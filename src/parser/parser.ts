import { Lexer, Token, TokenKind } from "../lexer/lexer";
import {
    Expression,
    ExpressionStatement,
    Identifier,
    IntegerLiteral,
    LetStatement,
    PrefixExpression,
    Program,
    ReturnStatement,
    Statement,
} from "../ast/ast";

type PrefixParseFn = () => Expression;
type InfixParseFn = (left: Expression) => Expression;

export class Parser {
    currToken!: Token;
    peekToken!: Token;
    prefixParseFns: Map<TokenKind, PrefixParseFn> = new Map();
    infixParseFns: Map<TokenKind, InfixParseFn> = new Map();

    constructor(public lexer: Lexer) {
        this.nextToken();
        this.nextToken();

        // set-up prefix functions
        this.prefixParseFns.set(TokenKind.IDENT, this.parseIdentifier);
        this.prefixParseFns.set(TokenKind.INT, this.parseIntegerLiteral);
        this.prefixParseFns.set(TokenKind.BANG, this.parsePrefixExpression);
        this.prefixParseFns.set(TokenKind.MINUS, this.parsePrefixExpression);
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
        if (this.currTokenIs(TokenKind.RETURN)) {
            return this.parseReturnStatement();
        }
        return this.parseExpressionStatement();
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

    parseIdentifier = (): Identifier => {
        return new Identifier(this.currToken.literal);
    };

    // return <expression>;
    parseReturnStatement(): ReturnStatement {
        this.expectToken(TokenKind.RETURN);

        // TODO: parse expression
        while (!this.currTokenIs(TokenKind.SEMICOLON)) {
            this.nextToken();
        }

        return new ReturnStatement(undefined!);
    }

    parseExpressionStatement(): ExpressionStatement {
        const expression = this.parseExpression();

        // Note: support missing semicolons for the REPL
        if (this.peekTokenIs(TokenKind.SEMICOLON)) {
            this.nextToken();
        }

        return new ExpressionStatement(expression);
    }

    parseExpression(): Expression {
        const prefixFn = this.prefixParseFns.get(this.currToken.kind);
        if (!prefixFn) {
            throw new Error(
                `No prefix function for token ${this.currToken.kind}`
            );
        }
        const leftExpr = prefixFn();
        return leftExpr;
    }

    parseIntegerLiteral = (): IntegerLiteral => {
        const value = parseInt(this.currToken.literal, 10);
        if (!Number.isInteger(value)) {
            throw new Error(
                `Unknown IntegerLiteral "${this.currToken.literal}"`
            );
        }
        return new IntegerLiteral(value);
    };

    // !10
    // -5
    parsePrefixExpression = (): PrefixExpression => {
        const operator = this.currToken.literal;
        this.nextToken();
        const right = this.parseExpression();
        return new PrefixExpression(operator, right);
    };
}
