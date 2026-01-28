import * as chalk from 'chalk';
 
import { Server, Socket } from 'socket.io';
 
import { injectable, injectFromBase } from 'inversify';
 
import { ExpressiveTeaPotSettings } from '@expressive-tea/commons/interfaces';
 
import Metadata from '@expressive-tea/commons/classes/Metadata';
 
import { ASSIGN_TEAPOT_KEY } from '@expressive-tea/commons/constants';
 
import ProxyRoute from '../../classes/ProxyRoute';
 
import ExpressiveTeaEngine from '../../classes/Engine';
 
import TeaGatewayHelper, { EncryptedMessage, TeaGatewayMessage } from '../../helpers/teapot-helper';
 
import { SOCKET_IO_INSTANCE_KEY } from '../constants/constants';
 
import Boot from '../../classes/Boot';
 
import { getClass } from '@expressive-tea/commons/helpers/object-helper';
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
  private socketServer!: Server;

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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
    this.teapotSettings = Metadata.get(ASSIGN_TEAPOT_KEY, this.context);

    const { publicKey, privateKey } = TeaGatewayHelper.generateKeys(this.teapotSettings.serverKey);
    this.publicKey = publicKey;
    this.privateKey = privateKey;

    this.serverSignature = TeaGatewayHelper.sign(this.teapotSettings.clientKey, privateKey as string, this.teapotSettings.serverKey);
  }

  async start(): Promise<void> {
    this.socketServer = Metadata.get(SOCKET_IO_INSTANCE_KEY, this.context).of('/teapot');
    TeapotEngine.header(this.teapotSettings);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.socketServer.on('connection', this.registerTeacup.bind(this));
  }

  static canRegister(ctx?: Boot): boolean {
    return Metadata.get(ASSIGN_TEAPOT_KEY, getClass(ctx), 'isTeapotActive');
  }
}
