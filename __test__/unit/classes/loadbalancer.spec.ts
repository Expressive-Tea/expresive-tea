import { inRange } from 'lodash';
import LoadBalancer from '../../../classes/LoadBalancer';

describe('Load Balancer', () => {

  test('should create load balancer instance', () => {
    const loadBalancer = new LoadBalancer(2);

    expect(loadBalancer.pick()).toEqual(0);
    expect(loadBalancer.pick()).toEqual(1);
  });

  test('should resolve when bins is new', () => {
    const loadBalancer = new LoadBalancer(4,  Number.MAX_SAFE_INTEGER);

    expect(inRange(loadBalancer.pick(), 0, 4)).toBeTruthy();
    expect(inRange(loadBalancer.pick(), 0, 4)).toBeTruthy();
    expect(inRange(loadBalancer.pick(), 0, 4)).toBeTruthy();
    expect(inRange(loadBalancer.pick(), 0, 4)).toBeTruthy();
  });
});
