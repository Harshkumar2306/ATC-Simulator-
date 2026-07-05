class ConflictDetector {
    constructor(gameServer) {
        this.gameServer = gameServer;
        this.separationMinima = 10; // Minimum distance units
    }

    checkConflicts() {
        const aircrafts = Array.from(this.gameServer.aircrafts.values());
        const conflicts = [];

        for (let i = 0; i < aircrafts.length; i++) {
            for (let j = i + 1; j < aircrafts.length; j++) {
                const a1 = aircrafts[i];
                const a2 = aircrafts[j];

                // Only check airborne/landing/takeoff aircraft
                if (a1.state === 'PARKED' || a1.state === 'FINISHED' || a1.state === 'TAXIING') continue;
                if (a2.state === 'PARKED' || a2.state === 'FINISHED' || a2.state === 'TAXIING') continue;

                // 2D distance
                const dist = Math.sqrt(Math.pow(a1.x - a2.x, 2) + Math.pow(a1.y - a2.y, 2));
                // Altitude difference
                const altDiff = Math.abs(a1.altitude - a2.altitude);

                // If altitude separation is >= 1000ft, no conflict
                if (altDiff >= 1000) continue;

                if (dist < 5) {
                    conflicts.push({ a1: a1.id, a2: a2.id, dist, type: 'RA' }); // Resolution Advisory (Critical)
                    if (Math.random() < 0.05) { // Log occasionally to avoid spam
                        this.gameServer.log(`TCAS RA: ${a1.callsign} & ${a2.callsign} - COLLISION IMMINENT!`);
                    }
                } else if (dist < 12) {
                    conflicts.push({ a1: a1.id, a2: a2.id, dist, type: 'TA' }); // Traffic Advisory (Warning)
                }
            }
        }

        return conflicts;
    }
}

module.exports = ConflictDetector;
