import { assert, it } from "vitest";
import { assertValueType, Bool, Integer, Value } from "./value";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { evaluate } from "./evaluator";

it("evaluates integers", () => {
    const inputs = [
        { input: "5", expected: 5 },
        { input: "10", expected: 10 },
    ];

    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

it("evaluates booleans", () => {
    const inputs = [
        { input: "true", expected: true },
        { input: "false", expected: false },
    ];

    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

it("evaluates logical negation", () => {
    const inputs = [
        { input: "!true", expected: false },
        { input: "!false", expected: true },
        { input: "!5", expected: false },
        { input: "!!true", expected: true },
        { input: "!!false", expected: false },
        { input: "!!5", expected: true },
    ];
    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

function assertValue(value: Value, expectedValue: boolean | number) {
    const expectedType = typeof expectedValue;
    if (expectedType === "boolean") {
        assertValueType(value, Bool);
        assert.equal(value.value, expectedValue);
    } else if (expectedType === "number") {
        assertValueType(value, Integer);
        assert.equal(value.value, expectedValue);
    }
}

export function evaluateProgram(input: string): Value {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    return evaluate(program);
}
