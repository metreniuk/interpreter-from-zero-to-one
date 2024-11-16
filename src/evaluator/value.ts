export type ValueType = "INTEGER" | "BOOLEAN" | "NULL";

export interface Value {
    type: ValueType;
    inspect(): string;
}

export class Integer implements Value {
    type = "INTEGER" as const;
    value: number;

    constructor(value: number) {
        this.value = value;
    }

    inspect() {
        return `INTEGER<${this.value}>`;
    }
}

export class Bool implements Value {
    type = "BOOLEAN" as const;
    value: boolean;

    constructor(value: boolean) {
        this.value = value;
    }

    inspect() {
        return `BOOLEAN<${this.value}>`;
    }
}

export class Null implements Value {
    type = "NULL" as const;
    value = null;

    constructor() {}
    inspect() {
        return `NULL`;
    }
}

export function assertValueType<T extends Value>(
    value: Value,
    ExpectedClass: new (...args: any[]) => T
): asserts value is T {
    if (!(value instanceof ExpectedClass)) {
        throw new Error(
            `Value "${value.inspect?.() ?? value}" is not an instance of ${
                ExpectedClass.name
            }`
        );
    }
}
