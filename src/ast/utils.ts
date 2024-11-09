import { assert } from "vitest";
import {
    BooleanLiteral,
    Expression,
    Identifier,
    InfixExpression,
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
    expectedValue: ExpectedNodeValue
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

export type ExpectedNodeValue = number | string | boolean;

export function assertInfix(
    expression: Expression,
    leftValue: ExpectedNodeValue,
    operator: string,
    rightValue: ExpectedNodeValue
) {
    assertNodeType(expression, InfixExpression);
    assert.equal(expression.operator, operator);
    assertLiteral(expression.left, leftValue);
    assertLiteral(expression.right, rightValue);
}
