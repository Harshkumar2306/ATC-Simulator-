import React, { useRef, useEffect } from 'react';

const LogPanel = ({ logs }) => {
    const endRef = useRef(null);

    const lastLogId = logs.length > 0 ? logs[logs.length - 1].id : null;

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lastLogId]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-full flex flex-col mt-0">
            <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Comms Log</h2>
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1">
                {logs.map(log => (
                    <div key={log.id} className="text-slate-400 border-l-2 border-slate-700 pl-2 py-1">
                        <span className="text-slate-600 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={log.message.includes('EMERGENCY') || log.message.includes('Conflict') ? 'text-red-400 font-bold' : 'text-slate-300'}>
                            {log.message}
                        </span>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    )
}

export default LogPanel;
