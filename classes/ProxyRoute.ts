import * as proxy from 'express-http-proxy';
import LoadBalancer from './LoadBalancer';
import { indexOf, includes, size } from '../libs/utilities';
import { type RequestHandler } from 'express';

interface ServerEntry {
  teacupId: string;
  address: string;
}

export default class ProxyRoute {
  private balancer!: LoadBalancer;
  private readonly servers: ServerEntry[] = [];
  private readonly clients: string[] = [];
  private lastServerSelected: number = 0;

   
  constructor(public readonly registeredOn: string) {}

  hasClients(): boolean {
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
    }) as unknown as RequestHandler;
  }
}
