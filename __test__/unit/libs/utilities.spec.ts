/**
 * Unit tests for libs/utilities.ts
 *
 * Tests native TypeScript utility functions that replace lodash
 */

import {
  get,
  set,
  has,
  pick,
  find,
  size,
  merge,
  isUndefined,
  isNil,
  isNumber,
  sortBy,
  orderBy,
  indexOf,
  includes,
  last,
  inRange,
  chain
} from '../../../libs/utilities';

describe('Utility Functions', () => {
  describe('get()', () => {
    test('should get value from simple path', () => {
      const obj = { a: { b: { c: 3 } } };
      expect(get(obj, 'a.b.c')).toBe(3);
    });

    test('should get value from array path', () => {
      const obj = { a: { b: { c: 3 } } };
      expect(get(obj, ['a', 'b', 'c'])).toBe(3);
    });

    test('should get value from numeric index', () => {
      const arr = [1, 2, 3];
      expect(get(arr, 0)).toBe(1);
      expect(get(arr, 2)).toBe(3);
    });

    test('should return default value for non-existent path', () => {
      const obj = { a: { b: 2 } };
      expect(get(obj, 'a.c.d', 'default')).toBe('default');
    });

    test('should return default value for undefined path', () => {
      const obj = { a: 1 };
      expect(get(obj, undefined as any, 'default')).toBe('default');
    });

    test('should return default value for null path', () => {
      const obj = { a: 1 };
      expect(get(obj, null as any, 'default')).toBe('default');
    });

    test('should return default value for null object', () => {
      expect(get(null, 'a.b', 'default')).toBe('default');
    });

    test('should handle undefined value in path', () => {
      const obj = { a: { b: undefined } };
      expect(get(obj, 'a.b', 'default')).toBe('default');
    });
  });

  describe('set()', () => {
    test('should set value at simple path', () => {
      const obj: any = {};
      set(obj, 'a.b.c', 3);
      expect(obj.a.b.c).toBe(3);
    });

    test('should set value at array path', () => {
      const obj: any = {};
      set(obj, ['a', 'b', 'c'], 3);
      expect(obj.a.b.c).toBe(3);
    });

    test('should overwrite existing value', () => {
      const obj = { a: { b: 1 } };
      set(obj, 'a.b', 2);
      expect(obj.a.b).toBe(2);
    });

    test('should create nested objects', () => {
      const obj: any = {};
      set(obj, 'a.b.c.d', 'value');
      expect(obj.a.b.c.d).toBe('value');
    });

    test('should return the object', () => {
      const obj: any = {};
      const result = set(obj, 'a', 1);
      expect(result).toBe(obj);
    });
  });

  describe('has()', () => {
    test('should return true for existing path', () => {
      const obj = { a: { b: { c: 3 } } };
      expect(has(obj, 'a.b.c')).toBe(true);
    });

    test('should return false for non-existent path', () => {
      const obj = { a: { b: 2 } };
      expect(has(obj, 'a.c')).toBe(false);
    });

    test('should handle array path', () => {
      const obj = { a: { b: 2 } };
      expect(has(obj, ['a', 'b'])).toBe(true);
    });

    test('should return false for undefined path', () => {
      const obj = { a: 1 };
      expect(has(obj, undefined as any)).toBe(false);
    });

    test('should return false for null path', () => {
      const obj = { a: 1 };
      expect(has(obj, null as any)).toBe(false);
    });

    test('should return false for null object', () => {
      expect(has(null, 'a')).toBe(false);
    });

    test('should return true for falsy but defined values', () => {
      const obj = { a: { b: 0 } };
      expect(has(obj, 'a.b')).toBe(true);
    });
  });

  describe('pick()', () => {
    test('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });

    test('should ignore non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1 });
    });

    test('should return empty object for empty keys', () => {
      const obj = { a: 1, b: 2 };
      expect(pick(obj, [])).toEqual({});
    });

    test('should return empty object for null object', () => {
      expect(pick(null, ['a'])).toEqual({});
    });
  });

  describe('find()', () => {
    test('should find element with predicate function', () => {
      const arr = [1, 2, 3, 4];
      expect(find(arr, (n) => n > 2)).toBe(3);
    });

    test('should find element with object matching', () => {
      const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
      expect(find(arr, { a: 2 })).toEqual({ a: 2 });
    });

    test('should find element with multiple properties', () => {
      const arr = [
        { a: 1, b: 2 },
        { a: 2, b: 2 },
        { a: 2, b: 3 }
      ];
      expect(find(arr, { a: 2, b: 3 })).toEqual({ a: 2, b: 3 });
    });

    test('should return undefined when not found with predicate', () => {
      const arr = [1, 2, 3];
      expect(find(arr, (n) => n > 10)).toBeUndefined();
    });

    test('should return undefined when not found with object', () => {
      const arr = [{ a: 1 }, { a: 2 }];
      expect(find(arr, { a: 3 })).toBeUndefined();
    });

    test('should return undefined for non-array', () => {
      expect(find(null as any, (_x) => true)).toBeUndefined();
    });
  });

  describe('size()', () => {
    test('should return size of array', () => {
      expect(size([1, 2, 3])).toBe(3);
    });

    test('should return size of object', () => {
      expect(size({ a: 1, b: 2 })).toBe(2);
    });

    test('should return size of string', () => {
      expect(size('hello')).toBe(5);
    });

    test('should return 0 for null', () => {
      expect(size(null)).toBe(0);
    });

    test('should return 0 for undefined', () => {
      expect(size(undefined)).toBe(0);
    });

    test('should return 0 for empty array', () => {
      expect(size([])).toBe(0);
    });

    test('should return 0 for empty object', () => {
      expect(size({})).toBe(0);
    });
  });

  describe('merge()', () => {
    test('should merge two objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3 };
      expect(merge(obj1, obj2)).toEqual({ a: 1, b: 2, c: 3 });
    });

    test('should deep merge nested objects', () => {
      const obj1 = { a: { b: 1, c: 2 } };
      const obj2 = { a: { c: 3, d: 4 } };
      expect(merge(obj1, obj2)).toEqual({ a: { b: 1, c: 3, d: 4 } });
    });

    test('should overwrite arrays', () => {
      const obj1 = { a: [1, 2] };
      const obj2 = { a: [3, 4] };
      expect(merge(obj1, obj2)).toEqual({ a: [3, 4] });
    });

    test('should merge multiple sources', () => {
      const obj1 = { a: 1 };
      const obj2 = { b: 2 };
      const obj3 = { c: 3 };
      expect(merge(obj1, obj2, obj3)).toEqual({ a: 1, b: 2, c: 3 });
    });

    test('should handle null source', () => {
      const obj1 = { a: 1 };
      expect(merge(obj1, null)).toEqual({ a: 1 });
    });
  });

  describe('isUndefined()', () => {
    test('should return true for undefined', () => {
      expect(isUndefined(undefined)).toBe(true);
    });

    test('should return false for null', () => {
      expect(isUndefined(null)).toBe(false);
    });

    test('should return false for 0', () => {
      expect(isUndefined(0)).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(isUndefined('')).toBe(false);
    });

    test('should return false for false', () => {
      expect(isUndefined(false)).toBe(false);
    });
  });

  describe('isNil()', () => {
    test('should return true for null', () => {
      expect(isNil(null)).toBe(true);
    });

    test('should return true for undefined', () => {
      expect(isNil(undefined)).toBe(true);
    });

    test('should return false for 0', () => {
      expect(isNil(0)).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(isNil('')).toBe(false);
    });

    test('should return false for false', () => {
      expect(isNil(false)).toBe(false);
    });
  });

  describe('isNumber()', () => {
    test('should return true for numbers', () => {
      expect(isNumber(3)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    test('should return true for NaN', () => {
      expect(isNumber(NaN)).toBe(true);
    });

    test('should return false for string numbers', () => {
      expect(isNumber('3')).toBe(false);
    });

    test('should return false for null', () => {
      expect(isNumber(null)).toBe(false);
    });

    test('should return false for undefined', () => {
      expect(isNumber(undefined)).toBe(false);
    });
  });

  describe('sortBy()', () => {
    test('should sort by single property', () => {
      const arr = [{ a: 2 }, { a: 1 }, { a: 3 }];
      expect(sortBy(arr, 'a')).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
    });

    test('should sort by array of properties', () => {
      const arr = [
        { a: 2, b: 1 },
        { a: 1, b: 2 },
        { a: 1, b: 1 }
      ];
      expect(sortBy(arr, ['a', 'b'])).toEqual([
        { a: 1, b: 1 },
        { a: 1, b: 2 },
        { a: 2, b: 1 }
      ]);
    });

    test('should sort in descending order', () => {
      const arr = [{ a: 1 }, { a: 3 }, { a: 2 }];
      expect(sortBy(arr, 'a', ['desc'])).toEqual([{ a: 3 }, { a: 2 }, { a: 1 }]);
    });

    test('should handle mixed sort orders', () => {
      const arr = [
        { a: 1, b: 2 },
        { a: 2, b: 1 },
        { a: 1, b: 1 }
      ];
      expect(sortBy(arr, ['a', 'b'], ['asc', 'desc'])).toEqual([
        { a: 1, b: 2 },
        { a: 1, b: 1 },
        { a: 2, b: 1 }
      ]);
    });

    test('should return empty array for non-array', () => {
      expect(sortBy(null as any, 'a')).toEqual([]);
    });

    test('should not modify original array', () => {
      const arr = [{ a: 2 }, { a: 1 }];
      sortBy(arr, 'a');
      expect(arr).toEqual([{ a: 2 }, { a: 1 }]);
    });
  });

  describe('orderBy()', () => {
    test('should work as alias for sortBy', () => {
      const arr = [{ a: 2 }, { a: 1 }];
      expect(orderBy(arr, ['a'], ['asc'])).toEqual([{ a: 1 }, { a: 2 }]);
    });
  });

  describe('indexOf()', () => {
    test('should return index of element', () => {
      expect(indexOf([1, 2, 3], 2)).toBe(1);
    });

    test('should return -1 when not found', () => {
      expect(indexOf([1, 2, 3], 4)).toBe(-1);
    });

    test('should return -1 for non-array', () => {
      expect(indexOf(null as any, 1)).toBe(-1);
    });
  });

  describe('includes()', () => {
    test('should return true when element exists', () => {
      expect(includes([1, 2, 3], 2)).toBe(true);
    });

    test('should return false when element does not exist', () => {
      expect(includes([1, 2, 3], 4)).toBe(false);
    });

    test('should return false for non-array', () => {
      expect(includes(null as any, 1)).toBe(false);
    });
  });

  describe('last()', () => {
    test('should return last element', () => {
      expect(last([1, 2, 3])).toBe(3);
    });

    test('should return undefined for empty array', () => {
      expect(last([])).toBeUndefined();
    });

    test('should return undefined for non-array', () => {
      expect(last(null as any)).toBeUndefined();
    });
  });

  describe('inRange()', () => {
    test('should return true when in range', () => {
      expect(inRange(3, 2, 4)).toBe(true);
    });

    test('should return false when equal to end', () => {
      expect(inRange(4, 2, 4)).toBe(false);
    });

    test('should return false when below range', () => {
      expect(inRange(1, 2, 4)).toBe(false);
    });

    test('should return false when above range', () => {
      expect(inRange(5, 2, 4)).toBe(false);
    });

    test('should return true when equal to start', () => {
      expect(inRange(2, 2, 4)).toBe(true);
    });

    test('should return false for non-number', () => {
      expect(inRange('3' as any, 2, 4)).toBe(false);
    });
  });

  describe('chain()', () => {
    test('should chain map operations', () => {
      const result = chain([1, 2, 3])
        .map((n) => n * 2)
        .value();
      expect(result).toEqual([2, 4, 6]);
    });

    test('should chain filter operations', () => {
      const result = chain([1, 2, 3, 4])
        .filter((n) => n > 2)
        .value();
      expect(result).toEqual([3, 4]);
    });

    test('should chain sortBy operations', () => {
      const result = chain([{ a: 2 }, { a: 1 }])
        .sortBy('a')
        .value();
      expect(result).toEqual([{ a: 1 }, { a: 2 }]);
    });

    test('should chain multiple operations', () => {
      const result = chain([1, 2, 3, 4])
        .map((n) => n * 2)
        .filter((n) => n > 4)
        .value();
      expect(result).toEqual([6, 8]);
    });

    test('should support thru operation', () => {
      const result = chain([1, 2, 3])
        .thru((arr) => arr.length)
        .value();
      expect(result).toBe(3);
    });

    test('should support find operation', () => {
      const result = chain([1, 2, 3, 4])
        .find((n) => n > 2)
        .value();
      expect(result).toBe(3);
    });

    test('should support size operation', () => {
      const result = chain([1, 2, 3]).size().value();
      expect(result).toBe(3);
    });

    test('should support pick operation', () => {
      const result = chain({ a: 1, b: 2, c: 3 }).pick(['a', 'c']).value();
      expect(result).toEqual({ a: 1, c: 3 });
    });

    test('should support get operation', () => {
      const result = chain({ a: { b: 2 } })
        .get('a.b')
        .value();
      expect(result).toBe(2);
    });

    test('should support has operation', () => {
      const result = chain({ a: { b: 2 } })
        .has('a.b')
        .value();
      expect(result).toBe(true);
    });
  });
});
