import { Node } from "./ast";

export function assertNodeType<T extends Node>(
    value: Node,
    ExpectedClass: new (...args: any[]) => T
): asserts value is T {
    if (!(value instanceof ExpectedClass)) {
        throw new Error(
            `Node "${value.display?.() ?? value}" is not an instance of ${
                ExpectedClass.name
            }`
        );
    }
}
