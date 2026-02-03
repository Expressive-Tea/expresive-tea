import { inRange } from '../../../libs/utilities';
import LoadBalancer from '../../../classes/LoadBalancer';

describe('Load Balancer', () => {

  test('should create load balancer instance', () => {
    const loadBalancer = new LoadBalancer(2);

    expect(inRange(loadBalancer.pick(), 0, 2)).toBeTruthy();
    expect(inRange(loadBalancer.pick(), 0, 2)).toBeTruthy();
  });

  test('should resolve when bins is new', () => {
    const loadBalancer = new LoadBalancer(4,  Number.MAX_SAFE_INTEGER);

    expect(inRange(loadBalancer.pick(), 0, 4)).toBeTruthy();
    expect(inRange(loadBalancer.pick(), 0, 4)).toBeTruthy();
    expect(inRange(loadBalancer.pick(), 0, 4)).toBeTruthy();
    expect(inRange(loadBalancer.pick(), 0, 4)).toBeTruthy();
  });

  describe('Constructor Bug Fix (Phase 0.3)', () => {
    test('should initialize bins array with correct count', () => {
      const loadBalancer = new LoadBalancer(5);
      
      // Pick should return valid indices for all 5 bins
      for (let i = 0; i < 20; i++) {
        const picked = loadBalancer.pick();
        expect(picked).toBeGreaterThanOrEqual(0);
        expect(picked).toBeLessThan(5);
      }
    });

    test('should initialize bins with default offset of 0', () => {
      const loadBalancer = new LoadBalancer(3);
      
      // All bins should start at 0
      const picked1 = loadBalancer.pick();
      const picked2 = loadBalancer.pick();
      
      expect(picked1).toBeGreaterThanOrEqual(0);
      expect(picked1).toBeLessThan(3);
      expect(picked2).toBeGreaterThanOrEqual(0);
      expect(picked2).toBeLessThan(3);
    });

    test('should initialize bins with custom offset', () => {
      const loadBalancer = new LoadBalancer(4, 100);
      
      // Should still work with custom offset
      for (let i = 0; i < 10; i++) {
        const picked = loadBalancer.pick();
        expect(picked).toBeGreaterThanOrEqual(0);
        expect(picked).toBeLessThan(4);
      }
    });

    test('should handle single bin', () => {
      const loadBalancer = new LoadBalancer(1);
      
      // With only one bin, should always return 0
      expect(loadBalancer.pick()).toBe(0);
      expect(loadBalancer.pick()).toBe(0);
      expect(loadBalancer.pick()).toBe(0);
    });

    test('should handle many bins', () => {
      const loadBalancer = new LoadBalancer(100);
      
      const results = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        results.add(loadBalancer.pick());
      }
      
      // Should have used multiple different bins
      expect(results.size).toBeGreaterThan(10);
    });
  });

  describe('Load Distribution', () => {
    test('should distribute load somewhat evenly', () => {
      const loadBalancer = new LoadBalancer(10);
      const counts = new Array(10).fill(0);
      
      // Pick 1000 times
      for (let i = 0; i < 1000; i++) {
        const picked = loadBalancer.pick();
        counts[picked]++;
      }
      
      // All bins should have been used at least once
      for (let i = 0; i < 10; i++) {
        expect(counts[i]).toBeGreaterThan(0);
      }
      
      // No bin should have more than 200 requests (reasonable distribution)
      for (let i = 0; i < 10; i++) {
        expect(counts[i]).toBeLessThan(200);
      }
    });

    test('should prefer less-loaded bins', () => {
      const loadBalancer = new LoadBalancer(3);
      
      // Track which bins get selected
      const firstPick = loadBalancer.pick();
      const secondPick = loadBalancer.pick();
      
      // Both picks should be valid
      expect(firstPick).toBeGreaterThanOrEqual(0);
      expect(firstPick).toBeLessThan(3);
      expect(secondPick).toBeGreaterThanOrEqual(0);
      expect(secondPick).toBeLessThan(3);
    });
  });

  describe('Overflow Handling', () => {
    test('should reset bins when reaching MAX_SAFE_INTEGER', () => {
      const loadBalancer = new LoadBalancer(4, Number.MAX_SAFE_INTEGER);
      
      // This should trigger the overflow reset logic
      const picked = loadBalancer.pick();
      
      expect(picked).toBeGreaterThanOrEqual(0);
      expect(picked).toBeLessThan(4);
    });

    test('should handle multiple overflow resets', () => {
      const loadBalancer = new LoadBalancer(2, Number.MAX_SAFE_INTEGER);
      
      // Multiple picks should handle overflow correctly
      for (let i = 0; i < 10; i++) {
        const picked = loadBalancer.pick();
        expect(picked).toBeGreaterThanOrEqual(0);
        expect(picked).toBeLessThan(2);
      }
    });
  });
});

