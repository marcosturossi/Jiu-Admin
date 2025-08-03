type JsonObject = Record<string, any>;

export class FromJsonToArray {
    private _keys: string[] = [];
    private _values: any[][] = [];

    constructor(data: JsonObject[]) {
        // Filter keys based on the provided columns
        this._keys = Object.keys(data[0])

        // Map values only for the filtered keys
        this._values = data.map(item => Object.values(item)) ;
    }

    get keys(): string[] {
        return this._keys;
    }

    get values(): any[][] {
        return this._values;
    }

    get keysAndValues(): any[] {
        return [this._keys, ...this._values]; // Return keys as first element followed by values
    }
}