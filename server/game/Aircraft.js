class Aircraft {
    constructor(id, type, gameServer) {
        this.id = id;
        this.type = type; // 'ARRIVAL' or 'DEPARTURE'
        this.gameServer = gameServer;

        // Timestamps
        this.spawnTime = new Date(); // When it appeared/scheduled
        this.actionTime = null;      // When it took off or landed

        // Random flight info
        this.callsign = this.generateCallsign();

        // Initial State
        this.state = type === 'ARRIVAL' ? 'AIRBORNE' : 'PARKED';
        this.emergency = false;

        // Physics
        this.x = 0;
        this.y = 0;
        this.altitude = 0;
        this.speed = 0;
        this.heading = 0;

        this.targetRunway = null;

        this.initializePosition();
    }

    generateCallsign() {
        const airlines = ['AA', 'UA', 'DL', 'BA', 'LH', 'AF'];
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        const number = Math.floor(Math.random() * 9000) + 1000;
        return `${airline}${number}`;
    }

    initializePosition() {
        if (this.type === 'ARRIVAL') {
            // Spawn at edge of "radar" (radius ~100)
            const angle = Math.random() * Math.PI * 2;
            const distance = 90;
            this.x = Math.cos(angle) * distance;
            this.y = Math.sin(angle) * distance;
            this.altitude = 30000;
            this.speed = 250; // knots

            // Point towards center (0,0) roughly
            this.heading = Math.atan2(-this.y, -this.x) * (180 / Math.PI);
        } else {
            // Parked at airport center
            this.x = (Math.random() - 0.5) * 10;
            this.y = (Math.random() - 0.5) * 10;
            this.altitude = 0;
            this.speed = 0;
            this.heading = Math.random() * 360;
        }
    }

    update(dt) {
        if (this.state === 'FINISHED') return;

        if (this.state === 'AIRBORNE' || this.state === 'LANDING' || this.state === 'TAKEOFF' || this.state === 'TAXIING') {
            // Move based on heading and speed
            const moveSpeed = (this.speed / 100) * 2;

            const rad = this.heading * (Math.PI / 180);
            this.x += Math.cos(rad) * moveSpeed * dt;
            this.y += Math.sin(rad) * moveSpeed * dt;

            // Logic for Arrival
            if (this.type === 'ARRIVAL' && this.state === 'AIRBORNE') {
                const dist = Math.sqrt(this.x * this.x + this.y * this.y);
                if (dist < 20 && !this.targetRunway) {
                    this.heading += 30 * dt; // Orbit
                }
            }

            // Landing Logic
            if (this.state === 'LANDING') {
                this.altitude -= 800 * dt; // Rapid descent
                this.speed -= 1 * dt;

                if (this.speed < 300) this.speed = 300; // High approach speed

                const targetAngle = Math.atan2(-this.y, -this.x) * (180 / Math.PI);
                this.heading = targetAngle;
                // Touchdown logic
                if (this.altitude <= 0) {
                    this.altitude = 0;
                    this.speed = 60; // Faster Taxi speed (was 20)
                    this.state = 'TAXIING';

                    // Force disappear after ~12 seconds (User requirement: 10-15s)
                    setTimeout(() => {
                        // Only finish if still taxiing (not already parked/finished)
                        if (this.state === 'TAXIING' || this.state === 'PARKED') {
                            this.state = 'FINISHED';
                        }
                    }, 12000);

                    // Release runway as we are now taxiing off
                    if (this.targetRunway) {
                        const rw = this.gameServer.runways.get(this.targetRunway);
                        if (rw) rw.release();
                    }
                }
            }

            // Taxiing Logic
            if (this.state === 'TAXIING') {
                const moveSpeed = (this.speed / 100) * 2;
                const rad = this.heading * (Math.PI / 180);
                this.x += Math.cos(rad) * moveSpeed * dt;
                this.y += Math.sin(rad) * moveSpeed * dt;

                const dist = Math.sqrt(this.x * this.x + this.y * this.y);
                if (dist < 2) {
                    this.state = 'PARKED';
                    this.status = 'TAXIED TO GATE';
                    setTimeout(() => { this.state = 'FINISHED'; }, 5000);
                }
            }

            // Takeoff Logic
            if (this.state === 'TAKEOFF') {
                this.altitude += 250 * dt;
                this.speed += 30 * dt;
                const dist = Math.sqrt(this.x * this.x + this.y * this.y);
                if (dist > 100) {
                    this.state = 'FINISHED';
                }
            }
        }
    }

    land(runwayId) {
        if (this.type !== 'ARRIVAL') return;
        const runway = this.gameServer.runways.get(runwayId);
        if (runway && runway.occupy(this.id)) {
            this.targetRunway = runwayId;
            this.state = 'LANDING';
            this.actionTime = new Date();
            return true;
        }
        return false;
    }

    takeoff(runwayId) {
        if (this.type !== 'DEPARTURE') return;
        const runway = this.gameServer.runways.get(runwayId);
        if (runway && runway.occupy(this.id)) {
            this.targetRunway = runwayId;
            this.state = 'TAKEOFF';
            this.actionTime = new Date();
            this.heading = runwayId.includes('L') ? 90 : 270;

            setTimeout(() => {
                runway.release();
            }, 5000);
            return true;
        }
        return false;
    }

    hold() {
        if (this.state === 'LANDING') {
            this.state = 'AIRBORNE';
            this.targetRunway = null;
            this.actionTime = null;
        }
    }

    declareEmergency() {
        this.emergency = true;
        this.speed = 300;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            callsign: this.callsign,
            state: this.state,
            emergency: this.emergency,
            x: this.x,
            y: this.y,
            altitude: this.altitude,
            speed: this.speed,
            heading: this.heading,
            targetRunway: this.targetRunway,
            spawnTime: this.spawnTime,
            actionTime: this.actionTime
        };
    }
}

module.exports = Aircraft;
