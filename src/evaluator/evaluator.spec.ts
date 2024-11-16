import { assert, it } from "vitest";
import { assertValueType, Integer, Value } from "./value";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { evaluate } from "./evaluator";

it("evaluates integers", () => {
    const value = evaluateProgram("5");

    assertValueType(value, Integer);
    assert.equal(value.value, 5);
});

export function evaluateProgram(input: string): Value {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    return evaluate(program);
}
