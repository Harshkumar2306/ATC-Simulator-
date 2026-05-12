class Runway {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.status = 'FREE'; // FREE, OCCUPIED, MAINTENANCE
        this.occupiedBy = null;
    }

    occupy(aircraftId) {
        if (this.status !== 'FREE') return false;
        this.status = 'OCCUPIED';
        this.occupiedBy = aircraftId;
        return true;
    }

    release() {
        this.status = 'FREE';
        this.occupiedBy = null;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            occupiedBy: this.occupiedBy
        };
    }
}

module.exports = Runway;
