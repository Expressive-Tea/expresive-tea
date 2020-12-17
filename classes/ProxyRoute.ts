import * as proxy from 'express-http-proxy';
import { P2cBalancer } from 'load-balancers';

export default class ProxyRoute {
  readonly registeredOn: string;
  private balancer: P2cBalancer;
  private servers: any[] = [];
  private lastServerSelected: number = 0;

  constructor(registeredOn: string) {
    this.registeredOn = registeredOn;
  }

  registerServer(address: string, teacupId: string) {
    this.servers.push({ teacupId, address });
    this.balancer = new P2cBalancer(this.servers.length, this.lastServerSelected);
  }

  registerRoute() {
    return proxy(() =>{
      this.lastServerSelected = this.balancer.pick();
      const server = this.servers[this.lastServerSelected];
      return server.address;
    }, {memoizeHost: false})
  }
}
