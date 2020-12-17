import * as proxy from 'express-http-proxy';
import LoadBalancer from './LoadBalancer';

export default class ProxyRoute {
  readonly registeredOn: string;
  private balancer: LoadBalancer;
  private servers: any[] = [];
  private lastServerSelected: number = 0;

  constructor(registeredOn: string) {
    this.registeredOn = registeredOn;
  }

  registerServer(address: string, teacupId: string) {
    this.servers.push({ teacupId, address });
    this.balancer = new LoadBalancer(this.servers.length, this.lastServerSelected);
  }

  registerRoute() {
    return proxy(() =>{
      this.lastServerSelected = this.balancer.pick();
      const server = this.servers[this.lastServerSelected];
      return server.address;
    }, {memoizeHost: false})
  }
}
