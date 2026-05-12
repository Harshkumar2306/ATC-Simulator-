const Runway = require('../Runway');

describe('Runway Unit Tests', () => {
    let runway;

    beforeEach(() => {
        runway = new Runway('09L', 'Left Runway');
    });

    test('should initialize with FREE status', () => {
        expect(runway.id).toBe('09L');
        expect(runway.name).toBe('Left Runway');
        expect(runway.status).toBe('FREE');
        expect(runway.occupiedBy).toBeNull();
    });

    test('should successfully occupy if FREE', () => {
        const success = runway.occupy('AIRCRAFT_123');
        expect(success).toBe(true);
        expect(runway.status).toBe('OCCUPIED');
        expect(runway.occupiedBy).toBe('AIRCRAFT_123');
    });

    test('should fail to occupy if already OCCUPIED', () => {
        runway.occupy('AIRCRAFT_123');
        const success = runway.occupy('AIRCRAFT_456'); // attempt to occupy again
        expect(success).toBe(false);
        expect(runway.status).toBe('OCCUPIED'); // Status should not change
        expect(runway.occupiedBy).toBe('AIRCRAFT_123');
    });

    test('should successfully release an occupied runway', () => {
        runway.occupy('AIRCRAFT_123');
        runway.release();
        expect(runway.status).toBe('FREE');
        expect(runway.occupiedBy).toBeNull();
    });

    test('toJSON should return correct representation', () => {
        runway.occupy('AIRCRAFT_123');
        const json = runway.toJSON();
        expect(json).toEqual({
            id: '09L',
            name: 'Left Runway',
            status: 'OCCUPIED',
            occupiedBy: 'AIRCRAFT_123'
        });
    });
});
