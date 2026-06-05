const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const isPostgres = !!process.env.DATABASE_URL;

let pgPool;
let sqliteDb;

if (isPostgres) {
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Render Postgres
    });
    console.log('Connected to PostgreSQL database.');
    initDb();
} else {
    const dbPath = path.resolve(__dirname, 'atc_data.db');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database ' + dbPath + ': ' + err.message);
        } else {
            console.log('Connected to the SQLite database.');
            initDb();
        }
    });
}

function initDb() {
    if (isPostgres) {
        pgPool.query(`CREATE TABLE IF NOT EXISTS flight_logs (
            id SERIAL PRIMARY KEY,
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
            if (err) console.error('Error creating PG table:', err);
            else console.log('PG Flight Logs table ready.');
        });
    } else {
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS flight_logs (
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
            if (err) console.error('Error creating SQLite table:', err);
            else console.log('SQLite Flight Logs table ready.');
        });
    }
}

function logAircraftState(aircraft) {
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

    if (isPostgres) {
        const query = `INSERT INTO flight_logs (
            timestamp, aircraft_id, callsign, type, state,
            altitude, speed, heading, x, y, target_runway
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
        pgPool.query(query, values, (err) => {
            if (err) console.error('Error logging aircraft state to PG:', err);
        });
    } else {
        const query = `INSERT INTO flight_logs (
            timestamp, aircraft_id, callsign, type, state,
            altitude, speed, heading, x, y, target_runway
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        sqliteDb.run(query, values, (err) => {
            if (err) console.error('Error logging aircraft state to SQLite:', err);
        });
    }
}

function getAllLogs(callback) {
    if (isPostgres) {
        pgPool.query("SELECT * FROM flight_logs ORDER BY timestamp DESC", (err, result) => {
            if (err) callback(err, null);
            else callback(null, result.rows);
        });
    } else {
        sqliteDb.all("SELECT * FROM flight_logs ORDER BY timestamp DESC", [], (err, rows) => {
            if (err) callback(err, null);
            else callback(null, rows);
        });
    }
}

module.exports = {
    logAircraftState,
    getAllLogs
};
