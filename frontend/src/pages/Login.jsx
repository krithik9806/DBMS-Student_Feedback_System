import React, { useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
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





const Login = () => {
    const navigate = useNavigate();





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

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await fetch(API_ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await handleResponse(response);
                throw new Error(errorData.error || errorData.message || 'Identity Verification Failed');
            }

            const { user, token } = await handleResponse(response);

            // Persist Identity Node & Access Token
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('authToken', token);

            // Conditional Redirection based on Administrative Role
            if (user.role === 'faculty') navigate('/faculty-dashboard');
            else if (user.role === 'admin') navigate('/admin-dashboard');
            else navigate('/dashboard');
        } catch (err) {
            console.error("Authentication Protocol Error:", err);
            alert(err.message || "System failure during identity verification.");
        }
    };

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
                            Welcome <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Back!</span>
                        </h1>
                        <p className="text-sm text-gray-400 mb-8 leading-relaxed max-w-md font-medium">
                            We missed you! Sign in to continue your journey and provide valuable feedback.
                        </p>
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
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Sign in to your account</h2>
                        <p className="mt-2 text-sm text-gray-400">
                            New here?{' '}
                            <Link to="/signup" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                                Create an account
                            </Link>
                        </p>
                    </motion.div>



                    <motion.form
                        onSubmit={handleLogin}
                        className="mt-6 space-y-6 relative z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        autoComplete="off"
                    >
                        <InputField label="Email address" name="email" type="email" placeholder="john@university.edu" icon={Mail} autoComplete="new-email" />

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors duration-200" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    autoComplete="new-password"
                                    className="block w-full pl-10 pr-3 py-3 border border-white/5 rounded-xl leading-5 bg-[#0a0a0a] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/5 transition-all duration-200 ease-in-out shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>


                        <div>
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                            >
                                Sign In <LogIn className="ml-2 h-4 w-4" />
                            </motion.button>
                        </div>


                    </motion.form>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
