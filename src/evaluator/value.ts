import { BlockStatement, Identifier } from "../ast/ast";

export type ValueType =
    | "INTEGER"
    | "BOOLEAN"
    | "NULL"
    | "RETURN_VALUE"
    | "FUNCTION";

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

export class ReturnValue implements Value {
    type = "RETURN_VALUE" as const;
    innerValue: Value;

    constructor(innerValue: Value) {
        this.innerValue = innerValue;
    }

    inspect() {
        return `RETURN_VALUE<${this.innerValue.inspect()}>`;
    }
}

export class FunctionValue implements Value {
    type = "FUNCTION" as const;

    parameters: Identifier[];
    body: BlockStatement;
    env: Environment;

    constructor(
        parameters: Identifier[],
        body: BlockStatement,
        env: Environment
    ) {
        this.parameters = parameters;
        this.body = body;
        this.env = env;
    }
    inspect() {
        return `fn (${this.parameters
            .map((x) => x.display())
            .join(", ")}) ${this.body.display()}`;
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

export class Environment {
    scope: Map<string, Value> = new Map();
    parentEnv: Environment | undefined;

    static withParent(parentEnv: Environment) {
        const env = new Environment();
        env.parentEnv = parentEnv;
        return env;
    }

    getIdentifier = (name: string): Value | undefined => {
        const value = this.scope.get(name);
        if (!value && this.parentEnv) {
            return this.parentEnv.getIdentifier(name);
        }
        return value;
    };

    setIdentifier = (name: string, val: Value) => {
        return this.scope.set(name, val);
    };
}

export const TRUE = new Bool(true);
export const FALSE = new Bool(false);
export const NULL = new Null();
