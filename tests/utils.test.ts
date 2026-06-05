import { describe, it, expect } from 'vitest';
import { calculateDays } from '../lib/utils';

describe('calculateDays', () => {
    it('should return 1 for same day', () => {
        const days = calculateDays('2023-01-01', '2023-01-01');
        expect(days).toBe(1);
    });

    it('should calculate difference correctly', () => {
        const days = calculateDays('2023-01-01', '2023-01-05');
        expect(days).toBe(5);
    });
});
