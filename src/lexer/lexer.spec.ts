import { assert, it } from "vitest";
import { Lexer, TokenKind } from "./lexer";

it("tokenizes operators and delimiters", () => {
    const input = `
        =+(){},;
        !-/*5;
        5 < 10 > 5;
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
    ];
    for (let [token, literal] of tokens) {
        const nextToken = lexer.nextToken();
        assert.deepEqual({ kind: token, literal }, nextToken);
    }
});
