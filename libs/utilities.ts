/**
 * Native Utility Functions
 * 
 * Lightweight replacements for lodash functions using native JavaScript/TypeScript.
 * These utilities provide common object, array, and type manipulation functions
 * without external dependencies.
 * 
 * ## Type Safety Notes
 * 
 * This module intentionally uses `any` types for maximum flexibility with dynamic data.
 * The functions perform runtime type checks and safe property access patterns.
 * 
 * ESLint warnings for unsafe `any` operations are suppressed because:
 * - These are utility functions designed to work with unknown data structures
 * - Runtime validation is performed where appropriate
 * - The API contract is clearly documented via JSDoc
 * - Backward compatibility must be maintained
 * 
 * @module libs/utilities
 * @since 2.0.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
 


/**
 * Get a value from an object using a path string or number
 * 
 * @param {any} obj - The object to query
 * @param {string | string[] | number} path - The path of the property to get (e.g., 'a.b.c' or ['a', 'b', 'c'] or 0)
 * @param {any} [defaultValue] - The value returned if the resolved value is undefined
 * @returns {any} The resolved value or defaultValue
 * 
 * @example
 * get({ a: { b: { c: 3 } } }, 'a.b.c') // => 3
 * get({ a: { b: { c: 3 } } }, 'a.b.x', 'default') // => 'default'
 * get([1, 2, 3], 0) // => 1
 */
export function get(obj: any, path: string | string[] | number, defaultValue?: any): any {
  if (!obj || (typeof obj !== 'object' && !Array.isArray(obj))) {
    return defaultValue;
  }

  // Handle undefined or null path
  if (path === undefined || path === null) {
    return defaultValue;
  }

  // Handle numeric index directly (for arrays)
  if (typeof path === 'number') {
    const value = obj[path];
    return value === undefined ? defaultValue : value;
  }

  const pathArray = Array.isArray(path) ? path : path.split('.');
  let current = obj;

  for (const key of pathArray) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }

  return current === undefined ? defaultValue : current;
}

/**
 * Set a value in an object using a path string
 * 
 * @param {any} obj - The object to modify
 * @param {string | string[]} path - The path of the property to set
 * @param {any} value - The value to set
 * @returns {any} Returns the object
 * 
 * @example
 * const obj = {};
 * set(obj, 'a.b.c', 3);
 * // obj is now { a: { b: { c: 3 } } }
 */
export function set(obj: any, path: string | string[], value: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const pathArray = Array.isArray(path) ? path : path.split('.');
  let current = obj;

  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[pathArray[pathArray.length - 1]] = value;
  return obj;
}

/**
 * Check if a path exists in an object
 * 
 * @param {any} obj - The object to query
 * @param {string | string[]} path - The path to check
 * @returns {boolean} Returns true if path exists, else false
 * 
 * @example
 * has({ a: { b: 2 } }, 'a.b') // => true
 * has({ a: { b: 2 } }, 'a.c') // => false
 */
export function has(obj: any, path: string | string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Handle undefined or null path
  if (path === undefined || path === null) {
    return false;
  }

  const pathArray = Array.isArray(path) ? path : path.split('.');
  let current = obj;

  for (const key of pathArray) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return true;
}

/**
 * Create an object composed of picked properties
 * 
 * @param {any} obj - The source object
 * @param {string[]} keys - The property keys to pick
 * @returns {any} Returns the new object
 * 
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // => { a: 1, c: 3 }
 */
export function pick(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const result: any = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Find the first element in an array that matches a predicate or object pattern
 * 
 * @param {any[]} array - The array to search
 * @param {((item: any) => boolean) | object} predicate - The function or object pattern to match
 * @returns {any} Returns the matched element, else undefined
 * 
 * @example
 * find([1, 2, 3, 4], n => n > 2) // => 3
 * find([{ a: 1 }, { a: 2 }], { a: 2 }) // => { a: 2 }
 */
export function find<T>(array: T[], predicate: ((item: T) => boolean) | Partial<T>): T | undefined {
  if (!Array.isArray(array)) {
    return undefined;
  }

  // If predicate is a function, use it directly
  if (typeof predicate === 'function') {
    return array.find(predicate);
  }

  // If predicate is an object, match properties
  if (predicate && typeof predicate === 'object') {
    return array.find((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }
      return Object.keys(predicate).every((key) => (item as any)[key] === (predicate as any)[key]);
    });
  }

  return undefined;
}

/**
 * Get the size of a collection
 * 
 * @param {any} collection - The collection to inspect
 * @returns {number} Returns the collection size
 * 
 * @example
 * size([1, 2, 3]) // => 3
 * size({ a: 1, b: 2 }) // => 2
 * size('hello') // => 5
 */
export function size(collection: any): number {
  if (!collection) {
    return 0;
  }

  if (Array.isArray(collection) || typeof collection === 'string') {
    return collection.length;
  }

  if (typeof collection === 'object') {
    return Object.keys(collection).length;
  }

  return 0;
}

/**
 * Deep merge objects
 * 
 * @param {any} target - The destination object
 * @param {...any} sources - The source objects
 * @returns {any} Returns the merged object
 * 
 * @example
 * merge({ a: 1 }, { b: 2 }, { c: 3 }) // => { a: 1, b: 2, c: 3 }
 * merge({ a: { b: 1 } }, { a: { c: 2 } }) // => { a: { b: 1, c: 2 } }
 */
export function merge(target: any, ...sources: any[]): any {
  if (!target || typeof target !== 'object') {
    return target;
  }

  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          target[key] = merge({}, targetValue, sourceValue);
        } else {
          target[key] = sourceValue;
        }
      }
    }
  }

  return target;
}

/**
 * Check if a value is undefined
 * 
 * @param {any} value - The value to check
 * @returns {boolean} Returns true if value is undefined, else false
 * 
 * @example
 * isUndefined(undefined) // => true
 * isUndefined(null) // => false
 */
export function isUndefined(value: any): value is undefined {
  return value === undefined;
}

/**
 * Check if a value is null or undefined
 * 
 * @param {any} value - The value to check
 * @returns {boolean} Returns true if value is null or undefined, else false
 * 
 * @example
 * isNil(null) // => true
 * isNil(undefined) // => true
 * isNil(0) // => false
 */
export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if a value is a number
 * 
 * @param {any} value - The value to check
 * @returns {boolean} Returns true if value is a number, else false
 * 
 * @example
 * isNumber(3) // => true
 * isNumber('3') // => false
 * isNumber(NaN) // => true
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number';
}

/**
 * Sort an array by one or more properties
 * 
 * @param {any[]} array - The array to sort
 * @param {string | string[]} properties - The property name(s) to sort by
 * @param {('asc'|'desc')[]} [orders] - The sort orders for each property
 * @returns {any[]} Returns the sorted array
 * 
 * @example
 * sortBy([{ a: 2 }, { a: 1 }], 'a') // => [{ a: 1 }, { a: 2 }]
 * sortBy([{ a: 2, b: 1 }, { a: 1, b: 2 }], ['a'], ['asc'])
 * // => [{ a: 1, b: 2 }, { a: 2, b: 1 }]
 */
export function sortBy(
  array: any[],
  properties: string | string[],
  orders: ('asc' | 'desc')[] = []
): any[] {
  if (!Array.isArray(array)) {
    return [];
  }

  const props = Array.isArray(properties) ? properties : [properties];

  return [...array].sort((a, b) => {
    for (let i = 0; i < props.length; i++) {
      const prop = props[i];
      const order = orders[i] || 'asc';
      const aVal = get(a, prop);
      const bVal = get(b, prop);

      if (aVal < bVal) {
        return order === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return order === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });
}

/**
 * Alias for sortBy to match lodash orderBy API
 * 
 * @param {any[]} array - The array to sort
 * @param {string[]} properties - The property names to sort by
 * @param {('asc'|'desc')[]} [orders] - The sort orders for each property
 * @returns {any[]} Returns the sorted array
 */
export function orderBy(
  array: any[],
  properties: string[],
  orders: ('asc' | 'desc')[] = []
): any[] {
  return sortBy(array, properties, orders);
}


/**
 * Get the index of a value in an array
 * 
 * @param {any[]} array - The array to search
 * @param {any} value - The value to search for
 * @returns {number} Returns the index of the value, or -1 if not found
 * 
 * @example
 * indexOf([1, 2, 3], 2) // => 1
 * indexOf([1, 2, 3], 4) // => -1
 */
export function indexOf<T>(array: T[], value: T): number {
  if (!Array.isArray(array)) {
    return -1;
  }
  return array.indexOf(value);
}

/**
 * Check if an array includes a value
 * 
 * @param {any[]} array - The array to search
 * @param {any} value - The value to search for
 * @returns {boolean} Returns true if value is found, else false
 * 
 * @example
 * includes([1, 2, 3], 2) // => true
 * includes([1, 2, 3], 4) // => false
 */
export function includes<T>(array: T[], value: T): boolean {
  if (!Array.isArray(array)) {
    return false;
  }
  return array.includes(value);
}

/**
 * Get the last element of an array
 * 
 * @param {any[]} array - The array to query
 * @returns {any} Returns the last element of the array, or undefined
 * 
 * @example
 * last([1, 2, 3]) // => 3
 * last([]) // => undefined
 */
export function last<T>(array: T[]): T | undefined {
  if (!Array.isArray(array) || array.length === 0) {
    return undefined;
  }
  return array[array.length - 1];
}

/**
 * Check if a number is within a range
 * 
 * @param {number} value - The number to check
 * @param {number} start - The start of the range (inclusive)
 * @param {number} end - The end of the range (exclusive)
 * @returns {boolean} Returns true if value is in range, else false
 * 
 * @example
 * inRange(3, 2, 4) // => true
 * inRange(4, 2, 4) // => false
 * inRange(1, 2, 4) // => false
 */
export function inRange(value: number, start: number, end: number): boolean {
  if (typeof value !== 'number' || typeof start !== 'number' || typeof end !== 'number') {
    return false;
  }
  return value >= start && value < end;
}


/**
 * Create a chainable wrapper (simplified lodash chain)
 * 
 * @param {any} value - The value to wrap
 * @returns {object} Returns the chainable wrapper
 * 
 * @example
 * chain([1, 2, 3])
 *   .map(n => n * 2)
 *   .filter(n => n > 2)
 *   .value()
 * // => [4, 6]
 */
export function chain<T>(value: T) {
  return {
    value: () => value,
    map: (fn: (item: any) => any) => chain(Array.isArray(value) ? value.map(fn) : value),
    filter: (fn: (item: any) => boolean) => chain(Array.isArray(value) ? value.filter(fn) : value),
    find: (fn: (item: any) => boolean) => chain(Array.isArray(value) ? value.find(fn) : undefined),
    sortBy: (properties: string | string[], orders?: ('asc' | 'desc')[]) => 
      chain(Array.isArray(value) ? sortBy(value, properties, orders) : value),
    size: () => chain(size(value)),
    pick: (keys: string[]) => chain(pick(value, keys)),
    get: (path: string, defaultValue?: any) => chain(get(value, path, defaultValue)),
    has: (path: string) => chain(has(value, path)),
    thru: (fn: (val: any) => any) => chain(fn(value))
  };
}
