import * as chalk from 'chalk';
import { Server, Socket } from 'socket.io';
import { injectable } from 'inversify';
import { ExpressiveTeaPotSettings } from '@expressive-tea/commons/interfaces';
import Metadata from '@expressive-tea/commons/classes/Metadata';
import { ASSIGN_TEAPOT_KEY } from '@expressive-tea/commons/constants';
import ProxyRoute from '../../classes/ProxyRoute';
import ExpressiveTeaEngine from '../../classes/Engine';
import TeaGatewayHelper, { EncryptedMessage } from '../../helpers/teapot-helper';
import { SOCKET_IO_INSTANCE_KEY } from '../constants/constants';

interface ClientMetadata {
  publicKey: Buffer;
  signature: Buffer;
}

@injectable()
export default class TeapotEngine extends ExpressiveTeaEngine {

  private clients: Map<string | symbol, any> = new Map<string | symbol, ClientMetadata>();
  private registeredRoute: Map<string, ProxyRoute> = new Map<string, ProxyRoute>();
  private teapotSettings: ExpressiveTeaPotSettings;
  private publicKey: any;
  private privateKey: any;
  private serverSignature: Buffer;
  private socketServer: Server;

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

    teacup.emit('handshake', Buffer.from(this.publicKey), this.serverSignature, Boolean(this.serverSecure), this.clientVerification.bind(this, teacup));
    teacup.on('disconnect', this.disconnected.bind(this, teacup));
  }

  private clientVerification(teacup: Socket, userPublicKey: Buffer, userSignature: Buffer) {
    console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${teacup.id}}]: {yellow.bold Client Verification Started}`);
    console.log('userKey', userPublicKey.toString('base64'));
    console.log('userSignature', userSignature.toString('base64'));
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
      console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP} [{magenta.bold ${teacup.id}}]: Failed wiht next message: ${e.message}`);
      teacup.disconnect();
    }
  }

  private registered(teacup: Socket, encryptedMessage: EncryptedMessage) {
    try {
      const message = TeaGatewayHelper.decrypt(encryptedMessage, this.serverSignature.slice(0, 32));
      const isRegistered = this.registeredRoute.has(message.mountTo);
      const proxyRoute: ProxyRoute = isRegistered ? this.registeredRoute.get(message.mountTo) : new ProxyRoute(message.mountTo);
      proxyRoute.registerServer(message.address, teacup.id);

      if (!isRegistered) {
        this.registeredRoute.set(message.mountTo, proxyRoute);
        this.context.getApplication().use(message.mountTo, TeaGatewayHelper.proxyResponse.bind(this, proxyRoute));
      }

      console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${teacup.id}}] {blue.bold <${message.address}>} <--> {white.bold ${message.mountTo}}`);
    } catch (e) {
      console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP}  {magenta.bold ${teacup.id}}: Failed wiht next message: ${e.message}`);
    }
  }

  private removeFromRoutes(routes: string[] = [], id: string) {
    routes.forEach(route => {
      const proxyRoute: ProxyRoute = this.registeredRoute.get(route);
      proxyRoute.unregisterServer(id);
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
      console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP}  {magenta.bold ${teacup.id}}: Failed wiht next message: ${e.message}`);
    }
  }

  async init(): Promise<void> {
    this.teapotSettings = Metadata.get(ASSIGN_TEAPOT_KEY, this.context);

    const { publicKey, privateKey } = TeaGatewayHelper.generateKeys(this.teapotSettings.serverKey);
    this.publicKey = publicKey;
    this.privateKey = privateKey;

    this.serverSignature = TeaGatewayHelper.sign(this.teapotSettings.clientKey, privateKey, this.teapotSettings.serverKey);
  }

  async start(): Promise<void> {
    this.socketServer = Metadata.get(SOCKET_IO_INSTANCE_KEY, this.context).of('/teapot');
    TeapotEngine.header(this.teapotSettings);
    this.socketServer.on('connection', this.registerTeacup.bind(this));
  }

}
