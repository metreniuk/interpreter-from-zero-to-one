import { assert, it } from "vitest";
import { Lexer } from "../lexer/lexer";
import { Parser } from "./parser";
import {
    CallExpression,
    ExpressionStatement,
    FunctionLiteral,
    IfExpression,
    InfixExpression,
    LetStatement,
    PrefixExpression,
    ReturnStatement,
} from "../ast/ast";
import { assertInfix, assertLiteral, assertNodeType } from "../ast/utils";

it("parses let statements", () => {
    const inputs = [
        { input: `let x = 5;`, name: "x", value: 5 },
        { input: `let y = true;`, name: "y", value: true },
        { input: `let foobar = x;`, name: "foobar", value: "x" },
    ];

    for (let { name, value, input } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        const statement = program.statements[0];

        assertNodeType(statement, LetStatement);
        assert.equal(statement.name.value, name);
        assertLiteral(statement.value, value);
    }
});

it("parses return statements", () => {
    const inputs = [
        { input: `return 5;`, value: 5 },
        { input: `return true;`, value: true },
        { input: `return x;`, value: "x" },
    ];

    for (let { input, value } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        const statement = program.statements[0];
        assertNodeType(statement, ReturnStatement);
        assertLiteral(statement.returnValue, value);
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
    assertLiteral(statement.expression, "foobar");
});

it("parses integer literal expressions", () => {
    const input = `5;`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 1);

    const statement = program.statements[0];

    assertNodeType(statement, ExpressionStatement);

    assertLiteral(statement.expression, 5);
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

        assertLiteral(statement.expression.right, value);
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
        {
            input: "true == true;",
            leftValue: true,
            operator: "==",
            rightValue: true,
        },
        {
            input: "true != false;",
            leftValue: true,
            operator: "!=",
            rightValue: false,
        },
        {
            input: "false == false;",
            leftValue: false,
            operator: "==",
            rightValue: false,
        },
    ];
    for (const { input, operator, leftValue, rightValue } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        assert.equal(program.statements.length, 1);
        const statement = program.statements[0];
        assertNodeType(statement, ExpressionStatement);

        assertInfix(statement.expression, leftValue, operator, rightValue);
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
        {
            input: "3 > 5 == false",
            expected: "((3 > 5) == false)",
        },
        {
            input: "3 < 5 == true",
            expected: "((3 < 5) == true)",
        },
        {
            input: "1 + (2 + 3) + 4",
            expected: "((1 + (2 + 3)) + 4)",
        },
        {
            input: "(5 + 5) * 2",
            expected: "((5 + 5) * 2)",
        },
        {
            input: "2 / (5 + 5)",
            expected: "(2 / (5 + 5))",
        },
        {
            input: "-(5 + 5)",
            expected: "(-(5 + 5))",
        },
        {
            input: "!(true == true)",
            expected: "(!(true == true))",
        },
        {
            input: "a + add(b * c) + d",
            expected: "((a + add((b * c))) + d)",
        },
        {
            input: "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
            expected: "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
        },
        {
            input: "add(a + b + c * d / f + g)",
            expected: "add((((a + b) + ((c * d) / f)) + g))",
        },
    ];

    for (const { input, expected } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        assert.equal(program.display(), expected);
    }
});

it("parses if expressions", () => {
    const input = `if (x < y) { x }`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 1);
    const statement = program.statements[0];

    assertNodeType(statement, ExpressionStatement);

    const { expression } = statement;
    assertNodeType(expression, IfExpression);
    assertInfix(expression.condition, "x", "<", "y");

    assert.equal(expression.consequence.statements.length, 1);
    assertNodeType(expression.consequence.statements[0], ExpressionStatement);
    assertLiteral(expression.consequence.statements[0].expression, "x");
});

it("parses if expressions with alternative", () => {
    const input = `if (x < y) { x } else { y }`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 1);
    const statement = program.statements[0];

    assertNodeType(statement, ExpressionStatement);

    const { expression } = statement;
    assertNodeType(expression, IfExpression);
    assertInfix(expression.condition, "x", "<", "y");

    assert.equal(expression.consequence.statements.length, 1);
    assertNodeType(expression.consequence.statements[0], ExpressionStatement);
    assertLiteral(expression.consequence.statements[0].expression, "x");

    assert.equal(expression.alternative!.statements.length, 1);
    assertNodeType(expression.alternative!.statements[0], ExpressionStatement);
    assertLiteral(expression.alternative!.statements[0].expression, "y");
});

it("parses function literals", () => {
    const input = `fn(x, y) { x + y; }`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assertNodeType(program.statements[0], ExpressionStatement);
    const { expression } = program.statements[0];

    assertNodeType(expression, FunctionLiteral);
    assertLiteral(expression.parameters[0], "x");
    assertLiteral(expression.parameters[1], "y");

    assertNodeType(expression.body.statements[0], ExpressionStatement);
    const { expression: innerExpression } = expression.body.statements[0];

    assertNodeType(innerExpression, InfixExpression);
    assertInfix(innerExpression, "x", "+", "y");
});

it("parses function parameters", () => {
    const inputs = [
        { input: `fn() {}`, expectedParameters: [] },
        { input: `fn(x) {}`, expectedParameters: ["x"] },
        { input: `fn(x, y) {}`, expectedParameters: ["x", "y"] },
    ];

    for (const { input, expectedParameters } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        assertNodeType(program.statements[0], ExpressionStatement);
        const { expression } = program.statements[0];
        assertNodeType(expression, FunctionLiteral);
        assert.equal(expression.parameters.length, expectedParameters.length);

        expectedParameters.forEach((param, i) => {
            assertLiteral(expression.parameters[i], param);
        });
    }
});

it("parses call expressions", () => {
    const input = `add(1, 2 + 3, 4 * 5);`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assertNodeType(program.statements[0], ExpressionStatement);
    const { expression } = program.statements[0];
    assertNodeType(expression, CallExpression);

    assertLiteral(expression.callee, "add");
    assertLiteral(expression.args[0], 1);
    assertInfix(expression.args[1], 2, "+", 3);
    assertInfix(expression.args[2], 4, "*", 5);
});
