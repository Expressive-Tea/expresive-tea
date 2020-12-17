import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as io from 'socket.io-client';
import * as crypto from 'crypto';
import * as chalk from 'chalk';
import { Server } from 'socket.io';

import MetaData from '../classes/MetaData';
import Boot from '../classes/Boot';
import Settings from '../classes/Settings';
import ProxyRoute from '../classes/ProxyRoute';

import {ASSIGN_TEACUP_KEY, ASSIGN_TEAPOT_KEY} from '../libs/constants';


const clients = new Map<string | symbol, any>();
const registeredRoute = new Map<string, ProxyRoute>();

Settings.getInstance().set('teapot:registered', clients);
Settings.getInstance().set('teapot:registeredRoute', registeredRoute);

export function teapotInitialize(context: Boot, server: http.Server, secureServer?: https.Server) {
  const settings = Settings.getInstance();
  const teapotSettings = MetaData.get(ASSIGN_TEAPOT_KEY, context);
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


  const socketServer = new Server({
    path: '/teapot',
    wsEngine: 'eiows',
    cookie: false
  });

  const { publicKey, privateKey } = generateKeys(teapotSettings.serverKey);
  settings.set('teapot:privateKey', privateKey);
  settings.set('teapot:publicKey', publicKey);

  const signature = sign(teapotSettings.clientKey, privateKey, teapotSettings.serverKey);

  socketServer.on('connection', teacup => {
    console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${teacup.id}}]: {grey.bold Connected}`);
    teacup.emit('handshake', {
      key: Buffer.from(publicKey).toString('base64'),
      signature: signature.toString('base64')
    });

    teacup.on('handshake', function (data){
      try {
        console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${this.id}}]: {yellow.bold Start Verification}`);
        const clientPublicKey = Buffer.from(data.key, 'base64').toString('ascii');
        const clientSignature = Buffer.from(data.signature, 'base64');

        if (verify(teapotSettings.clientKey, clientPublicKey, clientSignature)) {
          console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${this.id}}]: {green.bold Verified correctly}`);
          clients.set(this.id, {
            publicKey: clientPublicKey,
            signature: clientSignature
          });

          this.emit('accepted', encrypt({
            signature: signature.toString('base64')
          }, clientSignature.slice(0,32)));
          return;
        }
        console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP} [{magenta.bold ${this.id}}]: Failed to verify and will be disconnected...`);
        this.disconnect();
      } catch (e) {
        console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP} [{magenta.bold ${this.id}}]: Failed wiht next message: ${e.message}`);
        this.disconnect();
      }

    });

    teacup.on('register', function (data) {
      try {
        const message = decrypt(data, signature.slice(0,32));
        let proxyRoute: ProxyRoute;

        if (registeredRoute.has(message.mountTo)) {
          proxyRoute = registeredRoute.get(message.mountTo);
          proxyRoute.registerServer(message.address, this.id);
        } else {
          proxyRoute = new ProxyRoute(message.mountTo);
          proxyRoute.registerServer(message.address, this.id);
          registeredRoute.set(message.mountTo, proxyRoute);
          context.getApplication().use(message.mountTo, proxyRoute.registerRoute());
        }
        console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${this.id}}] {blue.bold <${message.address}>} <--> {white.bold ${message.mountTo}}`);
      } catch (e) {
        console.log(chalk`{cyan.bold [TEAPOT]} - {red.bold TEACUP}  {magenta.bold ${this.id}}: Failed wiht next message: ${e.message}`);
      }
    });

    teacup.on('disconnect', function(reason){
      console.log(chalk`{cyan.bold [TEAPOT]} - {blue TEACUP} [{magenta.bold ${this.id}}]: Got disconnected by ${reason}`);
    });
  });

  socketServer.listen(server)

}

export function teacupInitialize(context: Boot) {
  const settings = Settings.getInstance();
  const teacupSettings = MetaData.get(ASSIGN_TEACUP_KEY, context);
  const scheme = url.parse(teacupSettings.serverUrl);

  console.log(chalk.white.bold('Teacup Engine is initializing...'))
  console.log(chalk`
   {grey ( (}
    {white.bold ) )}
  {magenta.bold ........}
  {magenta.bold |      |]}
  {magenta.bold \\      /}    {yellow.bold [${teacupSettings.address}]}
   {magenta.bold \`----'}

{yellow.bold NOTICE:}
All Communication are encrypted to ensure intruder can not connected, however, please does not share any sensitive data like keys or passwords to avoid security issues.
  `);

  const { publicKey, privateKey } = generateKeys(teacupSettings.clientKey);
  const signature = sign(teacupSettings.clientKey, privateKey, teacupSettings.clientKey);

  settings.set('teacup:privateKey', privateKey);
  settings.set('teacup:publicKey', publicKey);
  console.log(chalk`{cyan.bold [TEACUP]} - {grey.bold Open Communication}`);
  const client = io(`http://${scheme.host}`, {
    path: '/teapot',
    reconnection: true,
    autoConnect: false,
    query: {
      publicKey
    }
  });



  client.on('handshake',data => {
    try {
      console.log(chalk`{cyan.bold [TEACUP]} - [{magenta.bold ${client.id}}]: {yellow.bold Started Verification}`);
      const serverPublicKey = Buffer.from(data.key, 'base64').toString('ascii');
      const serverSignature = Buffer.from(data.signature, 'base64');

      if (verify(teacupSettings.clientKey, serverPublicKey, serverSignature)) {
        console.log(chalk`{cyan.bold [TEACUP]} - [{magenta.bold ${client.id}}]: {green.bold Verified}`);
        Settings.getInstance().set('teacup:server:publicKey', serverPublicKey);
        Settings.getInstance().set('teacup:server:signature', serverSignature);

        client.emit('handshake', {
          key: Buffer.from(publicKey).toString('base64'),
          signature: signature.toString('base64')
        });
      }
    } catch (e) {
      console.error(e);
    }

    /*
    client.emit('handshake_started', {
      key: teacupSettings.publicKey
    });
     */
  });

  client.on('accepted', data => {
    console.log(chalk`{cyan.bold [TEACUP]} - [{magenta.bold ${client.id}}]: {green.bold Registered} - {blue.bold <${teacupSettings.serverUrl}>} <-> {white.bold ${teacupSettings.mountTo}}`);
    const serverSignature = Settings.getInstance().get('teacup:server:signature');
    client.emit('register', encrypt({
      mountTo:teacupSettings.mountTo,
      address: teacupSettings.address
    }, serverSignature.slice(0,32)));
  });

  client.on('error', console.log);

  client.connect();
}

function encrypt(data: { [property: string]: any }, signature: Buffer) {
  const iv: Buffer = crypto.randomBytes(16);
  const packet: string = JSON.stringify(data);
  const cipher: crypto.Cipher = crypto.createCipheriv('aes-256-ctr', signature, iv);
  const encrypted: Buffer = Buffer.concat([cipher.update(packet), cipher.final()]);

  return {iv: iv.toString('hex'), message: encrypted.toString('base64')};
}

function decrypt(data: { [property: string]: any }, signature: Buffer) {
  const iv: Buffer = Buffer.from(data.iv, 'hex');
  const message: Buffer = Buffer.from(data.message, 'base64');

  const decipher: crypto.Decipher = crypto.createDecipheriv('aes-256-ctr', signature, iv);
  const decrypted:Buffer = Buffer.concat([decipher.update(message), decipher.final()]);

  return JSON.parse(decrypted.toString());
}

function sign(data: string, privateKey, passphrase) {
  return crypto.sign('sha256', Buffer.from(data), {
    key: privateKey,
    passphrase
  });
}

function verify(data: string, publicKey, signature) {
  return crypto.verify(
    'sha256',
    Buffer.from(data),
    {
      key: publicKey
    },
    signature
  )
}

function generateKeys(passphrase: string) {
  const { generateKeyPairSync } = require('crypto');
  return  generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase
    }
  });
}
