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
    keywords: Record<string, TokenKind> = {
        let: TokenKind.LET,
        fn: TokenKind.FUNCTION,
    };

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

    skipWhitespace() {
        while (isWhitespace(this.char)) {
            this.advance();
        }
    }

    readIdentifier(): Token {
        const start = this.position;
        while (isLetter(this.char)) {
            this.advance();
        }
        const literal = this.input.slice(start, this.position);
        const keyword = this.keywords[literal];
        if (keyword) {
            return this.createToken(keyword, literal);
        }
        return this.createToken(TokenKind.IDENT, literal);
    }

    readInteger(): Token {
        const start = this.position;
        while (isDigit(this.char)) {
            this.advance();
        }
        const literal = this.input.slice(start, this.position);
        return this.createToken(TokenKind.INT, literal);
    }

    nextToken(): Token {
        let token: Token;

        this.skipWhitespace();

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
                if (isLetter(this.char)) {
                    token = this.readIdentifier();
                    return token;
                }
                if (isDigit(this.char)) {
                    token = this.readInteger();
                    return token;
                }
                token = this.createToken(TokenKind.ILLEGAL, this.char);
        }

        this.advance();

        return token;
    }
}

function isWhitespace(char: string) {
    return char === " " || char === "\r" || char === "\t" || char === "\n";
}

function isLetter(char: string) {
    return (
        (char.charCodeAt(0) >= "a".charCodeAt(0) &&
            char.charCodeAt(0) <= "z".charCodeAt(0)) ||
        (char.charCodeAt(0) >= "A".charCodeAt(0) &&
            char.charCodeAt(0) <= "Z".charCodeAt(0)) ||
        char === "_"
    );
}

function isDigit(char: string) {
    return (
        char.charCodeAt(0) >= "0".charCodeAt(0) &&
        char.charCodeAt(0) <= "9".charCodeAt(0)
    );
}