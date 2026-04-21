import { asSingleParam, parseAgeFromDob, parseCategoryIdsParam } from '@/services/signup-flow';

describe('signup-flow helpers', () => {
  it('extracts single params and ignores arrays', () => {
    expect(asSingleParam('hello')).toBe('hello');
    expect(asSingleParam(['a', 'b'])).toBeUndefined();
    expect(asSingleParam(undefined)).toBeUndefined();
  });

  it('parses valid DOB to positive age', () => {
    const age = parseAgeFromDob('01/01/2000');
    expect(age).not.toBeNull();
    expect(age).toBeGreaterThan(0);
  });

  it('rejects malformed DOB values', () => {
    expect(parseAgeFromDob('')).toBeNull();
    expect(parseAgeFromDob('2020-01-01')).toBeNull();
    expect(parseAgeFromDob('13/99/2050')).toBeNull();
  });

  it('parses category ids from JSON array', () => {
    expect(parseCategoryIdsParam('[1,2,3]')).toEqual([1, 2, 3]);
    expect(parseCategoryIdsParam('[1,"2",3]')).toEqual([1, 3]);
  });

  it('returns empty list for invalid category param', () => {
    expect(parseCategoryIdsParam(undefined)).toEqual([]);
    expect(parseCategoryIdsParam('not-json')).toEqual([]);
    expect(parseCategoryIdsParam('{"a":1}')).toEqual([]);
  });
});
