import { assert } from "vitest";
import {
    BooleanLiteral,
    Expression,
    Identifier,
    IntegerLiteral,
    Node,
} from "./ast";

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

export function assertLiteral(
    expression: Expression,
    expectedValue: number | string | boolean
) {
    const expectedType = typeof expectedValue;

    if (expectedType === "number") {
        assertNodeType(expression, IntegerLiteral);
        assert.equal(expression.value, expectedValue);
    } else if (expectedType === "string") {
        assertNodeType(expression, Identifier);
        assert.equal(expression.value, expectedValue);
    } else if (expectedType === "boolean") {
        assertNodeType(expression, BooleanLiteral);
        assert.equal(expression.value, expectedValue);
    } else {
        throw new Error(
            `Unknown literal type "${expectedType}" of expected value "${expectedValue}"`
        );
    }
}
