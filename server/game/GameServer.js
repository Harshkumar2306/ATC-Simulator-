const Aircraft = require('./Aircraft');
const Runway = require('./Runway');
const ConflictDetector = require('./ConflictDetector');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

class GameServer {
    constructor(io) {
        this.io = io;
        this.aircrafts = new Map();
        this.completedFlights = [];
        this.runways = new Map();
        this.logs = [];
        this.isRunning = false;
        this.tickRate = 50; // ms (20 updates/sec)

        // Initialize Runways
        this.addRunway('09L', 'Left Runway');
        this.addRunway('27R', 'Right Runway');

        this.conflictDetector = new ConflictDetector(this);

        // Spawn some initial aircraft for testing
        this.spawnAircraft('ARRIVAL');
        this.spawnAircraft('DEPARTURE');
    }

    addRunway(id, name) {
        this.runways.set(id, new Runway(id, name));
    }

    spawnAircraft(type) {
        const id = uuidv4();
        const aircraft = new Aircraft(id, type, this);
        this.aircrafts.set(id, aircraft);
        this.log(`New aircraft detected: ${aircraft.callsign}`);

        // Log initial state
        db.logAircraftState(aircraft);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        setInterval(() => {
            this.update();
        }, this.tickRate);

        // Randomly spawn aircraft every 30-60 seconds
        setInterval(() => {
            if (this.aircrafts.size < 10) {
                const type = Math.random() > 0.5 ? 'ARRIVAL' : 'DEPARTURE';
                this.spawnAircraft(type);
            }
        }, 45000);

        // Database Logging Interval (Every 5 seconds)
        setInterval(() => {
            this.aircrafts.forEach(aircraft => {
                db.logAircraftState(aircraft);
            });
        }, 5000);
    }

    update() {
        // Update all aircraft
        this.aircrafts.forEach(aircraft => {
            aircraft.update(this.tickRate / 1000);

            // Cleanup finished aircraft
            if (aircraft.state === 'FINISHED') {
                this.aircrafts.delete(aircraft.id);

                // Add to history
                this.completedFlights.unshift(aircraft);
                if (this.completedFlights.length > 100) this.completedFlights.pop(); // Keep last 100 completed

                this.log(`Aircraft ${aircraft.callsign} has left airspace/parked.`);
            }
        });

        // Check conflicts
        const conflicts = this.conflictDetector.checkConflicts();
        if (conflicts.length > 0) {
            conflicts.forEach(c => {
                // Rate limit logs or check if already logged
                if (Math.random() < 0.05) { // Simple rate limit
                    this.log(`WARNING: Conflict detected between ${c.a1.callsign} and ${c.a2.callsign}`);
                }
            });
        }

        // Broadcast state
        this.io.emit('gameState', this.getState());
    }

    handleCommand(command) {
        const { type, aircraftId, payload } = command;
        const aircraft = this.aircrafts.get(aircraftId);

        if (!aircraft) return;

        switch (type) {
            case 'LAND':
                if (aircraft.land(payload.runwayId)) {
                    this.log(`Command: ${aircraft.callsign} cleared to land on ${payload.runwayId}`);
                } else {
                    this.log(`Negative: ${aircraft.callsign}, runway ${payload.runwayId} is occupied!`);
                }
                break;
            case 'TAKEOFF':
                if (aircraft.takeoff(payload.runwayId)) {
                    this.log(`Command: ${aircraft.callsign} cleared for takeoff on ${payload.runwayId}`);
                } else {
                    this.log(`Negative: ${aircraft.callsign}, runway ${payload.runwayId} is occupied!`);
                }
                break;
            case 'HOLD':
                aircraft.hold();
                this.log(`Command: ${aircraft.callsign} placed in holding pattern`);
                break;
            case 'EMERGENCY':
                aircraft.declareEmergency();
                this.log(`ALERT: ${aircraft.callsign} declared EMERGENCY!`);
                break;
        }
    }

    log(message) {
        const logEntry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            message
        };
        this.logs.push(logEntry);
        if (this.logs.length > 50) this.logs.shift(); // Keep last 50
        this.io.emit('log', logEntry);
    }

    getState() {
        return {
            aircrafts: Array.from(this.aircrafts.values()).map(a => a.toJSON()),
            runways: Array.from(this.runways.values()).map(r => r.toJSON()),
            logs: this.logs
        };
    }
}

module.exports = GameServer;
