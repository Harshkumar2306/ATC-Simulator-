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
        <div className="h-screen bg-slate-950 flex flex-col md:flex-row items-center justify-center p-6 lg:p-16 relative overflow-hidden font-sans gap-8 lg:gap-16">
            {/* Background decorative elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* LEFT SECTION: Information & Features */}
            <div className="z-10 w-full md:w-1/2 flex flex-col items-start text-left space-y-6 max-w-xl">
                
                {/* Logo Area */}
                <div className="flex mb-1">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                        <div className="w-16 h-16 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center relative z-10 shadow-2xl overflow-hidden">
                            <img src="/logo.png" alt="ATC Logo" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                {/* Hero Text */}
                <div className="space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight leading-tight">
                        ATC COMMAND
                    </h1>
                    <p className="text-slate-400 text-base lg:text-lg leading-relaxed font-light">
                        Step into the high-stakes environment of a modern Air Traffic Control tower. 
                        Manage real-time airspace physics, coordinate landings, and resolve TCAS conflicts.
                    </p>
                </div>

                {/* Vertical Feature List */}
                <div className="grid grid-cols-1 gap-5 w-full mt-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-emerald-900/30 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-sm">
                            <Activity className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="pt-0.5">
                            <h3 className="text-slate-200 text-base font-bold mb-1">Real-Time Physics</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Buttery-smooth 60 FPS rendering driven by a server-authoritative physics engine.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                        <div className="bg-red-900/30 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-red-500/30 shadow-sm">
                            <ShieldAlert className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="pt-0.5">
                            <h3 className="text-slate-200 text-base font-bold mb-1">TCAS Collision System</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Advanced 3D spatial geometry calculates exact separation minimums for traffic alerts.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION: Action Buttons */}
            <div className="z-10 w-full md:w-1/2 flex flex-col items-center md:items-end justify-center max-w-sm mt-8 md:mt-0">
                <div className="w-full bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col gap-6 hover:border-slate-700 transition-colors">
                    
                    <div className="text-center mb-1">
                        <h2 className="text-xl font-bold text-slate-100 mb-1 uppercase tracking-wide">Access Terminal</h2>
                        <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase">Select Operating Mode</p>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all uppercase tracking-widest flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                    >
                        {loading ? 'Initializing...' : 'Start Simulation'}
                        {!loading && <PlaneTakeoff className="w-5 h-5" />}
                    </button>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-800"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-600 text-xs font-bold uppercase tracking-widest">Or</span>
                        <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    <button
                        onClick={onGuestLogin}
                        className="w-full px-6 py-4 bg-slate-950 hover:bg-slate-800 text-slate-300 text-sm font-bold rounded-xl border border-slate-700 hover:border-slate-500 transition-all uppercase tracking-widest flex items-center justify-center transform hover:-translate-y-0.5"
                    >
                        Spectate as Passenger
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
