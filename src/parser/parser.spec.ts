import { assert, it } from "vitest";
import { Lexer } from "../lexer/lexer";
import { Parser } from "./parser";
import {
    ExpressionStatement,
    Identifier,
    InfixExpression,
    LetStatement,
    PrefixExpression,
    ReturnStatement,
} from "../ast/ast";
import { assertIntegerLiteral, assertNodeType } from "../ast/utils";

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

        assertNodeType(statement, LetStatement);
        assert.equal(statement.name.value, name);
    }
});

it("parses return statements", () => {
    const input = `
        return 5;
        return 10;
        return 993322;
   `;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 3);

    for (let i in program.statements) {
        const statement = program.statements[i];
        assertNodeType(statement, ReturnStatement);
    }
});

it("parses identifier expressions", () => {
    const input = `foobar;`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    assert.equal(program.statements.length, 1);
    const statement = program.statements[0];

    assertNodeType(statement, ExpressionStatement);
    assertNodeType(statement.expression, Identifier);
    assert.equal(statement.expression.value, "foobar");
});

it("parses integer literal expressions", () => {
    const input = `5;`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 1);

    const statement = program.statements[0];

    assertNodeType(statement, ExpressionStatement);

    assertIntegerLiteral(statement.expression, 5);
});

it("parses prefix expression", () => {
    const inputs = [
        { input: "!5;", operator: "!", value: 5 },
        { input: "-15;", operator: "-", value: 15 },
    ];

    for (const { input, operator, value } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        assert.equal(program.statements.length, 1);

        const statement = program.statements[0];

        assertNodeType(statement, ExpressionStatement);
        assertNodeType(statement.expression, PrefixExpression);

        assert.equal(statement.expression.operator, operator);

        assertIntegerLiteral(statement.expression.right, value);
    }
});

it("parses infix expression", () => {
    const inputs = [
        { input: "5 + 5;", leftValue: 5, operator: "+", rightValue: 5 },
        { input: "5 - 5;", leftValue: 5, operator: "-", rightValue: 5 },
        { input: "5 * 5;", leftValue: 5, operator: "*", rightValue: 5 },
        { input: "5 / 5;", leftValue: 5, operator: "/", rightValue: 5 },
        { input: "5 > 5;", leftValue: 5, operator: ">", rightValue: 5 },
        { input: "5 < 5;", leftValue: 5, operator: "<", rightValue: 5 },
        { input: "5 == 5;", leftValue: 5, operator: "==", rightValue: 5 },
        { input: "5 != 5;", leftValue: 5, operator: "!=", rightValue: 5 },
    ];
    for (const { input, operator, leftValue, rightValue } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        assert.equal(program.statements.length, 1);
        const statement = program.statements[0];
        assertNodeType(statement, ExpressionStatement);
        assertNodeType(statement.expression, InfixExpression);

        assert.equal(statement.expression.operator, operator);
        assertIntegerLiteral(statement.expression.left, leftValue);
        assertIntegerLiteral(statement.expression.right, rightValue);
    }
});

it("parses expressions with precedence", () => {
    const inputs = [
        { input: "!-a", expected: "(!(-a))" },
        { input: "a + b / c", expected: "(a + (b / c))" },
        { input: "a * -b", expected: "(a * (-b))" },
        { input: "a + b + c", expected: "((a + b) + c)" },
        { input: "a + b - c", expected: "((a + b) - c)" },
        { input: "a * b * c", expected: "((a * b) * c)" },
        { input: "a * b / c", expected: "((a * b) / c)" },
        {
            input: "a + b * c + d / e - f",
            expected: "(((a + (b * c)) + (d / e)) - f)",
        },
        { input: "3 + 4; -5 * 5", expected: "(3 + 4)((-5) * 5)" },
        { input: "5 > 4 == 3 < 4", expected: "((5 > 4) == (3 < 4))" },
        { input: "5 < 4 != 3 > 4", expected: "((5 < 4) != (3 > 4))" },
        {
            input: "3 + 4 * 5 == 3 * 1 + 4 * 5",
            expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
        },
        {
            input: "3 + 4 * 5 == 3 * 1 + 4 * 5",
            expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
        },
    ];

    for (const { input, expected } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        assert.equal(program.display(), expected);
    }
});
