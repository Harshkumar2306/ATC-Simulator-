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
        <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row items-center justify-center p-8 lg:p-24 relative overflow-hidden font-sans gap-16 lg:gap-32">
            {/* Background decorative elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />
            
            {/* LEFT SECTION: Information & Features */}
            <div className="z-10 w-full md:w-1/2 flex flex-col items-start text-left space-y-10 max-w-2xl">
                
                {/* Logo Area */}
                <div className="flex mb-2">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                        <div className="w-24 h-24 bg-slate-900 border border-slate-700 rounded-3xl flex items-center justify-center relative z-10 shadow-2xl overflow-hidden">
                            <img src="/logo.png" alt="ATC Logo" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                {/* Hero Text */}
                <div className="space-y-6">
                    <h1 className="text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter leading-tight">
                        ATC COMMAND
                    </h1>
                    <p className="text-slate-400 text-lg lg:text-2xl leading-relaxed font-light">
                        Step into the high-stakes environment of a modern Air Traffic Control tower. 
                        Manage real-time airspace physics, coordinate landings, and resolve TCAS conflicts in a living, breathing simulation.
                    </p>
                </div>

                {/* Vertical Feature List */}
                <div className="grid grid-cols-1 gap-8 w-full mt-8">
                    <div className="flex items-start gap-5">
                        <div className="bg-emerald-900/30 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-lg">
                            <Activity className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="pt-1">
                            <h3 className="text-slate-200 text-xl font-bold mb-2">Real-Time Physics</h3>
                            <p className="text-slate-500 text-base leading-relaxed">Experience buttery-smooth 60 FPS rendering driven by a server-authoritative physics engine.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-5">
                        <div className="bg-red-900/30 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-red-500/30 shadow-lg">
                            <ShieldAlert className="w-6 h-6 text-red-400" />
                        </div>
                        <div className="pt-1">
                            <h3 className="text-slate-200 text-xl font-bold mb-2">TCAS Collision System</h3>
                            <p className="text-slate-500 text-base leading-relaxed">Advanced 3D spatial geometry calculates exact separation minimums for traffic alerts.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION: Action Buttons */}
            <div className="z-10 w-full md:w-1/2 flex flex-col items-center md:items-end justify-center w-full max-w-md mt-12 md:mt-0">
                <div className="w-full bg-slate-900/60 border border-slate-800 p-8 lg:p-12 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col gap-8 hover:border-slate-700 transition-colors">
                    
                    <div className="text-center mb-2">
                        <h2 className="text-2xl lg:text-3xl font-black text-slate-100 mb-2 uppercase tracking-wide">Access Terminal</h2>
                        <p className="text-slate-500 text-sm font-semibold tracking-widest uppercase">Select Operating Mode</p>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="w-full px-8 py-6 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-black rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all uppercase tracking-widest flex items-center justify-center gap-4 transform hover:-translate-y-1"
                    >
                        {loading ? 'Initializing...' : 'Start ATC Simulation'}
                        {!loading && <PlaneTakeoff className="w-6 h-6" />}
                    </button>
                    
                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-slate-800"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-600 text-sm font-bold uppercase tracking-widest">Or</span>
                        <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    <button
                        onClick={onGuestLogin}
                        className="w-full px-8 py-6 bg-slate-950 hover:bg-slate-800 text-slate-300 text-lg font-bold rounded-2xl border border-slate-700 hover:border-slate-500 transition-all uppercase tracking-widest flex items-center justify-center transform hover:-translate-y-1"
                    >
                        Spectate as Passenger
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
