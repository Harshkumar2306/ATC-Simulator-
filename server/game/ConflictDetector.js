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
                if (a1.state === 'PARKED' || a1.state === 'FINISHED') continue;
                if (a2.state === 'PARKED' || a2.state === 'FINISHED') continue;

                const dist = Math.sqrt(Math.pow(a1.x - a2.x, 2) + Math.pow(a1.y - a2.y, 2));

                if (dist < this.separationMinima) {
                    conflicts.push({ a1, a2, dist });
                }
            }
        }

        return conflicts;
    }
}

module.exports = ConflictDetector;
