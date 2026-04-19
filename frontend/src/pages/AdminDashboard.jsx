import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    Users, BookOpen, Clock, FileDown,
    ShieldCheck, Plus, Trash2, Power,
    UserPlus, LayoutDashboard, Settings,
    LogOut, Search, Filter,
    BarChart2, MessageSquare, TrendingUp,
    ArrowUpRight, Activity, Database, CheckCircle, User, GraduationCap, LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminPowerBI from '../components/AdminPowerBI';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import API_ENDPOINTS, { handleResponse } from '../utils/api';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isSessionOpen, setIsSessionOpen] = useState(() => {
        return localStorage.getItem('sessionStatus') !== 'closed';
    });
    const [liveStats, setLiveStats] = useState({
        totalFaculty: 0,
        totalStudents: 0,
        activeCourses: 0,
        totalResponses: 0,
        facultyList: [],
        studentList: [],
        recentFeedbacks: []
    });
    const [editingFaculty, setEditingFaculty] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [isDeleteCourseModalOpen, setIsDeleteCourseModalOpen] = useState(false);
    const [courses, setCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Mouse glow effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 1000, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 1000, damping: 30 });

    const refreshData = async () => {
        try {
            // Synchronize Terminal Stats with PostgreSQL Cluster
            const statsRes = await fetch(API_ENDPOINTS.ADMIN_STATS);
            if (!statsRes.ok) throw new Error('Failed to fetch stats');
            const statsData = await handleResponse(statsRes);

            // Synchronize Identity Registry
            const usersRes = await fetch(API_ENDPOINTS.ADMIN_USERS);
            if (!usersRes.ok) throw new Error('Failed to fetch users');
            const usersData = await handleResponse(usersRes);

            // Synchronize Curriculum Matrix
            const coursesRes = await fetch(API_ENDPOINTS.COURSES);
            if (!coursesRes.ok) throw new Error('Failed to fetch courses');
            const coursesData = await handleResponse(coursesRes);

            setCourses(coursesData);

            const facults = usersData.filter(u => u.role === 'faculty').map(f => ({
                fullName: f.full_name,
                given_name: f.given_name,
                family_name: f.family_name,
                email: f.email,
                subject: f.assigned_course || f.department || 'Not Assigned',
                course_id: f.course_id,
                status: f.status,
                id: f.id, // Full UUID for API
                displayId: f.id.substring(0, 8) // For UI
            }));

            const students = usersData.filter(u => u.role === 'student').map(s => ({
                fullName: s.full_name,
                email: s.email,
                college: s.college || 'SRMIST',
                id: s.id.substring(0, 8)
            }));

            setLiveStats({
                ...statsData,
                facultyList: facults,
                studentList: students,
                recentFeedbacks: (statsData.recentFeedbacks || []).map(f => ({
                    user: f.student_name,
                    course: f.course_name,
                    comment: f.overall_comment,
                    time: new Date(f.timestamp).toLocaleDateString(),
                    faculty: 'Faculty Node'
                }))
            });
        } catch (err) {
            console.error("Critical SQL Synchronization Failure:", err);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed.role !== 'admin') {
                    navigate(parsed.role === 'faculty' ? '/faculty-dashboard' : '/dashboard');
                }
                setUser(parsed);
            } catch (e) {
                navigate('/login');
            }
        } else {
            navigate('/login');
        }

        const handleMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, [navigate, mouseX, mouseY]);

    useEffect(() => {
        refreshData();
        window.addEventListener('storage', refreshData);
        return () => window.removeEventListener('storage', refreshData);
    }, []);

    const handleUpdateFaculty = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const response = await fetch(API_ENDPOINTS.FACULTY_UPDATE(editingFaculty.email), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    given_name: formData.get('given_name'),
                    family_name: formData.get('family_name'),
                    department: courses.find(c => c.id === formData.get('course_id'))?.course_name || '',
                    status: formData.get('status'),
                    course_id: formData.get('course_id') || null
                })
            });
            if (!response.ok) {
                const err = await handleResponse(response);
                throw new Error(err.error || err.message || 'Update failed');
            }
            setEditingFaculty(null);
            refreshData();
        } catch (err) {
            console.error("Faculty Update Error:", err);
            alert(`Failed to update faculty: ${err.message}`);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const given_name = formData.get('given_name');
        const family_name = formData.get('family_name');

        try {
            const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    given_name,
                    family_name
                })
            });

            if (!response.ok) {
                const err = await handleResponse(response);
                throw new Error(err.error || err.message || 'Failed to update identity matrix');
            }

            const data = await handleResponse(response);
            const updatedUser = { ...user, ...data.user };

            // Sync local user session
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsSettingsOpen(false);

            // Trigger UI Refresh
            refreshData();
        } catch (err) {
            console.error("Profile Synchronization Failure:", err);
            alert(`CRITICAL ERROR: ${err.message}`);
        }
    };

    const handleDeleteFaculty = async (email) => {
        if (window.confirm('PROTOCOL ALERT: Confirm decommission of this faculty node from the central registry?')) {
            try {
                const response = await fetch(API_ENDPOINTS.USER_DELETE(email), {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    const err = await handleResponse(response);
                    throw new Error(err.error || err.message || 'Delete failed');
                }
                refreshData();
            } catch (err) {
                console.error("Decommissioning Failure:", err);
                alert(`Failed to decommission faculty: ${err.message}`);
            }
        }
    };

    const handleAddFaculty = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const course_id = formData.get('course_id');
            if (!course_id) {
                alert("PROTOCOL ERROR: No course selected for faculty integration.");
                return;
            }
            const response = await fetch(API_ENDPOINTS.ADD_FACULTY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    given_name: formData.get('given_name'),
                    family_name: formData.get('family_name'),
                    email: formData.get('email'),
                    course_id: course_id,
                    status: formData.get('status'),
                    password: formData.get('password')
                })
            });
            if (!response.ok) {
                const err = await handleResponse(response);
                throw new Error(err.error || err.message || 'Add failed');
            }
            setIsAddModalOpen(false);
            refreshData();
        } catch (err) {
            console.error("Faculty Integration Failure:", err);
            alert(`FACULTY INTEGRATION ERROR: ${err.message}`);
        }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const response = await fetch(API_ENDPOINTS.COURSES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('courseName')
                })
            });

            if (!response.ok) {
                const err = await handleResponse(response);
                throw new Error(err.error || err.message || 'Failed to create course');
            }

            setIsAddCourseModalOpen(false);
            refreshData();
        } catch (err) {
            console.error("Course Initializer Error:", err);
            alert(`Failed to create course: ${err.message}`);
        }
    };

    const handleSystemReset = async () => {
        if (window.confirm('CRITICAL PROTOCOL: THIS WILL PERMANENTLY ERASE ALL FACULTY, STUDENTS, COURSES, AND FEEDBACK. ARE YOU ABSOLUTELY SURE?')) {
            try {
                const response = await fetch(API_ENDPOINTS.SYSTEM_RESET, {
                    method: 'POST'
                });
                if (!response.ok) throw new Error('System Reset Failed');
                const data = await handleResponse(response);
                alert(data.message);
                refreshData();
            } catch (err) {
                alert(`Reset Error: ${err.message}`);
            }
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm('PROTOCOL ALERT: Confirm decommission of this course node?')) {
            try {
                const response = await fetch(API_ENDPOINTS.DELETE_COURSE(courseId), {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Deletion Failed');
                refreshData();
            } catch (err) {
                console.error("Course Decommission Failure:", err);
                alert("Failed to delete course.");
            }
        }
    };

    const exportToPDF = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.EXPORT_FEEDBACK);
            if (!res.ok) {
                const errData = await handleResponse(res);
                throw new Error(errData.error || errData.message || 'Identity Matrix Synthesis Failure');
            }
            const data = await handleResponse(res);

            // Initialize PDF in Landscape for maximum data density
            const doc = new jsPDF({ orientation: 'landscape' });

            // Premium Branding Header
            doc.setFontSize(24);
            doc.setTextColor(59, 130, 246); // Blue-600
            doc.text("SRMIST: ACADEMIC FEEDBACK INTELLIGENCE", 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            const reportId = `REF: PROTOCOL-0x${Date.now().toString(16).toUpperCase()}`;
            doc.text(reportId, 14, 30);
            doc.text(`Report Generation Matrix: ${new Date().toLocaleString()}`, 14, 35);
            doc.text(`Authorized Administrator: ${user?.given_name} ${user?.family_name}`, 14, 40);

            const tableData = data.map(row => {
                const res = typeof row.responses === 'string' ? JSON.parse(row.responses) : (row.responses || {});
                return [
                    row.id.substring(0, 8).toUpperCase(),
                    new Date(row.timestamp).toLocaleString(),
                    row.student || 'Unknown Student',
                    row.course || 'Unknown Course',
                    row.faculty || 'Unassigned Node',
                    res["1"] || "N/A",
                    res["2"] || "N/A",
                    res["3"] || "N/A",
                    res["4"] || "N/A",
                    res["5"] || "N/A",
                    res["6"] || "N/A",
                    res["7"] || "N/A",
                    res["8"] || "N/A",
                    res["9"] || "N/A",
                    res["10"] || "N/A",
                    res["11"] || row.overall_comment || row.comment || "N/A"
                ];
            });

            if (tableData.length === 0) {
                tableData.push([
                    "N/A", "N/A", "N/A", "N/A", "N/A",
                    "-", "-", "-", "-", "-", "-", "-", "-", "-", "-",
                    "No Responses"
                ]);
            }

            autoTable(doc, {
                startY: 50,
                head: [[
                    'REPORT ID', 'TIMESTAMP', 'STUDENT', 'COURSE', 'FACULTY',
                    'Q.1: How clearly did the faculty explain the concepts?',
                    'Q.2: How would you rate the faculty\'s knowledge?',
                    'Q.3: How effective were the teaching methods used?',
                    'Q.4: How interactive and engaging were the classes?',
                    'Q.5: How effectively did the faculty address doubts?',
                    'Q.6: How clear and understandable was the communication?',
                    'Q.7: Did the faculty use helpful materials?',
                    'Q.8: How well did the faculty manage class time?',
                    'Q.9: How much did this faculty help improve your understanding?',
                    'Q.10: Overall, how would you rate this faculty member?',
                    'Q.11: Final Feedback'
                ]],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 41, 59], // Slate-800
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 7,
                    halign: 'center'
                },
                styles: {
                    fontSize: 6,
                    overflow: 'linebreak',
                    cellPadding: 2
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 20 },
                    15: { cellWidth: 35 }
                },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { top: 50, left: 5, right: 5 }
            });

            // Footer / Seal
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`SFMS INTELLIGENCE CORE | Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10);
            }

            doc.save(`SFMS_Executive_Insight_${Date.now()}.pdf`);
        } catch (err) {
            console.error("PDF Protocol Error:", err);
            alert(`PDF Synthesis Interrupted: ${err.message}`);
        }
    };

    const exportToExcel = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.EXPORT_FEEDBACK);
            if (!res.ok) {
                const errData = await handleResponse(res);
                throw new Error(errData.error || errData.message || 'Excel Matrix Synthesis Failure');
            }
            const data = await handleResponse(res);

            // Transform raw data into structured rows for an Executive Matrix
            const rows = data.map(feedback => {
                const res = typeof feedback.responses === 'string' ? JSON.parse(feedback.responses) : (feedback.responses || {});
                return [
                    feedback.id.substring(0, 8).toUpperCase(),
                    new Date(feedback.timestamp).toLocaleString(),
                    feedback.student || 'Unknown Student',
                    feedback.course || 'Unknown Course',
                    feedback.faculty || "Unassigned",
                    res["1"] || "N/A",
                    res["2"] || "N/A",
                    res["3"] || "N/A",
                    res["4"] || "N/A",
                    res["5"] || "N/A",
                    res["6"] || "N/A",
                    res["7"] || "N/A",
                    res["8"] || "N/A",
                    res["9"] || "N/A",
                    res["10"] || "N/A",
                    res["11"] || feedback.overall_comment || feedback.comment || "N/A"
                ];
            });

            if (rows.length === 0) {
                rows.push([
                    "N/A", "N/A", "N/A", "N/A", "N/A",
                    "-", "-", "-", "-", "-", "-", "-", "-", "-", "-",
                    "No Responses"
                ]);
            }

            // Construct the Professional Intelligence Matrix (AOA - Array of Arrays)
            const matrix = [
                ["SRMIST: ACADEMIC FEEDBACK SYSTEM - INTELLIGENCE MATRIX"],
                [`Report Protocol: 0x${Date.now().toString(16).toUpperCase()}`],
                [`Generation Date: ${new Date().toLocaleString()}`],
                [`Authorized Administrator: ${user?.given_name} ${user?.family_name}`],
                ["------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------"],
                [
                    "REPORT ID", "TIMESTAMP", "STUDENT", "COURSE", "FACULTY",
                    "Q.1: How clearly did the faculty explain the concepts in this subject?",
                    "Q.2: How would you rate the faculty's knowledge of the subject?",
                    "Q.3: How effective were the teaching methods used?",
                    "Q.4: How interactive and engaging were the classes?",
                    "Q.5: How effectively did the faculty address student doubts and questions?",
                    "Q.6: How clear and understandable was the faculty's communication?",
                    "Q.7: Did the faculty use helpful materials?",
                    "Q.8: How well did the faculty manage class time and syllabus completion?",
                    "Q.9: How much did this faculty help improve your understanding of the subject?",
                    "Q.10: Overall, how would you rate this faculty member?",
                    "Q.11: Final Feedback"
                ],
                ...rows
            ];

            const worksheet = XLSX.utils.aoa_to_sheet(matrix);

            // Professional Formatting Calibration: Column Widths
            const colWidths = [
                { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 25 },
                { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 },
                { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 },
                { wch: 60 }
            ];
            worksheet['!cols'] = colWidths;

            // Activate Auto-filters on the Data Header Row (Row 6)
            worksheet['!autofilter'] = { ref: `A6:P${matrix.length}` };

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback Deep Analysis");

            XLSX.writeFile(workbook, `SFMS_Executive_Insight_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error("Excel Protocol Error:", err);
            alert(`Excel Synthesis Failed: ${err.message}`);
        }
    };

    const toggleSession = () => {
        const newState = !isSessionOpen;
        setIsSessionOpen(newState);
        localStorage.setItem('sessionStatus', newState ? 'open' : 'closed');
        window.dispatchEvent(new Event('storage'));
    };

    useEffect(() => {
        const checkSession = () => {
            const status = localStorage.getItem('sessionStatus');
            if (status) {
                setIsSessionOpen(status !== 'closed');
            }
        };
        window.addEventListener('storage', checkSession);
        return () => window.removeEventListener('storage', checkSession);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const stats = [
        { label: 'Total Faculty', value: (liveStats.totalFaculty || 0).toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Total Students', value: (liveStats.totalStudents || 0).toString(), icon: GraduationCap, color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { label: 'Active Courses', value: (liveStats.activeCourses || 0).toString(), icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Total Responses', value: (liveStats.totalResponses || 0).toString(), icon: Database, color: 'text-green-500', bg: 'bg-green-500/10' }
    ];


    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
            {/* Interactive Cursor Glow */}
            <motion.div
                className="pointer-events-none fixed inset-0 z-30 opacity-40 mix-blend-screen"
                style={{
                    background: useTransform(
                        [springX, springY],
                        ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(99, 102, 241, 0.25), transparent 80%)`
                    )
                }}
            />

            {/* Ambient Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.01]"></div>
            </div>

            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-20 lg:w-24 bg-black/40 backdrop-blur-3xl border-r border-white/5 z-50 flex flex-col items-center py-10 justify-between">
                <div className="space-y-10">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                        <ShieldCheck className="text-white w-6 h-6" />
                    </motion.div>

                    <nav className="flex flex-col gap-6">
                        {[
                            { id: 'overview', icon: LayoutDashboard, action: () => { navigate('/admin-dashboard'); setActiveTab('overview'); } },
                            { id: 'analytics', icon: LayoutGrid, action: () => setActiveTab('analytics') },
                            { id: 'settings', icon: Settings, action: () => setIsSettingsOpen(true) }
                        ].map((item) => (
                            <motion.button
                                key={item.id}
                                onClick={item.action}
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id || (item.id === 'overview' && window.location.pathname === '/admin-dashboard') ? 'bg-blue-600 text-white' : 'text-gray-500'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                            </motion.button>
                        ))}
                    </nav>
                </div>

                <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-red-500 bg-red-500/5 group"
                >
                    <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </aside>

            {/* Main Content */}
            <main className="pl-24 pt-8 pb-12">
                <div className="max-w-7xl mx-auto px-10">

                    {/* Header */}
                    <header className="relative z-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                        <div>
                            <motion.h2
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-blue-500 text-xs font-black uppercase tracking-[0.4em] mb-2"
                            >
                                Root Access Protocol
                            </motion.h2>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl lg:text-5xl font-black tracking-tighter uppercase"
                            >
                                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Admin {user?.given_name} {user?.family_name}</span>
                            </motion.h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <motion.button
                                onClick={toggleSession}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300 font-bold uppercase tracking-widest text-[10px] ${isSessionOpen
                                    ? 'bg-green-500/10 border-green-500/50 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                                    : 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                                    }`}
                            >
                                <Power className={`w-4 h-4 ${isSessionOpen ? 'animate-pulse' : ''}`} />
                                Feedback Session: {isSessionOpen ? 'Open' : 'Closed'}
                            </motion.button>

                            <motion.button
                                onClick={handleSystemReset}
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 font-bold uppercase tracking-widest text-[10px] hover:border-red-500 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                System Pure Reset
                            </motion.button>

                            <div className="flex items-center gap-4">
                                <motion.div
                                    onClick={() => setShowProfileModal(!showProfileModal)}
                                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center space-x-3 bg-white/5 pl-2 pr-4 py-1.5 rounded-full border border-white/10 cursor-pointer transition-all"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 p-[1px]">
                                        <div className="h-full w-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                            {user && user.picture ? (
                                                <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-4 w-4 text-white" />
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold tracking-tight text-white capitalize">
                                        {user ? (user.given_name ? `${user.given_name} ${user.family_name || ''}` : user.name) : 'ADMIN'}
                                    </span>
                                </motion.div>
                            </div>
                        </div>
                    </header>

                    {activeTab === 'analytics' && <AdminPowerBI />}

                    {activeTab === 'overview' && (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.2 + (i * 0.1), type: 'spring' }}
                                whileHover={{ y: -8, backgroundColor: 'rgba(255,255,255,0.06)' }}
                                className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] group cursor-default"
                            >
                                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Faculty Management Section */}
                        <motion.section
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.6 }}
                            className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem]"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    Faculty Terminal
                                </h3>
                                <div className="flex gap-3">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search Faculty..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-48 transition-all"
                                        />
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(37, 99, 235, 1)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsAddModalOpen(true);
                                        }}
                                        className="relative flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 z-10"
                                    >
                                        <Plus className="w-4 h-4 text-white" />
                                        Add Faculty
                                    </motion.button>
                                </div>
                            </div>

                            <div className="overflow-x-auto relative z-20">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] border-b border-white/5">
                                            <th className="pb-4 pl-4 uppercase">Name</th>
                                            <th className="pb-4 uppercase">Assigned Subject</th>
                                            <th className="pb-4 uppercase">Status</th>
                                            <th className="pb-4 text-right pr-4 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {liveStats.facultyList
                                            .filter(f => f.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || f.subject.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((faculty, i) => (
                                                <motion.tr
                                                    key={faculty.email || i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 + (i * 0.05) }}
                                                    onClick={() => setEditingFaculty(faculty)}
                                                    whileHover={{ x: 8, backgroundColor: 'rgba(59, 130, 246, 0.04)' }}
                                                    whileTap={{ scale: 0.99 }}
                                                    className="group transition-all cursor-pointer border-b border-white/5 last:border-0 relative z-10 pointer-events-auto"
                                                >
                                                    <td className="py-5 pl-4">
                                                        <span className="text-sm font-bold block">{faculty.fullName}</span>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase">U-ID: SFMS-{faculty.displayId}</span>
                                                    </td>
                                                    <td className="py-5">
                                                        <div className="flex flex-col">
                                                            <span className={`text-xs font-medium ${faculty.course_id ? 'text-gray-400' : 'text-orange-400 italic flex items-center gap-1'}`}>
                                                                {faculty.subject}
                                                                {!faculty.course_id && <Activity className="w-2 h-2" />}
                                                            </span>
                                                            {!faculty.course_id && (
                                                                <span className="text-[8px] text-orange-500/60 font-black uppercase tracking-tighter">Legacy Data - Unlinked</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-5">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${faculty.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                                            }`}>
                                                            {faculty.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 text-right pr-4">
                                                        <div className="flex justify-end gap-2">
                                                            <motion.button
                                                                whileHover={{ scale: 1.2, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Edit Faculty Details"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingFaculty(faculty);
                                                                }}
                                                                className="p-2.5 text-gray-400 hover:text-blue-400 rounded-lg transition-all"
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.2, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Decommission Faculty Node"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteFaculty(faculty.email);
                                                                }}
                                                                className="p-2.5 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        {liveStats.facultyList.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="py-10 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">No faculty nodes detected in system.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.section>

                        {/* Student Management Section */}
                        <motion.section
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.65 }}
                            className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] mt-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                                    <GraduationCap className="w-5 h-5 text-pink-500" />
                                    Global Student Registry
                                </h3>
                            </div>

                            <div className="overflow-x-auto relative z-20">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] border-b border-white/5">
                                            <th className="pb-4 pl-4 uppercase">Student Identity</th>
                                            <th className="pb-4 uppercase">Connected Institution</th>
                                            <th className="pb-4 text-right pr-4 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {liveStats.studentList.map((student, i) => (
                                            <motion.tr
                                                key={student.email || i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + (i * 0.05) }}
                                                whileHover={{ x: 8, backgroundColor: 'rgba(236, 72, 153, 0.04)' }}
                                                className="group transition-all border-b border-white/5 last:border-0 relative z-10"
                                            >
                                                <td className="py-5 pl-4">
                                                    <span className="text-sm font-bold block">{student.fullName}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">{student.email}</span>
                                                </td>
                                                <td className="py-5">
                                                    <span className="text-xs text-gray-400 font-medium">{student.college}</span>
                                                </td>
                                                <td className="py-5 text-right pr-4">
                                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-pink-500/10 text-pink-500">
                                                        Authenticated
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                        {liveStats.studentList.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="py-10 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">No student footprints detected.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.section>

                        {/* Report & Control Section */}
                        <div className="space-y-8">
                            {/* Report Generation */}
                            <motion.div
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.7 }}
                                className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/40 relative overflow-hidden group"
                            >
                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
                                        <FileDown className="text-white w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tighter uppercase mb-4">Feedback Intelligence</h3>
                                    <p className="text-blue-100 text-xs leading-relaxed mb-10 opacity-80">
                                        Synthesize and export all current session feedback data into structured files for academic review.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={exportToPDF}
                                            className="py-3 bg-white text-blue-600 font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            Export PDF <ArrowUpRight className="w-3 h-3" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={exportToExcel}
                                            className="py-3 bg-blue-950/30 backdrop-blur-md text-white border border-white/20 font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-2"
                                        >
                                            Excel Node <ArrowUpRight className="w-3 h-3" />
                                        </motion.button>
                                    </div>
                                </div>
                                <div className="absolute top-[-10%] right-[-10%] opacity-20 group-hover:rotate-12 transition-transform duration-500">
                                    <Database className="w-40 h-40 text-white" />
                                </div>
                            </motion.div>

                            {/* Course Management Quick Actions */}
                            <motion.div
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.8 }}
                                className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem]"
                            >
                                <h3 className="text-sm font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                                    <Plus className="w-4 h-4 text-indigo-400" />
                                    Quick Course Injector
                                </h3>
                                <div className="space-y-4">
                                    <motion.div
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsAddCourseModalOpen(true);
                                        }}
                                        className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all cursor-pointer relative z-10"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-widest">Incorporate New Course</span>
                                        </div>
                                        <Plus className="w-4 h-4 text-gray-600 group-hover:text-white" />
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsDeleteCourseModalOpen(true);
                                        }}
                                        className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:border-red-500/50 transition-all cursor-pointer relative z-10"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                                                <Trash2 className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-widest">Decommission Course</span>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                        </>
                    )}

                </div>
            </main >

            <AnimatePresence>
                {editingFaculty && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl" />

                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <Settings className="w-6 h-6 text-blue-500" />
                                Modify Faculty Node
                            </h3>

                            <form onSubmit={handleUpdateFaculty} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">First Name</label>
                                        <input
                                            name="given_name"
                                            defaultValue={editingFaculty.given_name}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Name</label>
                                        <input
                                            name="family_name"
                                            defaultValue={editingFaculty.family_name}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Assigned Subject</label>
                                    <select
                                        name="course_id"
                                        defaultValue={editingFaculty.course_id}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                    >
                                        <option value="">-- No Specific Assignment --</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>{course.course_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status</label>
                                    <select
                                        name="status"
                                        defaultValue={editingFaculty.status}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Decommissioned">Decommissioned</option>
                                    </select>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingFaculty(null)}
                                        className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Commit Protocol
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl" />

                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <UserPlus className="w-6 h-6 text-green-500" />
                                Inject New Faculty Node
                            </h3>

                            <form onSubmit={handleAddFaculty} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">First Name</label>
                                        <input
                                            name="given_name"
                                            placeholder="Enter first name"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all placeholder:text-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Name</label>
                                        <input
                                            name="family_name"
                                            placeholder="Enter last name"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Node Identifier (Email)</label>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="faculty@university.edu"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all placeholder:text-gray-700"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Operational Status</label>
                                        <select
                                            name="status"
                                            required
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-bold"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="On Leave">On Leave</option>
                                            <option value="Pending">Pending (Must Sign Up)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Access Key (Password)</label>
                                        <input
                                            name="password"
                                            type="password"
                                            placeholder="Set initial password"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all placeholder:text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Primary Assignment (Subject)</label>
                                    <select
                                        name="course_id"
                                        required
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-bold"
                                    >
                                        <option value="">-- Select Course Objective --</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>{course.course_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-green-500/20"
                                    >
                                        Process Injection
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {isSettingsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl" />

                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <Settings className="w-6 h-6 text-blue-500" />
                                Admin Identity Config
                            </h3>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">First Name</label>
                                    <input
                                        name="given_name"
                                        defaultValue={user?.given_name}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Name</label>
                                    <input
                                        name="family_name"
                                        defaultValue={user?.family_name}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsSettingsOpen(false)}
                                        className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {isAddCourseModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <BookOpen className="w-6 h-6 text-blue-500" />
                                Inject New Course
                            </h3>
                            <form onSubmit={handleAddCourse} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Subject Name</label>
                                    <input
                                        name="courseName"
                                        required
                                        placeholder="e.g. Advanced DBMS"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-700"
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddCourseModalOpen(false)}
                                        className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Finalize Injection
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {isDeleteCourseModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg relative overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <Trash2 className="w-6 h-6 text-red-500" />
                                Decommission Course Node
                            </h3>

                            <div className="overflow-y-auto space-y-3 pr-2 scrollbar-none">
                                {courses.length > 0 ? courses.map(course => (
                                    <motion.div
                                        key={course.id}
                                        whileHover={{ x: 5, backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                                        className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group"
                                    >
                                        <div>
                                            <h4 className="text-sm font-bold text-white uppercase tracking-tight">{course.course_name}</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lead: {course.faculty_name || 'Unassigned'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCourse(course.id)}
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )) : (
                                    <div className="py-10 text-center text-gray-500 text-[10px] font-black uppercase tracking-widest">No active course nodes detected.</div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsDeleteCourseModalOpen(false)}
                                className="mt-8 w-full px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Close Terminal
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {showProfileModal && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed top-24 right-24 z-[100] w-72 bg-gray-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl p-[2px]">
                                <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center overflow-hidden">
                                    <User className="h-10 w-10 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                                    {user?.given_name} {user?.family_name}
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                    {user?.email}
                                </p>
                            </div>
                            <div className="w-full pt-4 border-t border-white/5 space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                    <span className="text-gray-500">First Name</span>
                                    <span className="text-white">{user?.given_name || '-'}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                    <span className="text-gray-500">Last Name</span>
                                    <span className="text-white">{user?.family_name || '-'}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                    <span className="text-gray-500">Role</span>
                                    <span className="text-blue-400">System Administrator</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                                Close Terminal
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 0.4; }
                }
                .animate-pulse {
                    animation: pulse-slow 10s infinite ease-in-out;
                }
            `}</style>
        </div >
    );
};

export default AdminDashboard;
