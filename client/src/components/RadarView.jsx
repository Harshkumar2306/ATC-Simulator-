import React, { useEffect, useRef } from 'react';
import { socket } from '../services/socket';

const RadarView = ({ aircrafts, runways, weather, conflicts = [] }) => {
    const canvasRef = useRef(null);

    const aircraftsRef = useRef(aircrafts);
    const runwaysRef = useRef(runways);
    const weatherRef = useRef(weather);
    const conflictsRef = useRef(conflicts);
    const historyMap = useRef(new Map());

    // Initialize refs with initial props
    useEffect(() => {
        aircraftsRef.current = aircrafts;
        runwaysRef.current = runways;
        weatherRef.current = weather;
        conflictsRef.current = conflicts;
    }, []); // Only run once on mount

    // Direct high-speed 20Hz pipeline to bypass React DOM throttling
    useEffect(() => {
        const handleFastState = (data) => {
            aircraftsRef.current = data.aircrafts;
            runwaysRef.current = data.runways;
            weatherRef.current = data.weather;
            conflictsRef.current = data.conflicts || [];
        };

        socket.on('gameState', handleFastState);
        return () => {
            socket.off('gameState', handleFastState);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationId;

        // Canvas dimensions
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = Math.min(width, height) / 240; // Scale 120 units to half-width

        let lastTime = performance.now();

        const render = (time) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            // Fade out previous frame (Ghosting / Trail effect)
            ctx.fillStyle = 'rgba(15, 23, 42, 0.25)'; // Slate 900 with alpha
            ctx.fillRect(0, 0, width, height);

            // Draw Grid / Radar Circles
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)'; // Emerald tint
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);

            // Concentric circles
            for (let r = 20; r <= 100; r += 20) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, r * scale, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Drop lines
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, height);
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash

            // Compass Markers
            ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'; // Slate 400
            ctx.font = '12px "Space Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('N', centerX, centerY - 105 * scale);
            ctx.fillText('S', centerX, centerY + 105 * scale);
            ctx.fillText('E', centerX + 105 * scale, centerY);
            ctx.fillText('W', centerX - 105 * scale, centerY);
            ctx.textAlign = 'left'; // Reset

            // Draw Weather / Storm Cells
            if (weatherRef.current && weatherRef.current.storms) {
                weatherRef.current.storms.forEach(storm => {
                    const x = centerX + storm.x * scale;
                    const y = centerY + storm.y * scale;
                    const r = storm.radius * scale;
                    
                    ctx.save();
                    ctx.translate(x, y);
                    
                    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
                    
                    let colorCenter, colorEdge;
                    if (storm.intensity === 1) { // Light (Green)
                        colorCenter = 'rgba(34, 197, 94, 0.4)';
                        colorEdge = 'rgba(34, 197, 94, 0)';
                    } else if (storm.intensity === 2) { // Heavy (Yellow)
                        colorCenter = 'rgba(234, 179, 8, 0.5)';
                        colorEdge = 'rgba(234, 179, 8, 0)';
                    } else { // Severe (Red)
                        colorCenter = 'rgba(239, 68, 68, 0.6)';
                        colorEdge = 'rgba(239, 68, 68, 0)';
                    }
                    
                    gradient.addColorStop(0, colorCenter);
                    gradient.addColorStop(1, colorEdge);
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                });
            }

            // ILS Approach Cones for runways
            ctx.save();
            ctx.translate(centerX, centerY);
            
            // ILS 09L (Approaching from West, pointing East)
            const gradient09 = ctx.createLinearGradient(-50 * scale, 0, -10 * scale, 0);
            gradient09.addColorStop(0, 'rgba(16, 185, 129, 0)');
            gradient09.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
            ctx.fillStyle = gradient09;
            ctx.beginPath();
            ctx.moveTo(-10 * scale, 0);
            ctx.lineTo(-50 * scale, -15 * scale);
            ctx.lineTo(-50 * scale, 15 * scale);
            ctx.closePath();
            ctx.fill();

            // ILS 27R (Approaching from East, pointing West)
            const gradient27 = ctx.createLinearGradient(50 * scale, 8 * scale, 10 * scale, 8 * scale);
            gradient27.addColorStop(0, 'rgba(16, 185, 129, 0)');
            gradient27.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
            ctx.fillStyle = gradient27;
            ctx.beginPath();
            ctx.moveTo(10 * scale, 8 * scale);
            ctx.lineTo(50 * scale, -7 * scale);
            ctx.lineTo(50 * scale, 23 * scale);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Draw Runways
            runwaysRef.current.forEach(runway => {
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.fillStyle = runway.status === 'FREE' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(127, 29, 29, 0.8)';
                ctx.shadowBlur = 5;
                ctx.shadowColor = runway.status === 'FREE' ? '#334155' : '#7f1d1d';
                
                if (runway.id === '09L') ctx.fillRect(-10 * scale, -2 * scale, 20 * scale, 4 * scale);
                if (runway.id === '27R') ctx.fillRect(-10 * scale, 6 * scale, 20 * scale, 4 * scale);

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#94a3b8';
                ctx.font = '10px "Space Mono", monospace';
                if (runway.id === '09L') ctx.fillText(runway.id, -15 * scale, 0);
                if (runway.id === '27R') ctx.fillText(runway.id, -15 * scale, 8 * scale);
                ctx.restore();
            });

            // Maintain history for breadcrumbs
            const currentIds = new Set(aircraftsRef.current.map(a => a.id));
            for (const id of historyMap.current.keys()) {
                if (!currentIds.has(id)) historyMap.current.delete(id);
            }

            // Draw Aircraft
            aircraftsRef.current.forEach(ac => {
                if (ac.state === 'FINISHED') return;

                // Client-side Extrapolation (Smooth 60FPS movement between 20Hz server ticks)
                if (['AIRBORNE', 'LANDING', 'TAKEOFF', 'TAXIING', 'TAXI_OUT'].includes(ac.state)) {
                    const moveSpeed = (ac.speed / 100) * 2;
                    const rad = ac.heading * (Math.PI / 180);
                    ac.x += Math.cos(rad) * moveSpeed * dt;
                    ac.y += Math.sin(rad) * moveSpeed * dt;
                }

                const x = centerX + ac.x * scale;
                const y = centerY + ac.y * scale;

                // Update history map (store points every 1 second)
                if (!historyMap.current.has(ac.id)) historyMap.current.set(ac.id, []);
                const history = historyMap.current.get(ac.id);
                const now = Date.now();
                if (history.length === 0 || now - history[history.length - 1].time > 1000) {
                    history.push({ x: ac.x * scale, y: ac.y * scale, time: now });
                    if (history.length > 5) history.shift(); // Keep last 5 points
                }

                // Check TCAS Conflicts
                const conflict = conflictsRef.current.find(c => c.a1 === ac.id || c.a2 === ac.id);

                // Determine Colors
                let color, glowColor;
                if (ac.emergency || (conflict && conflict.type === 'RA')) {
                    color = '#ef4444'; // Red (Emergency or Resolution Advisory)
                    glowColor = 'rgba(239, 68, 68, 1)';
                } else if (conflict && conflict.type === 'TA') {
                    color = '#eab308'; // Yellow (Traffic Advisory)
                    glowColor = 'rgba(234, 179, 8, 0.8)';
                } else if (ac.type === 'ARRIVAL') {
                    color = '#34d399'; // Emerald
                    glowColor = 'rgba(52, 211, 153, 0.8)';
                } else {
                    color = '#60a5fa'; // Blue
                    glowColor = 'rgba(96, 165, 250, 0.8)';
                }

                // Phosphor Trail (Breadcrumbs)
                ctx.save();
                ctx.translate(centerX, centerY);
                history.forEach((pt, i) => {
                    const alpha = Math.pow((i + 1) / (history.length + 1), 2); // Exponential phosphor decay
                    ctx.fillStyle = color;
                    // Removed expensive shadowBlur for performance
                    ctx.globalAlpha = alpha * 0.8;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();

                ctx.save();
                ctx.translate(x, y);

                // Altitude scaling for 3D effect (0 to 30000ft maps to scale 0.6x to 1.5x)
                const altRatio = Math.max(0, Math.min(1, ac.altitude / 30000));
                const dotScale = 0.6 + (altRatio * 0.9);
                const shadowRadius = 2 + (altRatio * 15);

                // Draw glowing dot
                ctx.shadowBlur = shadowRadius;
                ctx.shadowColor = glowColor;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, 0, 3.5 * dotScale, 0, Math.PI * 2);
                ctx.fill();

                // Speed Vector Trend Line (Predicts position in 60 seconds)
                ctx.shadowBlur = 0;
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.0;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const rad = ac.heading * (Math.PI / 180);
                // moveSpeed = (speed / 100) * 2; prediction over 60 seconds (1 minute trend line)
                const trendLen = (ac.speed / 100) * 2 * 60 * scale / 100; 
                ctx.lineTo(Math.cos(rad) * trendLen, Math.sin(rad) * trendLen);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
                
                ctx.restore();

                // Draw Data Block and Leader Line
                const lblX = x + 15;
                const lblY = y - 25;

                // Leader Line
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 10, y - 10);
                ctx.lineTo(lblX, y - 10);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.0;
                ctx.globalAlpha = 0.6;
                ctx.stroke();
                ctx.globalAlpha = 1.0;

                // Data Block Background
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // Darker bg for Data Block
                ctx.fillRect(lblX, lblY, 80, 42);
                ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)'; // subtle border
                ctx.strokeRect(lblX, lblY, 80, 42);

                ctx.fillStyle = color;
                ctx.font = 'bold 10px "Space Mono", monospace';
                ctx.fillText(ac.callsign, lblX + 4, lblY + 12);
                
                ctx.fillStyle = '#94a3b8'; // Slate 400 for Wake Category & Squawk
                ctx.font = '10px "Space Mono", monospace';
                ctx.fillText(`${ac.type.charAt(0)}/${ac.wakeCategory || 'M'}`, lblX + 50, lblY + 12);

                ctx.fillStyle = '#cbd5e1'; 
                ctx.fillText(`${Math.floor(ac.altitude).toString().padStart(5, '0')}`, lblX + 4, lblY + 24);
                ctx.fillText(`[${ac.squawk}]`, lblX + 48, lblY + 24);

                // Line 3: Speed & Fuel
                ctx.fillText(`${Math.floor(ac.speed).toString().padStart(3, '0')}kts`, lblX + 4, lblY + 36);
                ctx.fillStyle = ac.fuel < 100 ? '#ef4444' : '#64748b';
                ctx.fillText(`F${Math.floor(ac.fuel)}`, lblX + 50, lblY + 36);
            });

            // Radar Sweep Effect (Visual only)
            const sweepTime = Date.now() / 2000;
            const angle = sweepTime % (Math.PI * 2);

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            
            // Draw a subtle conic wedge
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 110 * scale, -0.15, 0);
            ctx.closePath();
            ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.fill();

            // Leading bright edge
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(110 * scale, 0);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#10b981';
            ctx.stroke();
            
            ctx.restore();
            
            animationId = requestAnimationFrame(render);
        };

        animationId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            {weather && (
                <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1 bg-slate-950/80 backdrop-blur px-3 py-2 rounded border border-slate-700/50 shadow-lg">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SURFACE WIND</div>
                    <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                        <span>{weather.windHeading.toString().padStart(3, '0')}°</span>
                        <span className="text-slate-600">@</span>
                        <span>{weather.windSpeed}kts</span>
                        <div 
                            className="w-5 h-5 border-2 border-emerald-500/50 rounded-full flex items-center justify-center ml-1"
                            style={{ transform: `rotate(${weather.windHeading}deg)` }}
                        >
                            <div className="w-0.5 h-2.5 bg-emerald-400 shadow-[0_0_5px_#34d399] -mt-2 rounded-full"></div>
                        </div>
                    </div>
                </div>
            )}
            <canvas
                ref={canvasRef}
                width={800}
                height={800}
                className="w-full h-full object-contain"
            />
        </div>
    );
};

export default RadarView;
