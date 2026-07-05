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

        const wcs = ['L', 'M', 'H']; // Light, Medium, Heavy
        this.wakeCategory = wcs[Math.floor(Math.random() * wcs.length)];

        // Physics
        this.x = 0;
        this.y = 0;
        this.altitude = 0;
        this.speed = 0;
        this.heading = 0;

        this.targetRunway = null;
        this.targetHeading = null;
        this.targetAltitude = null;
        this.squawk = Math.floor(Math.random() * 7000 + 1000).toString(); // Generates 1000-7999
        this.fuel = type === 'ARRIVAL' ? 300 : 800; // 5 mins for arrivals, 13 mins for departures

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
            
            if (this.state === 'AIRBORNE' || this.state === 'LANDING') {
                this.fuel -= dt;
                if (this.fuel < 60 && !this.emergency) {
                    this.gameServer.log(`BINGO FUEL: ${this.callsign} has critical fuel levels! MAYDAY declared.`);
                    this.declareEmergency();
                }

                // Apply Wind Drift
                if (this.gameServer && this.gameServer.weather) {
                    const wind = this.gameServer.weather.getWindVector();
                    this.x += wind.x * dt;
                    this.y += wind.y * dt;

                    // Check Storms
                    for (const storm of this.gameServer.weather.stormCells) {
                        const dx = this.x - storm.x;
                        const dy = this.y - storm.y;
                        if (Math.sqrt(dx*dx + dy*dy) < storm.radius) {
                            if (Math.random() < 0.05 * dt && !this.emergency) {
                                this.gameServer.log(`TURBULENCE ALERT: ${this.callsign} has entered a storm cell!`);
                                if (storm.intensity === 3 && Math.random() < 0.1) {
                                    this.declareEmergency();
                                    this.gameServer.log(`MAYDAY: ${this.callsign} declaring emergency due to severe weather damage!`);
                                }
                            }
                        }
                    }
                }
            }

            // Target Heading Adjustment
            if (this.targetHeading !== null && this.state === 'AIRBORNE') {
                let diff = this.targetHeading - this.heading;
                while (diff > 180) diff -= 360;
                while (diff < -180) diff += 360;
                
                if (Math.abs(diff) < 2) {
                    this.heading = this.targetHeading;
                } else {
                    this.heading += Math.sign(diff) * 15 * dt; 
                }
                while (this.heading < 0) this.heading += 360;
                while (this.heading >= 360) this.heading -= 360;
            }

            // Target Altitude Adjustment
            if (this.targetAltitude !== null && this.state === 'AIRBORNE') {
                if (Math.abs(this.altitude - this.targetAltitude) < 50) {
                    this.altitude = this.targetAltitude;
                } else if (this.altitude < this.targetAltitude) {
                    this.altitude += 500 * dt;
                } else {
                    this.altitude -= 500 * dt;
                }
            }

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
                if (this.speed > 160) this.speed -= 20 * dt; // Slow down to approach speed

                // Calculate distance to runway threshold
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const distToRunway = Math.sqrt(dx * dx + dy * dy);

                // Glide slope descent
                if (distToRunway < 40) {
                    // Smoothly descend to 0
                    this.altitude -= 1000 * dt;
                } else {
                    this.altitude -= 500 * dt;
                }
                if (this.altitude < 0) this.altitude = 0;

                // Intercept Localizer vs Final Approach
                if (distToRunway > 15) {
                    // Fly towards threshold
                    const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                    this.heading = targetAngle;
                } else {
                    // Final approach, align with runway
                    this.heading = this.runwayHeading;
                }

                // Touchdown logic
                if (distToRunway < 2 && this.altitude <= 50) {
                    this.altitude = 0;
                    this.speed = 60; // Faster Taxi speed (was 20)
                    this.state = 'TAXIING';

                    // Force disappear after ~12 seconds
                    setTimeout(() => {
                        if (this.state === 'TAXIING' || this.state === 'PARKED') {
                            this.state = 'FINISHED';
                        }
                    }, 12000);

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
            
            // Set runway threshold and heading
            if (runwayId === '09L') {
                this.targetX = -10;
                this.targetY = -2;
                this.runwayHeading = 90;
            } else if (runwayId === '27R') {
                this.targetX = 10;
                this.targetY = 6;
                this.runwayHeading = 270;
            }
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
            if (this.targetRunway) {
                const runway = this.gameServer.runways.get(this.targetRunway);
                if (runway) runway.release();
            }
            this.state = 'AIRBORNE';
            this.targetRunway = null;
            this.actionTime = null;
            this.targetHeading = this.heading; // Maintain current heading when holding
            this.targetAltitude = 3000; // Climb to hold altitude
        }
    }

    setHeading(heading) {
        if (this.state === 'AIRBORNE') {
            this.targetHeading = heading;
            return true;
        }
        return false;
    }

    setAltitude(alt) {
        if (this.state === 'AIRBORNE') {
            this.targetAltitude = alt;
            return true;
        }
        return false;
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
            targetHeading: this.targetHeading,
            targetAltitude: this.targetAltitude,
            targetRunway: this.targetRunway,
            spawnTime: this.spawnTime,
            actionTime: this.actionTime,
            squawk: this.squawk,
            fuel: this.fuel,
            wakeCategory: this.wakeCategory
        };
    }
}

module.exports = Aircraft;
