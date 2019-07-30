import { Express } from '@expressive-tea/node_modules/@types/express';
import { Server } from 'http';

export interface IDynamicObject {
  [key: string]: any;
}

export interface IServerInstance {
  application: Express;
  server: Server;
}
