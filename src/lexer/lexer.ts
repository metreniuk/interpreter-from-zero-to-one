export const TokenKind = {
    ILLEGAL: "ILLEGAL",
    EOF: "EOF",
    // Identifiers + literals
    IDENT: "IDENT", // add, foobar, x, y, ...
    INT: "INT", // 1343456
    // Operators
    ASSIGN: "=",
    PLUS: "+",
    // Delimiters
    COMMA: ",",
    SEMICOLON: ";",
    LPAREN: "(",
    RPAREN: ")",
    LBRACE: "{",
    RBRACE: "}",
    // Keywords
    FUNCTION: "FUNCTION",
    LET: "LET",
} as const;
type TokenKindKey = keyof typeof TokenKind;
type TokenKind = (typeof TokenKind)[TokenKindKey];

type Token = {
    kind: TokenKind;
    literal: string;
};

export class Lexer {
    input: string;
    position: number = 0;
    char: string = "";

    constructor(input: string) {
        this.input = input;
        this.char = input[0] ?? "";
    }

    advance() {
        this.position++;
        this.char = this.input[this.position] ?? "";
    }

    createToken(kind: TokenKind, literal?: string): Token {
        return { kind, literal: literal ?? kind };
    }

    nextToken(): Token {
        let token: Token;

        switch (this.char) {
            case "=":
                token = this.createToken(TokenKind.ASSIGN);
                break;
            case "+":
                token = this.createToken(TokenKind.PLUS);
                break;
            case ",":
                token = this.createToken(TokenKind.COMMA);
                break;
            case ";":
                token = this.createToken(TokenKind.SEMICOLON);
                break;
            case "(":
                token = this.createToken(TokenKind.LPAREN);
                break;
            case ")":
                token = this.createToken(TokenKind.RPAREN);
                break;
            case "{":
                token = this.createToken(TokenKind.LBRACE);
                break;
            case "}":
                token = this.createToken(TokenKind.RBRACE);
                break;
            case "":
                token = this.createToken(TokenKind.EOF, "<EOF>");
                break;
            default:
                token = this.createToken(TokenKind.ILLEGAL, this.char);
        }

        this.advance();

        return token;
    }
}
