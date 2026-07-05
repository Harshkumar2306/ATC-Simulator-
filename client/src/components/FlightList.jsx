import React from 'react';
import { Plane, AlertTriangle } from 'lucide-react';

const FlightList = ({ aircrafts, runways, conflicts = [], onCommand }) => {
    const stateWeights = {
        'LANDING': 4,
        'TAKEOFF': 3,
        'TAXI_OUT': 2.5,
        'AIRBORNE': 2,
        'TAXIING': 1,
        'PARKED': 0,
        'FINISHED': -1
    };

    const sorted = [...aircrafts].sort((a, b) => {
        if (a.emergency && !b.emergency) return -1;
        if (!a.emergency && b.emergency) return 1;
        const weightA = stateWeights[a.state] || 0;
        const weightB = stateWeights[b.state] || 0;
        return weightB - weightA;
    });

    const isRunwayFree = (id) => {
        const rw = runways?.find(r => r.id === id);
        return rw && rw.status === 'FREE';
    };

    const getConflictType = (id) => {
        const conflict = conflicts.find(c => c.a1 === id || c.a2 === id);
        return conflict ? conflict.type : null;
    };

    return (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/50 rounded-xl p-4 h-full flex flex-col shadow-xl">
            <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Plane className="w-4 h-4" /> Active Flights
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {sorted.map(ac => {
                    const tcas = getConflictType(ac.id);
                    let cardStyle = 'bg-slate-800/40 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800/60';
                    if (ac.emergency) cardStyle = 'bg-red-900/30 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                    else if (tcas === 'RA') cardStyle = 'bg-red-900/40 border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse';
                    else if (tcas === 'TA') cardStyle = 'bg-yellow-900/30 border-yellow-500/60 shadow-[0_0_10px_rgba(234,179,8,0.3)]';

                    return (
                    <div
                        key={ac.id}
                        className={`p-3 rounded-lg border flex flex-col gap-2 transition-colors duration-300 ${cardStyle}`}
                    >
                        <div className="flex justify-between items-center">
                            <span className={`font-mono font-bold ${ac.emergency ? 'text-red-400' : 'text-slate-200'}`}>
                                {ac.callsign} <span className="text-[10px] text-slate-500 font-normal">[{ac.squawk}]</span>
                            </span>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-slate-500 font-mono">{ac.type}</span>
                                {tcas && <span className={`text-[10px] font-bold ${tcas === 'RA' ? 'text-red-500' : 'text-yellow-500'}`}>TCAS {tcas}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400 font-mono">
                            <div>ALT: {Math.floor(ac.altitude)}</div>
                            <div>SPD: {Math.floor(ac.speed)}</div>
                            <div>FUEL: <span className={ac.fuel < 100 ? 'text-red-400 font-bold' : ''}>{Math.floor(ac.fuel)}s</span></div>
                            <div>PHASE: <span className={getStateColor(ac.emergency ? 'EMERGENCY' : ac.state)}>{ac.emergency ? 'EMERGENCY' : ac.state}</span></div>
                        </div>

                        {/* Advanced Controls (Vectoring) */}
                        {ac.state === 'AIRBORNE' && (
                            <div className="grid grid-cols-2 gap-1 mt-1 pt-2 border-t border-slate-700/50">
                                <div className="flex items-center justify-between bg-slate-900/50 rounded px-1 border border-slate-700">
                                    <span className="text-[9px] text-slate-500 font-bold">HDG</span>
                                    <div className="flex">
                                        <button onClick={() => onCommand('CHANGE_HEADING', ac.id, { heading: Math.floor(ac.heading - 10) })} className="text-[10px] px-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">-</button>
                                        <button onClick={() => onCommand('CHANGE_HEADING', ac.id, { heading: Math.floor(ac.heading + 10) })} className="text-[10px] px-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">+</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-slate-900/50 rounded px-1 border border-slate-700">
                                    <span className="text-[9px] text-slate-500 font-bold">ALT</span>
                                    <div className="flex">
                                        <button onClick={() => onCommand('CHANGE_ALTITUDE', ac.id, { altitude: Math.floor(ac.altitude - 1000) })} className="text-[10px] px-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">-</button>
                                        <button onClick={() => onCommand('CHANGE_ALTITUDE', ac.id, { altitude: Math.floor(ac.altitude + 1000) })} className="text-[10px] px-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">+</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex gap-1 mt-2">
                            {ac.type === 'ARRIVAL' && ac.state === 'AIRBORNE' && !ac.targetRunway && (
                                <>
                                    <button
                                        disabled={!isRunwayFree('09L')}
                                        onClick={() => onCommand('LAND', ac.id, { runwayId: '09L' })}
                                        className={`text-[10px] px-2 py-1 rounded transition-all duration-300 ${isRunwayFree('09L') ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                                    >LAND 09L</button>
                                    <button
                                        disabled={!isRunwayFree('27R')}
                                        onClick={() => onCommand('LAND', ac.id, { runwayId: '27R' })}
                                        className={`text-[10px] px-2 py-1 rounded transition-all duration-300 ${isRunwayFree('27R') ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                                    >LAND 27R</button>
                                </>
                            )}
                            {ac.type === 'DEPARTURE' && ac.state === 'PARKED' && (
                                <>
                                    <button
                                        disabled={!isRunwayFree('09L')}
                                        onClick={() => onCommand('TAKEOFF', ac.id, { runwayId: '09L' })}
                                        className={`text-[10px] px-2 py-1 rounded transition-all duration-300 ${isRunwayFree('09L') ? 'bg-sky-600 hover:bg-sky-500 text-white hover:shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                                    >DEP 09L</button>
                                    <button
                                        disabled={!isRunwayFree('27R')}
                                        onClick={() => onCommand('TAKEOFF', ac.id, { runwayId: '27R' })}
                                        className={`text-[10px] px-2 py-1 rounded transition-all duration-300 ${isRunwayFree('27R') ? 'bg-sky-600 hover:bg-sky-500 text-white hover:shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
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
                )})}

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
        case 'TAXI_OUT': return 'text-sky-200';
        case 'EMERGENCY': return 'text-red-500 animate-pulse';
        case 'HOLD': return 'text-amber-400';
        default: return 'text-slate-400';
    }
}

export default FlightList;
