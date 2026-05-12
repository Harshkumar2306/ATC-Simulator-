import React from 'react';

const RunwayStatus = ({ runways, aircrafts }) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0 flex items-center justify-between">
                <span>Runway Status</span>
                <span className="text-[10px] text-slate-600 font-mono">270/12 • 10nm</span>
            </h2>

            <div className="grid grid-cols-2 gap-2">
                {runways?.map(rw => {
                    // Resolve occupant name
                    const occupant = aircrafts?.find(a => a.id === rw.occupiedBy);
                    const occupantName = occupant ? occupant.callsign : rw.occupiedBy;

                    return (
                        <div key={rw.id} className="bg-slate-800/50 p-1.5 rounded border border-slate-700 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-mono font-bold text-white leading-none">{rw.id}</span>
                                <div className={`px-1 py-0.5 rounded text-[9px] font-bold uppercase leading-none ${rw.status === 'FREE' ? 'text-emerald-400' : 'text-red-400 animate-pulse'
                                    }`}>
                                    {rw.status}
                                </div>
                            </div>
                            {rw.occupiedBy && (
                                <div className="text-[10px] text-slate-400 mt-1 font-mono text-center bg-slate-900/50 rounded py-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {occupantName}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RunwayStatus;
