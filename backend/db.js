const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

// Primary SQL Connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sfms_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 2000
});

let pgOnline = null;

// ── Resilience Layer: JSON Fallback Database ──
const MOCK_DB_FILE = path.join(__dirname, 'mock_db.json');

const loadDB = () => {
    if (!fs.existsSync(MOCK_DB_FILE)) {
        const initial = {
            users: [],
            courses: [],
            course_assignments: [],
            feedback: [],
            system_config: [
                { config_key: 'feedback_session_status', config_value: 'open' }
            ]
        };
        fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(initial, null, 2));
        return initial;
    }
    const data = JSON.parse(fs.readFileSync(MOCK_DB_FILE));
    // Ensure arrays exist
    if (!data.users) data.users = [];
    if (!data.courses) data.courses = [];
    if (!data.course_assignments) data.course_assignments = [];
    if (!data.feedback) data.feedback = [];
    return data;
};

const saveDB = (data) => {
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(data, null, 2));
};

// ── Virtual SQL Router ──
const virtualQuery = (text, params = []) => {
    const db = loadDB();
    const q = text.replace(/\s+/g, ' ').trim().toUpperCase();

    try {
        // ── INSERT INTO USERS ──
        if (q.includes('INSERT INTO USERS')) {
            const id = crypto.randomUUID();
            let newUser = { id, created_at: new Date().toISOString(), google_auth: false };

            if (q.includes('GOOGLE_AUTH')) {
                // Google Auth Pattern: (full_name, given_name, email, password_hash, role, department, college, google_auth, status)
                newUser = {
                    ...newUser,
                    full_name: params[0], given_name: params[1], family_name: '',
                    email: params[2], password_hash: params[3], role: params[4],
                    department: params[5], college: params[6], google_auth: params[7], status: params[8]
                };
            } else if (params.length === 9) {
                // Standard Signup Pattern (Student): (full_name, given_name, family_name, email, password_hash, role, department, college, status)
                newUser = {
                    ...newUser,
                    full_name: params[0], given_name: params[1], family_name: params[2],
                    email: params[3], password_hash: params[4], role: params[5],
                    department: params[6], college: params[7], status: params[8]
                };
            } else if (params.length === 8) {
                // Admin Pattern (Faculty Addition): (full_name, given_name, family_name, email, password_hash, role, department, status)
                newUser = {
                    ...newUser,
                    full_name: params[0], given_name: params[1], family_name: params[2],
                    email: params[3], password_hash: params[4], role: params[5],
                    department: params[6], status: params[7], college: 'SRMIST'
                };
            }

            if (db.users.find(u => u.email === newUser.email)) {
                throw { code: '23505', detail: 'Email already exists' };
            }
            db.users.push(newUser);
            saveDB(db);
            return { rows: [newUser], rowCount: 1 };
        }

        // ── SELECT FROM USERS ──
        if (q.includes('SELECT') && q.includes('FROM USERS')) {
            let filtered = [...db.users];

            if (q.includes('WHERE EMAIL = $1')) {
                const email = params[0];
                const role = q.includes('AND ROLE = $2') ? params[1] : null;
                filtered = filtered.filter(u => u.email === email && (!role || u.role === role.toLowerCase()));
            } else if (q.includes('WHERE ID = $1')) {
                filtered = filtered.filter(u => u.id === params[0]);
            } else if (q.includes("ROLE = 'ADMIN'")) {
                filtered = filtered.filter(u => u.role === 'admin');
            } else if (q.includes("ROLE = 'FACULTY'")) {
                filtered = filtered.filter(u => u.role === 'faculty');
            } else if (q.includes("ROLE = 'STUDENT'")) {
                filtered = filtered.filter(u => u.role === 'student');
            }

            // Handle sorting and limit for stats/registry
            if (q.includes('ORDER BY')) {
                filtered.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
            }
            if (q.includes('LIMIT 1')) {
                filtered = filtered.slice(0, 1);
            }

            const results = filtered.map(u => {
                const ca = db.course_assignments.find(a => a.faculty_id === u.id);
                let course = ca ? db.courses.find(c => c.id === ca.course_id) : null;
                if (!course && u.role === 'faculty' && u.department) {
                    course = db.courses.find(c => c.course_name.toLowerCase() === u.department.toLowerCase());
                }
                return {
                    ...u,
                    assigned_course: course ? course.course_name : null,
                    course_id: course ? course.id : null
                };
            });

            return { rows: results };
        }

        // ── INSERT INTO COURSES ──
        if (q.includes('INSERT INTO COURSES')) {
            const id = crypto.randomUUID();
            const newCourse = {
                id,
                course_name: params[0],
                course_code: params[1] || `CS${Math.floor(1000 + Math.random() * 9000)}`,
                semester: 4,
                created_at: new Date().toISOString()
            };
            db.courses.push(newCourse);
            saveDB(db);
            return { rows: [{ id }] };
        }

        // ── SELECT FROM COURSES ──
        if (q.includes('SELECT') && q.includes('FROM COURSES')) {
            let filtered = [...db.courses];

            if (q.includes('WHERE ID = $1')) {
                filtered = filtered.filter(c => c.id === params[0]);
            }

            const results = filtered.map(c => {
                const ca = db.course_assignments.find(a => a.course_id === c.id);
                let faculty = ca ? db.users.find(u => u.id === ca.faculty_id) : null;
                if (!faculty) {
                    faculty = db.users.find(u => u.role === 'faculty' && u.department && u.department.toLowerCase() === c.course_name.toLowerCase());
                }
                return {
                    ...c,
                    faculty_name: faculty ? faculty.full_name : 'Unassigned',
                    faculty_id: faculty ? faculty.id : null
                };
            }).sort((a, b) => (a.course_name || '').localeCompare(b.course_name || ''));
            return { rows: results };
        }

        // ── INSERT INTO FEEDBACK ──
        if (q.includes('INSERT INTO FEEDBACK')) {
            const newFeedback = {
                id: crypto.randomUUID(),
                student_id: params[0],
                course_id: params[1],
                faculty_id: params[2],
                responses: typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3],
                overall_comment: params[4],
                overall_rating: params[5],
                timestamp: new Date().toISOString()
            };
            db.feedback.push(newFeedback);
            saveDB(db);
            return { rows: [newFeedback] };
        }

        // ── SELECT FROM FEEDBACK ──
        if (q.includes('SELECT') && q.includes('FROM FEEDBACK')) {
            let filtered = db.feedback.map(f => {
                const student = db.users.find(u => u.id === f.student_id) || {};
                const course = db.courses.find(c => c.id === f.course_id) || {};
                const faculty = db.users.find(u => u.id === f.faculty_id) || {};
                return {
                    ...f,
                    student_name: student.full_name || 'Anonymous',
                    course_name: course.course_name || 'General Inquiry',
                    student: student.full_name || 'Anonymous',
                    course: course.course_name || 'General Inquiry',
                    faculty: faculty.full_name || 'Unassigned'
                };
            });

            if (q.includes('WHERE STUDENT_ID = $1 AND COURSE_ID = $2 AND FACULTY_ID = $3')) {
                filtered = filtered.filter(f => f.student_id === params[0] && f.course_id === params[1] && f.faculty_id === params[2]);
            } else if (q.includes('WHERE STUDENT_ID = $1 AND COURSE_ID = $2 AND FACULTY_ID IS NULL')) {
                filtered = filtered.filter(f => f.student_id === params[0] && f.course_id === params[1] && (f.faculty_id === null || f.faculty_id === undefined));
            } else if (q.includes('WHERE F.FACULTY_ID = $1') || q.includes('WHERE FACULTY_ID = $1')) {
                filtered = filtered.filter(f => f.faculty_id === params[0]);
            } else if (q.includes('WHERE STUDENT_ID = $1 AND COURSE_ID = $2')) {
                filtered = filtered.filter(f => f.student_id === params[0] && f.course_id === params[1]);
            }

            filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            if (q.includes('LIMIT')) {
                const limitMatch = text.match(/LIMIT\s+(\d+)/i);
                if (limitMatch) filtered = filtered.slice(0, parseInt(limitMatch[1]));
            }
            return { rows: filtered };
        }


        // ── COUNT queries ──
        if (q.includes('COUNT(*)')) {
            let count = 0;
            if (q.includes('FROM USERS')) {
                if (q.includes("ROLE = 'FACULTY'")) count = db.users.filter(u => u.role === 'faculty').length;
                else if (q.includes("ROLE = 'STUDENT'")) count = db.users.filter(u => u.role === 'student').length;
                else count = db.users.length;
            } else if (q.includes('FROM COURSES')) {
                count = db.courses.length;
            } else if (q.includes('FROM FEEDBACK')) {
                count = db.feedback.length;
            }
            return { rows: [{ count: count.toString() }] };
        }

        // ── UPDATE USERS ──
        if (q.includes('UPDATE USERS')) {
            const email = params[params.length - 1];
            const idx = db.users.findIndex(u => u.email === email);
            if (idx !== -1) {
                if (q.includes('PASSWORD_HASH') && q.includes('STATUS')) {
                    // Activation
                    db.users[idx].password_hash = params[0];
                    db.users[idx].full_name = params[1];
                    db.users[idx].given_name = params[2];
                    db.users[idx].family_name = params[3];
                    db.users[idx].status = params[4];
                } else if (q.includes('FULL_NAME = $1')) {
                    // Profile update
                    db.users[idx].full_name = params[0];
                    db.users[idx].given_name = params[1];
                    db.users[idx].family_name = params[2];
                    if (q.includes('DEPARTMENT = $4')) {
                        db.users[idx].department = params[3];
                        db.users[idx].status = params[4];
                    }
                }
                saveDB(db);
                return { rows: [db.users[idx]], rowCount: 1 };
            }
        }

        // ── TRUNCATE / DELETE ──
        if (q.includes('TRUNCATE') || q.includes('DELETE FROM')) {
            if (q.includes('FEEDBACK')) db.feedback = [];
            if (q.includes('COURSE_ASSIGNMENTS')) db.course_assignments = [];
            if (q.includes('COURSES')) db.courses = [];
            if (q.includes('USERS') && q.includes('ROLE =')) {
                db.users = db.users.filter(u => u.role === 'admin');
            }
            saveDB(db);
            return { rows: [], rowCount: 1 };
        }

        console.warn("Virtual SQL: Unsupported pattern ->", q.substring(0, 100));
        return { rows: [], rowCount: 0 };
    } catch (err) {
        console.error("Virtual SQL Error:", err);
        throw err;
    }
};

module.exports = {
    query: async (text, params) => {
        if (pgOnline === false) return virtualQuery(text, params);
        try {
            const res = await pool.query(text, params);
            pgOnline = true;
            return res;
        } catch (err) {
            // Check for various connection/authentication failures
            const isConnectionError =
                err.code === 'ECONNREFUSED' ||
                err.code === '28P01' || // Invalid Password
                err.code === '3D000' || // Invalid Database Name
                err.message?.includes('connect') ||
                err.message?.includes('authentication') ||
                err.message?.includes('terminating connection');

            if (isConnectionError) {
                if (pgOnline !== false) {
                    console.warn("⚠️  SQL Nexus Offline. Engaging Resilience Engine.");
                    pgOnline = false;
                }
                return virtualQuery(text, params);
            }
            throw err;
        }
    },
    pool
};
