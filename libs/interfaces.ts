import { Express, Router } from 'express';
import { Server } from 'http';

export interface IDynamicObject {
  [key: string]: any;
}

export interface ExpressiveTeaApplication {
  application: Express;
  server: Server;
}

export interface ExpressiveTeaServerProps {
  port?: number;
  [key: string]: any;
}

export interface ExpressiveTeaModuleProps {
  controllers: any[];
  providers: any[];
  mountpoint: string;
}
