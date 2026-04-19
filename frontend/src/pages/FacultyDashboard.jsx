import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import {
    Users, BookOpen, MessageSquare, TrendingUp,
    BarChart3, Settings, LogOut, Search,
    Star, GraduationCap, ArrowUpRight,
    Zap, Target, Activity, LayoutDashboard, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS, { handleResponse } from '../utils/api';

const FacultyDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [liveData, setLiveData] = useState({
        stats: [],
        performance: [],
        feedbacks: [],
        courseName: "Loading...",
        overallSatisfaction: 0
    });

    // Mouse glow effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 1000, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 1000, damping: 30 });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.role !== 'faculty') {
                navigate(parsed.role === 'admin' ? '/admin-dashboard' : '/dashboard');
            }
            setUser(parsed);
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
        if (!user) return;

        const syncFacultyTelemetry = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.FACULTY_STATS(user.id));
                const statsResponse = await fetch(API_ENDPOINTS.ADMIN_STATS);
                const coursesResponse = await fetch(API_ENDPOINTS.COURSES);
                
                if (!response.ok || !statsResponse.ok || !coursesResponse.ok) throw new Error('Failed to synchronize telemetry');
                
                const data = await handleResponse(response);
                const globalStats = await handleResponse(statsResponse);
                const coursesData = await handleResponse(coursesResponse);
                
                const assignedCourse = coursesData.find(c => c.faculty_id === user.id);
                const exactCourseName = assignedCourse ? assignedCourse.course_name : (user?.department || "Unassigned");

                const totalStudents = globalStats.totalStudents || 0;
                const activeTotal = totalStudents > 0 ? totalStudents : 1; // Prevent Div by 0
                const count = data.length;

                const map100 = (v) => {
                    if (v === undefined || v === null) return 70;
                    const maps = {
                        "Not effective": 20, "Slightly effective": 40, "Moderately effective": 60, "Very effective": 80, "Extremely effective": 100,
                        "Poor": 20, "Average": 40, "Good": 60, "Very good": 80, "Excellent": 100,
                        "Never": 20, "Rarely": 40, "Sometimes": 60, "Often": 80, "Always": 100,
                        "Needs Improvement": 20, "Satisfactory": 40, "Very Good": 80
                    };
                    if (maps[v]) return maps[v];
                    const num = parseFloat(v);
                    if (!isNaN(num) && num <= 10) return num * 10;
                    if (!isNaN(num) && num > 10) return num;
                    return 0; 
                };

                const getStatus = (score) => {
                    if (score >= 90) return 'Excellence';
                    if (score >= 80) return 'High Impact';
                    if (score >= 70) return 'Mastery';
                    if (score >= 60) return 'Optimal';
                    if (score >= 50) return 'Satisfactory';
                    return 'Needs Work';
                };

                const avgScore = (qId) => {
                    let validCount = 0;
                    let totalScore = 0;
                    
                    data.forEach(f => {
                        const resObj = typeof f.responses === 'string' ? JSON.parse(f.responses) : (f.responses || {});
                        if (resObj[qId] !== undefined && resObj[qId] !== "") {
                            validCount++;
                            totalScore += map100(resObj[qId]);
                        }
                    });
                    
                    if (validCount === 0) return 0;
                    return Math.round(totalScore / validCount);
                };

                const avgRating = count > 0
                    ? (data.reduce((acc, curr) => acc + (Number(curr.overall_rating) || 0), 0) / count).toFixed(1)
                    : '0.0';

                setLiveData({
                    stats: [
                        { label: 'Total Feedback Received', value: count.toString(), delta: '+1', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        { label: 'Avg Rating', value: avgRating, delta: '+0.1', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                        { label: 'Total Enrolled Students', value: totalStudents.toString(), delta: '0', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Response Rate', value: Math.min(100, Math.round((count / activeTotal) * 100)) + '%', delta: '+2%', icon: Zap, color: 'text-pink-500', bg: 'bg-pink-500/10' }
                    ],
                    performance: [
                        { id: "1", name: 'Concept Explanation Clarity' },
                        { id: "2", name: 'Subject Knowledge Rating' },
                        { id: "3", name: 'Teaching Methods Effectiveness' },
                        { id: "4", name: 'Class Interactivity & Engagement' },
                        { id: "5", name: 'Doubt Resolution Efficiency' },
                        { id: "6", name: 'Communication Clarity' },
                        { id: "7", name: 'Helpful Materials Utilization' },
                        { id: "8", name: 'Class Time Management' },
                        { id: "9", name: 'Understanding Improvement Impact' }
                    ].map(q => {
                        const score = avgScore(q.id);
                        return { name: q.name, score, status: getStatus(score) };
                    }),
                    feedbacks: data.slice(0, 3).map(f => ({
                        user: f.student_name || "Anonymous Node",
                        course: f.course_name || "General Inquiry",
                        comment: f.overall_comment || "No comment provided.",
                        time: new Date(f.timestamp).toLocaleDateString()
                    })),
                    courseName: exactCourseName,
                    overallSatisfaction: count > 0 ? Math.round(avgRating * 10) : 0
                });
            } catch (err) {
                console.error("Critical Faculty Telemetry Synchronization Failure:", err);
            }
        };

        syncFacultyTelemetry();
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
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
        } catch (err) {
            console.error("Profile Synchronization Failure:", err);
            alert(`CRITICAL ERROR: ${err.message}`);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            {/* Interactive Mouse Glow */}
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
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02]"></div>
            </div>

            {/* Sidebar Navigation */}
            <aside className="fixed left-0 top-0 h-full w-24 bg-black/40 backdrop-blur-3xl border-r border-white/5 z-50 flex flex-col items-center py-10 justify-between">
                <div className="space-y-10">
                    <motion.div
                        whileHover={{ rotate: 180 }}
                        className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center cursor-pointer shadow-lg shadow-purple-500/20"
                    >
                        <Zap className="text-white w-6 h-6 fill-current" />
                    </motion.div>

                    <nav className="flex flex-col gap-6">
                        {[
                            { id: 'overview', icon: LayoutDashboard, action: () => setActiveTab('overview') },
                            { id: 'settings', icon: Settings, action: () => setIsSettingsOpen(true) }
                        ].map((item) => (
                            <motion.button
                                key={item.id}
                                onClick={item.action}
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-purple-600 text-white' : 'text-gray-500'
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
                    <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </motion.button>
            </aside>

            {/* Main Dashboard Area */}
            <main className="pl-24 pt-8 pb-12 transition-all duration-500">
                <div className="max-w-7xl mx-auto px-10">

                    {/* Top Header */}
                    <header className="flex items-center justify-between mb-12">
                        <div>
                            <motion.h2
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] mb-2"
                            >
                                Intelligence Portal
                            </motion.h2>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl font-black tracking-tighter uppercase"
                            >
                                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Prof. {user?.given_name} {user?.family_name}</span>
                            </motion.h1>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative group hidden lg:block">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search data nodes..."
                                    className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-64 transition-all"
                                />
                            </div>
                            <motion.div
                                onClick={() => setShowProfileModal(!showProfileModal)}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center space-x-3 bg-white/5 pl-2 pr-4 py-1.5 rounded-full border border-white/10 cursor-pointer transition-all"
                            >
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-[1px]">
                                    <div className="h-full w-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                        {user && user.picture ? (
                                            <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-4 w-4 text-white" />
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm font-bold tracking-tight text-white capitalize">
                                    {user ? (user.given_name ? `${user.given_name} ${user.family_name || ''}` : user.name) : 'FACULTY'}
                                </span>
                            </motion.div>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {liveData.stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.2 + (i * 0.1), type: 'spring', stiffness: 100 }}
                                whileHover={{
                                    y: -8,
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    borderColor: 'rgba(168,85,247,0.3)',
                                    boxShadow: '0 20px 40px -20px rgba(168,85,247,0.2)'
                                }}
                                className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] transition-all group cursor-default"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-full text-[10px] font-black uppercase">
                                        <TrendingUp className="w-3 h-3" />
                                        {stat.delta}
                                    </div>
                                </div>
                                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Performance & Insights Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Course Ranking */}
                        <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.6 }}
                            whileHover={{ borderColor: 'rgba(168,85,247,0.2)' }}
                            className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-10 rounded-[2.5rem] relative overflow-hidden group transition-all"
                        >
                            <div className="absolute top-0 right-0 p-8">
                                <Activity className="w-20 h-20 text-purple-500/10" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <Target className="w-5 h-5 text-purple-500" />
                                Course Performance Index
                            </h3>

                            <div className="space-y-6">
                                {liveData.performance.map((course, i) => (
                                    <div key={course.name} className="relative group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-gray-400">{course.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 text-gray-500">
                                                    {course.status}
                                                </span>
                                                <span className="text-sm font-black text-white">{course.score}%</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${course.score}%` }}
                                                transition={{ duration: 1.5, delay: 0.8 + (i * 0.1) }}
                                                className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Quick Insights */}
                        <motion.div
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.7 }}
                            className="bg-gradient-to-br from-purple-600 to-blue-700 p-1 rounded-[2rem] shadow-2xl shadow-purple-900/20 max-h-[350px]"
                        >
                            <div className="h-full w-full bg-[#0a0a0a] rounded-[1.9rem] p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                                    <GraduationCap className="text-purple-400 w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black tracking-tighter uppercase mb-2">Academic Impact</h3>
                                <p className="text-gray-500 text-xs leading-relaxed max-w-[200px]">
                                    Prof. {user?.given_name} for the course - "{liveData.courseName}" reached <span className="text-white font-bold">{liveData.overallSatisfaction}% satisfaction</span> this month.
                                </p>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </main >

            <AnimatePresence>
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
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl" />

                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <Settings className="w-6 h-6 text-purple-500" />
                                Profile Configuration
                            </h3>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">First Name</label>
                                    <input
                                        name="given_name"
                                        defaultValue={user?.given_name}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Name</label>
                                    <input
                                        name="family_name"
                                        defaultValue={user?.family_name}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
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
                                        className="flex-1 px-6 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
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
                            <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-2xl p-[2px]">
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
                                    <span className="text-purple-400">University Faculty</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                                Close Portal
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
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
                .animate-pulse {
                    animation: pulse-slow 8s infinite ease-in-out;
                }
            `}</style>
        </div >
    );
};

export default FacultyDashboard;
