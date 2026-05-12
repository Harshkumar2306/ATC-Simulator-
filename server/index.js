const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameServer = require('./game/GameServer');

const app = express();
const db = require('./db');
app.use(cors());
app.use(express.json());

// Hardcoded secret for simplicity
const ADMIN_PASSWORD = 'admin123';
const TOKENS = new Set(); // In-memory token store

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        const token = require('crypto').randomUUID(); // Node 19+ or older using crypto module
        TOKENS.add(token);
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.get('/export', (req, res) => {
    // Combine Active and Completed flights
    const active = Array.from(game.aircrafts.values());
    const completed = game.completedFlights || [];
    const allFlights = [...active, ...completed];

    // Sort by latest action or spawn
    allFlights.sort((a, b) => b.spawnTime - a.spawnTime);

    const columns = [
        { id: 'spawnTime', title: 'Start Time' },
        { id: 'callsign', title: 'Flight' },
        { id: 'type', title: 'Type' },
        { id: 'state', title: 'Final Phase' },
        { id: 'actionTime', title: 'Action Time' },
        { id: 'altitude', title: 'Altitude (ft)' },
        { id: 'speed', title: 'Speed (kts)' },
        { id: 'targetRunway', title: 'Runway' }
    ];

    const csvRows = [columns.map(c => c.title).join(',')];

    allFlights.forEach(ac => {
        const values = columns.map(col => {
            let val = ac[col.id];

            // Format Dates
            if (['spawnTime', 'actionTime'].includes(col.id)) {
                if (val) {
                    val = new Date(val).toLocaleTimeString();
                } else {
                    val = '-';
                }
            }

            // Format numbers
            if (typeof val === 'number') {
                if (['speed', 'heading', 'altitude'].includes(col.id)) {
                    val = Math.round(val);
                }
            }

            if (val === null || val === undefined) val = '-';
            return `"${val}"`;
        });
        csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="atc_full_report.csv"');
    res.send(csvString);
});

app.get('/export/pdf', (req, res) => {
    const PDFDocument = require('pdfkit');
    // Combine Active and Completed flights
    const active = Array.from(game.aircrafts.values());
    const completed = game.completedFlights || [];
    const allFlights = [...active, ...completed];

    allFlights.sort((a, b) => b.spawnTime - a.spawnTime);

    const doc = new PDFDocument({ layout: 'landscape' }); // Landscape for more columns
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="atc_full_report.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text('ATC FULL REPORT', { align: 'center' });
    doc.moveDown();
    const dateStr = new Date().toLocaleString();
    doc.fontSize(12).text(`Generated: ${dateStr}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`Active: ${active.length} | Completed: ${completed.length}`, { align: 'center' });
    doc.moveDown();

    // Simple table layout
    let y = 180;
    doc.font('Helvetica-Bold').fontSize(10);

    // Header
    doc.text('Start Time', 50, y);
    doc.text('Flight', 150, y);
    doc.text('Type', 210, y);
    doc.text('Final Phase', 290, y);
    doc.text('Action Time', 370, y);
    doc.text('Alt', 450, y);
    doc.text('Spd', 510, y);
    doc.text('Rwy', 560, y);

    y += 20;
    doc.moveTo(50, y).lineTo(600, y).stroke();
    y += 10;

    doc.font('Helvetica').fontSize(10);

    allFlights.forEach(ac => {
        if (y > 500) {
            doc.addPage();
            y = 50;
        }

        const spawnTime = ac.spawnTime ? new Date(ac.spawnTime).toLocaleTimeString() : '-';
        const actionTime = ac.actionTime ? new Date(ac.actionTime).toLocaleTimeString() : '-';

        doc.text(spawnTime, 50, y);
        doc.text(ac.callsign, 150, y);
        doc.text(ac.type, 210, y);
        doc.text(ac.state, 290, y);
        doc.text(actionTime, 370, y);
        doc.text(Math.round(ac.altitude || 0).toString(), 450, y);
        doc.text(Math.round(ac.speed || 0).toString(), 510, y);
        doc.text(ac.targetRunway || '-', 560, y);
        y += 20;
    });

    doc.end();
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;

// Initialize the Game Server
const game = new GameServer(io);

// Start the simulation loop
game.start();

// Middleware for Socket Authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token === 'GUEST' || TOKENS.has(token)) {
        next();
    } else {
        next(new Error("Unauthorized"));
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial state
    socket.emit('gameState', game.getState());

    // Handle Client Events
    socket.on('command', (data) => {
        game.handleCommand(data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`ATC Server running on port ${PORT}`);
});
