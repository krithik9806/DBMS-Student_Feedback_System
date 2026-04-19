import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { Mail, Lock, User, CheckCircle, ArrowRight, Shield, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import API_ENDPOINTS, { handleResponse } from '../utils/api';

const InputField = ({ label, type, name, placeholder, icon: Icon, autoComplete }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors duration-200" />
            </div>
            <input
                type={type}
                name={name}
                autoComplete={autoComplete || "off"}
                className="block w-full pl-10 pr-3 py-3 border border-white/5 rounded-xl leading-5 bg-[#0a0a0a] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/5 transition-all duration-200 ease-in-out shadow-sm"
                placeholder={placeholder}
                required
            />
        </div>
    </div>
);



const Signup = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('student');
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showFacultyModal, setShowFacultyModal] = useState(false);
    const [showNameErrorModal, setShowNameErrorModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Mouse glow effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 1000, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 1000, damping: 30 });

    useEffect(() => {
        const handleMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, [mouseX, mouseY]);

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);
        const firstName = formData.get('first_name');
        const lastName = formData.get('last_name');
        const email = formData.get('email');
        const password = formData.get('password');

        if (role === 'student') {
            const hasSpecialChars = (str) => /[^a-zA-Z0-9\s]/.test(str);
            if (hasSpecialChars(firstName) || hasSpecialChars(lastName)) {
                setIsLoading(false);
                setShowNameErrorModal(true);
                return;
            }
        }

        try {
            const response = await fetch(API_ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: `${firstName} ${lastName}`,
                    email,
                    password,
                    role,
                    college: 'SRMIST'
                })
            });

            if (!response.ok) {
                const errorData = await handleResponse(response);
                console.log("[SIGNUP DEBUG] Error Data:", errorData);
                if (errorData.error === 'ADMIN_EXISTS') {
                    setShowAdminModal(true);
                    return;
                }

                if (role === 'faculty' && response.status === 403) {
                    console.log("[SIGNUP] Faculty 403 detected. Showing modal.");
                    setShowFacultyModal(true);
                    return;
                }

                if (errorData.error === 'FACULTY_NOT_REGISTERED') {
                    setShowFacultyModal(true);
                    return;
                }
                throw new Error(errorData.error || errorData.message || 'Identity Registry Failure');
            }

            const data = await handleResponse(response);
            const userToStore = data.user || data;

            localStorage.setItem('user', JSON.stringify({
                ...userToStore,
                given_name: firstName || userToStore.given_name,
                family_name: lastName || userToStore.family_name
            }));

            if (role === 'faculty') navigate('/faculty-dashboard');
            else if (role === 'admin') navigate('/admin-dashboard');
            else navigate('/dashboard');
        } catch (err) {
            console.error("Identity Registry Failure:", err);
            alert(`IDENTITY REGISTRY ALERT: ${err.message || 'System Link Failure'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const roles = [
        { id: 'student', label: 'Student', icon: User },
        { id: 'faculty', label: 'Faculty', icon: Users },
        { id: 'admin', label: 'Admin', icon: Shield }
    ];

    return (
        <div className="min-h-screen flex bg-[#050505] font-sans overflow-hidden text-gray-200 selection:bg-purple-500/30 relative">
            {/* Interactive Spotlight Cursor */}
            <motion.div
                className="fixed top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"
                style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
            />

            {/* Ambient Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] mix-blend-screen pointer-events-none" />

            {/* Left Side - Hero/Artistic */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:flex lg:w-1/2 relative text-white items-center justify-center p-12 z-10"
            >
                {/* Abstract Background Elements (Enhanced Colors) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
                    <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-24 right-0 w-[500px] h-[500px] bg-pink-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 max-w-lg text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <h2 className="text-xl font-bold italic text-gray-500 mb-6 uppercase tracking-[0.2em] drop-shadow-lg leading-tight">
                            SRMIST Ramapuram
                        </h2>
                        <h1 className="text-5xl font-black mb-6 tracking-tighter leading-tight uppercase">
                            Create Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Account</span>
                        </h1>
                        <p className="text-sm text-gray-400 mb-8 leading-relaxed max-w-md font-medium">
                            Share your feedback and shape the future of learning. Join our community to improve the academic experience.
                        </p>

                        <div className="flex items-center space-x-4">
                            <div className="flex -space-x-2">
                                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-purple-900" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt="" />
                                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-purple-900" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt="" />
                                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-purple-900" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64" alt="" />
                            </div>
                            <span className="text-sm font-medium text-purple-200">Joined by 2,000+ students</span>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Side - Form */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-[#0a0a0a]/50 relative z-10 border-l border-white/5 backdrop-blur-xl"
            >
                <div className="mx-auto w-full max-w-md">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${role === 'faculty' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                                Mode: <span className={role === 'faculty' ? 'text-blue-400' : 'text-purple-400'}>{role}</span>
                            </span>
                        </div>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Get started today</h2>
                        <p className="mt-2 text-sm text-gray-400 relative z-50">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </motion.div>

                    <div className="mt-8">


                        <motion.form
                            onSubmit={handleSignup}
                            className="mt-6 space-y-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            autoComplete="off"
                        >
                            {/* Role Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300">Choose your role</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {roles.map((r) => {
                                        const Icon = r.icon;
                                        return (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setRole(r.id)}
                                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${role === r.id
                                                    ? 'bg-purple-500/10 border-purple-500/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <Icon className={`h-6 w-6 mb-2 ${role === r.id ? 'text-purple-400' : ''}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {role === 'faculty' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 leading-relaxed"
                                    >
                                        <span className="font-bold text-blue-400 uppercase tracking-tighter mr-2">Admin Authorization Required:</span>
                                        Only faculty nodes pre-registered by the administrator can be activated. Use the email exactly as provided during your departmental onboarding.
                                    </motion.div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                                <InputField label="First name" name="first_name" type="text" placeholder="John" icon={User} autoComplete="given-name" />
                                <InputField label="Last name" name="last_name" type="text" placeholder="Doe" icon={User} autoComplete="family-name" />
                            </div>

                            <InputField label="Email address" name="email" type="email" placeholder="john@university.edu" icon={Mail} autoComplete="email" />
                            <InputField label="Password" name="password" type="password" placeholder="••••••••" icon={Lock} autoComplete="new-password" />


                            <div>
                                <motion.button
                                    whileHover={!isLoading ? { scale: 1.02, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)" } : {}}
                                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'}`}
                                >
                                    {isLoading ? 'Verifying Registry...' : (
                                        <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
                                    )}
                                </motion.button>
                            </div>


                        </motion.form>
                    </div>
                </div>
            </motion.div>
            {/* Role Restriction Modal */}
            <AnimatePresence>
                {showAdminModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gray-900 border border-red-500/20 p-10 rounded-[3rem] w-full max-w-lg relative overflow-hidden shadow-2xl shadow-red-900/20"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl" />

                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
                                    <Shield className="w-10 h-10 text-red-500" />
                                </div>

                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-white">
                                    Access Denied
                                </h3>

                                <p className="text-gray-400 text-sm leading-relaxed mb-10">
                                    <span className="text-red-400 font-bold block mb-2 uppercase tracking-widest text-[10px]">Security Protocol 403</span>
                                    A Root Administrator node is already active in this system.
                                    The "Student Feedback Management System" is restricted to a single oversight authority.
                                </p>

                                <div className="flex flex-col w-full gap-3">
                                    <button
                                        onClick={() => setShowAdminModal(false)}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-white border border-white/10"
                                    >
                                        I Understand
                                    </button>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 text-white"
                                    >
                                        Return to Login
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {showFacultyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gray-900 border border-blue-500/20 p-10 rounded-[3rem] w-full max-w-lg relative overflow-hidden shadow-2xl shadow-blue-900/20"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl" />

                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-8 border border-blue-500/20">
                                    <Users className="w-10 h-10 text-blue-500" />
                                </div>

                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-white">
                                    Identity Not Found
                                </h3>

                                <p className="text-gray-400 text-sm leading-relaxed mb-10">
                                    <span className="text-blue-400 font-bold block mb-2 uppercase tracking-widest text-[10px]">Verification Failure</span>
                                    Your email address has not been registered in the Academic Faculty Registry.
                                    Only pre-authorized faculty nodes can be activated through this portal.
                                </p>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-10 w-full text-left">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Required Action</p>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Please report to the <span className="text-white font-bold">Admin Office</span> or your Departmental HOD to register your official identity matrix before attempting activation.
                                    </p>
                                </div>

                                <div className="flex flex-col w-full gap-3">
                                    <button
                                        onClick={() => setShowFacultyModal(false)}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-white border border-white/10"
                                    >
                                        I'll Contact Them
                                    </button>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 text-white"
                                    >
                                        Return to Terminal
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {showNameErrorModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gray-900 border border-purple-500/20 p-10 rounded-[3rem] w-full max-w-lg relative overflow-hidden shadow-2xl shadow-purple-900/20"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl" />

                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mb-8 border border-purple-500/20">
                                    <User className="w-10 h-10 text-purple-500" />
                                </div>

                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-white">
                                    Invalid Input
                                </h3>

                                <p className="text-gray-400 text-sm leading-relaxed mb-10">
                                    <span className="text-purple-400 font-bold block mb-2 uppercase tracking-widest text-[10px]">Format Violation</span>
                                    No special characters are permitted in the username. 
                                    Please use only standard alphanumeric characters for your First and Last name.
                                </p>

                                <div className="flex flex-col w-full gap-3">
                                    <button
                                        onClick={() => setShowNameErrorModal(false)}
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 text-white"
                                    >
                                        Return to Form
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Signup;
