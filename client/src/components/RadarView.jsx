import React, { useEffect, useRef } from 'react';

const RadarView = ({ aircrafts, runways }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Canvas dimensions
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = Math.min(width, height) / 240; // Scale 120 units to half-width

        const render = () => {
            // Clear screen
            ctx.fillStyle = '#0f172a'; // Slate 900
            ctx.fillRect(0, 0, width, height);

            // Draw Grid / Radar Circles
            ctx.strokeStyle = '#1e293b'; // Slate 800
            ctx.lineWidth = 1;

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

            // Draw Runways
            runways.forEach(runway => {
                // Simplified runway representation
                // For now, draw them near center
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.fillStyle = runway.status === 'FREE' ? '#334155' : '#7f1d1d'; // Slate 700 or Red 900
                // Approx positions for visuals
                if (runway.id === '09L') ctx.fillRect(-10 * scale, -2 * scale, 20 * scale, 4 * scale);
                if (runway.id === '27R') ctx.fillRect(-10 * scale, 6 * scale, 20 * scale, 4 * scale);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '10px monospace';
                if (runway.id === '09L') ctx.fillText(runway.id, -15 * scale, 0);
                if (runway.id === '27R') ctx.fillText(runway.id, -15 * scale, 8 * scale);
                ctx.restore();
            });

            // Draw Aircraft
            aircrafts.forEach(ac => {
                if (ac.state === 'FINISHED') return;

                const x = centerX + ac.x * scale;
                const y = centerY + ac.y * scale;

                ctx.save();
                ctx.translate(x, y);

                // Icon color based on status
                if (ac.emergency) ctx.fillStyle = '#ef4444'; // Red
                else if (ac.type === 'ARRIVAL') ctx.fillStyle = '#34d399'; // Emerald
                else ctx.fillStyle = '#60a5fa'; // Blue

                // Draw basic triangle for aircraft
                ctx.rotate((ac.heading + 90) * Math.PI / 180); // +90 adjustment for canvas coords
                ctx.beginPath();
                ctx.moveTo(0, -5);
                ctx.lineTo(4, 5);
                ctx.lineTo(-4, 5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Draw Label (Callsign, Altitude, Speed)
                ctx.fillStyle = '#e2e8f0'; // Slate 200
                ctx.font = '12px monospace';
                ctx.fillText(ac.callsign, x + 8, y - 8);

                ctx.font = '10px monospace';
                ctx.fillStyle = '#94a3b8'; // Slate 400
                ctx.fillText(`${Math.floor(ac.altitude)}ft`, x + 8, y + 2);
                ctx.fillText(`${Math.floor(ac.speed)}kts`, x + 8, y + 12);
            });

            // Radar Sweep Effect (Visual only)
            const time = Date.now() / 2000;
            const angle = time % (Math.PI * 2);

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            const gradient = ctx.createLinearGradient(0, 0, 100 * scale, 0);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 110 * scale, -0.2, 0.2); // Wedge
            ctx.fill();
            ctx.restore();
        };

        const animationId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationId);
    }, [aircrafts, runways]);

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
