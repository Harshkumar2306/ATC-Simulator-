const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'atc_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.run(`CREATE TABLE IF NOT EXISTS flight_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        aircraft_id TEXT,
        callsign TEXT,
        type TEXT,
        state TEXT,
        altitude REAL,
        speed REAL,
        heading REAL,
        x REAL,
        y REAL,
        target_runway TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Flight Logs table ready.');
        }
    });
}

function logAircraftState(aircraft) {
    const query = `INSERT INTO flight_logs (
        timestamp, aircraft_id, callsign, type, state,
        altitude, speed, heading, x, y, target_runway
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const now = new Date().toISOString();
    const values = [
        now,
        aircraft.id,
        aircraft.callsign,
        aircraft.type,
        aircraft.state,
        aircraft.altitude,
        aircraft.speed,
        aircraft.heading,
        aircraft.x,
        aircraft.y,
        aircraft.targetRunway || 'NONE'
    ];

    db.run(query, values, (err) => {
        if (err) {
            console.error('Error logging aircraft state:', err);
        }
    });
}

function getAllLogs(callback) {
    db.all("SELECT * FROM flight_logs ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
}

module.exports = {
    logAircraftState,
    getAllLogs
};
