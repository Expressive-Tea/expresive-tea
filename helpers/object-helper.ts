/* istanbul ignore file */
/**
 * Get the provide constructor.
 * @param targetClass
 * @ignore
 */
export const getConstructor = (targetClass: any): any =>
  typeof targetClass === 'function' ? targetClass : targetClass.constructor;

/**
 * Get the provide constructor if target is an instance.
 * @param target
 * @returns {*}
 * @ignore
 */
export function getClass(target: any): any {
  return target.prototype ? target : target.constructor;
}

/**
 * Get the provide constructor if target is an instance.
 * @param target
 * @returns {*}
 * @alias getClass
 * @ignore
 */
export function classOf(target: any) {
  return getClass(target);
}

/**
 *
 * @param target
 * @returns {symbol}
 * @ignore
 */
export function getClassOrSymbol(target: any): any {
  return typeof target === 'symbol' ? target : getClass(target);
}

/**
 * Return true if the given obj is a primitive.
 * @param target
 * @returns {boolean}
 * @ignore
 */
export function isPrimitiveOrPrimitiveClass(target: any): boolean {
  return isString(target) || isNumber(target) || isBoolean(target);
}

/**
 *
 * @param target
 * @returns {"string" | "number" | "boolean" | "any"}
 * @ignore
 */
export function primitiveOf(target: any): 'string' | 'number' | 'boolean' | 'any' {
  if (isString(target)) {
    return 'string';
  }
  if (isNumber(target)) {
    return 'number';
  }
  if (isBoolean(target)) {
    return 'boolean';
  }

  return 'any';
}

/**
 *
 * @param target
 * @returns {boolean}
 * @ignore
 */
export function isString(target: any): boolean {
  return checkType(target, 'string', String);
}

/**
 *
 * @param target
 * @returns {boolean}
 * @ignore
 */
export function isNumber(target: any): boolean {
  return checkType(target, 'number', Number);
}

/**
 *
 * @param target
 * @returns {boolean}
 * @ignore
 */
export function isBoolean(target: any): boolean {
  return checkType(target, 'boolean', Boolean);
}

function checkType(target, type, TypeClass) {
  return typeof target === type || target instanceof TypeClass || target === TypeClass;
}
/**
 *
 * @param target
 * @returns {Boolean}
 * @ignore
 */
export function isArray(target: any): boolean {
  return Array.isArray(target);
}

/**
 * Return true if the clazz is an array.
 * @param target
 * @returns {boolean}
 * @ignore
 */
export function isArrayOrArrayClass(target: any): boolean {
  if (target === Array) {
    return true;
  }

  return isArray(target);
}

/**
 * Return true if the target.
 * @param target
 * @returns {boolean}
 * @ignore
 */
export function isCollection(target: any): boolean {
  return (
    isArrayOrArrayClass(target) ||
    target === Map ||
    target instanceof Map ||
    target === Set ||
    target instanceof Set ||
    target === WeakMap ||
    target instanceof WeakMap ||
    target === WeakSet ||
    target instanceof WeakSet
  );
}

/**
 *
 * @param target
 * @returns {boolean}
 * @ignore
 */
export function isDate(target: any): boolean {
  return target === Date || target instanceof Date;
}

/**
 *
 * @param target
 * @returns {boolean}
 * @ignore
 */
export function isObject(target: any): boolean {
  return target === Object;
}

/**
 *
 * @param target
 * @returns {boolean}
 * @ignore
 */
export function isClass(target: any) {
  return (
    !isPrimitiveOrPrimitiveClass(target) &&
    !isObject(target) &&
    !isDate(target) &&
    target !== undefined &&
    !isPromise(target)
  );
}

/**
 * Return true if the value is an empty string, null or undefined.
 * @param value
 * @returns {boolean}
 * @ignore
 */
export function isEmpty(value: any): boolean {
  return value === '' || value === null || value === undefined;
}

/**
 *
 * @param target
 * @returns {boolean}
 * @ignore
 */
export function isPromise(target: any): boolean {
  return target === Promise || target instanceof Promise;
}

/**
 *
 * @param target
 * @returns {any}
 * @ignore
 */
export function getInheritedClass(target: any): any {
  return Object.getPrototypeOf(target);
}

/**
 *
 * @param target
 * @returns {Array}
 * @ignore
 */
export function ancestorsOf(target: any) {
  const classes: any[] = [];

  let currentTarget = getClass(target);

  while (nameOf(currentTarget) !== '') {
    classes.unshift(currentTarget);
    currentTarget = getInheritedClass(currentTarget);
  }

  return classes;
}

/**
 * Get object name
 * @ignore
 */
export function nameOf(obj: any): string {
  switch (typeof obj) {
    default:
      return '' + obj;
    case 'symbol':
      return nameOfSymbol(obj);
    case 'function':
      return nameOfClass(obj);
  }
}

/**
 * Get the provide name.
 * @param targetClass
 * @ignore
 */
export function nameOfClass(targetClass: any): string {
  return typeof targetClass === 'function' ? targetClass.name : targetClass.constructor.name;
}

/**
 * Get symbol name.
 * @param sym
 * @ignore
 */
export const nameOfSymbol = (sym: symbol): string =>
  sym
    .toString()
    .replace('Symbol(', '')
    .replace(')', '');

/**
 *
 * @param target
 * @param {string} propertyKey
 * @returns {PropertyDescriptor}
 * @ignore
 */
export function descriptorOf(target: any, propertyKey: string): PropertyDescriptor {
  return Object.getOwnPropertyDescriptor((target && target.prototype) || target, propertyKey)!;
}

/**
 *
 * @param target
 * @returns {any}
 * @ignore
 */
export function prototypeOf(target: any) {
  return classOf(target) === target ? target.prototype : target;
}

const argumentsRegExp = /\(([\s\S]*?)\)/;
const replaceRegExp = /[ ,\n\r\t]+/;
// tslint:disable-next-line:ban-types
export function getOwnArgumentNames(fn: Function) {
  const fnArguments = argumentsRegExp.exec(fn.toString())[1].trim();

  return fnArguments && fnArguments.length ? fnArguments.split(replaceRegExp) : [];
}

export function isAsyncFunction(fn: () => any) {
  return fn.constructor.name === 'AsyncFunction' || fn.constructor.name.includes('__awaiter');
}
