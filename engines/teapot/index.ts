import * as chalk from 'chalk';
import Settings from '../../classes/Settings';
import { inject, injectable } from 'inversify';
import * as http from 'http';
import * as https from 'https';
import Boot from '../../classes/Boot';
import ProxyRoute from '../../classes/ProxyRoute';
import { ExpressiveTeaPotSettings } from '../../libs/interfaces';
import Metadata from '../../classes/MetaData';
import { ASSIGN_TEAPOT_KEY } from '../../libs/constants';
import TeaGatewayHelper from '../../helpers/teapot-helper';
import { Server, Socket } from 'socket.io';

@injectable()
export default class TeapotEngine {

  private readonly settings: Settings;
  private readonly context: Boot;
  private readonly server: http.Server;
  private readonly serverSecure?: https.Server;

  private clients: Map<string | symbol, any> = new Map<string | symbol, any>();
  private registeredRoute: Map<string, ProxyRoute> = new Map<string, ProxyRoute>();
  private teapotSettings: ExpressiveTeaPotSettings;
  private publicKey: any;
  private privateKey: any;
  private isActive: boolean;
  private serverSignature: Buffer;
  private socketServer: Server;

  private static header(teapotSettings: ExpressiveTeaPotSettings) {
    console.log(chalk.white.bold('Teapot Engine is initializing...'))
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

    teacup.emit('handshake', {
      key: Buffer.from(this.publicKey).toString('base64'),
      signature: this.serverSignature.toString('base64')
    });

    teacup.on('handshake', this.acceptedHandshake.bind(teacup, this));
    teacup.on('register', this.registered.bind(teacup, this));
    teacup.on('disconnect', this.disconnected.bind(teacup, this));
  }

  private acceptedHandshake(ctx: TeapotEngine, data: any) {
    const self: Socket = this as unknown as Socket;
    try {
      console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${self.id}}]: {yellow.bold Start Verification}`);
      const clientPublicKey = Buffer.from(data.key, 'base64').toString('ascii');
      const clientSignature = Buffer.from(data.signature, 'base64');

      if (TeaGatewayHelper.verify(ctx.teapotSettings.clientKey, clientPublicKey, clientSignature)) {
        console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${self.id}}]: {green.bold Verified correctly}`);
        ctx.clients.set(self.id, {
          publicKey: clientPublicKey,
          signature: clientSignature
        });

        self.emit('accepted', TeaGatewayHelper.encrypt({
          signature: ctx.serverSignature.toString('base64')
        }, clientSignature.slice(0,32)));
        return;
      }
      console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP} [{magenta.bold ${self.id}}]: Failed to verify and will be disconnected...`);
      self.disconnect();
    } catch (e) {
      console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP} [{magenta.bold ${self.id}}]: Failed wiht next message: ${e.message}`);
      self.disconnect();
    }
  }

  private registered(ctx: TeapotEngine, data: any) {
    const self: Socket = this as unknown as Socket;
    try {
      const message = TeaGatewayHelper.decrypt(data, ctx.serverSignature.slice(0,32));
      console.log('Registered, ', message);
      let proxyRoute: ProxyRoute;

      if (ctx.registeredRoute.has(message.mountTo)) {
        proxyRoute = ctx.registeredRoute.get(message.mountTo);
        proxyRoute.registerServer(message.address, self.id);
      } else {
        proxyRoute = new ProxyRoute(message.mountTo);
        proxyRoute.registerServer(message.address, self.id);
        ctx.registeredRoute.set(message.mountTo, proxyRoute);
        ctx.context.getApplication().use(message.mountTo, (req, res, next) => {
          const router = proxyRoute.registerRoute();
          console.log(proxyRoute.hasClients());
          if (!proxyRoute.hasClients()) {
            return next();
          }

          return router(req, res, next);
        });
      }

      console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${self.id}}] {blue.bold <${message.address}>} <--> {white.bold ${message.mountTo}}`);
    } catch (e) {
      console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP}  {magenta.bold ${self.id}}: Failed wiht next message: ${e.message}`);
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
      console.log(`map.get('${route}') = ${proxyRoute}`);
      if (proxyRoute.isClientOnRoute(teacupId)) {
        routes.push(route);
      }
    })
    return routes;
  }

  private disconnected(ctx: TeapotEngine, reason: string) {
    const self: Socket = this as unknown as Socket;
    try {
      const routes: string[] = ctx.findClientInRoutes(self.id);
      ctx.removeFromRoutes(routes, self.id);
      console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${self.id}}]: Got disconnected by ${reason}`);
    } catch (e) {
      console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP}  {magenta.bold ${self.id}}: Failed wiht next message: ${e.message}`);
    }
  }

  constructor(
    @inject('context') ctx,
    @inject('server') server,
    @inject( 'secureServer') serverSecure,
    @inject( 'settings') settings
  ) {
    this.settings = settings;
    this.context = ctx;
    this.server = server;
    this.serverSecure = serverSecure;
    this.isActive = Metadata.get(ASSIGN_TEAPOT_KEY, this.context, 'isTeapotActive');
    this.teapotSettings = Metadata.get(ASSIGN_TEAPOT_KEY, this.context);

    if (!this.isActive) {
      return;
    }

    const { publicKey, privateKey } = TeaGatewayHelper.generateKeys(this.teapotSettings.serverKey);

    this.publicKey = publicKey;
    this.privateKey = privateKey;

    this.serverSignature = TeaGatewayHelper.sign(this.teapotSettings.clientKey, privateKey, this.teapotSettings.serverKey);
    this.socketServer = new Server({
      path: '/teapot',
      wsEngine: 'eiows',
      cookie: false
    });
  }


  async start(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    TeapotEngine.header(this.teapotSettings);

    this.socketServer.on('connection', this.registerTeacup.bind(this));

    this.socketServer.listen(this.server);
  }

}
