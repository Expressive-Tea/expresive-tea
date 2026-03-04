import WebsocketService from '@services/WebsocketService';
import * as WebSocket from 'ws';
import { injectable, injectFromBase } from 'inversify';
import ExpressiveTeaEngine from '@classes/Engine';
import Boot from '@classes/Boot';
import Settings from '@classes/Settings';

@injectable()
@injectFromBase({ extendConstructorArguments: true })
export default class WebsocketEngine extends ExpressiveTeaEngine {
  canStart: boolean = false;
  isDetached: boolean = false;

  async init(): Promise<void> {
    this.canStart = Boolean(this.settings.get('startWebsocket'));

    this.isDetached = Boolean(this.settings.get('detachWebsocket'));
    if (this.canStart) {
      WebsocketService.init();
      WebsocketService.getInstance().setWebSocket(
        new WebSocket.Server(this.isDetached ? { noServer: true } : { server: this.server })
      );

      if (this.serverSecure) {
        WebsocketService.getInstance().setSecureWebsocket(
          new WebSocket.Server(this.isDetached ? { noServer: true } : { server: this.serverSecure })
        );
      }

      WebsocketService.getInstance().setHttpServer(this.server);
      WebsocketService.getInstance().setHttpServer(this.serverSecure);
    }
  }

  /**
   * Graceful shutdown for WebsocketEngine.
   *
   * Closes all WebSocket servers and clears the singleton service to prevent
   * resource leaks and dangling connections during application shutdown.
   *
   * @returns {Promise<void>} Promise that resolves when all WebSocket servers are closed
   * @since 2.0.0
   */
  async stop(): Promise<void> {
    if (!this.canStart) {
      return;
    }

    const wsService = WebsocketService.getInstance();

    // Close the primary WebSocket server
    const ws = wsService.getWebsocket(this.server);
    if (ws) {
      await new Promise<void>((resolve) => {
        ws.close(() => resolve());
      });
    }

    // Close the secure WebSocket server if present
    if (this.serverSecure) {
      const wss = wsService.getWebsocket(this.serverSecure);
      if (wss) {
        await new Promise<void>((resolve) => {
          wss.close(() => resolve());
        });
      }
    }

    // Clear the singleton service to prevent stale references
    WebsocketService.clear();
  }

  static canRegister(ctx?: Boot, settings?: Settings): boolean {
    return Boolean(settings?.get('startWebsocket'));
  }
}
