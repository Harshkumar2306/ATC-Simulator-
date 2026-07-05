const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const GameServer = require('./game/GameServer');

const app = express();
const db = require('./db');
app.use(cors());
app.use(express.json());

// Hardcoded secret for simplicity fallback
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
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
        { id: 'squawk', title: 'Squawk' },
        { id: 'state', title: 'Final Phase' },
        { id: 'actionTime', title: 'Action Time' },
        { id: 'altitude', title: 'Altitude (ft)' },
        { id: 'speed', title: 'Speed (kts)' },
        { id: 'fuel', title: 'Fuel (s)' },
        { id: 'targetRunway', title: 'Runway' }
    ];

    const csvRows = [columns.map(c => c.title).join(',')];

    allFlights.forEach(ac => {
        const values = columns.map(col => {
            let val = ac[col.id];

            // Format Dates
            if (['spawnTime', 'actionTime'].includes(col.id)) {
                if (val) {
                    val = new Date(val).toISOString(); // ISO for better Excel parsing
                } else {
                    val = '-';
                }
            }

            // Format numbers
            if (typeof val === 'number') {
                if (['speed', 'heading', 'altitude', 'fuel'].includes(col.id)) {
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

    // Calculate stats
    const totalFlights = allFlights.length;
    const totalArrivals = allFlights.filter(a => a.type === 'ARRIVAL').length;
    const totalDepartures = allFlights.filter(a => a.type === 'DEPARTURE').length;

    const doc = new PDFDocument({ layout: 'landscape', margin: 50, bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="atc_full_report.pdf"');
    doc.pipe(res);

    // Corporate Header
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#1e293b').text('ATC SIMULATOR COMMAND CENTER', { align: 'center' });
    doc.fontSize(14).fillColor('#64748b').text('OFFICIAL LOG REPORT', { align: 'center' });
    doc.moveDown(0.5);
    
    // Line separator
    doc.moveTo(50, doc.y).lineTo(742, doc.y).strokeColor('#cbd5e1').lineWidth(2).stroke();
    doc.moveDown();

    // Summary Box
    doc.rect(50, doc.y, 692, 40).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#334155').fontSize(11).font('Helvetica-Bold');
    const boxY = doc.y + 14;
    doc.text(`Total Flights: ${totalFlights}`, 70, boxY);
    doc.font('Helvetica').text(`Active: ${active.length}  |  Completed: ${completed.length}`, 220, boxY);
    doc.text(`Arrivals: ${totalArrivals}  |  Departures: ${totalDepartures}`, 420, boxY);
    const dateStr = new Date().toLocaleString();
    doc.text(`Generated: ${dateStr}`, 600, boxY);
    doc.moveDown(3);

    // Table Setup
    let y = doc.y;
    
    // Columns
    const cols = {
        time: 60,
        callsign: 130,
        squawk: 200,
        type: 260,
        state: 340,
        alt: 430,
        spd: 500,
        fuel: 560,
        rwy: 620,
        action: 680
    };

    const drawHeader = (startY) => {
        doc.rect(50, startY, 692, 25).fill('#0f172a');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
        const textY = startY + 8;
        doc.text('Start Time', cols.time, textY);
        doc.text('Flight', cols.callsign, textY);
        doc.text('Squawk', cols.squawk, textY);
        doc.text('Type', cols.type, textY);
        doc.text('Status', cols.state, textY);
        doc.text('Alt (ft)', cols.alt, textY);
        doc.text('Spd (kts)', cols.spd, textY);
        doc.text('Fuel (s)', cols.fuel, textY);
        doc.text('Rwy', cols.rwy, textY);
        doc.text('Action Time', cols.action, textY);
    };

    drawHeader(y);
    y += 25;

    // Table Rows
    doc.font('Helvetica').fontSize(9);
    
    allFlights.forEach((ac, index) => {
        // Page break logic
        if (y > 500) {
            doc.addPage({ layout: 'landscape', margin: 50 });
            y = 50;
            drawHeader(y);
            y += 25;
            doc.font('Helvetica').fontSize(9);
        }

        // Zebra striping
        if (index % 2 === 0) {
            doc.rect(50, y, 692, 20).fill('#f8fafc');
        } else {
            doc.rect(50, y, 692, 20).fill('#ffffff');
        }

        const textY = y + 5;

        const spawnTime = ac.spawnTime ? new Date(ac.spawnTime).toLocaleTimeString() : '-';
        const actionTime = ac.actionTime ? new Date(ac.actionTime).toLocaleTimeString() : '-';

        doc.fillColor('#64748b').font('Helvetica');
        doc.text(spawnTime, cols.time, textY);
        
        // Emphasize emergency
        if (ac.emergency || ac.status === 'CRASHED') {
            doc.fillColor('#dc2626').font('Helvetica-Bold');
        } else {
            doc.fillColor('#0f172a').font('Helvetica-Bold');
        }
        doc.text(ac.callsign, cols.callsign, textY);
        
        doc.fillColor('#64748b').font('Helvetica');
        doc.text(ac.squawk || '-', cols.squawk, textY);
        
        doc.fillColor('#334155');
        doc.text(ac.type, cols.type, textY);
        
        // Color code status
        if (ac.state === 'FINISHED') doc.fillColor('#10b981').font('Helvetica-Bold');
        else doc.fillColor('#0284c7').font('Helvetica-Bold');
        doc.text(ac.status || ac.state, cols.state, textY);
        
        doc.fillColor('#475569').font('Helvetica');
        doc.text(Math.round(ac.altitude || 0).toString(), cols.alt, textY);
        doc.text(Math.round(ac.speed || 0).toString(), cols.spd, textY);
        
        if (ac.fuel < 100) doc.fillColor('#dc2626').font('Helvetica-Bold');
        else doc.fillColor('#475569').font('Helvetica');
        doc.text(Math.round(ac.fuel || 0).toString(), cols.fuel, textY);
        
        doc.fillColor('#334155').font('Helvetica');
        doc.text(ac.targetRunway || '-', cols.rwy, textY);
        
        doc.fillColor('#94a3b8');
        doc.text(actionTime, cols.action, textY);

        y += 20;
    });

    // Add footers with page numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.rect(50, 560, 692, 1).fill('#e2e8f0');
        doc.font('Helvetica').fontSize(8).fillColor('#94a3b8');
        doc.text(`Page ${i + 1} of ${range.count}`, 50, 570, { align: 'center' });
    }

    doc.end();
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

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

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all route to serve the React app
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

server.listen(PORT, () => {
    console.log(`ATC Server running on port ${PORT}`);
});
