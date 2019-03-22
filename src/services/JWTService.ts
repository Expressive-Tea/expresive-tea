import TokenModel from '@app/commons/models/TokenModel';
import DependencyInjection from '@core/services/DependencyInjection';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import { JWT_AUDIENCE, JWT_ISSUER, JWT_SECRET } from '../constants';

const dependencyInjection = DependencyInjection.getInstance();
const DomainContainer = dependencyInjection.getContainer();

export default class JWTService {
  static async validateToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  static async isValid(token: string) {
    try {
      const tokenValue = await TokenModel.findOne({ where: { token } });
      return Boolean(tokenValue.isValid);
    } catch (e) {
      return false;
    }
  }

  static async getValidToken(userId) {
    return await TokenModel.findOne({ where: { userId, isValid: true } });
  }

  static async storeToken(userId, token) {
    return TokenModel.create({ userId, token, isValid: true });
  }

  static async invalidateToken(userId) {
    return TokenModel.update({ isValid: false }, { where: { userId, isValid: true } });
  }

  static async issueToken(userId) {
    const issuedToken = await JWTService.getValidToken(userId);

    if (!_.get(issuedToken, 'isValid', false)) {
      const token = jwt.sign({ sub: userId }, JWT_SECRET, { audience: JWT_AUDIENCE, issuer: JWT_ISSUER });
      await JWTService.storeToken(userId, token);
      return token;
    }

    return issuedToken.token;

  }
}

DomainContainer.bind('JWTService').toConstantValue(JWTService);
