/* istanbul ignore file */
import 'reflect-metadata';

function get(key: string, target: any, propertyKey?: string | symbol, own: boolean = false) {
  return own ?
    Reflect.getOwnMetadata(key, target, propertyKey!) :
    Reflect.getMetadata(key, target, propertyKey!);
}

export default class Metadata {
  static get(key: string, target: any, propertyKey?: string | symbol): any {
    return get(key, target, propertyKey!);
  }

  static getOwn(key: string, target: any, propertyKey?: string | symbol): any {
    return get(key, target, propertyKey!, true);
  }

  static getType(target: any, propertyKey?: string | symbol): any {
    return Reflect.getMetadata(DESIGN_TYPE, target, propertyKey!);
  }

  static getOwnType(target: any, propertyKey?: string | symbol): any {
    return Reflect.getMetadata(DESIGN_TYPE, target, propertyKey!);
  }

  static getReturnType(target: any, propertyKey?: string | symbol): any {
    return Reflect.getMetadata(DESIGN_RETURN_TYPE, target, propertyKey!);
  }

  static getOwnReturnType(target: any, propertyKey?: string | symbol): any {
    return Reflect.getOwnMetadata(DESIGN_RETURN_TYPE, target, propertyKey!);
  }

  static has(key: string, target: any, propertyKey?: string | symbol): boolean {
    try {
      return Reflect.hasMetadata(key, target, propertyKey!);
    } catch (er) {
    }

    return false;
  }

  static hasOwn(key: string, target: any, propertyKey?: string | symbol): boolean {
    return Reflect.hasOwnMetadata(key, target, propertyKey!);
  }

  static setParamTypes(target: any, propertyKey: string | symbol, value: any): void {
    return this.set(DESIGN_PARAM_TYPES, value, target.prototype, propertyKey);
  }

  static delete(key: string, target: any, propertyKey?: string | symbol): boolean {
    return Reflect.deleteMetadata(key, target, propertyKey!);
  }

  static getTargetsFromPropertyKey = (metadataKey: string | symbol): any[] =>
    PROPERTIES.has(metadataKey) ? PROPERTIES.get(metadataKey) || [] : []

  static set(key: string, value: any, target: any, propertyKey?: string | symbol): void {
    const targets: any[] = PROPERTIES.has(key) ? PROPERTIES.get(key) || [] : [];
    const classConstructor = target;

    if (targets.indexOf(classConstructor) === -1) {
      targets.push(classConstructor);
      PROPERTIES.set(key, targets);
    }

    Reflect.defineMetadata(key, value, target, propertyKey!);
  }

  static getParamTypes(targetPrototype: any, propertyKey?: string | symbol): any[] {
    return get(DESIGN_PARAM_TYPES, targetPrototype, propertyKey!) || [];
  }

  static getOwnParamTypes(target: any, propertyKey?: string | symbol): any[] {
    return get(DESIGN_PARAM_TYPES, target, propertyKey!, true) || [];
  }
}

const DESIGN_PARAM_TYPES = 'design:paramtypes';
const DESIGN_TYPE = 'design:type';
const DESIGN_RETURN_TYPE = 'design:returntype';
const PROPERTIES: Map<string | symbol, any[]> = new Map<string | symbol, any[]>();
