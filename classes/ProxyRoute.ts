import * as proxy from 'express-http-proxy';
import LoadBalancer from './LoadBalancer';
import {indexOf, includes, size } from 'lodash';
import { RequestHandler } from 'express';

export default class ProxyRoute {
  readonly registeredOn: string;
  private balancer: LoadBalancer;
  private servers: any[] = [];
  private clients: string[] = [];
  private lastServerSelected: number = 0;

  constructor(registeredOn: string) {
    this.registeredOn = registeredOn;
  }

  hasClients() {
    return size(this.clients) > 0;
  }

  isClientOnRoute(teacupId: string): boolean {
    return includes(this.clients, teacupId);
  }

  registerServer(address: string, teacupId: string): void {
    this.servers.push({ teacupId, address });
    this.clients.push(teacupId);
    this.balancer = new LoadBalancer(this.servers.length, this.lastServerSelected);
  }

  unregisterServer(teacupId: string): void {
    const index: number = indexOf(this.clients, teacupId);
    this.servers.splice(index, 1);
    this.clients.splice(index, 1);

    this.balancer = new LoadBalancer(this.servers.length);
  }

  registerRoute(): RequestHandler {
    return proxy(() =>{
      this.lastServerSelected = this.balancer.pick();
      const server = this.servers[this.lastServerSelected];
      return server.address;
    }, {
      memoizeHost: false
    })
  }
}
