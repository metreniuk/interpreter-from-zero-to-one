import { assert, it } from "vitest";
import { Lexer } from "../lexer/lexer";
import { Parser } from "./parser";
import { LetStatement } from "../ast/ast";

it("parses let statements", () => {
    const input = `
        let x = 5;
        let y = 10;
        let foobar = 838383;
   `;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 3);

    const expectedNames = ["x", "y", "foobar"];

    for (let i in program.statements) {
        const statement = program.statements[i];
        const name = expectedNames[i];

        if (statement instanceof LetStatement) {
            assert.equal(statement.name.value, name);
        } else {
            throw new Error(
                `Node "${statement.display()}" is not an instance of "LetStatement"`
            );
        }
    }
});
