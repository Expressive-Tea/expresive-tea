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

  console.log(signature.toString('base64'));

  /*
  socketServer.use((socket, next) => {
    console.log('Middleware', socket.handshake);
    next();
  });
   */

  socketServer.on('connection', teacup => {
    console.log('Connection ---> ', signature);

    teacup.emit('handshake', {
      key: Buffer.from(publicKey).toString('base64'),
      signature: signature.toString('base64')
    });

    teacup.on('handshake', function (data){
      try {
        console.log(data, this.id,'TeaPot handshake_started');
        const clientPublicKey = Buffer.from(data.key, 'base64').toString('ascii');
        const signature = Buffer.from(data.signature, 'base64');

        console.log(clientPublicKey, signature.toString('base64'), data.signature);

        if (verify(teapotSettings.clientKey, clientPublicKey, signature)) {
          clients.set(this.id, {
            publicKey: clientPublicKey,
            signature
          });
          this.emit('accepted', '');
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

function onHandshakeResponse(data) {}

export function teacupInitialize(context: Boot) {
  const settings = Settings.getInstance();
  const teacupSettings = MetaData.get(ASSIGN_TEACUP_KEY, context);
  const scheme = url.parse(teacupSettings.serverUrl);

  const { publicKey, privateKey } = generateKeys(teacupSettings.clientKey);

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
      const signature = Buffer.from(data.signature, 'base64');

      console.log(serverPublicKey, signature.toString('base64'), data.signature);

      if (verify(teacupSettings.clientKey, serverPublicKey, signature)) {
        const signature = sign(teacupSettings.clientKey, privateKey, teacupSettings.clientKey);
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
    key: publicKey
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
