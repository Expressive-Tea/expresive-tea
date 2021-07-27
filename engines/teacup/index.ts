import * as chalk from 'chalk';
import * as url from 'url';
// tslint:disable-next-line:no-duplicate-imports
import { io, Socket } from 'socket.io-client';
import { inject, injectable } from 'inversify';
import Boot from '../../classes/Boot';
import Settings from '../../classes/Settings';
import { ExpressiveTeaCupSettings } from '../../libs/interfaces';
import MetaData from '../../classes/MetaData';
import { ASSIGN_TEACUP_KEY } from '../../libs/constants';
import TeaGatewayHelper from '../../helpers/teapot-helper';
import { getClass } from '../../helpers/object-helper';
import http from 'http';
import https from 'https';

@injectable()
export default class TeacupEngine {

  private readonly settings: Settings;
  private readonly context: Boot;
  private readonly server: http.Server;
  private readonly serverSecure?: https.Server;
  private teacupSettings: ExpressiveTeaCupSettings;
  private isActive: boolean;
  private publicKey: any;
  private privateKey: any;
  private publicServerKey: any;
  private serverSignature: any;
  private clientSignature: Buffer;
  private client: Socket;

  private header() {
    console.log(chalk.white.bold('Teacup Engine is initializing...'))
    console.log(chalk`
   {grey ( (}
    {white.bold ) )}
  {magenta.bold ........}
  {magenta.bold |      |]}
  {magenta.bold \\      /}    {yellow.bold [${this.teacupSettings.address}]}
   {magenta.bold \`----'}

{yellow.bold NOTICE:}
All Communication are encrypted to ensure intruder can not connected, however, please does not share any sensitive data like keys or passwords to avoid security issues.
  `);
  }

  constructor(
    @inject('context') ctx,
    @inject( 'settings') settings,
    @inject('server') server,
    @inject( 'secureServer') serverSecure,
  ) {
    this.server = server;
    this.serverSecure = serverSecure;
    this.settings = settings;
    this.context = ctx;
    this.teacupSettings = MetaData.get(ASSIGN_TEACUP_KEY, getClass(this.context));
    this.isActive =  MetaData.get(ASSIGN_TEACUP_KEY, getClass(this.context), 'isTeacupActive');

    if (!this.isActive) {
      return;
    }

    const scheme = url.parse(this.teacupSettings.serverUrl);
    const { publicKey, privateKey } = TeaGatewayHelper.generateKeys(this.teacupSettings.clientKey);
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.clientSignature = TeaGatewayHelper.sign(this.teacupSettings.clientKey, this.privateKey, this.teacupSettings.clientKey);

    this.client = io(`http://${scheme.host}`, {
      path: '/teapot',
      reconnection: true,
      autoConnect: false
    });
  }

  private handshaked(data) {
    try {
      console.log(chalk`{cyan.bold [TEACUP]} - [{magenta.bold ${this.client.id}}]: {yellow.bold Started Verification}`);
      const serverPublicKey = Buffer.from(data.key, 'base64').toString('ascii');
      const serverSignature = Buffer.from(data.signature, 'base64');

      if (TeaGatewayHelper.verify(this.teacupSettings.clientKey, serverPublicKey, serverSignature)) {
        console.log(chalk`{cyan.bold [TEACUP]} - [{magenta.bold ${this.client.id}}]: {green.bold Verified}`);
        this.publicServerKey = serverPublicKey;
        this.serverSignature = serverSignature;

        this.client.emit('handshake', {
          key: Buffer.from(this.publicKey).toString('base64'),
          signature: this.clientSignature.toString('base64')
        });
      }
    } catch (e) {
      console.error(chalk`{cyan.bold [TEACUP]} - {red.bold TEAPOD}  {magenta.bold ${this.client.id}}: Failed with next message: ${e.message}`);
    }
  }

  private accepted() {
    console.log(chalk`{cyan.bold [TEACUP]} - [{magenta.bold ${this.client.id}}]: {green.bold Registered} - {blue.bold <${this.teacupSettings.serverUrl}>} <-> {white.bold ${this.teacupSettings.mountTo}}`);

    this.client.emit('register', TeaGatewayHelper.encrypt({
      mountTo: this.teacupSettings.mountTo,
      address: this.teacupSettings.address
    }, this.serverSignature.slice(0,32)));

    const onClose = () => {
      try {
        this.client.close();
      } catch (_) {}
    };

    this.server.on('close', onClose);
    this.serverSecure?.on('close', onClose);
  }

  async start(): Promise<void> {

    if (!this.isActive) {
      return;
    }

    this.header();

    this.client.on('handshake', this.handshaked.bind(this));
    this.client.on('accepted', this.accepted.bind(this));
    this.client.on('error', console.log);

    this.client.connect();
  }

}
