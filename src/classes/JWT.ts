import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

import { JWT_AUDIENCE, JWT_ISSUER, JWT_SECRET } from '@core/constants';

export default class JWT {
  static async isValid(token: string) {
    try {
      const tokenValue = await getTokenModel().findOne({ token }).lean(true);
      return Boolean(tokenValue.isValid);
    } catch (e) {
      return false;
    }
  }

  static async getValidToken(userId) {
    return await getTokenModel().findOne({ issued: userId, isValid: true }).lean(true);
  }

  static async storeToken(userId, token) {
    const Token = getTokenModel();
    const tokenInstance = new Token({ issued: userId, token });
    return await tokenInstance.save();
  }

  static async invalidateToken(userId) {
    return getTokenModel().update({ issued: userId, isValid: true }, { $set: { isValid: false } });
  }

  static async issueToken(userId) {
    const issuedToken = await JWT.getValidToken(userId);

    if (!_.get(issuedToken, 'token', false)) {
      const token = jwt.sign({ sub: userId }, JWT_SECRET, { audience: JWT_AUDIENCE, issuer: JWT_ISSUER });
      await JWT.storeToken(userId, token);
      return token;
    }

    return issuedToken.token;

  }
}

function getTokenModel() {
  return mongoose.model('Token');
}
