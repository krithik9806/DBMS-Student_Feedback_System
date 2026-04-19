import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { LogOut, User, BookOpen, MessageSquare, ArrowRight, Hexagon, Settings, Mail, Shield, ExternalLink, Bell, ChevronDown, Info, Activity, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS, { handleResponse } from '../utils/api';

const Counter = ({ value }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseInt(value);
        if (start === end) return;
        let totalMiliseconds = 2000;
        let incrementTime = (totalMiliseconds / end);
        let timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start === end) clearInterval(timer);
        }, incrementTime);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{count}</span>;
};

const InteractiveCard = ({ title, subtitle, description, icon: Icon, onClick, color, buttonText, direction = 'left', delay = 0 }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 1000, damping: 50 });
    const springY = useSpring(mouseY, { stiffness: 1000, damping: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            initial={{ opacity: 0, x: direction === 'left' ? -100 : 100, y: 0 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: false, margin: "-10% 0px -10% 0px", amount: 0.2 }}
            transition={{ duration: 0.7, delay, ease: "easeOut" }}
            whileHover={{
                y: -15,
                scale: 1.02,
                boxShadow: `0 20px 40px ${color === 'purple' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
            }}
            className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-12 rounded-[3.5rem] border border-white/10 flex flex-col items-center text-center h-full group relative overflow-hidden backdrop-blur-sm cursor-default"
        >
            <div className={`absolute top-0 right-0 w-48 h-48 ${color === 'purple' ? 'bg-purple-500/10' : 'bg-blue-500/10'} blur-[100px] group-hover:bg-opacity-30 transition-all duration-700`} />

            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`w-20 h-20 ${color === 'purple' ? 'bg-purple-500/20' : 'bg-blue-500/20'} rounded-3xl mb-10 flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 relative`}
            >
                <Icon className={`h-10 w-10 ${color === 'purple' ? 'text-purple-500' : 'text-blue-500'}`} />
                <div className={`absolute inset-0 ${color === 'purple' ? 'bg-purple-500/20' : 'bg-blue-500/20'} blur-xl scale-0 group-hover:scale-150 transition-transform duration-700 rounded-full`} />
            </motion.div>

            <h3 className="text-4xl font-black uppercase mb-6 tracking-tighter leading-none">
                {title} <br />
                <span className={color === 'purple' ? 'text-purple-400' : 'text-blue-400'}>{subtitle}</span>
            </h3>

            <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
                {description}
            </p>

            {/* Floating Follow Button */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        style={{
                            position: 'absolute',
                            left: springX,
                            top: springY,
                            translateX: '-50%',
                            translateY: '-50%',
                            pointerEvents: 'none',
                        }}
                        className={`z-50 px-6 py-3 ${color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'} rounded-full shadow-2xl flex items-center gap-2 whitespace-nowrap`}
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                            {buttonText}
                        </span>
                        <ArrowRight className="h-4 w-4 text-white" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [adminInfo, setAdminInfo] = useState(null);
    const { scrollY } = useScroll();

    // Parallax values for background blobs
    const blob1Y = useTransform(scrollY, [0, 1000], [0, 200]);
    const blob2Y = useTransform(scrollY, [0, 1000], [0, -200]);

    // Mouse follow effect for subtle glow
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 1000, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 1000, damping: 30 });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);

            // Session Fixer: If name looks like an ID/email prefix, try to find the full name in our users list
            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const dbMatch = existingUsers.find(u => u.email === parsedUser.email);

            if (dbMatch && (!parsedUser.given_name || (parsedUser.name && parsedUser.name.match(/\d/)))) {
                setUser(dbMatch);
                localStorage.setItem('user', JSON.stringify(dbMatch));
            } else {
                setUser(parsedUser);
            }
        }

        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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

    const handleContactClick = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.ADMIN_CONTACT);
            if (!response.ok) throw new Error('Failed to synchronize contact matrix');
            const data = await handleResponse(response);
            setAdminInfo(data);
            setIsContactOpen(true);
        } catch (err) {
            console.error("Contact Retrieval Error:", err);
            // Silent fallback to avoid interrupting user experience with alerts
            setAdminInfo({
                full_name: 'John Wick',
                given_name: 'John',
                family_name: 'Wick',
                email: 'admin123@gmail.com'
            });
            setIsContactOpen(true);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 12 }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            {/* Interactive Mouse Glow */}
            <motion.div
                className="fixed top-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0"
                style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
            />

            {/* Ambient Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    style={{ y: blob1Y }}
                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    style={{ y: blob2Y }}
                    className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
            </div>

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -20, rotate: -10 }}
                                animate={{ opacity: 1, x: 0, rotate: 0 }}
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center space-x-2 cursor-pointer"
                            >
                                <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-500 rounded-lg shadow-lg shadow-purple-500/20 flex items-center justify-center">
                                    <Hexagon className="w-5 h-5 text-white animate-spin-slow" />
                                </div>
                                <h1 className="text-xl font-black tracking-tighter uppercase italic">
                                    SRM <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">STUDENT</span>
                                </h1>
                            </motion.div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-400 uppercase tracking-widest">
                                {['Courses', 'Dashboard'].map((item, i) => (
                                    <motion.button
                                        key={item}
                                        onClick={() => item === 'Courses' ? navigate('/courses') : null}
                                        whileHover={{ y: -2, color: '#fff' }}
                                        className={`transition-colors relative text-sm font-medium uppercase tracking-widest ${item === 'Dashboard' ? 'text-white font-bold' : 'text-gray-400'}`}
                                    >
                                        {item}
                                        {item === 'Dashboard' && (
                                            <motion.div
                                                layoutId="navUnderline"
                                                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-purple-500"
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                            <div className="flex items-center space-x-4 pl-6 border-l border-white/10">
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
                                    <span className="text-sm font-bold tracking-tight">
                                        {user ? (user.given_name ? `${user.given_name} ${user.family_name || ''}` : user.name) : 'STUDENT'}
                                    </span>
                                </motion.div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="p-2.5 rounded-xl bg-white/5 transition-all border border-white/5 group"
                                >
                                    <Settings className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1, x: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleLogout}
                                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all"
                                >
                                    <LogOut className="h-5 w-5" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <motion.main
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto py-12 px-6 lg:px-8 relative z-10"
            >
                {/* Hero section */}
                <header className="mb-20 text-center lg:text-left">
                    <motion.div variants={itemVariants}>
                        <motion.h2
                            initial={{ opacity: 0, letterSpacing: '0.1em' }}
                            animate={{ opacity: 1, letterSpacing: '0.4em' }}
                            transition={{ duration: 1.2 }}
                            className="text-xs font-black text-purple-500 uppercase mb-4"
                        >
                            SRM ACADEMIC PORTAL
                        </motion.h2>
                        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] uppercase mb-8">
                            <motion.span
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                                className="block"
                            >
                                EFFICIENT
                            </motion.span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500">
                                FEEDBACK
                            </span> <br />
                            <motion.span
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.7 }}
                                className="block"
                            >
                                SOLUTIONS
                            </motion.span>
                        </h1>
                        <div className="flex flex-col lg:flex-row items-center gap-8 justify-between mt-12 pt-12 border-t border-white/5">
                            <div className="flex items-center gap-4 group">
                                <div className="text-4xl font-black text-purple-500 group-hover:scale-110 transition-transform cursor-default">
                                    <Counter value="45" />+
                                </div>
                                <div className="text-[10px] text-gray-500 leading-tight uppercase tracking-widest max-w-[100px]">
                                    Active courses in SRMIST system
                                </div>
                            </div>
                            <p className="max-w-xl text-gray-400 text-sm tracking-wide leading-relaxed">
                                Welcome <span className="text-white font-bold">{user ? user.given_name || (user.name && user.name.split(' ')[0]) || (user.full_name && user.full_name.split(' ')[0]) || 'Student' : 'Student'}</span>.
                                We help SRM university students and parental faculty to find
                                their way in the digital portal by creating efficient feedback
                                strategies and increasing their online influence.
                            </p>
                            <motion.button
                                onClick={handleContactClick}
                                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                            >
                                Contact Us
                            </motion.button>
                        </div>
                    </motion.div>
                </header>

                {/* Dashboard Grid */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column - Digital Pro */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="lg:col-span-4 flex flex-col justify-center"
                    >
                        <motion.h3
                            className="text-5xl font-black uppercase tracking-tighter mb-8 leading-none"
                            whileInView={{ scale: [0.95, 1] }}
                        >
                            DIGITAL <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-blue-500">PRO</span>
                        </motion.h3>

                        <div className="space-y-12">
                            {[
                                { title: 'Expertise', desc: 'Our team consists of professionals who share many years of experience in the field of SRMIST portal management.' },
                                { title: 'Effectiveness', desc: 'Our goal is not just working, but to achieve concrete results for SRM university students and faculty.' }
                            ].map((item, i) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: false }}
                                    transition={{ delay: i * 0.2 + 0.3 }}
                                    whileHover={{ x: 10 }}
                                    className="group border-l-2 border-purple-500/20 pl-6 py-2 hover:border-purple-500 transition-all cursor-default"
                                >
                                    <h4 className="text-[10px] font-black tracking-[0.2em] text-white uppercase mb-2 group-hover:text-purple-400 transition-colors">{item.title}</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-300 transition-colors">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Column - Cards */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InteractiveCard
                            title="Submit"
                            subtitle="Feedback"
                            description="Share your detailed thoughts on courses, faculty, and academic resources at SRMIST."
                            icon={MessageSquare}
                            color="purple"
                            buttonText="FEEDBACK"
                            onClick={() => navigate('/feedback')}
                            direction="right"
                            delay={0.1}
                        />

                        <InteractiveCard
                            title="My"
                            subtitle="Courses"
                            description="Track your currently enrolled subjects and review your submission history comprehensively."
                            icon={BookOpen}
                            color="blue"
                            buttonText="VIEW ALL"
                            onClick={() => navigate('/courses')}
                            direction="right"
                            delay={0.3}
                        />
                    </div>
                </section>

                {/* Footer Section */}
                <motion.section
                    variants={itemVariants}
                    className="mt-32 pt-20 border-t border-white/5 overflow-hidden rounded-[3rem] relative"
                >
                    <motion.div
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 blur-[100px]"
                    />
                    <div className="relative z-10 text-center py-20 px-4">
                        <motion.h2
                            whileInView={{ opacity: [0, 1], y: [20, 0] }}
                            className="text-5xl font-black uppercase tracking-tighter mb-4"
                        >
                            LET'S BEGIN
                        </motion.h2>
                        <motion.h2
                            whileInView={{ scale: [0.9, 1], opacity: [0, 1] }}
                            className="text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 mb-8 leading-none"
                        >
                            IMPROVEMENT
                        </motion.h2>
                        <p className="text-gray-400 text-sm tracking-widest uppercase mb-12">Please contact us for cooperation and service details.</p>
                        <motion.button
                            onClick={handleContactClick}
                            whileHover={{ scale: 1.1, rotate: [-1, 1, -1] }}
                            whileTap={{ scale: 0.9 }}
                            className="px-12 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                        >
                            Contact Us
                        </motion.button>
                    </div>
                </motion.section>
            </motion.main>

            {/* Settings Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gray-900 border border-white/10 p-10 rounded-[3rem] w-full max-w-md relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 text-white">Identity Matrix Settings</h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Given Name</label>
                                    <input
                                        name="given_name"
                                        defaultValue={user?.given_name}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Family Name</label>
                                    <input
                                        name="family_name"
                                        defaultValue={user?.family_name}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-all"
                                        required
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsSettingsOpen(false)}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
                                    >
                                        Synchronize
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contact Us Modal */}
            <AnimatePresence>
                {isContactOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 100, rotateX: 20 }}
                            animate={{ scale: 1, y: 0, rotateX: 0 }}
                            exit={{ scale: 0.8, y: 100, opacity: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className="bg-gray-900 border border-white/10 p-12 rounded-[4rem] w-full max-w-lg relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
                        >
                            {/* Animated Background Gradients */}
                            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full animate-pulse" />
                            <div className="absolute bottom-[-20%] left-[-20%] w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full animation-delay-2000" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <motion.div
                                    animate={{
                                        y: [0, -10, 0],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/40"
                                >
                                    <Shield className="h-10 w-10 text-white" />
                                </motion.div>

                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 mb-4">Support Protocol</h3>
                                <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-6 italic">Central Registry</h2>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-blue-500/10 border border-blue-500/20 px-8 py-4 rounded-2xl mb-10 max-w-[340px]"
                                >
                                    <p className="text-blue-400 text-[10px] font-black leading-relaxed uppercase tracking-widest">
                                        Access the root administrator node for system troubleshooting and identity synchronization.
                                    </p>
                                </motion.div>

                                <div className="w-full space-y-4 mb-10">
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Administrator</p>
                                            <p className="text-lg font-black text-white">{adminInfo?.given_name} {adminInfo?.family_name}</p>
                                        </div>
                                        <User className="h-6 w-6 text-blue-500" />
                                    </div>

                                    <motion.a
                                        href={`mailto:${adminInfo?.email}`}
                                        className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between group hover:bg-blue-600 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="text-left text-white">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Email Terminal</p>
                                            <p className="text-lg font-black">{adminInfo?.email}</p>
                                        </div>
                                        <Mail className="h-6 w-6 text-white" />
                                    </motion.a>
                                </div>

                                <motion.button
                                    onClick={() => setIsContactOpen(false)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full py-6 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-3xl shadow-xl hover:shadow-2xl transition-all"
                                >
                                    Close Connection
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Info Modal */}
            <AnimatePresence>
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
                                    <span className="text-purple-400">Undergraduate Student</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                                Close Details
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
