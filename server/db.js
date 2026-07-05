const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/atc_simulator';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB (MERN Stack Active)'))
    .catch(err => console.error('MongoDB connection error:', err));

const flightLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    aircraft_id: String,
    callsign: String,
    type: String,
    state: String,
    altitude: Number,
    speed: Number,
    heading: Number,
    x: Number,
    y: Number,
    target_runway: String,
    squawk: String,
    fuel: Number
});

const FlightLog = mongoose.model('FlightLog', flightLogSchema);

function logAircraftState(aircraft) {
    const logEntry = new FlightLog({
        aircraft_id: aircraft.id,
        callsign: aircraft.callsign,
        type: aircraft.type,
        state: aircraft.state,
        altitude: aircraft.altitude,
        speed: aircraft.speed,
        heading: aircraft.heading,
        x: aircraft.x,
        y: aircraft.y,
        target_runway: aircraft.targetRunway || 'NONE',
        squawk: aircraft.squawk,
        fuel: aircraft.fuel
    });

    logEntry.save().catch(err => console.error('Error logging to MongoDB:', err));
}

function getAllLogs(callback) {
    FlightLog.find().sort({ timestamp: -1 }).lean()
        .then(logs => callback(null, logs))
        .catch(err => callback(err, null));
}

module.exports = {
    logAircraftState,
    getAllLogs
};
