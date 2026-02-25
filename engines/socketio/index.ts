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

  async init(): Promise<void> {
    const commonConfig = {
      path: '/exp-tea/',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transports: ['websocket', 'polling'] as any[]
    };

    this.io = this.server ? new Server(this.server, { ...commonConfig }) : (undefined as any);
    this.ioSecure = this.serverSecure ? new Server(this.serverSecure, { ...commonConfig }) : (undefined as any);

    Metadata.set(SOCKET_IO_INSTANCE_KEY, this.io, this.context);
    Metadata.set(SOCKET_IO_SECURE_INSTANCE_KEY, this.ioSecure, this.context);
  }

  /**
   * Graceful shutdown for SocketIOEngine.
   *
   * Closes all Socket.IO server instances and clears metadata references
   * to prevent memory leaks and lingering client connections.
   *
   * @returns {Promise<void>} Promise that resolves when all Socket.IO servers are closed
   * @since 2.0.0
   */
  async stop(): Promise<void> {
    // Close primary Socket.IO server
    if (this.io) {
      await new Promise<void>((resolve) => {
        this.io.close(() => resolve());
      });
    }

    // Close secure Socket.IO server if present
    if (this.ioSecure) {
      await new Promise<void>((resolve) => {
        this.ioSecure.close(() => resolve());
      });
    }

    // Clear metadata references to allow garbage collection
    Metadata.set(SOCKET_IO_INSTANCE_KEY, null, this.context);
    Metadata.set(SOCKET_IO_SECURE_INSTANCE_KEY, null, this.context);
  }

  static canRegister(): boolean {
    return true;
  }
}
