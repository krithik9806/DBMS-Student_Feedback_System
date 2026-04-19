import React, { useState, useEffect, useRef } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { motion, animate } from 'framer-motion';
import { Activity, Star, Users, TrendingUp, Zap, Server, ShieldAlert, Cpu, Radio } from 'lucide-react';
import API_ENDPOINTS, { handleResponse } from '../utils/api';

// Defined Subtle SVG gradients
const GRADIENTS = ['url(#neonPurple)', 'url(#neonFuchsia)', 'url(#neonYellow)', 'url(#neonGreen)', 'url(#neonCyan)', 'url(#neonOrange)'];

const AnimatedNumber = ({ value, isDecimal, className }) => {
    const nodeRef = useRef(null);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;
        const targetValue = parseFloat(value) || 0;
        const controls = animate(0, targetValue, {
            duration: 2.5,
            ease: [0.16, 1, 0.3, 1],
            onUpdate(val) {
                node.textContent = isDecimal ? val.toFixed(1) : Math.floor(val);
            }
        });
        return () => controls.stop();
    }, [value, isDecimal]);

    return <span ref={nodeRef} className={className}>0</span>;
};

// Dynamic Background Particles - Reduced density and glow
const Particles = () => {
    const particles = Array.from({ length: 10 });
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 mix-blend-screen opacity-40">
            {particles.map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: ["100%", "-100%"],
                        opacity: [0, 0.4, 0],
                        scale: [0.3, 1.2, 0.3]
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 5 + Math.random() * 5,
                        delay: Math.random() * 3,
                        ease: "linear"
                    }}
                    className={`absolute rounded-full shadow-[0_0_5px_currentColor] 
                    ${i % 3 === 0 ? 'bg-purple-500 text-purple-500 h-1 w-1' : i % 2 === 0 ? 'bg-fuchsia-400 text-fuchsia-400 h-[2px] w-[2px]' : 'bg-cyan-400 text-cyan-400 h-1 w-1'}`}
                    style={{ left: `${Math.random() * 100}%`, top: '100%' }}
                />
            ))}
        </div>
    );
};

// New Scanning Line Effect
const ScanningLine = () => (
    <motion.div
        animate={{ y: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/10 to-transparent z-[50] pointer-events-none"
    />
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-black/90 border border-purple-500/40 p-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-2xl relative overflow-hidden z-[100]"
            >
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(168,85,247,0.05)_50%)] bg-[length:100%_4px] pointer-events-none" />
                <p className="text-purple-200 text-[10px] font-black uppercase tracking-[0.25em] mb-2 border-b border-purple-500/30 pb-2 relative z-10">{label}</p>
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex items-center gap-3 mb-1.5 last:mb-0 relative z-10">
                        <div className="w-2 h-2 rounded-sm" style={{ background: entry.color || '#a855f7', boxShadow: `0 0 8px ${entry.color || '#a855f7'}` }} />
                        <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                            {entry.name}: <span className="text-white ml-1 font-black">{entry.value}</span>
                        </p>
                    </div>
                ))}
            </motion.div>
        );
    }
    return null;
};

const ChartGradients = () => (
    <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
            <linearGradient id="neonPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
            <linearGradient id="neonCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            <linearGradient id="neonFuchsia" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#be185d" />
            </linearGradient>
            <linearGradient id="neonYellow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
            <linearGradient id="neonGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="neonOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#9a3412" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.0} />
            </linearGradient>
        </defs>
    </svg>
);

const AdminPowerBI = () => {
    const [isLoading, setIsLoading] = useState(true);

    const [metrics, setMetrics] = useState({
        overallRating: 0,
        npsScore: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        totalResponses: 0
    });

    const [charts, setCharts] = useState({
        courseDistribution: [],
        facultyStats: [],
        trendData: []
    });

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.EXPORT_FEEDBACK);
                if (!res.ok) throw new Error('Failed to fetch comprehensive feedback data');
                const rawData = await handleResponse(res);
                processData(rawData);
            } catch (err) {
                console.error("Dashboard Analytics Error:", err);
            } finally {
                setTimeout(() => setIsLoading(false), 1200);
            }
        };

        fetchAnalyticsData();
    }, []);

    const processData = (rawData) => {
        if (!rawData || rawData.length === 0) return;

        let totalPoints = 0;
        let promoters = 0;
        let passives = 0;
        let detractors = 0;

        const courseMap = {};
        const facultyMap = {};
        const trendMap = {};

        rawData.forEach(fb => {
            // FIX: Handle overall_rating if rating is not present (mapping fix for mock DB)
            const rating = Number(fb.rating || fb.overall_rating || 0);
            totalPoints += rating;

            if (rating >= 8) promoters++;
            else if (rating >= 6) passives++;
            else detractors++;

            const course = fb.course || 'Unknown';
            courseMap[course] = (courseMap[course] || 0) + 1;

            const faculty = fb.faculty || 'Unassigned';
            facultyMap[faculty] = (facultyMap[faculty] || 0) + 1;

            const date = new Date(fb.timestamp);
            const monthYear = date.toLocaleString('default', { month: 'short' }) + " '" + date.getFullYear().toString().substr(-2);
            trendMap[monthYear] = (trendMap[monthYear] || 0) + 1;
        });

        const totalResp = rawData.length;
        const avg = (totalPoints / totalResp).toFixed(1);

        const percentPromoters = (promoters / totalResp) * 100;
        const percentDetractors = (detractors / totalResp) * 100;
        const nps = (percentPromoters - percentDetractors).toFixed(1);

        setMetrics({
            overallRating: avg,
            npsScore: nps,
            promoters,
            passives,
            detractors,
            totalResponses: totalResp
        });

        setCharts({
            courseDistribution: Object.keys(courseMap).map(k => ({ name: k, value: courseMap[k] })),
            facultyStats: Object.keys(facultyMap).map(k => ({ name: k, Responses: facultyMap[k] })),
            trendData: Object.keys(trendMap).map(k => ({ time: k, Responses: trendMap[k] }))
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        show: { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            transition: { type: "spring", stiffness: 120, damping: 15 } 
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] w-full p-20 gap-8 relative overflow-hidden bg-black/90 backdrop-blur-lg rounded-2xl border border-white/5 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
                <div className="relative z-10 scale-75">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="w-32 h-32 border border-dashed border-purple-500/40 rounded-full flex items-center justify-center"
                    >
                        <motion.div
                            animate={{ rotate: -720 }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="w-24 h-24 border-2 border-t-purple-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                        />
                    </motion.div>
                </div>
                <motion.div 
                    animate={{ opacity: [0.4, 1, 0.4] }} 
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-purple-300 font-mono text-[10px] tracking-[0.8em] uppercase font-black"
                >
                    Synchronizing Telemetry
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div 
            className="space-y-6 relative rounded-2xl p-1"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <ChartGradients />
            
            {/* Holographic Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ 
                backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.2) 1px, transparent 1px)',
                backgroundSize: '32px 32px'
            }} />

            {/* Header Section */}
            <motion.div variants={itemVariants} className="relative flex justify-between items-center bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl overflow-hidden group">
                <Particles />
                <ScanningLine />
                
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10 w-full justify-between">
                    <div className="flex items-center gap-5">
                        <div className="relative p-3.5 bg-purple-500/5 border border-purple-400/20 rounded-xl shadow-inner">
                            <ShieldAlert className="w-8 h-8 text-purple-400/80" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-100 to-white pr-4">
                                Strategic Analysis
                            </h2>
                            <p className="flex items-center gap-2 text-[9px] text-purple-400/60 font-black uppercase tracking-[0.5em] mt-1">
                                <Radio className="w-2.5 h-2.5 animate-pulse" /> Live Feed Integration
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 bg-white/[0.02] px-6 py-3 rounded-xl border border-white/5 flex items-center gap-4 transition-all">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em]">Captured Packets</span>
                        <div className="text-white font-black text-3xl tracking-tighter leading-none px-2 shadow-purple-500/10 text-shadow-sm">
                            <AnimatedNumber value={metrics.totalResponses} isDecimal={false} />
                        </div>
                        <Activity className="w-5 h-5 text-purple-500/50" />
                    </div>
                </div>
            </motion.div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 w-full">
                
                {/* Column 1: Overall Metrics */}
                <div className="flex flex-col gap-6 col-span-1 w-full">
                    
                    {/* Overall Rating Box */}
                    <motion.div variants={itemVariants} className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500 w-full">
                        <ScanningLine />
                        <h3 className="text-[10px] text-purple-300/80 font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 relative z-10">
                            <Star className="w-4 h-4" /> Node Health
                        </h3>
                        
                        <div className="flex items-center gap-1 mb-6 relative z-10">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-6 h-6 ${star <= Math.round(metrics.overallRating / 2) ? 'text-purple-400 fill-purple-400/20' : 'text-gray-800'}`} />
                            ))}
                        </div>
                        
                        <div className="text-6xl font-black text-white relative z-10 pr-2 pb-1">
                            <AnimatedNumber value={metrics.overallRating} isDecimal={true} />
                            <span className="text-xl text-gray-700 ml-1 font-bold">/ 10</span>
                        </div>
                    </motion.div>

                    {/* Sentiment Analysis Box */}
                    <motion.div variants={itemVariants} className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-fuchsia-500/20 transition-all duration-500 flex-1 flex flex-col justify-between w-full">
                         <div className="absolute inset-0 holographic-grid opacity-[0.02]" />
                         <ScanningLine />
                        
                        <div>
                            <h3 className="text-[10px] text-fuchsia-300/80 font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 relative z-10">
                                <Users className="w-4 h-4" /> Personnel Index
                            </h3>
                            <div className="space-y-5 relative z-10">
                                {[
                                    { label: 'Promoters', value: metrics.promoters, color: 'bg-purple-500', text: 'text-purple-400' },
                                    { label: 'Passives', value: metrics.passives, color: 'bg-cyan-500', text: 'text-cyan-400' },
                                    { label: 'Detractors', value: metrics.detractors, color: 'bg-pink-500', text: 'text-pink-400' }
                                ].map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-[9px] font-black mb-1.5 uppercase tracking-widest">
                                            <span className={`${item.text} opacity-70`}>{item.label}</span>
                                            <span className="text-white"><AnimatedNumber value={item.value} /></span>
                                        </div>
                                        <div className="w-full bg-white/[0.03] h-1.5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${(item.value / metrics.totalResponses) * 100}%` }} 
                                                transition={{ duration: 1.2, delay: 0.5 + idx * 0.1 }}
                                                className={`${item.color} h-full opacity-60`} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
                            <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.4em] block mb-2">Stability Coefficient</span>
                            <div className="inline-block px-6 py-2 bg-white/[0.02] border border-white/10 rounded-lg">
                                <span className={`text-3xl font-black ${metrics.npsScore > 0 ? 'text-purple-200' : 'text-pink-300'}`}>
                                    <AnimatedNumber value={metrics.npsScore} isDecimal={true} />
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Main Charts */}
                <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    
                    {/* Course Allocation Matrix */}
                    <motion.div variants={itemVariants} className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg w-full group overflow-hidden relative">
                        <ScanningLine />
                        <h3 className="text-[10px] text-purple-300/80 font-black uppercase tracking-[0.2em] mb-4 flex items-center justify-between relative z-10">
                            <span>Sector Allocation</span>
                            <Zap className="w-4 h-4 text-purple-400 opacity-50" />
                        </h3>
                        
                        <div className="h-[300px] w-full relative">
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 mt-[-15px]">
                                <motion.span 
                                    className="text-5xl font-black text-white"
                                >
                                    <AnimatedNumber value={charts.courseDistribution.length} />
                                </motion.span>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mt-1">Total Sectors</span>
                            </div>
                            
                            <div className="w-full h-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.courseDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={75}
                                            outerRadius={105}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="#000"
                                            strokeWidth={2}
                                            cornerRadius={4}
                                            animationDuration={1500}
                                        >
                                            {charts.courseDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={GRADIENTS[index % GRADIENTS.length]} fillOpacity={0.7} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>

                    {/* Faculty Personnel Stats */}
                    <motion.div variants={itemVariants} className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg w-full relative overflow-hidden">
                        <ScanningLine />
                        <h3 className="text-[10px] text-fuchsia-300/80 font-black uppercase tracking-[0.2em] mb-4 relative z-10">Registry Load</h3>
                        <div className="h-[300px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.facultyStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 9, fontWeight: '700' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                                    <Bar dataKey="Responses" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.6}>
                                        {charts.facultyStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={GRADIENTS[(index + 1) % GRADIENTS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Timeline Analysis */}
                    <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-lg w-full relative overflow-hidden group">
                        <ScanningLine />
                        <h3 className="text-[11px] text-white font-black uppercase tracking-[0.25em] mb-8 flex items-center justify-between relative z-10">
                            <span className="flex items-center gap-3">System Velocity Timeline</span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                <span className="text-[8px] text-gray-400 tracking-[0.2em] uppercase font-black">Active Stream</span>
                            </div>
                        </h3>
                        <div className="h-[340px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts.trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                    <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: '700' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="Responses" 
                                        stroke="#a855f7" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#areaGradient)" 
                                        activeDot={{ r: 6, fill: "#fff", stroke: "#a855f7", strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminPowerBI;
