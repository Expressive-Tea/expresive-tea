import * as chalk from 'chalk';
 
import { Namespace, Socket } from 'socket.io';
 
import { injectable, injectFromBase } from 'inversify';
 
import { ExpressiveTeaPotSettings } from '@expressive-tea/commons';
 
import { Metadata } from '@expressive-tea/commons';
 
import { ASSIGN_TEAPOT_KEY } from '@expressive-tea/commons';
 
import ProxyRoute from '@classes/ProxyRoute';
 
import ExpressiveTeaEngine from '@classes/Engine';
 
import TeaGatewayHelper, { EncryptedMessage, TeaGatewayMessage } from '@helpers/teapot-helper';
 
import { SOCKET_IO_INSTANCE_KEY } from '@engines/constants/constants';
 
import Boot from '@classes/Boot';
 
import { getClass } from '@expressive-tea/commons';
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

interface ClientMetadata {
  publicKey: Buffer;
  signature: Buffer;
}

@injectable()
@injectFromBase({ extendConstructorArguments: true })
export default class TeapotEngine extends ExpressiveTeaEngine {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly clients: Map<string | symbol, any> = new Map<string | symbol, ClientMetadata>();
  private readonly registeredRoute: Map<string, ProxyRoute> = new Map<string, ProxyRoute>();
  private teapotSettings!: ExpressiveTeaPotSettings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private publicKey: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private privateKey: any;
  private serverSignature!: Buffer;
  private socketServer!: Namespace;
  private isStopped: boolean = false;

  private static header(teapotSettings: ExpressiveTeaPotSettings) {
    console.log(chalk.white.bold('Teapot Engine is initializing...'));
    console.log(chalk`
             {white.bold ;,'}
     {green _o_}    {white.bold ;:;'}
 {blue.bold ,-.}{green '---\`}{blue.bold .__} {white.bold ; }
{blue.bold ((j\`=====',-'}
 {blue.bold \`-\\     /}
    {blue.bold \`-=-'}

{white Please assign the next} {white.bold Client Key:} {magenta.bold ${teapotSettings.clientKey}} {white to all your}
{yellow.bold Teacups} {white and do not share the key with anyone}

{yellow.bold NOTICE:}
All Communication are encrypted to ensure intruder can not connected, however, please does not share any sensitive data like keys or passwords to avoid security issues.
  `);


  }

  private registerTeacup(teacup: Socket) {
    console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${teacup.id}}]: {grey.bold Connected}`);

    teacup.emit('handshake', Buffer.from(this.publicKey as string), this.serverSignature, Boolean(this.serverSecure), this.clientVerification.bind(this, teacup));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    teacup.on('disconnect', this.disconnected.bind(this, teacup));
  }

  private clientVerification(teacup: Socket, userPublicKey: Buffer, userSignature: Buffer) {
    console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${teacup.id}}]: {yellow.bold Client Verification Started}`);
    try {
      if (!TeaGatewayHelper.verify(this.teapotSettings.clientKey, userPublicKey.toString('ascii'), userSignature)) {
        console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP} [{magenta.bold ${teacup.id}}]: Failed to verify and will be disconnected...`);
        return teacup.disconnect();
      }

      this.clients.set(teacup.id, {
        publicKey: userPublicKey,
        signature: userSignature
      });

      teacup.emit('accepted', this.registered.bind(this, teacup));

      console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${teacup.id}}]: {green.bold Client Verified}`);

    } catch (e) {
      const error = e as Error;
      console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP} [{magenta.bold ${teacup.id}}]: Failed wiht next message: ${error.message}`);
      teacup.disconnect();
    }
  }

  private registered(teacup: Socket, encryptedMessage: EncryptedMessage) {
    try {
      const message: TeaGatewayMessage = TeaGatewayHelper.decrypt(encryptedMessage, this.serverSignature);

      const isRegistered = this.registeredRoute.has(message.mountTo as string);
      const proxyRoute: ProxyRoute | undefined = isRegistered ? this.registeredRoute.get(message.mountTo as string) : new ProxyRoute(message.mountTo as string);
      
      if (!proxyRoute) {
        throw new Error('Failed to create or retrieve proxy route');
      }
      
      proxyRoute.registerServer(message.address as string, teacup.id);

      if (!isRegistered) {
        this.registeredRoute.set(message.mountTo as string, proxyRoute);
         
        this.context.getApplication().use(message.mountTo as string, TeaGatewayHelper.proxyResponse.bind(this, proxyRoute));
      }

      console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${teacup.id}}] {blue.bold <${message.address}>} <--> {white.bold ${message.mountTo}}`);
    } catch (e) {
      const error = e as Error;
      console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP}  {magenta.bold ${teacup.id}}: Failed wiht next message: ${error.message}`);
    }
  }

  private removeFromRoutes(routes: string[] = [], id: string) {
    routes.forEach(route => {
      const proxyRoute = this.registeredRoute.get(route);
      if (proxyRoute) {
        proxyRoute.unregisterServer(id);
      }
    });
  }

  private findClientInRoutes(teacupId: string): string[] {
    const routes: string[] = [];

    this.registeredRoute.forEach((proxyRoute, route) => {
      if (proxyRoute.isClientOnRoute(teacupId)) {
        routes.push(route);
      }
    });
    return routes;
  }

  private disconnected(teacup: Socket, reason: string) {
    try {
      const routes: string[] = this.findClientInRoutes(teacup.id);
      this.removeFromRoutes(routes, teacup.id);
      console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${teacup.id}}]: Got disconnected by ${reason}`);
    } catch (e) {
      const error = e as Error;
      console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP}  {magenta.bold ${teacup.id}}: Failed wiht next message: ${error.message}`);
    }
  }

  async init(): Promise<void> {
    // Metadata is stored on the class by decorators, not on instances
    this.teapotSettings = Metadata.get(ASSIGN_TEAPOT_KEY, getClass(this.context));

    const { publicKey, privateKey } = TeaGatewayHelper.generateKeys(this.teapotSettings.serverKey);
    this.publicKey = publicKey;
    this.privateKey = privateKey;

    this.serverSignature = TeaGatewayHelper.sign(this.teapotSettings.clientKey, privateKey as string, this.teapotSettings.serverKey);
  }

  async start(): Promise<void> {
    // Socket.IO instance is stored on the Boot instance at runtime (not on the class)
    this.socketServer = Metadata.get(SOCKET_IO_INSTANCE_KEY, this.context).of('/teapot');
    TeapotEngine.header(this.teapotSettings);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.socketServer.on('connection', this.registerTeacup.bind(this));
  }

  /**
   * Graceful shutdown for the Teapot engine.
   *
   * Disconnects all connected Teacup clients, closes the Socket.IO namespace,
   * and clears internal state. This method is idempotent and safe to call multiple times.
   *
   * @returns {Promise<void>} Promise that resolves when cleanup is complete
   * @since 2.0.0
   */
  async stop(): Promise<void> {
    // Idempotent: skip if already stopped or never started
    if (this.isStopped || !this.socketServer) {
      return;
    }

    this.isStopped = true;

    console.log(chalk.cyan.bold('[TEAPOT]') + ' - Initiating graceful shutdown...');

    // Disconnect all connected clients gracefully
    const connectedSockets = await this.socketServer.fetchSockets();
    for (const socket of connectedSockets) {
      const routes = this.findClientInRoutes(socket.id);
      this.removeFromRoutes(routes, socket.id);
      socket.disconnect(true);
      console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${socket.id}}]: {yellow.bold Disconnected for shutdown}`);
    }

    // Remove all listeners from the namespace
    this.socketServer.removeAllListeners();

    // Clear internal state
    this.clients.clear();
    this.registeredRoute.clear();

    console.log(chalk.cyan.bold('[TEAPOT]') + ' - Graceful shutdown complete.');
  }

  static canRegister(ctx?: Boot): boolean {
    return Metadata.get(ASSIGN_TEAPOT_KEY, getClass(ctx), 'isTeapotActive');
  }
}
