import { Server } from 'socket.io';
import { injectable, injectFromBase } from 'inversify';
import ExpressiveTeaEngine from '@classes/Engine';
import { Metadata } from '@expressive-tea/commons';
import { SOCKET_IO_INSTANCE_KEY, SOCKET_IO_SECURE_INSTANCE_KEY } from '@engines/constants/constants';

@injectable()
@injectFromBase({ extendConstructorArguments: true })
export default class SocketIOEngine extends ExpressiveTeaEngine {
  private io!: Server;
  private ioSecure!: Server;

  init(): void {
    const commonConfig = {
      path: '/exp-tea/',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transports: ['websocket', 'polling'] as any[]
    };

    this.io = this.server && new Server(this.server, { ...commonConfig });
    this.ioSecure = this.serverSecure && new Server(this.serverSecure, { ...commonConfig });

    Metadata.set(SOCKET_IO_INSTANCE_KEY, this.io, this.context);
    Metadata.set(SOCKET_IO_SECURE_INSTANCE_KEY, this.ioSecure, this.context);
  }

  static canRegister(): boolean {
    return true;
  }
};
