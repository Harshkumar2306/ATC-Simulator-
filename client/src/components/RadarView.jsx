import React, { useEffect, useRef } from 'react';

const RadarView = ({ aircrafts, runways }) => {
    const canvasRef = useRef(null);

    const aircraftsRef = useRef(aircrafts);
    const runwaysRef = useRef(runways);

    // Update refs whenever props change, without restarting the animation loop
    useEffect(() => {
        aircraftsRef.current = aircrafts;
        runwaysRef.current = runways;
    }, [aircrafts, runways]);

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

            // Draw Aircraft
            aircraftsRef.current.forEach(ac => {
                if (ac.state === 'FINISHED') return;

                const x = centerX + ac.x * scale;
                const y = centerY + ac.y * scale;

                ctx.save();
                ctx.translate(x, y);

                // Icon color based on status
                let color, glowColor;
                if (ac.emergency) {
                    color = '#ef4444'; // Red
                    glowColor = 'rgba(239, 68, 68, 0.8)';
                }
                else if (ac.type === 'ARRIVAL') {
                    color = '#34d399'; // Emerald
                    glowColor = 'rgba(52, 211, 153, 0.8)';
                }
                else {
                    color = '#60a5fa'; // Blue
                    glowColor = 'rgba(96, 165, 250, 0.8)';
                }

                // Draw glowing dot
                ctx.shadowBlur = 10;
                ctx.shadowColor = glowColor;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
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
