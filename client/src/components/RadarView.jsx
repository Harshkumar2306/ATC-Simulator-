import React, { useEffect, useRef } from 'react';

const RadarView = ({ aircrafts, runways, weather }) => {
    const canvasRef = useRef(null);

    const aircraftsRef = useRef(aircrafts);
    const runwaysRef = useRef(runways);
    const weatherRef = useRef(weather);
    const historyMap = useRef(new Map());

    // Update refs whenever props change, without restarting the animation loop
    useEffect(() => {
        aircraftsRef.current = aircrafts;
        runwaysRef.current = runways;
        weatherRef.current = weather;
    }, [aircrafts, runways, weather]);

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

        const render = () => {
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
            ctx.moveTo(-10 * scale, -2 * scale);
            ctx.lineTo(-50 * scale, -12 * scale);
            ctx.lineTo(-50 * scale, 8 * scale);
            ctx.lineTo(-10 * scale, 2 * scale);
            ctx.fill();

            // ILS 27R (Approaching from East, pointing West)
            const gradient27 = ctx.createLinearGradient(50 * scale, 8 * scale, 10 * scale, 8 * scale);
            gradient27.addColorStop(0, 'rgba(16, 185, 129, 0)');
            gradient27.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
            ctx.fillStyle = gradient27;
            ctx.beginPath();
            ctx.moveTo(10 * scale, 6 * scale);
            ctx.lineTo(50 * scale, -4 * scale);
            ctx.lineTo(50 * scale, 16 * scale);
            ctx.lineTo(10 * scale, 10 * scale);
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

                // Determine Colors
                let color, glowColor;
                if (ac.emergency) {
                    color = '#ef4444'; // Red
                    glowColor = 'rgba(239, 68, 68, 0.8)';
                } else if (ac.type === 'ARRIVAL') {
                    color = '#34d399'; // Emerald
                    glowColor = 'rgba(52, 211, 153, 0.8)';
                } else {
                    color = '#60a5fa'; // Blue
                    glowColor = 'rgba(96, 165, 250, 0.8)';
                }

                // Draw Breadcrumbs
                ctx.save();
                ctx.translate(centerX, centerY);
                history.forEach((pt, i) => {
                    const alpha = (i + 1) / (history.length + 1); // Older points are more transparent
                    ctx.fillStyle = color;
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
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

                // Draw vector line based on heading
                ctx.shadowBlur = 0;
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                // Adjust for canvas rotation (0 is right/east)
                const rad = ac.heading * (Math.PI / 180);
                const vectorLen = (Math.max(ac.speed, 50) / 100) * 6; // line length based on speed
                ctx.lineTo(Math.cos(rad) * vectorLen, Math.sin(rad) * vectorLen);
                ctx.stroke();
                
                ctx.restore();

                // Draw Label (Callsign, Altitude, Speed) with background for readability
                ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'; // Dark bg for label
                ctx.fillRect(x + 6, y - 16, 50, 32);

                ctx.fillStyle = color;
                ctx.font = 'bold 11px "Space Mono", monospace';
                ctx.fillText(ac.callsign, x + 8, y - 6);

                ctx.font = '10px "Space Mono", monospace';
                ctx.fillStyle = '#cbd5e1'; 
                ctx.fillText(`${Math.floor(ac.altitude)}ft`, x + 8, y + 4);
                ctx.fillText(`${Math.floor(ac.speed)}kts`, x + 8, y + 14);
            });

            // Radar Sweep Effect (Visual only)
            const time = Date.now() / 2000;
            const angle = time % (Math.PI * 2);

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
