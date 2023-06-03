import { Server } from 'socket.io';
import ExpressiveTeaEngine from '../../classes/Engine';

export default class SocketIOEngine extends ExpressiveTeaEngine {
  private io: Server;
  private ioSecure: Server;
  async init(): Promise<void> {
    const commonConfig = {
      path: '/exp-tea/',
      transports: ['websocket', 'polling'] as any[]
    };
    this.io = this.server && new Server(this.server, {...commonConfig});
    this.ioSecure = this.serverSecure &&  new Server(this.serverSecure, {...commonConfig});
  }
}
