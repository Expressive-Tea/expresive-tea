import * as chalk from 'chalk';
import * as url from 'url';
// tslint:disable-next-line:no-duplicate-imports
import { io, Socket } from 'socket.io-client';
import { injectable } from 'inversify';
import { ExpressiveTeaCupSettings } from '@expressive-tea/commons/interfaces';
import MetaData from '@expressive-tea/commons/classes/Metadata';
import { ASSIGN_TEACUP_KEY } from '@expressive-tea/commons/constants';
import TeaGatewayHelper from '../../helpers/teapot-helper';
import { getClass } from '@expressive-tea/commons/helpers/object-helper';
import ExpressiveTeaEngine from '../../classes/Engine';

@injectable()
export default class TeacupEngine extends ExpressiveTeaEngine {
  private teacupSettings: ExpressiveTeaCupSettings;
  private publicKey: string;
  private privateKey: string;
  private publicServerKey: Buffer;
  private serverSignature: Buffer;
  private clientSignature: Buffer;
  private client: Socket;

  private header() {
    console.log(chalk.white.bold('Teacup Engine is initializing...'));
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

  private handshaked(key: Buffer, signature: Buffer, isSecure: boolean, cb) {
    try {
      console.log(chalk`{cyan.bold [TEACUP]} - [{magenta.bold ${this.client.id}}]: {yellow.bold Server Verification Started}`);
      if (!TeaGatewayHelper.verify(this.teacupSettings.clientKey, key.toString('ascii'), signature)) {
        throw new Error('Fail to Verify Client on Teapod.');
      }

      console.log(chalk`{cyan.bold [TEACUP]} - [{magenta.bold ${this.client.id}}]: {green.bold Server Has Been Verified}`);
      this.publicServerKey = key;
      this.serverSignature = signature;

      cb(Buffer.from(this.publicKey), this.clientSignature);
    } catch (e) {
      console.error(chalk`{cyan.bold [TEACUP]} - {red.bold TEAPOD}  {magenta.bold ${this.client.id}}: Failed with next message: ${e.message}`);
      this.client.disconnect();
    }
  }

  private accepted(cb) {
    console.log(chalk`{cyan.bold [TEACUP]} - [{magenta.bold ${this.client.id}}]: {green.bold Registered} - {blue.bold <${this.teacupSettings.serverUrl}>} <-> {white.bold ${this.teacupSettings.mountTo}}`);

    const encryptedMessage = TeaGatewayHelper.encrypt({
      mountTo: this.teacupSettings.mountTo,
      address: this.teacupSettings.address
    }, this.serverSignature.slice(0, 32));

    cb(encryptedMessage);

    const onClose = () => {
      try {
        this.client.close();
      } catch (_) {
      }
    };

    this.server.on('close', onClose);
    this.serverSecure?.on('close', onClose);
  }

  async start(): Promise<void> {
    this.teacupSettings = MetaData.get(ASSIGN_TEACUP_KEY, getClass(this.context));
    const scheme = url.parse(this.teacupSettings.serverUrl);
    const { publicKey, privateKey } = TeaGatewayHelper.generateKeys(this.teacupSettings.clientKey);
    const protocol = TeaGatewayHelper.httpSchema(scheme.protocol);
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.clientSignature = TeaGatewayHelper.sign(this.teacupSettings.clientKey, this.privateKey, this.teacupSettings.clientKey);

    this.client = io(`${protocol}//${scheme.host}/teapot`, {
      path: '/exp-tea/',
      reconnection: true,
      autoConnect: false
    });

    this.header();

    this.client.on('handshake', this.handshaked.bind(this));
    this.client.on('accepted', this.accepted.bind(this));
    this.client.on('error', console.log);

    this.client.connect();
  }

}
