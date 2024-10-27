import { assert, it } from "vitest";
import { Lexer, TokenKind } from "./lexer";

it("tokenizes operators and delimiters", () => {
    const input = `
        =+(){},;
        !-/*5;
        5 < 10 > 5;
        10 == 10; 
        10 != 9;
    `;
    const lexer = new Lexer(input);

    const tokens = [
        [TokenKind.ASSIGN, "="],
        [TokenKind.PLUS, "+"],
        [TokenKind.LPAREN, "("],
        [TokenKind.RPAREN, ")"],
        [TokenKind.LBRACE, "{"],
        [TokenKind.RBRACE, "}"],
        [TokenKind.COMMA, ","],
        [TokenKind.SEMICOLON, ";"],
        // more
        [TokenKind.BANG, "!"],
        [TokenKind.MINUS, "-"],
        [TokenKind.SLASH, "/"],
        [TokenKind.ASTERISK, "*"],
        [TokenKind.INT, "5"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.INT, "5"],
        [TokenKind.LT, "<"],
        [TokenKind.INT, "10"],
        [TokenKind.GT, ">"],
        [TokenKind.INT, "5"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.INT, "10"],
        [TokenKind.EQ, "=="],
        [TokenKind.INT, "10"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.INT, "10"],
        [TokenKind.NOT_EQ, "!="],
        [TokenKind.INT, "9"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.EOF, "<EOF>"],
    ];
    for (let [token, literal] of tokens) {
        const nextToken = lexer.nextToken();
        assert.deepEqual({ kind: token, literal }, nextToken);
    }
});

it("tokenizes keywords and identifiers", () => {
    const input = `
    let add = fn(x, y) {
        x + y;
    };
    let result = add(5, 10);
    if (5 < 10) {
        return true;
    } else {
        return false;
    }
    `;
    const lexer = new Lexer(input);

    const tokens = [
        [TokenKind.LET, "let"],
        [TokenKind.IDENT, "add"],
        [TokenKind.ASSIGN, "="],
        [TokenKind.FUNCTION, "fn"],
        [TokenKind.LPAREN, "("],
        [TokenKind.IDENT, "x"],
        [TokenKind.COMMA, ","],
        [TokenKind.IDENT, "y"],
        [TokenKind.RPAREN, ")"],
        [TokenKind.LBRACE, "{"],
        [TokenKind.IDENT, "x"],
        [TokenKind.PLUS, "+"],
        [TokenKind.IDENT, "y"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.RBRACE, "}"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.LET, "let"],
        [TokenKind.IDENT, "result"],
        [TokenKind.ASSIGN, "="],
        [TokenKind.IDENT, "add"],
        [TokenKind.LPAREN, "("],
        [TokenKind.INT, "5"],
        [TokenKind.COMMA, ","],
        [TokenKind.INT, "10"],
        [TokenKind.RPAREN, ")"],
        [TokenKind.SEMICOLON, ";"],
        // more
        [TokenKind.IF, "if"],
        [TokenKind.LPAREN, "("],
        [TokenKind.INT, "5"],
        [TokenKind.LT, "<"],
        [TokenKind.INT, "10"],
        [TokenKind.RPAREN, ")"],
        [TokenKind.LBRACE, "{"],
        [TokenKind.RETURN, "return"],
        [TokenKind.TRUE, "true"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.RBRACE, "}"],
        [TokenKind.ELSE, "else"],
        [TokenKind.LBRACE, "{"],
        [TokenKind.RETURN, "return"],
        [TokenKind.FALSE, "false"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.RBRACE, "}"],
        [TokenKind.EOF, "<EOF>"],
    ];
    for (let [token, literal] of tokens) {
        const nextToken = lexer.nextToken();
        assert.deepEqual({ kind: token, literal }, nextToken);
    }
});
