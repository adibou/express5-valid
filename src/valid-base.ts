import ValidNumber from "./valid-number";
import ValidString from "./valid-string";
import ValidBoolean from "./valid-boolean";
import ValidArray from "./valid-array";
import ValidDate from "./valid-date";
import ValidEnum from "./valid-enum";
import ValidObject, { type ObjectValidator } from "./valid-object";

export default class ValidBase {
    private _value: unknown;
    private _name: string;

    constructor(value: unknown, name: string) {
        this._value = value;
        this._name = name;
    }

    get number(): ValidNumber {
        return new ValidNumber(this._value, this._name);
    }

    get string(): ValidString {
        return new ValidString(this._value, this._name);
    }

    get boolean(): ValidBoolean {
        return new ValidBoolean(this._value, this._name);
    }

    get array(): ValidArray {
        return new ValidArray(this._value, this._name);
    }

    get date(): ValidDate {
        return new ValidDate(this._value, this._name);
    }

    enum<V extends string | number>(allowedValues: V[]): ValidEnum<V> {
        return new ValidEnum<V>(this._value, this._name, allowedValues);
    }

    object<T>(validator: ObjectValidator<T>): ValidObject<T> {
        return new ValidObject<T>(this._value, this._name, validator);
    }
}
