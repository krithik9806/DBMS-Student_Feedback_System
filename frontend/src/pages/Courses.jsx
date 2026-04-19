import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { ArrowLeft, BookOpen, GraduationCap, Clock, ChevronRight, Search, Hexagon, Star, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS, { handleResponse } from '../utils/api';

const Courses = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const { scrollY } = useScroll();

    // Parallax values for background blobs
    const blob1Y = useTransform(scrollY, [0, 1000], [0, 200]);
    const blob2Y = useTransform(scrollY, [0, 1000], [0, -200]);

    // Mouse follow effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 1000, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 1000, damping: 30 });

    const [sessionOpen, setSessionOpen] = useState(true);
    const [courseList, setCourseList] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const checkSession = () => {
            const status = localStorage.getItem('sessionStatus');
            setSessionOpen(status !== 'closed');
        };

        const loadCourses = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.COURSES);
                if (!response.ok) throw new Error('Failed to synchronize curriculum matrix');
                const data = await handleResponse(response);
                setCourseList(data);
            } catch (err) {
                console.error("SQL curriculum retrieval failure:", err);
            }
        };

        const handleSync = () => {
            checkSession();
            loadCourses();
        };

        checkSession();
        loadCourses();
        window.addEventListener('storage', handleSync);

        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('storage', handleSync);
        };
    }, []);


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 15 }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            {/* Interactive Mouse Glow */}
            <motion.div
                className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"
                style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
            />

            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    style={{ y: blob1Y }}
                    className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    style={{ y: blob2Y }}
                    className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]"
                    animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
            </div>

            {/* Header / Nav */}
            <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <motion.button
                        onClick={() => navigate('/dashboard')}
                        whileHover={{ x: -5 }}
                        className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </motion.button>
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Hexagon className="w-5 h-5 text-white animate-spin-slow" />
                        </div>
                        <span className="text-xl font-black tracking-tighter uppercase italic">My <span className="text-blue-400">Courses</span></span>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-20 px-6 relative z-10">
                <header className="mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <h2 className="text-xs font-black tracking-[0.5em] text-blue-500 uppercase mb-4">
                            Academic Enrollment
                        </h2>
                        <h1 className="text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
                            Knowledge <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                                Repository
                            </span>
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
                            Hey <span className="text-white font-bold">{user ? user.given_name || user.name.split(' ')[0] : 'Student'}</span>,
                            here are the subjects you're currently mastering at SRMIST.
                            Each course is a step towards your digital expertise.
                        </p>
                    </motion.div>
                </header>

                {/* Course Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8"
                >
                    {courseList.map((course, index) => (
                        <motion.div
                            key={course.id || index}
                            variants={cardVariants}
                            whileHover={{
                                y: -10,
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderColor: 'rgba(59, 130, 246, 0.3)'
                            }}
                            className="group bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-64"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                        <BookOpen className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Semester IV
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight group-hover:text-blue-400 transition-colors">
                                    {course.course_name}
                                </h3>
                            </div>

                            <div className="relative z-10 flex items-center justify-between mt-4">
                                <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> 40 Hours</span>
                                    <span className="flex items-center gap-2 text-yellow-500/80"><Star className="w-3 h-3 fill-yellow-500/20" /> Core</span>
                                </div>
                                <motion.button
                                    whileHover={{ x: 5 }}
                                    onClick={() => {
                                        if (!sessionOpen) {
                                            alert("Feedback portal is currently closed for this node.");
                                            navigate('/feedback');
                                        } else {
                                            navigate('/feedback', { state: { course } });
                                        }
                                    }}
                                    className="p-3 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                    {courseList.length === 0 && (
                        <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-[3rem]">
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No courses currently broadcast from the administrative terminal.</p>
                        </div>
                    )}
                </motion.div>

                {/* Decorative Section */}
                <motion.section
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-40 text-center"
                >
                    <div className="inline-block px-10 py-5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-white/10 backdrop-blur-md">
                        <p className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <GraduationCap className="w-5 h-5 text-blue-400" />
                            Continuous Learning is the Minimum Requirement for Success
                        </p>
                    </div>
                </motion.section>
            </main>

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

export default Courses;
