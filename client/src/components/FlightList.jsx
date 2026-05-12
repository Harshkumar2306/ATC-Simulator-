import React from 'react';
import { Plane, AlertTriangle } from 'lucide-react';

const FlightList = ({ aircrafts, runways, onCommand }) => {
    // Sort: Emergency > Landing > Takeoff > Airborne > Parked
    const sorted = [...aircrafts].sort((a, b) => {
        if (a.emergency) return -1;
        if (b.emergency) return 1;
        return 0; // Simplified
    });

    const isRunwayFree = (id) => {
        const rw = runways?.find(r => r.id === id);
        return rw && rw.status === 'FREE';
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-full flex flex-col">
            <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Plane className="w-4 h-4" /> Active Flights
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {sorted.map(ac => (
                    <div
                        key={ac.id}
                        className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${ac.emergency ? 'bg-red-900/20 border-red-500/50' :
                            'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                            }`}
                    >
                        <div className="flex justify-between items-center">
                            <span className={`font-mono font-bold ${ac.emergency ? 'text-red-400' : 'text-slate-200'}`}>
                                {ac.callsign}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">{ac.type}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-mono">
                            <div>ALT: {Math.floor(ac.altitude)}</div>
                            <div>SPD: {Math.floor(ac.speed)}</div>
                            <div>PHASE: <span className={getStateColor(ac.state)}>{ac.state}</span></div>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-1 mt-2">
                            {ac.type === 'ARRIVAL' && ac.state === 'AIRBORNE' && !ac.targetRunway && (
                                <>
                                    <button
                                        disabled={!isRunwayFree('09L')}
                                        onClick={() => onCommand('LAND', ac.id, { runwayId: '09L' })}
                                        className={`text-[10px] px-2 py-1 rounded transition-colors ${isRunwayFree('09L') ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                                    >LAND 09L</button>
                                    <button
                                        disabled={!isRunwayFree('27R')}
                                        onClick={() => onCommand('LAND', ac.id, { runwayId: '27R' })}
                                        className={`text-[10px] px-2 py-1 rounded transition-colors ${isRunwayFree('27R') ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                                    >LAND 27R</button>
                                </>
                            )}
                            {ac.type === 'DEPARTURE' && ac.state === 'PARKED' && (
                                <>
                                    <button
                                        disabled={!isRunwayFree('09L')}
                                        onClick={() => onCommand('TAKEOFF', ac.id, { runwayId: '09L' })}
                                        className={`text-[10px] px-2 py-1 rounded transition-colors ${isRunwayFree('09L') ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                                    >DEP 09L</button>
                                    <button
                                        disabled={!isRunwayFree('27R')}
                                        onClick={() => onCommand('TAKEOFF', ac.id, { runwayId: '27R' })}
                                        className={`text-[10px] px-2 py-1 rounded transition-colors ${isRunwayFree('27R') ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                                    >DEP 27R</button>
                                </>
                            )}
                            {(ac.state === 'LANDING') && (
                                <button
                                    onClick={() => onCommand('HOLD', ac.id)}
                                    className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] px-2 py-1 rounded"
                                >GO AROUND</button>
                            )}
                            {!ac.emergency && ac.state !== 'FINISHED' && (
                                <button
                                    onClick={() => onCommand('EMERGENCY', ac.id)}
                                    className="bg-red-900/50 hover:bg-red-800 text-red-200 text-[10px] px-2 py-1 rounded ml-auto flex items-center"
                                ><AlertTriangle className="w-3 h-3" /></button>
                            )}
                        </div>
                    </div>
                ))}

                {sorted.length === 0 && (
                    <div className="text-slate-600 text-center text-xs py-4">No active flights</div>
                )}
            </div>
        </div>
    );
};

const getStateColor = (state) => {
    switch (state) {
        case 'LANDING': return 'text-emerald-400';
        case 'TAKEOFF': return 'text-sky-400';
        case 'EMERGENCY': return 'text-red-500 animate-pulse';
        case 'HOLD': return 'text-amber-400';
        default: return 'text-slate-400';
    }
}

export default FlightList;
