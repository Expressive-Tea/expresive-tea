
import { inject, injectable, optional } from 'inversify';
import Settings from '@classes/Settings';
import Boot from '@classes/Boot';
import {Server as HttpServer} from 'node:http';
import {Server as HttpsServer} from 'node:https';
import { TYPES } from '../types/injection-types';

@injectable()
export default class ExpressiveTeaEngine {

  constructor(
    @inject(TYPES.Context) protected readonly  context: Boot,
    @inject(TYPES.Server) protected readonly  server: HttpServer,
    @inject(TYPES.SecureServer) @optional() protected readonly serverSecure: HttpsServer,
    @inject(TYPES.Settings) protected readonly settings: Settings
  ) {}

  /**
   * Execute a lifecycle method across all registered engines
   * 
   * @param {ExpressiveTeaEngine[]} availableEngines - Array of engine instances
   * @param {string} method - Method name to execute (e.g., 'init', 'start', 'stop')
   * @returns {Promise<unknown[]>} Array of results from all engines
   * 
   * @example
   * ```typescript
   * await ExpressiveTeaEngine.exec(engines, 'init');
   * await ExpressiveTeaEngine.exec(engines, 'start');
   * ```
   * @since 1.0.0
   */
  static exec(availableEngines: ExpressiveTeaEngine[], method: string): Promise<unknown[]> {
    return Promise.all(availableEngines
      .filter(engine => typeof (engine as unknown as Record<string, unknown>)[method] === 'function')
      .map(engine => ((engine as unknown as Record<string, () => unknown>)[method])())
    );
  }

  /**
   * Determine if this engine can be registered in the current context
   * 
   * Override this method to conditionally enable/disable the engine based on
   * settings or environment. Default returns false to prevent accidental registration.
   * 
   * @param {Boot} [ctx] - Boot context
   * @param {Settings} [settings] - Application settings
   * @returns {boolean} True if engine can be registered
   * 
   * @example
   * ```typescript
   * static canRegister(ctx?: Boot, settings?: Settings): boolean {
   *   return settings?.get('enableMyEngine') === true;
   * }
   * ```
   * @since 1.0.0
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static canRegister(ctx?: Boot, settings?: Settings): boolean {
    return false;
  }

  /**
   * Graceful shutdown lifecycle method
   * 
   * Override this method to implement cleanup logic when the application stops.
   * This is called during graceful shutdown to close connections, clean up resources, etc.
   * 
   * @returns {Promise<void>} Promise that resolves when cleanup is complete
   * 
   * @example
   * ```typescript
   * async stop(): Promise<void> {
   *   await this.closeConnections();
   *   await this.cleanup();
   * }
   * ```
   * @since 2.0.0
   */
  async stop(): Promise<void> {
    // Default implementation does nothing
    // Engines can override to implement cleanup
  }
}

