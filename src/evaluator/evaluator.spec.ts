import { assert, it } from "vitest";
import {
    assertValueType,
    Bool,
    Environment,
    Integer,
    Null,
    Value,
} from "./value";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { evaluate } from "./evaluator";

it("evaluates integers", () => {
    const inputs = [
        { input: "5", expected: 5 },
        { input: "10", expected: 10 },
        { input: "-5", expected: -5 },
        { input: "-10", expected: -10 },
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

it("evaluates integer expressions", () => {
    const inputs = [
        { input: "5 + 5 + 5 + 5 - 10", expected: 10 },
        { input: "2 * 2 * 2 * 2 * 2", expected: 32 },
        { input: "-50 + 100 + -50", expected: 0 },
        { input: "5 * 2 + 10", expected: 20 },
        { input: "5 + 2 * 10", expected: 25 },
        { input: "20 + 2 * -10", expected: 0 },
        { input: "50 / 2 * 2 + 10", expected: 60 },
        { input: "2 * (5 + 10)", expected: 30 },
        { input: "3 * 3 * 3 + 10", expected: 37 },
        { input: "3 * (3 * 3) + 10", expected: 37 },
        { input: "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50 },
    ];

    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

it("evaluates boolean expressions", () => {
    const inputs = [
        { input: "1 < 2", expected: true },
        { input: "1 > 2", expected: false },
        { input: "1 < 1", expected: false },
        { input: "1 > 1", expected: false },
        { input: "1 == 1", expected: true },
        { input: "1 != 1", expected: false },
        { input: "1 == 2", expected: false },
        { input: "1 != 2", expected: true },
        { input: "true == true", expected: true },
        { input: "false == false", expected: true },
        { input: "true == false", expected: false },
        { input: "true != false", expected: true },
        { input: "false != true", expected: true },
        { input: "(1 < 2) == true", expected: true },
        { input: "(1 < 2) == false", expected: false },
        { input: "(1 > 2) == true", expected: false },
        { input: "(1 > 2) == false", expected: true },
    ];

    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

it("evaluates if expressions", () => {
    const inputs = [
        { input: "if (true) { 10 }", expected: 10 },
        { input: "if (false) { 10 }", expected: null },
        { input: "if (1) { 10 }", expected: 10 },
        { input: "if (1 < 2) { 10 }", expected: 10 },
        { input: "if (1 > 2) { 10 }", expected: null },
        { input: "if (1 > 2) { 10 } else { 20 }", expected: 20 },
        { input: "if (1 < 2) { 10 } else { 20 }", expected: 10 },
    ];
    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

it("evaluates return statements", () => {
    const inputs = [
        { input: "return 10;", expected: 10 },
        { input: "return 10; 9;", expected: 10 },
        { input: "return 2 * 5; 9;", expected: 10 },
        { input: "9; return 2 * 5; 9;", expected: 10 },
        {
            input: `
            if (10 > 1) {
                if (10 > 1) {
                    return 10;
                }
                return 1; 
            }`,
            expected: 10,
        },
    ];
    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

it("evaluates let statements", () => {
    const inputs = [
        { input: "let a = 5; a;", expected: 5 },
        { input: "let a = 5 * 5; a;", expected: 25 },
        { input: "let a = 5; let b = a; b;", expected: 5 },
        { input: "let a = 5; let b = a; let c = a + b + 5; c;", expected: 15 },
    ];
    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

it("evaluates function application", () => {
    const inputs = [
        { input: "let identity = fn(x) { x; }; identity(5);", expected: 5 },
        {
            input: "let identity = fn(x) { return x; }; identity(5);",
            expected: 5,
        },
        { input: "let double = fn(x) { x * 2; }; double(5);", expected: 10 },
        { input: "let add = fn(x, y) { x + y; }; add(5, 5);", expected: 10 },
        {
            input: "let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));",
            expected: 20,
        },
        { input: "fn(x) { x; }(5)", expected: 5 },
        {
            input: `
            let x = 5;
            let f = fn() {
                let x = 3;
                return x; 
            };
            let y = f();
            x
            `,
            expected: 5,
        },
        {
            input: `
            let fa = fn(x, y) {
                return x + y;
            };
            let fb = fn(x, y) {
                let z = fa(x, y);
                return z + x;
            };
            fb(1, 2)`,
            expected: 4,
        },
        {
            input: `
            let newAdder = fn(x) {
                fn(y) { x + y };
            };
            let addTwo = newAdder(2);
            addTwo(2);`,
            expected: 4,
        },
    ];

    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

it("fibonacci", () => {
    const input = `
        let fibonacci = fn(x) {
            if (x < 2) {
                return x;
            }
            return fibonacci(x - 1) + fibonacci(x - 2);
        };
        fibonacci(10)
    `;

    const value = evaluateProgram(input);

    assertValue(value, 55);
});

it("factorial", () => {
    const input = `
        let factorial = fn(x) {
            if (x < 2) {
                return 1;
            }
            return x * factorial(x - 1);
        };
        factorial(10)
    `;

    const value = evaluateProgram(input);

    assertValue(value, 3628800);
});

function assertValue(value: Value, expectedValue: boolean | number | null) {
    const expectedType = typeof expectedValue;
    if (expectedType === "boolean") {
        assertValueType(value, Bool);
        assert.equal(value.value, expectedValue);
    } else if (expectedType === "number") {
        assertValueType(value, Integer);
        assert.equal(value.value, expectedValue);
    } else if (expectedValue === null) {
        assertValueType(value, Null);
        assert.equal(value.value, expectedValue);
    } else {
        throw new Error(
            `Unknown value type "${expectedType}" of expected value "${expectedValue}"`
        );
    }
}

export function evaluateProgram(input: string): Value {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    const env = new Environment();
    return evaluate(program, env);
}
