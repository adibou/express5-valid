import { describe, it, expect } from 'vitest';
import ValidBase from '../src/valid-base';
import ValidNumber from '../src/valid-number';
import ValidString from '../src/valid-string';
import ValidBoolean from '../src/valid-boolean';
import ValidArray from '../src/valid-array';
import ValidDate from '../src/valid-date';
import ValidEnum from '../src/valid-enum';
import ValidObject from '../src/valid-object';

describe('ValidBase', () => {
    it('should create ValidNumber from .number', () => {
        const base = new ValidBase(42, 'age');
        const number = base.number;

        expect(number).toBeInstanceOf(ValidNumber);
        expect(number.value).toBe(42);
    });

    it('should create ValidString from .string', () => {
        const base = new ValidBase('hello', 'name');
        const string = base.string;

        expect(string).toBeInstanceOf(ValidString);
        expect(string.value).toBe('hello');
    });

    it('should create ValidBoolean from .boolean', () => {
        const base = new ValidBase(true, 'active');
        const boolean = base.boolean;

        expect(boolean).toBeInstanceOf(ValidBoolean);
        expect(boolean.value).toBe(true);
    });

    it('should create ValidArray from .array', () => {
        const base = new ValidBase([1, 2, 3], 'items');
        const array = base.array;

        expect(array).toBeInstanceOf(ValidArray);
        expect(array.value).toEqual([1, 2, 3]);
    });

    it('should create ValidDate from .date', () => {
        const date = new Date('2024-01-15');
        const base = new ValidBase(date, 'createdAt');
        const dateValidator = base.date;

        expect(dateValidator).toBeInstanceOf(ValidDate);
        expect(dateValidator.value).toEqual(date);
    });

    it('should create ValidEnum from .enum()', () => {
        const base = new ValidBase('active', 'status');
        const enumValidator = base.enum(['active', 'inactive']);

        expect(enumValidator).toBeInstanceOf(ValidEnum);
        expect(enumValidator.value).toBe('active');
    });

    it('should create ValidObject from .object()', () => {
        const data = { name: 'John', age: 25 };
        const base = new ValidBase(data, 'user');
        const objectValidator = base.object((obj) => ({
            name: new ValidBase(obj['name'], 'name').string.required.value,
            age: new ValidBase(obj['age'], 'age').number.value
        }));

        expect(objectValidator).toBeInstanceOf(ValidObject);
        expect(objectValidator.value).toEqual({ name: 'John', age: 25 });
    });

    it('should support chaining after type selection', () => {
        const base = new ValidBase('  hello  ', 'name');
        const result = base.string.trim.required.value;

        expect(result).toBe('hello');
    });
});
