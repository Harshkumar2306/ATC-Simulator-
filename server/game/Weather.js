const { v4: uuidv4 } = require('uuid');

class StormCell {
    constructor(x, y, radius, intensity, dx, dy) {
        this.id = uuidv4();
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.intensity = intensity; // 1: Light (Green), 2: Heavy (Yellow), 3: Severe (Red)
        this.dx = dx; // Velocity X
        this.dy = dy; // Velocity Y
        this.lifeTime = Math.random() * 300 + 300; // Lives for 5 to 10 minutes (seconds)
    }

    update(dt) {
        this.x += this.dx * dt;
        this.y += this.dy * dt;
        this.lifeTime -= dt;
    }

    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            radius: this.radius,
            intensity: this.intensity
        };
    }
}

class WeatherSystem {
    constructor() {
        this.windHeading = Math.floor(Math.random() * 360);
        this.windSpeed = Math.floor(Math.random() * 20) + 5; // 5 to 25 knots
        
        this.stormCells = [];
        this.nextWindUpdate = 60; // Update wind every 60 seconds
    }

    update(dt) {
        this.nextWindUpdate -= dt;
        if (this.nextWindUpdate <= 0) {
            // Slowly shift wind
            this.windHeading += (Math.random() - 0.5) * 10;
            if (this.windHeading >= 360) this.windHeading -= 360;
            if (this.windHeading < 0) this.windHeading += 360;
            
            this.windSpeed += (Math.random() - 0.5) * 4;
            if (this.windSpeed < 0) this.windSpeed = 0;
            if (this.windSpeed > 40) this.windSpeed = 40; // Max 40 knots
            
            this.nextWindUpdate = 60;
        }

        // Randomly spawn storm cells
        if (Math.random() < 0.001 * dt && this.stormCells.length < 3) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100; // Spawn on edge of radar
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            // Storm moves somewhat with the wind
            const windRad = this.windHeading * (Math.PI / 180);
            const dx = Math.cos(windRad) * (this.windSpeed / 10) + (Math.random() - 0.5);
            const dy = Math.sin(windRad) * (this.windSpeed / 10) + (Math.random() - 0.5);
            
            const radius = Math.random() * 15 + 10;
            const intensity = Math.floor(Math.random() * 3) + 1;
            
            this.stormCells.push(new StormCell(x, y, radius, intensity, dx, dy));
        }

        // Update storms and remove dead ones
        for (let i = this.stormCells.length - 1; i >= 0; i--) {
            this.stormCells[i].update(dt);
            if (this.stormCells[i].lifeTime <= 0) {
                this.stormCells.splice(i, 1);
            }
        }
    }

    getWindVector() {
        const rad = this.windHeading * (Math.PI / 180);
        return {
            x: Math.cos(rad) * (this.windSpeed / 100), // Scaled down for game units
            y: Math.sin(rad) * (this.windSpeed / 100)
        };
    }

    toJSON() {
        return {
            windHeading: Math.floor(this.windHeading),
            windSpeed: Math.floor(this.windSpeed),
            storms: this.stormCells.map(s => s.toJSON())
        };
    }
}

module.exports = WeatherSystem;
