import { Lexer, Token, TokenKind } from "../lexer/lexer";
import { Identifier, LetStatement, Program, Statement } from "../ast/ast";

export class Parser {
    currToken!: Token;
    peekToken!: Token;

    constructor(public lexer: Lexer) {
        this.nextToken();
        this.nextToken();
    }

    nextToken() {
        this.currToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }

    currTokenIs(kind: TokenKind) {
        return this.currToken.kind === kind;
    }

    peekTokenIs(kind: TokenKind) {
        return this.peekToken.kind === kind;
    }

    expectPeek(kind: TokenKind) {
        if (this.peekTokenIs(kind)) {
            this.nextToken();
        } else {
            throw new Error(
                `Expected peek token to be "${kind}", but got "${this.peekToken.kind}"`
            );
        }
    }

    expectToken(kind: TokenKind) {
        if (this.currTokenIs(kind)) {
            this.nextToken();
        } else {
            throw new Error(
                `Expected current token to be "${kind}", but got "${this.currToken.kind}"`
            );
        }
    }

    parseProgram(): Program {
        const statements = [];

        while (!this.currTokenIs(TokenKind.EOF)) {
            const statement = this.parseStatement();
            statements.push(statement);
            this.nextToken();
        }
        return new Program(statements);
    }

    parseStatement(): Statement {
        if (this.currTokenIs(TokenKind.LET)) {
            return this.parseLetStatement();
        }
        throw new Error(`Unknown statement "${this.currToken.kind}"`);
    }

    // let <identifier> = <expression>;
    parseLetStatement(): LetStatement {
        this.expectPeek(TokenKind.IDENT);
        const identifier = this.parseIdentifier();
        this.expectPeek(TokenKind.ASSIGN);

        // TODO: parse expression
        while (!this.currTokenIs(TokenKind.SEMICOLON)) {
            this.nextToken();
        }
        return new LetStatement(identifier, undefined!);
    }

    parseIdentifier(): Identifier {
        return new Identifier(this.currToken.literal);
    }
}
