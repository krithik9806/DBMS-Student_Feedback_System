const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const app = express();
app.use(cors({
    origin: "https://sfms-lilac.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// --- DATABASE SCHEMA INTEGRITY ---
const initializeDatabase = async () => {
    try {
        console.log("[DBMS] Running Schema Integrity Check...");
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_assignments' AND column_name='academic_year') THEN
                    ALTER TABLE course_assignments ADD COLUMN academic_year VARCHAR(20);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_assignments' AND column_name='semester') THEN
                    ALTER TABLE course_assignments ADD COLUMN semester VARCHAR(20);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='family_name') THEN
                    ALTER TABLE users ADD COLUMN family_name VARCHAR(255);
                END IF;
            END $$;
        `);
        console.log("[DBMS] Schema Integrity Verified.");
    } catch (err) {
        console.error("[DBMS] Critical Initialization Failure:", err);
    }
};
initializeDatabase();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'root_access_protocol_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- AUTH PROTOCOLS ---

// Signup Node
app.post('/api/auth/register', async (req, res) => {
    const { full_name, email, password, role, department, college } = req.body;
    try {
        if (role === 'faculty') {
            // Check if account was pre-registered by admin
            const check = await db.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, 'faculty']);
            if (check.rows.length === 0) {
                console.log(`[AUTH] Faculty Access Denied: ${email} is not in the registry.`);
                return res.status(403).json({ error: 'FACULTY_NOT_REGISTERED', message: 'UNAUTHORIZED: Your email has not been registered by the administrator. Please contact the Admin Office.' });
            }
            if (check.rows[0].status === 'Active') {
                return res.status(409).json({ error: 'PROTOCOL ALERT: This node is already active. Please use the login terminal.' });
            }

            // If account exists and is Pending, activate it
            const hashedPassword = await bcrypt.hash(password, 10);
            const given_name = full_name.split(' ')[0];
            const family_name = full_name.split(' ').slice(1).join(' ') || '';

            await db.query(
                'UPDATE users SET password_hash = $1, full_name = $2, given_name = $3, family_name = $4, status = $5 WHERE email = $6',
                [hashedPassword, full_name, given_name, family_name, 'Active', email]
            );

            // Fetch the fully activated user to return to the frontend
            const activatedRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = activatedRes.rows[0];
            delete user.password_hash;

            return res.status(200).json({
                message: 'Faculty Node Activated Successfully.',
                user: user
            });
        }

        if (role === 'admin') {
            const adminCheck = await db.query("SELECT * FROM users WHERE role = 'admin'");
            if (adminCheck.rows.length > 0) {
                return res.status(403).json({
                    error: 'ADMIN_EXISTS',
                    message: 'SYSTEM ALERT: A Root Administrator node is already active in this system. Direct recruitment of multiple administrators is prohibited by security protocol.'
                });
            }
        }

        // Standard Registration for Students
        const hashedPassword = await bcrypt.hash(password, 10);
        const given_name = full_name.split(' ')[0];
        const family_name = full_name.split(' ').slice(1).join(' ') || '';
        const result = await db.query(
            'INSERT INTO users (full_name, given_name, family_name, email, password_hash, role, department, college, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email, role',
            [full_name, given_name, family_name, email, hashedPassword, role, department, college, 'Active']
        );
        res.status(201).json({ ...result.rows[0], full_name, given_name, family_name });
    } catch (err) {
        console.error("Registration Error:", err);
        if (err.code === '23505' || err.detail?.includes('already exists')) {
            return res.status(409).json({ error: 'An account with this email/identity already exists.' });
        }
        res.status(500).json({ error: 'Registration Protocol Failure' });
    }
});

// Login Node
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Identity Not Found' });

        const user = result.rows[0];
        if (user.status === 'Pending') {
            return res.status(403).json({ error: 'ACCOUNT DEACTIVATED: Please complete the Sign Up process to activate your faculty node.' });
        }
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Credential Mismatch' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        // Remove sensitive data before sending
        delete user.password_hash;
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Authentication Protocol Error' });
    }
});

// Update Profile Node
app.put('/api/auth/update-profile', async (req, res) => {
    const { email, given_name, family_name } = req.body;
    try {
        const full_name = `${given_name} ${family_name}`.trim();
        const result = await db.query(
            'UPDATE users SET full_name = $1, given_name = $2, family_name = $3 WHERE email = $4 RETURNING *',
            [full_name, given_name, family_name, email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Identity Matrix Mismatch' });
        }

        const user = result.rows[0];
        delete user.password_hash;
        res.json({ message: 'Identity Matrix Synchronized', user });
    } catch (err) {
        console.error("Profile Sync Error:", err);
        res.status(500).json({ error: 'Identity Matrix Synthesis Failure' });
    }
});

// Google Auth Node
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (result.rows.length === 0) {
            // Create user as student by default if not pre-registered
            const given_name = payload.given_name;
            const family_name = payload.family_name || '';
            const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

            const newUser = await db.query(
                'INSERT INTO users (full_name, given_name, email, password_hash, role, department, college, google_auth, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
                [name, given_name, email, hashedPassword, 'student', 'General', 'SRMIST', true, 'Active']
            );
            user = newUser.rows[0];
        } else {
            user = result.rows[0];

            // Critical: If this is a pre-registered faculty node, activate it via OAuth
            if (user.status === 'Pending') {
                await db.query('UPDATE users SET status = $1, google_auth = true WHERE id = $2', ['Active', user.id]);
                user.status = 'Active';
            } else if (!user.google_auth) {
                await db.query('UPDATE users SET google_auth = true WHERE id = $1', [user.id]);
            }
        }

        const appToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        delete user.password_hash;

        // Add profile picture to user object if not present in DB (or just return it)
        user.picture = picture;

        res.json({ token: appToken, user });
    } catch (err) {
        console.error("Google Auth Error:", err);
        res.status(401).json({ error: 'Google Identity Verification Failed' });
    }
});

// --- ACADEMIC PROTOCOLS ---

// Get Course Matrix
// Get Course Matrix with Assigned Faculty
app.get('/api/courses', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.*, u.full_name as faculty_name, u.id as faculty_id
            FROM courses c
            LEFT JOIN course_assignments ca ON c.id = ca.course_id
            LEFT JOIN users u ON ca.faculty_id = u.id
            ORDER BY c.course_name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Course Fetch Error:", err);
        res.status(500).json({ error: 'Curriculum Retrieval Failure' });
    }
});

// Check if feedback already submitted
app.get('/api/feedback/check/:student_id/:course_id/:faculty_id', async (req, res) => {
    try {
        const { student_id, course_id, faculty_id } = req.params;
        let check;
        if (faculty_id && faculty_id !== 'null' && faculty_id !== 'undefined') {
            check = await db.query('SELECT * FROM feedback WHERE student_id = $1 AND course_id = $2 AND faculty_id = $3', [student_id, course_id, faculty_id]);
        } else {
            // Fallback for general course feedback without assigned faculty
            check = await db.query('SELECT * FROM feedback WHERE student_id = $1 AND course_id = $2 AND faculty_id IS NULL', [student_id, course_id]);
        }
        res.json({ submitted: check.rows.length > 0 });
    } catch (err) {
        console.error("Feedback Check Error:", err);
        res.status(500).json({ error: 'Failed to check feedback status' });
    }
});

// Submit Feedback Node
app.post('/api/feedback', async (req, res) => {
    const { student_id, course_id, faculty_id, responses, comment, rating } = req.body;
    try {
        let check;
        if (faculty_id) {
            check = await db.query('SELECT * FROM feedback WHERE student_id = $1 AND course_id = $2 AND faculty_id = $3', [student_id, course_id, faculty_id]);
        } else {
            check = await db.query('SELECT * FROM feedback WHERE student_id = $1 AND course_id = $2 AND faculty_id IS NULL', [student_id, course_id]);
        }
        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'Feedback for this subject faculty is already gave and submitted.' });
        }

        const result = await db.query(
            'INSERT INTO feedback (student_id, course_id, faculty_id, responses, overall_comment, overall_rating) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [student_id, course_id, faculty_id, JSON.stringify(responses), comment, rating]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Pulse Submission Failure' });
    }
});

// System Reset Node (Erase All Feedback, Courses, and Participants)
app.post('/api/admin/system/reset', async (req, res) => {
    try {
        // We preserve admin users to allow the session to continue
        await db.query('TRUNCATE TABLE feedback CASCADE');
        await db.query('TRUNCATE TABLE course_assignments CASCADE');
        await db.query('TRUNCATE TABLE courses CASCADE');
        await db.query("DELETE FROM users WHERE role = 'faculty' OR role = 'student'");
        res.json({ message: 'System Hard Reset Successful. All dynamic data purged.' });
    } catch (err) {
        console.error("System Reset Error:", err);
        res.status(500).json({ error: 'System Purge Protocol Failed' });
    }
});

// --- ADMINISTRATIVE TERMINAL ENDPOINTS ---

// Admin Contact Retrieval
app.get('/api/admin/contact', async (req, res) => {
    try {
        const result = await db.query("SELECT full_name, given_name, family_name, email FROM users WHERE role = 'admin' LIMIT 1");

        if (result.rows.length > 0) {
            return res.json(result.rows[0]);
        }

        // Fallback for fresh systems without an admin node yet
        res.json({
            full_name: 'John Wick',
            given_name: 'John',
            family_name: 'Wick',
            email: 'admin123@gmail.com'
        });
    } catch (err) {
        console.error("Admin Contact Fetch Error:", err);
        // Even on database error, return the fallback to prevent frontend alerts
        res.json({
            full_name: 'John Wick',
            given_name: 'John',
            family_name: 'Wick',
            email: 'admin123@gmail.com'
        });
    }
});

// Admin Stats Telemetry
app.get('/api/admin/stats', async (req, res) => {
    try {
        const facultyCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'faculty'");
        const studentCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'student'");
        const courseCount = await db.query("SELECT COUNT(*) FROM courses");
        const feedbackCount = await db.query("SELECT COUNT(*) FROM feedback");

        const recentFeedback = await db.query(`
            SELECT f.*, u.full_name as student_name, c.course_name 
            FROM feedback f
            JOIN users u ON f.student_id = u.id
            JOIN courses c ON f.course_id = c.id
            ORDER BY f.timestamp DESC LIMIT 5
        `);

        res.json({
            totalFaculty: parseInt(facultyCount.rows[0]?.count ?? facultyCount.rows.length),
            totalStudents: parseInt(studentCount.rows[0]?.count ?? studentCount.rows.length),
            activeCourses: parseInt(courseCount.rows[0]?.count ?? courseCount.rows.length),
            totalResponses: parseInt(feedbackCount.rows[0]?.count ?? feedbackCount.rows.length),
            recentFeedbacks: recentFeedback.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Analytics Synthesis Failure' });
    }
});

// User Registry with Course Assignments for Faculty
app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.id, u.full_name, u.email, u.role, u.department, u.college, u.status,
                c.course_name as assigned_course,
                c.id as course_id
            FROM users u
            LEFT JOIN course_assignments ca ON u.id = ca.faculty_id
            LEFT JOIN courses c ON ca.course_id = c.id
            ORDER BY u.role, u.full_name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("User Registry Error:", err);
        res.status(500).json({ error: 'Identity Registry Retrieval Failure' });
    }
});

// Export Data Node (JSON for Frontend to convert to Excel/PDF)
app.get('/api/admin/export/feedback', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                f.id, 
                u1.full_name as student, 
                u1.department as student_dept,
                u1.college as student_college,
                c.course_name as course, 
                u2.full_name as faculty,
                f.overall_rating as rating, 
                f.overall_comment as comment, 
                f.responses,
                f.timestamp
            FROM feedback f
            JOIN users u1 ON f.student_id = u1.id
            JOIN courses c ON f.course_id = c.id
            LEFT JOIN users u2 ON f.faculty_id = u2.id
            ORDER BY f.timestamp DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Export Query Failure:", err);
        res.status(500).json({ error: 'Data Synthesis for Export Failed' });
    }
});

app.get('/api/faculty/stats/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT f.*, u.full_name as student_name, c.course_name 
            FROM feedback f
            JOIN users u ON f.student_id = u.id
            JOIN courses c ON f.course_id = c.id
            WHERE f.faculty_id = $1
            ORDER BY f.timestamp DESC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Faculty Telemetry Link Failure' });
    }
});

// Update Faculty Node and Course Assignment
app.put('/api/admin/users/:email', async (req, res) => {
    const { email } = req.params;
    const { given_name, family_name, department, status, course_id } = req.body;
    try {
        const full_name = `${given_name} ${family_name}`.trim();
        const result = await db.query(
            'UPDATE users SET full_name = $1, given_name = $2, family_name = $3, department = $4, status = $5 WHERE email = $6 RETURNING *',
            [full_name, given_name, family_name, department, status, email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Faculty node not found' });
        }

        const facultyId = result.rows[0].id;

        // Handle Course Assignment Update: Treat empty string as "unassign"
        if (course_id && course_id !== "") {
            // Remove existing assignments first for simplicity (1:1 per this system requirement)
            await db.query('DELETE FROM course_assignments WHERE faculty_id = $1', [facultyId]);
            await db.query(
                'INSERT INTO course_assignments (faculty_id, course_id, academic_year, semester) VALUES ($1, $2, $3, $4)',
                [facultyId, course_id, '2024-2025', 'Even']
            );
        } else if (course_id === "" || course_id === null) {
            // Explicitly remove assignment if explicitly told to or if it's cleared
            await db.query('DELETE FROM course_assignments WHERE faculty_id = $1', [facultyId]);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Faculty Update Error:", err);
        res.status(500).json({ error: 'Faculty Update Failed' });
    }
});

// Delete User Node
app.delete('/api/admin/users/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = userRes.rows[0].id;
        
        // Remove foreign key dependencies first
        await db.query('DELETE FROM course_assignments WHERE faculty_id = $1', [userId]);
        // Disconnect feedback to prevent cascade failures without losing telemetry data
        await db.query('UPDATE feedback SET faculty_id = NULL WHERE faculty_id = $1', [userId]);
        
        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
        res.json({ message: 'User decommissioned', user: result.rows[0] });
    } catch (err) {
        console.error("Delete User Error:", err);
        res.status(500).json({ error: 'Failed to decommission user: ' + err.message });
    }
});

// Add New Faculty Node with Required Course Assignment
app.post('/api/admin/faculty', async (req, res) => {
    const { given_name, family_name, email, course_id, status, password } = req.body;
    try {
        // Fetch course name to use as department/subject display
        const courseRes = await db.query('SELECT course_name FROM courses WHERE id = $1', [course_id]);
        if (courseRes.rows.length === 0) {
            return res.status(400).json({ error: 'Selected Course Mapping Not Found' });
        }
        const department = courseRes.rows[0].course_name;

        const full_name = `${given_name} ${family_name}`.trim();
        // Use provided password or fallback to default
        const passwordToHash = password || 'faculty123';
        const hashedPassword = await bcrypt.hash(passwordToHash, 10);

        // Use provided status or fallback to Pending
        const accountStatus = status || 'Pending';

        const result = await db.query(
            'INSERT INTO users (full_name, given_name, family_name, email, password_hash, role, department, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [full_name, given_name, family_name, email, hashedPassword, 'faculty', department, accountStatus]
        );

        const facultyId = result.rows[0].id;

        await db.query(
            'INSERT INTO course_assignments (faculty_id, course_id, academic_year, semester) VALUES ($1, $2, $3, $4)',
            [facultyId, course_id, '2024-2025', 'Even']
        );

        res.status(201).json({ id: facultyId, full_name, email });
    } catch (err) {
        console.error("Add Faculty Error:", err);
        if (err.code === '23505' || err.detail?.includes('already exists')) {
            return res.status(409).json({ error: 'A faculty with this residency already exists.' });
        }
        res.status(500).json({ error: 'Failed to integrate faculty node' });
    }
});

// Admin Course Management - Independent Creation
app.post('/api/courses', async (req, res) => {
    const { name } = req.body;
    try {
        const courseRes = await db.query(
            'INSERT INTO courses (course_name, course_code) VALUES ($1, $2) RETURNING id',
            [name, `CS${Math.floor(1000 + Math.random() * 9000)}`]
        );
        const courseId = courseRes.rows[0].id;
        res.status(201).json({ id: courseId, message: 'Course created successfully' });
    } catch (err) {
        console.error("Course Creation Error:", err);
        res.status(500).json({ error: 'Failed to create course' });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM courses WHERE id = $1', [id]);
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        console.error("Course Deletion Error:", err);
        res.status(500).json({ error: 'Failed to delete course' });
    }
});

// System Management API - Sync Obsolete
app.get('/api/admin/auto-link-courses', async (req, res) => {
    res.status(410).json({ error: 'This protocol is deprecated. Use Explicit Assignment instead.' });
});

app.listen(PORT, () => {
    console.log(`[SFMS SERVER] Protocol initialized on port ${PORT}`);
});
