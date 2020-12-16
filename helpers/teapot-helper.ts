import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as io from 'socket.io-client';
import * as crypto from 'crypto';
import { Server } from 'socket.io';

import MetaData from '../classes/MetaData';
import Boot from '../classes/Boot';
import Settings from '../classes/Settings';

import {ASSIGN_TEACUP_KEY, ASSIGN_TEAPOT_KEY} from '../libs/constants';

const clients = new Map<string | symbol, any>();
Settings.getInstance().set('teapot:registered', clients);

export function teapotInitialize(context: Boot, server: http.Server, secureServer?: https.Server) {
  const settings = Settings.getInstance();
  const teapotSettings = MetaData.get(ASSIGN_TEAPOT_KEY, context);

  const socketServer = new Server({
    path: '/teapot',
    wsEngine: 'eiows',
    cookie: false
  });

  const { publicKey, privateKey } = generateKeys(teapotSettings.serverKey);
  settings.set('teapot:privateKey', privateKey);
  settings.set('teapot:publicKey', publicKey);

  const signature = sign(teapotSettings.clientKey, privateKey, teapotSettings.serverKey);

  /*
  socketServer.use((socket, next) => {
    console.log('Middleware', socket.handshake);
    next();
  });
   */

  socketServer.on('connection', teacup => {

    teacup.emit('handshake', {
      key: Buffer.from(publicKey).toString('base64'),
      signature: signature.toString('base64')
    });

    teacup.on('handshake', function (data){
      try {
        const clientPublicKey = Buffer.from(data.key, 'base64').toString('ascii');
        const clientSignature = Buffer.from(data.signature, 'base64');

        if (verify(teapotSettings.clientKey, clientPublicKey, clientSignature)) {
          clients.set(this.id, {
            publicKey: clientPublicKey,
            signature: clientSignature
          });

          this.emit('accepted', createMessage({
            signature: signature.toString('base64')
          }, clientSignature.slice(0,32)));
          return;
        }

        this.disconnect();
      } catch (e) {
        console.error(e);
        this.disconnect();
      }

    });
  });

  socketServer.listen(server)

}

function createMessage(data: { [property: string]: any }, signature: Buffer) {
  const iv: Buffer = crypto.randomBytes(16);
  const packet: string = JSON.stringify(data);
  const cipher: crypto.Cipher = crypto.createCipheriv('aes-256-ctr', signature, iv);

  const encrypted: Buffer = Buffer.concat([cipher.update(packet), cipher.final()]);

  console.log('Signature Cipher: ', signature.toString('base64'));
  console.log('IV Cipher: ', iv.toString('hex'));
  return {iv: iv.toString('hex'), message: encrypted.toString('base64')};
}

function getMessage(data: { [property: string]: any }, signature: Buffer, packet: string) {
  console.log(data);
  const iv: Buffer = Buffer.from(data.iv, 'hex');
  const message: Buffer = Buffer.from(data.message, 'base64');

  const decipher: crypto.Decipher = crypto.createDecipheriv('aes-256-ctr', signature, iv);
  const decrypted:Buffer = Buffer.concat([decipher.update(message), decipher.final()]);

  return JSON.parse(decrypted.toString());
}

export function teacupInitialize(context: Boot) {
  const settings = Settings.getInstance();
  const teacupSettings = MetaData.get(ASSIGN_TEACUP_KEY, context);
  const scheme = url.parse(teacupSettings.serverUrl);

  const { publicKey, privateKey } = generateKeys(teacupSettings.clientKey);
  const signature = sign(teacupSettings.clientKey, privateKey, teacupSettings.clientKey);

  settings.set('teacup:privateKey', privateKey);
  settings.set('teacup:publicKey', publicKey);

  const client = io(`http://${scheme.host}`, {
    path: scheme.path,
    reconnection: true,
    autoConnect: false,
    query: {
      publicKey
    }
  });



  client.on('handshake',data => {
    try {
      const serverPublicKey = Buffer.from(data.key, 'base64').toString('ascii');
      const serverSignature = Buffer.from(data.signature, 'base64');

      if (verify(teacupSettings.clientKey, serverPublicKey, serverSignature)) {

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
    console.log('Signature Decipher: ', signature.slice(0,32).toString('base64'));
    console.log('IV Decipher: ', data.iv);
    console.log(getMessage(data, signature.slice(0,32), data.message))
  });

  client.connect();
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

function encryptData(publicKey, data: Buffer) {
  return crypto.publicEncrypt({
    key: publicKey,
    oaepHash:'sha256'
  }, data);
}

function decryptData(privateKey, passphrase, data: Buffer) {
  return crypto.privateDecrypt({
    key: privateKey,
    passphrase
  }, data);
}

function generateKeys(passphrase: string) {
  const { generateKeyPairSync } = require('crypto');
  return  generateKeyPairSync('rsa', {
    modulusLength: 512,
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
