import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Target, Zap, BarChart3, MessageSquare, Hexagon, UserCircle, CheckCircle2, Book, ChevronRight, Clock, Lock, Lightbulb, Brain, Gauge, TrendingUp, Star } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_ENDPOINTS, { handleResponse } from '../utils/api';

const Feedback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const incomingCourse = location.state?.course || null;
    const [user, setUser] = useState(null);
    const [sessionOpen, setSessionOpen] = useState(true);
    // If incomingCourse is present, skip selection and go straight to questions.
    const [feedbackStep, setFeedbackStep] = useState(incomingCourse ? 'QUESTIONS' : 'SELECT_COURSE');
    const [selectedCourse, setSelectedCourse] = useState(incomingCourse);
    // const [facultyName, setFacultyName] = useState(''); // REMOVED: Auto-assignment
    const [questionStep, setQuestionStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [courseList, setCourseList] = useState([]);
    const [hoverEmoji, setHoverEmoji] = useState(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);

    const handleDuplicateClose = () => {
        setShowDuplicateModal(false);
        setFeedbackStep('SELECT_COURSE');
        setSelectedCourse(null);
        navigate('/feedback', { replace: true });
    };

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 1000, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 1000, damping: 30 });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const syncPortal = async () => {
            try {
                const coursesRes = await fetch(API_ENDPOINTS.COURSES);
                if (!coursesRes.ok) throw new Error('Failed to synchronize portal matrix');
                const coursesData = await handleResponse(coursesRes);
                setCourseList(coursesData);
                const status = localStorage.getItem('sessionStatus');
                setSessionOpen(status !== 'closed');
            } catch (err) {
                console.error("SQL curriculum link failure:", err);
            }
        };

        syncPortal();
        window.addEventListener('storage', syncPortal);

        const handleMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMove);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('storage', syncPortal);
        };
    }, []);

    const questions = [
        {
            id: 1,
            emoji: "🗣️",
            title: "How clearly did the faculty explain the concepts in this subject?",
            type: "scale",
            icon: <MessageSquare className="w-5 h-5 text-purple-400" />,
            gradient: "from-purple-500 to-pink-500",
            min: 1,
            max: 10,
            labels: { 1: "Very unclear", 10: "Extremely clear" }
        },
        {
            id: 2,
            emoji: "🧠",
            title: "How would you rate the faculty's knowledge of the subject?",
            type: "scale",
            icon: <Book className="w-5 h-5 text-blue-400" />,
            gradient: "from-blue-500 to-cyan-400",
            min: 1,
            max: 10,
            labels: { 1: "Very weak", 10: "Excellent" }
        },
        {
            id: 3,
            emoji: "🛠️",
            title: "How effective were the teaching methods used (examples, visuals, demonstrations, problem solving)?",
            type: "choice",
            icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
            gradient: "from-yellow-500 to-orange-500",
            options: [
                { text: "Not effective", icon: "❌" },
                { text: "Slightly effective", icon: "😕" },
                { text: "Moderately effective", icon: "👍" },
                { text: "Very effective", icon: "🚀" },
                { text: "Extremely effective", icon: "🔥" }
            ]
        },
        {
            id: 4,
            emoji: "🤝",
            title: "How interactive and engaging were the classes?",
            type: "star",
            icon: <Target className="w-5 h-5 text-pink-400" />,
            gradient: "from-pink-500 to-rose-500"
        },
        {
            id: 5,
            emoji: "❓",
            title: "How effectively did the faculty address student doubts and questions?",
            type: "star",
            icon: <Zap className="w-5 h-5 text-orange-400" />,
            gradient: "from-orange-500 to-yellow-400"
        },
        {
            id: 6,
            emoji: "💬",
            title: "How clear and understandable was the faculty's communication?",
            type: "choice",
            icon: <MessageSquare className="w-5 h-5 text-emerald-400" />,
            gradient: "from-emerald-500 to-teal-400",
            options: [
                { text: "Poor", icon: "📉" },
                { text: "Average", icon: "😐" },
                { text: "Good", icon: "🙂" },
                { text: "Very good", icon: "🌟" },
                { text: "Excellent", icon: "👑" }
            ]
        },
        {
            id: 7,
            emoji: "📚",
            title: "Did the faculty use helpful materials such as slides, examples, assignments, or demonstrations?",
            type: "choice",
            icon: <Book className="w-5 h-5 text-cyan-400" />,
            gradient: "from-cyan-500 to-blue-500",
            options: [
                { text: "Never", icon: "🚫" },
                { text: "Rarely", icon: "⚠️" },
                { text: "Sometimes", icon: "🔄" },
                { text: "Often", icon: "📈" },
                { text: "Always", icon: "💯" }
            ]
        },
        {
            id: 8,
            emoji: "⏱️",
            title: "How well did the faculty manage class time and syllabus completion?",
            type: "star",
            icon: <Clock className="w-5 h-5 text-red-400" />,
            gradient: "from-red-500 to-rose-400"
        },
        {
            id: 9,
            emoji: "📈",
            title: "How much did this faculty help improve your understanding of the subject?",
            type: "scale",
            icon: <TrendingUp className="w-5 h-5 text-indigo-400" />,
            gradient: "from-indigo-500 to-violet-500",
            min: 1,
            max: 10,
            labels: { 1: "No Improvement", 10: "Major Improvement" }
        },
        {
            id: 10,
            emoji: "⭐",
            title: "Overall, how would you rate this faculty member?",
            type: "choice",
            icon: <Star className="w-5 h-5 text-amber-400" />,
            gradient: "from-amber-500 to-yellow-400",
            options: [
                { text: "Needs Improvement", icon: "🌱" },
                { text: "Satisfactory", icon: "☑️" },
                { text: "Good", icon: "👍" },
                { text: "Very Good", icon: "🌟" },
                { text: "Excellent", icon: "🏆" }
            ]
        },
        {
            id: 11,
            emoji: "📝",
            title: "Final Feedback",
            type: "text",
            icon: <Lightbulb className="w-5 h-5 text-gray-400" />,
            gradient: "from-gray-500 to-gray-600",
            placeholder: "Please share suggestions, appreciation, or areas where the faculty can improve."
        }
    ];

    useEffect(() => {
        const checkDirectCourse = async () => {
            if (incomingCourse && user && feedbackStep === 'QUESTIONS') {
                try {
                    const res = await fetch(API_ENDPOINTS.CHECK_FEEDBACK(user.id, incomingCourse.id, incomingCourse.faculty_id));
                    const data = await res.json();
                    if (data.submitted) {
                        setShowDuplicateModal(true);
                    }
                } catch (err) {
                    console.error("Feedback verification error", err);
                }
            }
        };
        checkDirectCourse();
    }, [user, incomingCourse, feedbackStep, navigate]);

    const handleCourseSelect = async (course) => {
        try {
            const res = await fetch(API_ENDPOINTS.CHECK_FEEDBACK(user.id, course.id, course.faculty_id));
            const data = await res.json();
            if (data.submitted) {
                setShowDuplicateModal(true);
                return;
            }
        } catch (err) {
            console.error("Feedback verification error", err);
        }

        setSelectedCourse(course);
        // Direct jump to Questions, skipping manual faculty entry
        setFeedbackStep('QUESTIONS');
    };

    // REMOVED handleFacultySubmit

    const handleAnswer = (value) => {
        setFormData({ ...formData, [questions[questionStep].id]: value });
    };

    const handleNext = async () => {
        if (questionStep < questions.length - 1) {
            setQuestionStep(questionStep + 1);
        } else {
            try {
                // Determine Faculty ID: Prefer selected course's assigned faculty, fallback to null (General Feedback)
                // The backend now expects 'faculty_id' which we get from the course object
                const assignedFacultyId = selectedCourse.faculty_id || null;

                const submission = {
                    student_id: user.id,
                    course_id: selectedCourse.id,
                    faculty_id: assignedFacultyId,
                    responses: formData,
                    comment: formData[11] || "No additional comment.",
                    rating: Math.round(
                        ((formData[9] || 5) + (formData[1] || 5)) / 2
                    )
                };

                const response = await fetch(API_ENDPOINTS.FEEDBACK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submission)
                });

                if (!response.ok) {
                    const errData = await handleResponse(response);
                    throw new Error(errData.error || errData.message || 'Feedback transmission failed');
                }
                setFeedbackStep('SUCCESS');
            } catch (err) {
                console.error("Submission protocol failure:", err);
                alert(`Failed to submit feedback: ${err.message}`);
            }
        }
    };

    const handlePrev = () => {
        if (questionStep > 0) {
            setQuestionStep(questionStep - 1);
        } else {
            setFeedbackStep('SELECT_COURSE');
        }
    };

    const progress = ((questionStep + 1) / questions.length) * 100;

    const resetFeedback = () => {
        setSelectedCourse(null);
        setQuestionStep(0);
        setFormData({});
        setFeedbackStep('SELECT_COURSE');
    };

    // ── Dynamic Question Renderers ──

    const renderChoice = (question) => (
        <div className="grid grid-cols-1 gap-3">
            {question.options.map((opt, i) => {
                const optText = typeof opt === 'string' ? opt : opt.text;
                const optIcon = typeof opt === 'string' ? null : opt.icon;
                const isSelected = formData[question.id] === optText;
                return (
                    <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
                        whileHover={{ x: 12, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(optText)}
                        className={`relative text-left p-5 rounded-2xl border transition-all duration-300 font-bold text-sm flex items-center gap-4 overflow-hidden group ${isSelected
                            ? `bg-gradient-to-r ${question.gradient} border-transparent text-white shadow-lg`
                            : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/[0.06]'
                            }`}
                    >
                        {/* Animated background glow on selected */}
                        {isSelected && (
                            <motion.div
                                layoutId="choiceGlow"
                                className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                        )}

                        {optIcon && (
                            <motion.span
                                className="text-2xl relative z-10"
                                animate={isSelected ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
                                transition={{ duration: 0.5 }}
                            >
                                {optIcon}
                            </motion.span>
                        )}

                        <span className="relative z-10 uppercase tracking-wider text-xs">{optText}</span>

                        <div className="ml-auto relative z-10">
                            <motion.div
                                animate={isSelected ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                                transition={{ duration: 0.4 }}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                    ? 'border-white bg-white/20'
                                    : 'border-white/20'
                                    }`}
                            >
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2 h-2 rounded-full bg-white"
                                    />
                                )}
                            </motion.div>
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );

    const renderSlider = (question) => {
        const value = formData[question.id] || 0;
        const percentage = ((value - question.min) / (question.max - question.min)) * 100;

        return (
            <div className="py-8">
                {/* Value Display */}
                <motion.div
                    className="text-center mb-10"
                    key={value}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                    <span className={`text-7xl font-black italic bg-gradient-to-r ${question.gradient} bg-clip-text text-transparent`}>
                        {value}
                    </span>
                    <span className="text-2xl font-black text-gray-500 ml-2">{question.unit}</span>
                </motion.div>

                {/* Custom Slider Track */}
                <div className="relative h-16 flex items-center px-2">
                    <div className="absolute inset-x-2 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            className={`h-full bg-gradient-to-r ${question.gradient} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        />
                        {/* Glow effect on track */}
                        <motion.div
                            className={`absolute top-0 h-full bg-gradient-to-r ${question.gradient} rounded-full blur-md opacity-40`}
                            animate={{ width: `${percentage}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        />
                    </div>
                    <input
                        type="range"
                        min={question.min}
                        max={question.max}
                        value={value}
                        onChange={(e) => handleAnswer(parseInt(e.target.value))}
                        className="absolute inset-x-2 w-[calc(100%-16px)] h-12 opacity-0 cursor-pointer z-10"
                    />
                    {/* Custom thumb */}
                    <motion.div
                        className={`absolute w-7 h-7 bg-gradient-to-br ${question.gradient} rounded-full shadow-lg pointer-events-none border-2 border-white/30`}
                        style={{ left: `calc(${percentage}% + 8px - 14px)` }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${question.gradient} rounded-full blur-lg opacity-50`} />
                    </motion.div>
                </div>

                {/* Labels */}
                {question.labels && (
                    <div className="flex justify-between mt-6 px-2">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic"
                        >
                            {question.labels[question.min]}
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic"
                        >
                            {question.labels[question.max]}
                        </motion.span>
                    </div>
                )}
            </div>
        );
    };

    const renderEmoji = (question) => (
        <div className="py-8">
            <div className="flex justify-center gap-6 flex-wrap">
                {question.options.map((opt, i) => {
                    const isSelected = formData[question.id] === opt.label;
                    const isHovered = hoverEmoji === i;
                    return (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 30, rotate: -10 }}
                            animate={{ opacity: 1, y: 0, rotate: 0 }}
                            transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                            whileHover={{ scale: 1.15, y: -8 }}
                            whileTap={{ scale: 0.9 }}
                            onHoverStart={() => setHoverEmoji(i)}
                            onHoverEnd={() => setHoverEmoji(null)}
                            onClick={() => handleAnswer(opt.label)}
                            className={`relative flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 min-w-[100px] ${isSelected
                                ? `border-transparent bg-gradient-to-b ${opt.color} shadow-2xl`
                                : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                                }`}
                        >
                            {/* Glow ring on selected */}
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1.2, opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className={`absolute inset-0 bg-gradient-to-b ${opt.color} rounded-3xl blur-xl -z-10`}
                                />
                            )}

                            <motion.span
                                className="text-5xl"
                                animate={isSelected ? {
                                    scale: [1, 1.3, 1],
                                    rotate: [0, 15, -15, 0],
                                    y: [0, -8, 0]
                                } : isHovered ? { scale: 1.2 } : { scale: 1 }}
                                transition={isSelected ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.5 } : { duration: 0.3 }}
                            >
                                {opt.emoji}
                            </motion.span>
                            <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                {opt.label}
                            </span>

                            {/* Connection line from boring to mind-blowing */}
                            {i < question.options.length - 1 && (
                                <div className="absolute right-[-12px] top-1/2 w-6 h-[2px] bg-white/5 hidden md:block" />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Arrow indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-4 mt-8"
            >
                <span className="text-gray-600 text-xs font-bold">😴</span>
                <div className="h-[2px] w-32 bg-gradient-to-r from-gray-600 via-yellow-500 to-purple-500 rounded-full" />
                <span className="text-gray-600 text-xs font-bold">🤯</span>
            </motion.div>
        </div>
    );

    const renderScale = (question) => {
        const currentVal = formData[question.id];
        return (
            <div className="py-8">
                <div className="flex justify-center gap-2 mb-8 flex-wrap">
                    {Array.from({ length: question.max - question.min + 1 }).map((_, i) => {
                        const val = i + question.min;
                        const isSelected = currentVal === val;
                        const fillPercent = val / question.max;
                        return (
                            <motion.button
                                key={val}
                                initial={{ opacity: 0, scale: 0, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                                whileHover={{ scale: 1.15, y: -4 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleAnswer(val)}
                                className={`relative w-14 h-14 rounded-2xl border-2 font-black text-lg flex items-center justify-center transition-all duration-300 overflow-hidden ${isSelected
                                    ? `border-transparent shadow-lg shadow-purple-500/30`
                                    : 'border-white/10 bg-white/[0.03] text-gray-500 hover:border-white/20'
                                    }`}
                            >
                                {/* Animated fill background */}
                                <motion.div
                                    className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${question.gradient}`}
                                    initial={{ height: 0 }}
                                    animate={{ height: isSelected ? '100%' : `${fillPercent * 30}%` }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                />

                                <span className="relative z-10">{val}</span>

                                {/* Pulse on selected */}
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className={`absolute inset-0 bg-gradient-to-t ${question.gradient} rounded-2xl`}
                                        style={{ opacity: 0.3 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Scale Labels */}
                <div className="flex justify-between px-1">
                    {Object.entries(question.labels).map(([key, label], i) => (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="text-center"
                        >
                            <span className={`block text-lg font-black mb-1 ${currentVal === parseInt(key)
                                ? `bg-gradient-to-r ${question.gradient} bg-clip-text text-transparent`
                                : 'text-gray-600'
                                }`}>
                                {key}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 italic">
                                {label}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    const renderText = (question) => {
        const charCount = (formData[question.id] || '').length;
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-4"
            >
                <div className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-500 ${charCount > 0
                    ? `border-transparent bg-gradient-to-r ${question.gradient} p-[2px]`
                    : 'border-white/10 p-[2px]'
                    }`}>
                    <div className="bg-[#0a0a0a] rounded-[22px] relative">
                        <textarea
                            value={formData[question.id] || ''}
                            onChange={(e) => handleAnswer(e.target.value)}
                            placeholder={question.placeholder}
                            className="w-full h-48 bg-transparent p-8 text-lg font-medium focus:outline-none transition-all placeholder:text-gray-700 resize-none"
                        />

                        {/* Character counter */}
                        <div className="absolute bottom-4 right-6 flex items-center gap-3">
                            <motion.div
                                animate={{ opacity: charCount > 0 ? 1 : 0.3 }}
                                className="flex items-center gap-2"
                            >
                                <div className={`w-2 h-2 rounded-full ${charCount > 10 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    {charCount} chars
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-600 italic"
                >
                    💡 Your positive feedback helps instructors grow
                </motion.p>
            </motion.div>
        );
    };

    const renderStar = (question) => {
        const currentVal = formData[question.id] || 0;
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 px-4 max-w-2xl mx-auto"
            >
                <div className="flex justify-between items-end mb-8 relative">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">0%</span>
                    <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-48 text-center flex flex-col items-center">
                        <motion.div
                            key={currentVal}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`text-6xl font-black tracking-tighter bg-gradient-to-r ${question.gradient || 'from-pink-500 to-rose-500'} bg-clip-text text-transparent drop-shadow-lg`}
                        >
                            {currentVal}%
                        </motion.div>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">100%</span>
                </div>

                <div className="relative w-full h-8 flex items-center group mt-10">
                    <div className="absolute inset-x-0 h-4 bg-white/5 rounded-full border border-white/10 overflow-hidden">
                        <motion.div
                            className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${question.gradient || 'from-pink-500 to-rose-500'} shadow-[0_0_20px_rgba(255,255,255,0.2)]`}
                            style={{ width: `${currentVal}%` }}
                            initial={false}
                            animate={{ width: `${currentVal}%` }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                    </div>

                    <motion.div
                        className={`absolute h-8 w-8 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.8)] border-[4px] border-black flex items-center justify-center pointer-events-none z-20`}
                        style={{ left: `calc(${currentVal}% - 16px)` }}
                        initial={false}
                        animate={{ left: `calc(${currentVal}% - 16px)` }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                         <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${question.gradient || 'from-pink-500 to-rose-500'}`} />
                    </motion.div>

                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentVal}
                        onChange={(e) => handleAnswer(parseInt(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer z-30"
                    />
                </div>

                <p className="text-center mt-8 text-[10px] font-bold uppercase tracking-widest text-gray-600 italic">
                    Drag the slider to indicate your percentage
                </p>
            </motion.div>
        );
    };

    const renderQuestion = (question) => {
        switch (question.type) {
            case 'choice': return renderChoice(question);
            case 'slider': return renderSlider(question);
            case 'emoji': return renderEmoji(question);
            case 'scale': return renderScale(question);
            case 'star': return renderStar(question);
            case 'text': return renderText(question);
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 overflow-hidden relative">
            {/* Interactive Mouse Glow */}
            <motion.div
                className="fixed top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"
                style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
            />

            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <motion.button
                        onClick={() => navigate('/dashboard')}
                        whileHover={{ x: -5 }}
                        className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Exit Portal
                    </motion.button>
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Hexagon className="w-6 h-6 text-white animate-spin-slow" />
                        </div>
                        <span className="text-xl font-black tracking-tighter uppercase italic">
                            Feedback <span className="text-purple-400">Hub</span>
                        </span>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto py-12 px-6 relative z-10 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">

                {!sessionOpen ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white/[0.02] border border-white/5 p-16 rounded-[4rem] text-center max-w-2xl relative overflow-hidden group shadow-2xl shadow-red-500/10"
                    >
                        <div className="relative mb-12">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="w-32 h-32 bg-gradient-to-tr from-red-500/20 to-orange-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto relative z-10 border border-white/10 backdrop-blur-3xl shadow-2xl"
                            >
                                <Lock className="w-12 h-12 text-red-500" />
                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-4 -right-4 w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-lg"
                                >
                                    <span className="text-2xl">😔</span>
                                </motion.div>
                            </motion.div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full -z-10" />
                        </div>

                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase mb-6 leading-tight">
                            Feedback Portal <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">is now Closed!</span>
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed mb-12 max-w-md mx-auto">
                            The window of academic feedback has closed. Kindly reach out to your faculty advisor for special access permissions.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/dashboard')}
                            className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center gap-4 mx-auto group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Return to Dashboard
                        </motion.button>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        {feedbackStep === 'SELECT_COURSE' && (
                            <motion.div
                                key="select_course"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="w-full"
                            >
                                <div className="text-center mb-16">
                                    <motion.h2
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="text-xs font-black tracking-[0.5em] text-purple-500 uppercase mb-4"
                                    >
                                        Step 01
                                    </motion.h2>
                                    <motion.h1
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none"
                                    >
                                        Select Your <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 underline decoration-purple-500/30">Target Course</span>
                                    </motion.h1>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {courseList.map((course, i) => (
                                        <motion.button
                                            key={course.id || i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(168, 85, 247, 0.4)' }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleCourseSelect(course)}
                                            className="h-40 p-6 bg-white/[0.03] border border-white/5 rounded-3xl text-left flex flex-col justify-between group transition-all"
                                        >
                                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                                <Book className="w-5 h-5 text-purple-400 group-hover:text-white" />
                                            </div>
                                            <span className="text-sm font-black uppercase tracking-tighter leading-tight group-hover:text-white text-gray-400">{course.course_name}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ENTER_FACULTY STEP REMOVED */}

                        {feedbackStep === 'QUESTIONS' && (
                            <motion.div
                                key="questions_portal"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-4xl"
                            >
                                {/* Progress Info */}
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <span className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">{selectedCourse?.course_name}</span>
                                        <span className="text-xs font-bold text-gray-400 capitalize underline decoration-purple-500/20 underline-offset-4">Professor: {selectedCourse?.faculty_name || 'Unassigned'}</span>
                                    </div>
                                    <div className="text-right">
                                        <motion.span
                                            key={Math.round(progress)}
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={`block text-2xl font-black italic bg-gradient-to-r ${questions[questionStep].gradient} bg-clip-text text-transparent`}
                                        >
                                            {Math.round(progress)}%
                                        </motion.span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Completed</span>
                                    </div>
                                </div>

                                {/* Animated Progress Bar */}
                                <div className="h-2 w-full bg-white/5 rounded-full mb-12 overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                                        className={`h-full bg-gradient-to-r ${questions[questionStep].gradient} shadow-lg relative`}
                                    >
                                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-r ${questions[questionStep].gradient} rounded-full blur-sm`} />
                                    </motion.div>
                                </div>

                                {/* Question Step Indicators */}
                                <div className="flex justify-center gap-2 mb-8">
                                    {questions.map((q, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                scale: i === questionStep ? 1.3 : 1,
                                                backgroundColor: i < questionStep ? 'rgb(168, 85, 247)' : i === questionStep ? 'rgb(255, 255, 255)' : 'rgba(255,255,255,0.1)'
                                            }}
                                            className="w-2 h-2 rounded-full transition-all"
                                        />
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={questionStep}
                                        initial={{ opacity: 0, y: 40, rotateX: -10 }}
                                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                        exit={{ opacity: 0, y: -40, rotateX: 10 }}
                                        transition={{ duration: 0.5, type: 'spring', stiffness: 100, damping: 15 }}
                                        className="bg-white/[0.03] border border-white/10 p-10 md:p-12 rounded-[3rem] relative overflow-hidden"
                                    >
                                        {/* Background glow based on question gradient */}
                                        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${questions[questionStep].gradient} opacity-[0.03] blur-3xl`} />

                                        {/* Question number badge */}
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                            className="flex items-center gap-3 mb-8"
                                        >
                                            <div className={`px-4 py-2 bg-gradient-to-r ${questions[questionStep].gradient} rounded-full`}>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                                    {questions[questionStep].emoji} Q{questionStep + 1} of {questions.length}
                                                </span>
                                            </div>
                                        </motion.div>

                                        <div className="flex items-start gap-5 mb-8">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 300, delay: 0.15 }}
                                                className={`w-14 h-14 bg-gradient-to-br ${questions[questionStep].gradient} bg-opacity-20 border border-white/10 rounded-2xl flex items-center justify-center shrink-0`}
                                                style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))` }}
                                            >
                                                {questions[questionStep].icon}
                                            </motion.div>
                                            <motion.h2
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="text-2xl md:text-3xl font-black tracking-tighter leading-tight"
                                            >
                                                {questions[questionStep].title}
                                            </motion.h2>
                                        </div>

                                        {/* Dynamic Question Content */}
                                        <div className="mt-6">
                                            {renderQuestion(questions[questionStep])}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Controls */}
                                <div className="flex justify-between mt-10 gap-6">
                                    <motion.button
                                        onClick={handlePrev}
                                        whileHover={{ x: -10 }}
                                        className="px-10 py-5 bg-white/5 rounded-full font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all flex items-center gap-4 border border-white/5"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Go Back
                                    </motion.button>

                                    <motion.button
                                        onClick={handleNext}
                                        disabled={!formData[questions[questionStep].id] && formData[questions[questionStep].id] !== 0}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${!formData[questions[questionStep].id] && formData[questions[questionStep].id] !== 0
                                            ? 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed'
                                            : `bg-gradient-to-r ${questions[questionStep].gradient} text-white shadow-lg`
                                            }`}
                                    >
                                        {questionStep === questions.length - 1 ? (
                                            <>SUBMIT FEEDBACK <Send className="w-4 h-4" /></>
                                        ) : (
                                            <>Next Inquiry <ChevronRight className="w-4 h-4" /></>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {feedbackStep === 'SUCCESS' && (
                            <motion.div
                                key="success_screen"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/[0.04] border border-white/10 p-20 rounded-[4rem] text-center max-w-xl backdrop-blur-3xl relative overflow-hidden"
                            >
                                {/* Celebration particles */}
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 0, x: 0, opacity: 1 }}
                                        animate={{
                                            y: [0, -100 - Math.random() * 100],
                                            x: [-50 + Math.random() * 100],
                                            opacity: [1, 0],
                                            scale: [1, 0.5]
                                        }}
                                        transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, repeatDelay: 3 }}
                                        className="absolute top-1/2 left-1/2 text-2xl"
                                    >
                                        {['🎉', '✨', '🌟', '💫', '🎊', '⭐'][i]}
                                    </motion.div>
                                ))}

                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                    className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(34,197,94,0.2)]"
                                >
                                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                                </motion.div>
                                <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 italic">Submission<br />Received</h1>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-12 italic leading-relaxed">
                                    Your feedback for <span className="text-white">{selectedCourse?.course_name}</span> handled by <span className="text-white">{selectedCourse?.faculty_name || 'Unassigned'}</span> has been securely transmitted.
                                </p>
                                <motion.button
                                    onClick={resetFeedback}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="px-12 py-5 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl"
                                >
                                    Submit Another Response
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                <AnimatePresence>
                    {showDuplicateModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="w-full max-w-md bg-[#0a0a0a] border border-blue-500/20 rounded-[2.5rem] p-8 shadow-[0_0_100px_rgba(59,130,246,0.1)] relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                                
                                <div className="flex items-start gap-5 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                        <Lock className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2 leading-tight">
                                            Access <br/><span className="text-blue-400">Restricted</span>
                                        </h3>
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 leading-relaxed">
                                            Feedback for this subject faculty is already submitted. Duplicate entries are blocked by system protocol.
                                        </p>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleDuplicateClose}
                                            className="px-6 py-4 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500 hover:text-white text-blue-400 w-full rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-colors"
                                        >
                                            Acknowledge
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                }
                input[type="range"]::-moz-range-thumb {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default Feedback;
