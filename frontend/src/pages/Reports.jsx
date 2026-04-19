import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    LayoutDashboard, BarChart2, MessageSquare, Settings,
    LogOut, Bell, ShieldCheck, ArrowLeft,
    TrendingUp, Users, BookOpen, Activity,
    Calendar, Filter, FileDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import API_ENDPOINTS, { handleResponse } from '../utils/api';

const Reports = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [stats, setStats] = useState({
        avgRating: 0,
        totalResponses: 0,
        topFaculty: '',
        satisfaction: 0
    });

    // Mouse glow effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 1000, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 1000, damping: 30 });

    const refreshData = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.EXPORT_FEEDBACK);
            if (!res.ok) {
                const errData = await handleResponse(res);
                throw new Error(errData.error || errData.message || 'Query failure');
            }
            const allFeedbacks = await handleResponse(res);
            setFeedbacks(allFeedbacks);

            if (allFeedbacks.length > 0) {
                const total = allFeedbacks.length;
                const sum = allFeedbacks.reduce((acc, curr) => acc + (parseFloat(curr.rating) || 0), 0);
                const avg = (sum / total).toFixed(1);

                const facultyMap = {};
                allFeedbacks.forEach(f => {
                    const fName = f.faculty || 'Unassigned';
                    facultyMap[fName] = (facultyMap[fName] || 0) + 1;
                });
                const top = Object.entries(facultyMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

                setStats({
                    avgRating: avg,
                    totalResponses: total,
                    topFaculty: top,
                    satisfaction: Math.round((avg / 5) * 100)
                });
            }
        } catch (err) {
            console.error("Telemetry Sync Error:", err);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.role !== 'admin') {
                navigate(parsed.role === 'faculty' ? '/faculty-dashboard' : '/dashboard');
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

        refreshData();

        return () => window.removeEventListener('mousemove', handleMove);
    }, [navigate, mouseX, mouseY]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const exportToPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(24);
        doc.setTextColor(99, 102, 241); // Indigo-500
        doc.text("SRMIST: ACADEMIC FEEDBACK INTELLIGENCE", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Report Protocol: 0x${Date.now().toString(16).toUpperCase()}`, 14, 30);
        doc.text(`Generation Date: ${new Date().toLocaleString()}`, 14, 35);

        const tableData = feedbacks.map(row => {
            const res = typeof row.responses === 'string' ? JSON.parse(row.responses) : (row.responses || {});
            return [
                row.id.substring(0, 8).toUpperCase(),
                new Date(row.timestamp).toLocaleString(),
                row.student || 'Unknown',
                row.course || 'Unknown',
                row.faculty || 'Unassigned',
                res["1"] || "N/A", res["2"] || "N/A", res["3"] || "N/A", res["4"] || "N/A", res["5"] || "N/A",
                res["6"] || "N/A", res["7"] || "N/A", res["8"] || "N/A", res["9"] || "N/A", res["10"] || "N/A",
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
                fillColor: [30, 41, 59],
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

        // Add page numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`SFMS INTELLIGENCE CORE | Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10);
        }

        doc.save(`SFMS_Executive_Insight_${Date.now()}.pdf`);
    };

    const exportToExcel = () => {
        const rows = feedbacks.map(f => {
            const res = typeof f.responses === 'string' ? JSON.parse(f.responses) : (f.responses || {});
            return [
                f.id.substring(0, 8).toUpperCase(),
                new Date(f.timestamp).toLocaleString(),
                f.student || 'Unknown',
                f.course || 'Unknown',
                f.faculty || 'Unassigned',
                res["1"] || "N/A", res["2"] || "N/A", res["3"] || "N/A", res["4"] || "N/A", res["5"] || "N/A",
                res["6"] || "N/A", res["7"] || "N/A", res["8"] || "N/A", res["9"] || "N/A", res["10"] || "N/A",
                res["11"] || f.overall_comment || f.comment || "N/A"
            ];
        });

        if (rows.length === 0) {
            rows.push([
                "N/A", "N/A", "N/A", "N/A", "N/A",
                "-", "-", "-", "-", "-", "-", "-", "-", "-", "-",
                "No Responses"
            ]);
        }

        const matrix = [
            ["SRMIST: ACADEMIC FEEDBACK SYSTEM - INTELLIGENCE MATRIX"],
            [`Report Protocol: 0x${Date.now().toString(16).toUpperCase()}`],
            [`Generation Date: ${new Date().toLocaleString()}`],
            [`Authorized Analyst: ${user?.given_name} ${user?.family_name}`],
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

        // Adjust column widths
        const colWidths = [
            { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 25 },
            { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
            { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
            { wch: 55 }
        ];
        worksheet['!cols'] = colWidths;
        worksheet['!autofilter'] = { ref: `A6:P${matrix.length}` };

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback Analysis");
        XLSX.writeFile(workbook, `SFMS_Executive_Insight_${Date.now()}.xlsx`);
    };

    const chartData = [
        { label: 'Rating 5', value: feedbacks.filter(f => Math.round(f.rating) === 5).length, color: 'bg-green-500' },
        { label: 'Rating 4', value: feedbacks.filter(f => Math.round(f.rating) === 4).length, color: 'bg-blue-500' },
        { label: 'Rating 3', value: feedbacks.filter(f => Math.round(f.rating) === 3).length, color: 'bg-yellow-500' },
        { label: 'Rating 2', value: feedbacks.filter(f => Math.round(f.rating) === 2).length, color: 'bg-orange-500' },
        { label: 'Rating 1', value: feedbacks.filter(f => Math.round(f.rating) === 1).length, color: 'bg-red-500' },
    ];

    const questions = [
        { id: 1, title: "Cognitive Transformation", detail: "Course impact on subject thinking", type: "choice" },
        { id: 2, title: "Targeting Proficiency", detail: "Real-world application confidence", type: "mean" },
        { id: 3, title: "Instructorial Engagement", detail: "Encouragement of independent thinking", type: "choice" },
        { id: 4, title: "Developmental Priority", detail: "Key areas identified for upgrade", type: "choice" },
        { id: 6, title: "Skill Acquisition Delta", detail: "Quantifiable skill improvement", type: "mean" },
        { id: 8, title: "Intellectual Friction", detail: "Cognitive challenge level", type: "mean" },
        { id: 9, title: "Knowledge Retention", detail: "6-month recall probability", type: "mean" }
    ];

    const getQuestionStats = (qId, type) => {
        if (feedbacks.length === 0) return type === 'mean' ? 0 : {};

        const responses = feedbacks.map(f => {
            const res = typeof f.responses === 'string' ? JSON.parse(f.responses) : (f.responses || {});
            return res[qId];
        }).filter(r => r !== undefined);

        if (responses.length === 0) return type === 'mean' ? 0 : {};

        if (type === 'mean') {
            const sum = responses.reduce((acc, curr) => acc + parseFloat(curr), 0);
            return (sum / responses.length).toFixed(1);
        }

        const dist = {};
        responses.forEach(r => {
            dist[r] = (dist[r] || 0) + 1;
        });
        return dist;
    };

    const maxVal = Math.max(...chartData.map(d => d.value), 1);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
            {/* Interactive Cursor Glow */}
            <motion.div
                className="pointer-events-none fixed inset-0 z-30 opacity-20 mix-blend-screen"
                style={{
                    background: useTransform(
                        [springX, springY],
                        ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(99, 102, 241, 0.2), transparent 80%)`
                    )
                }}
            />

            {/* Ambient Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-20 lg:w-24 bg-black/40 backdrop-blur-3xl border-r border-white/5 z-50 flex flex-col items-center py-10 justify-between">
                <div className="space-y-10">
                    <motion.div
                        onClick={() => navigate('/admin-dashboard')}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                        <ShieldCheck className="text-white w-6 h-6" />
                    </motion.div>

                    <nav className="flex flex-col gap-6">
                        {[
                            { id: 'overview', icon: LayoutDashboard, path: '/admin-dashboard' },
                            { id: 'reports', icon: BarChart2, path: '/reports' },
                            { id: 'feedback', icon: MessageSquare, path: '#' },
                            { id: 'settings', icon: Settings, path: '#' }
                        ].map((item) => (
                            <motion.button
                                key={item.id}
                                onClick={() => {
                                    if (item.path !== '#') {
                                        navigate(item.path);
                                    }
                                }}
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.path === '/reports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-gray-500'
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
            <main className="pl-24 lg:pl-32 pt-12 pb-24 min-h-screen relative z-10">
                <div className="max-w-7xl mx-auto px-10">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Intelligence Analytics node
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none"
                            >
                                Feedback <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-500 to-purple-600 font-black italic">Visualizer</span>
                            </motion.h1>
                        </div>

                        <div className="flex gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={exportToPDF}
                                className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                <Calendar className="w-4 h-4 text-indigo-400" />
                                Export Landscape PDF
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={exportToExcel}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                            >
                                <FileDown className="w-4 h-4" />
                                Export Excel Node
                            </motion.button>
                        </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Summary Stats */}
                        <div className="lg:col-span-4 space-y-6">
                            {[
                                { label: 'Overall Satisfaction', value: `${stats.satisfaction}%`, detail: 'System-wide sentiment', icon: Activity, color: 'text-indigo-400' },
                                { label: 'Average Node Rating', value: stats.avgRating, detail: 'Out of 5.0 scale', icon: TrendingUp, color: 'text-blue-400' },
                                { label: 'Total Sync Responses', value: stats.totalResponses, detail: 'Valid feedback nodes', icon: Users, color: 'text-purple-400' },
                                { label: 'Leading Faculty', value: stats.topFaculty, detail: 'Highest engagement', icon: BookOpen, color: 'text-green-400' }
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.05] transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <h3 className="text-3xl font-black mb-1">{stat.value}</h3>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase">{stat.detail}</p>
                                        </div>
                                        <div className={`p-3 rounded-xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Main Graphic Representation */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-8 bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-12">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                                        <BarChart2 className="w-6 h-6 text-indigo-500" />
                                        Sentiment Distribution
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-[9px] font-bold text-gray-500 uppercase">Positive</span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <span className="text-[9px] font-bold text-gray-500 uppercase">Critical</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[400px] flex items-end justify-between gap-4 px-4">
                                    {chartData.map((data, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                            <div className="relative w-full flex items-end justify-center">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${(data.value / maxVal) * 300}px` }}
                                                    transition={{ delay: 0.6 + (i * 0.1), duration: 1, ease: "easeOut" }}
                                                    className={`w-full max-w-[60px] ${data.color} opacity-20 blur-2xl absolute bottom-0 rounded-t-2xl`}
                                                />
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${(data.value / maxVal) * 300}px` }}
                                                    whileHover={{ scaleX: 1.05, filter: 'brightness(1.2)' }}
                                                    transition={{ delay: 0.6 + (i * 0.1), duration: 1, ease: "easeOut" }}
                                                    className={`w-full max-w-[60px] ${data.color} rounded-t-2xl relative z-10 shadow-lg group-hover:shadow-[data.color]/40 transition-all`}
                                                >
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        <span className="text-[10px] font-black bg-white text-black px-2 py-1 rounded-md">{data.value} Nodes</span>
                                                    </div>
                                                </motion.div>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">{data.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {feedbacks.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20 rounded-[3rem]">
                                        <Activity className="w-12 h-12 text-indigo-500/50 mb-4 animate-pulse" />
                                        <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">Awaiting Feedback Ingestion...</p>
                                    </div>
                                )}
                            </div>

                            {/* Decorative background grid */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                        </motion.div>

                    </div>

                    {/* Detailed Analysis Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
                            <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                                <Filter className="w-5 h-5 text-purple-400" />
                                Data Insights
                            </h3>
                            <div className="space-y-4">
                                <p className="text-sm text-gray-400 leading-relaxed italic">
                                    "System indicates a strong preference for interactive learning nodes. Feedback density is highest during the mid-semester sync protocols."
                                </p>
                                <div className="pt-4 flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-black uppercase rounded-md">Positive Growth</span>
                                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase rounded-md">Critical Success</span>
                                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[9px] font-black uppercase rounded-md">Engagement Peak</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-900/20 to-transparent border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Automated Report</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Generated by SFMS AI Oracle</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                onClick={exportToPDF}
                                className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl"
                            >
                                <FileDown className="w-8 h-8" />
                            </motion.button>
                        </div>
                    </motion.section>

                    {/* Course Performance Index */}
                    <motion.section
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-12"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <Activity className="w-6 h-6 text-indigo-500" />
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Course Performance Index</h2>
                            <div className="h-px bg-white/5 flex-1 ml-4" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {questions.map((q, i) => {
                                const stats = getQuestionStats(q.id, q.type);
                                return (
                                    <motion.div
                                        key={q.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.04] transition-all"
                                    >
                                        <div className="mb-4">
                                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">{q.detail}</p>
                                            <h4 className="text-sm font-black uppercase tracking-tight leading-tight">{q.title}</h4>
                                        </div>

                                        {q.type === 'mean' ? (
                                            <div className="flex items-end gap-3 mt-6">
                                                <span className="text-4xl font-black">{stats}</span>
                                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${(stats / (q.id === 2 || q.id === 9 ? 100 : 10)) * 100}%` }}
                                                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 mt-4">
                                                {Object.entries(stats).length > 0 ? (
                                                    Object.entries(stats).map(([option, count], idx) => (
                                                        <div key={idx}>
                                                            <div className="flex justify-between text-[9px] font-bold uppercase text-gray-400 mb-1">
                                                                <span className="truncate max-w-[150px]">{option}</span>
                                                                <span>{Math.round((count / feedbacks.length) * 100)}%</span>
                                                            </div>
                                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    whileInView={{ width: `${(count / feedbacks.length) * 100}%` }}
                                                                    className="h-full bg-purple-500/50"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-gray-600 font-bold uppercase italic mt-8">Node Inactive</p>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.section>

                </div>
            </main>

            <style jsx>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 0.4; }
                }
                .animate-pulse {
                    animation: pulse-slow 8s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default Reports;
