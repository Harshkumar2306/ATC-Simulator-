import React, { useState } from 'react';
import { PlaneTakeoff, ShieldAlert, Activity } from 'lucide-react';

const LoginForm = ({ onLoginSuccess, onGuestLogin }) => {
    const [loading, setLoading] = useState(false);

    const handleStart = async () => {
        setLoading(true);
        try {
            const response = await fetch((import.meta.env.VITE_API_URL || "") + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.success) {
                onLoginSuccess(data.token);
            }
        } catch (error) {
            console.error('Connection error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background decorative elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="z-10 text-center max-w-4xl mx-auto space-y-10 w-full">
                {/* Logo Area */}
                <div className="flex justify-center mb-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                        <div className="w-28 h-28 bg-slate-900 border border-slate-700 rounded-3xl flex items-center justify-center relative z-10 shadow-2xl overflow-hidden">
                            <img src="/logo.png" alt="ATC Logo" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter">
                        ATC COMMAND NODE
                    </h1>
                    <p className="text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-light">
                        Step into the high-stakes environment of a modern Air Traffic Control tower. 
                        Manage real-time airspace physics, coordinate landings, and resolve TCAS conflicts in a living, breathing simulation.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto mt-16 mb-16">
                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl hover:border-emerald-500/50 transition-colors duration-300">
                        <div className="bg-emerald-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                            <Activity className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h3 className="text-slate-200 text-lg font-bold mb-2">Real-Time Physics</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Experience buttery-smooth 60 FPS rendering driven by a server-authoritative engine and mathematical extrapolation.</p>
                    </div>
                    
                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl hover:border-red-500/50 transition-colors duration-300">
                        <div className="bg-red-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-slate-200 text-lg font-bold mb-2">TCAS Collision</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Advanced 3D spatial geometry calculates exact separation minimums to trigger Traffic and Resolution Advisories.</p>
                    </div>
                    
                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-xl hover:border-blue-500/50 transition-colors duration-300">
                        <div className="bg-blue-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                            <PlaneTakeoff className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-slate-200 text-lg font-bold mb-2">Dynamic Weather</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Global wind vectors apply physical drift to aircraft, while severe storm cells generate hazardous turbulence and emergencies.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-black rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all uppercase tracking-widest flex items-center justify-center gap-4 w-full sm:w-auto transform hover:-translate-y-1"
                    >
                        {loading ? 'Initializing Core...' : 'Start ATC Simulation'}
                        {!loading && <PlaneTakeoff className="w-6 h-6" />}
                    </button>
                    
                    <button
                        onClick={onGuestLogin}
                        className="px-10 py-5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-lg font-bold rounded-2xl border border-slate-700 hover:border-slate-500 transition-all uppercase tracking-widest w-full sm:w-auto flex items-center justify-center"
                    >
                        Spectate as Passenger
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
