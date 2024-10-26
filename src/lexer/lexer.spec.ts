import { assert, it } from "vitest";
import { Lexer, TokenKind } from "./lexer";

it("tokenizes operators and delimiters", () => {
    const lexer = new Lexer("=+(){},;");

    const tokens = [
        [TokenKind.ASSIGN, "="],
        [TokenKind.PLUS, "+"],
        [TokenKind.LPAREN, "("],
        [TokenKind.RPAREN, ")"],
        [TokenKind.LBRACE, "{"],
        [TokenKind.RBRACE, "}"],
        [TokenKind.COMMA, ","],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.EOF, "<EOF>"],
    ];
    for (let [token, literal] of tokens) {
        const nextToken = lexer.nextToken();
        assert.deepEqual({ kind: token, literal }, nextToken);
    }
});
