import React from 'react';

const PassengerDashboard = ({ gameState, onLogout }) => {
    const { aircrafts = [], runways = [] } = gameState || {};

    // Combine aircrafts with history if available, but for now just use active
    const activeFlights = aircrafts; // This view shows current active flights

    const arrivals = activeFlights.filter(a => a.type === 'ARRIVAL');
    const departures = activeFlights.filter(a => a.type === 'DEPARTURE');

    // Format Time
    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const FlightTable = ({ title, flights, color }) => (
        <div className="flex-1 min-w-[300px] bg-slate-900 border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl">
            <div className={`p-4 ${color === 'amber' ? 'bg-amber-600' : 'bg-blue-600'} text-white font-black text-2xl uppercase tracking-widest text-center shadow-md`}>
                {title}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left font-mono">
                    <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                        <tr>
                            <th className="p-3">Time</th>
                            <th className="p-3">Flight</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Runway</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-lg">
                        {flights.map(f => (
                            <tr key={f.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-3 text-yellow-400 font-bold">{formatTime(f.spawnTime)}</td>
                                <td className="p-3 text-white font-bold tracking-wider">{f.callsign}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm font-bold ${f.state === 'AIRBORNE' ? 'bg-blue-900 text-blue-300' :
                                            f.state === 'LANDING' ? 'bg-amber-900 text-amber-300' :
                                                f.state === 'TAXIING' ? 'bg-emerald-900 text-emerald-300' :
                                                    f.state === 'TAKEOFF' ? 'bg-indigo-900 text-indigo-300' :
                                                        'bg-slate-800 text-slate-400'
                                        }`}>
                                        {f.state}
                                    </span>
                                </td>
                                <td className="p-3 text-slate-300">{f.targetRunway || '-'}</td>
                            </tr>
                        ))}
                        {flights.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-slate-600 italic">No flights scheduled</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 p-6 flex flex-col gap-8 font-sans">
            {/* Header */}
            <header className="flex justify-between items-center border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-widest uppercase">
                        <span className="text-blue-500">AIRPORT</span> STATUS
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest">Live Flight Information Display System</p>
                </div>
                <div className="bg-slate-900 px-6 py-3 rounded-lg border border-slate-800 text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Local Time</div>
                    <div className="text-2xl font-mono text-yellow-500 font-bold">
                        {new Date().toLocaleTimeString()}
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="text-xs text-slate-500 hover:text-white font-mono uppercase tracking-wider border border-slate-800 px-4 py-2 rounded hover:bg-slate-800 transition-colors"
                >
                    Exit View
                </button>
            </header>

            {/* Boards */}
            <div className="flex flex-wrap gap-8">
                <FlightTable title="Arrivals" flights={arrivals} color="blue" />
                <FlightTable title="Departures" flights={departures} color="amber" />
            </div>

            {/* Footer Info */}
            <footer className="mt-auto text-center text-slate-600 text-xs uppercase tracking-widest py-6">
                <p>Information provided for simulation purposes only</p>
            </footer>
        </div>
    );
};

export default PassengerDashboard;
