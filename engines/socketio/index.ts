import { Server } from 'socket.io';
import ExpressiveTeaEngine from '../../classes/Engine';
import MetaData from '@expressive-tea/commons/classes/Metadata';
import { SOCKET_IO_INSTANCE_KEY, SOCKET_IO_SECURE_INSTANCE_KEY } from '../constants/constants';

export default class SocketIOEngine extends ExpressiveTeaEngine {
  private io: Server;
  private ioSecure: Server;

  async init(): Promise<void> {
    const commonConfig = {
      path: '/exp-tea/',
      transports: ['websocket', 'polling'] as any[]
    };

    this.io = this.server && new Server(this.server, { ...commonConfig });
    this.ioSecure = this.serverSecure && new Server(this.serverSecure, { ...commonConfig });

    MetaData.set(SOCKET_IO_INSTANCE_KEY, this.io, this.context);
    MetaData.set(SOCKET_IO_SECURE_INSTANCE_KEY, this.ioSecure, this.context);
  }
};
