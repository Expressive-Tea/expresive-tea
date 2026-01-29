/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import * as chalk from 'chalk';
import {URL} from 'url';
import { io, Socket } from 'socket.io-client';
import { injectable, injectFromBase } from 'inversify';
import { ExpressiveTeaCupSettings } from '@expressive-tea/commons';
import { Metadata } from '@expressive-tea/commons';
import { ASSIGN_TEACUP_KEY } from '@expressive-tea/commons';
import TeaGatewayHelper from '@helpers/teapot-helper';
import { getClass } from '@expressive-tea/commons';
import ExpressiveTeaEngine from '@classes/Engine';
import Boot from '@classes/Boot';

@injectable()
@injectFromBase({ extendConstructorArguments: true })
export default class TeacupEngine extends ExpressiveTeaEngine {
  private teacupSettings!: ExpressiveTeaCupSettings;
  private publicKey!: string;
  private privateKey!: string;
  private publicServerKey!: Buffer;
  private serverSignature!: Buffer;
  private clientSignature!: Buffer;
  private client!: Socket;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handshaked(key: Buffer, signature: Buffer, isSecure: boolean, cb: any) {
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
      const error = e as Error;
      console.error(chalk`{cyan.bold [TEACUP]} - {red.bold TEAPOD}  {magenta.bold ${this.client.id}}: Failed with next message: ${error.message}`);
      this.client.disconnect();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private accepted(cb: any) {
    console.log(chalk`{cyan.bold [TEACUP]} - [{magenta.bold ${this.client.id}}]: {green.bold Registered} - {blue.bold <${this.teacupSettings.serverUrl}>} <-> {white.bold ${this.teacupSettings.mountTo}}`);

    const encryptedMessage = TeaGatewayHelper.encrypt({
      mountTo: this.teacupSettings.mountTo,
      address: this.teacupSettings.address
    }, this.serverSignature);

    cb(encryptedMessage);

    const onClose = () => {
      try {
        this.client.close();
       
      } catch (_) {
        // Intentionally empty - ignore close errors
      }
    };

    this.server.on('close', onClose);
    this.serverSecure?.on('close', onClose);
  }

  async start(): Promise<void> {
    this.teacupSettings = Metadata.get(ASSIGN_TEACUP_KEY, getClass(this.context));
    const scheme = new URL(this.teacupSettings.serverUrl);
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.client.on('handshake', this.handshaked.bind(this));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.client.on('accepted', this.accepted.bind(this));
    this.client.on('error', console.log);

    this.client.connect();
  }

  static canRegister(ctx?: Boot): boolean {
    return Metadata.get(ASSIGN_TEACUP_KEY, getClass(ctx), 'isTeacupActive');
  }

}
