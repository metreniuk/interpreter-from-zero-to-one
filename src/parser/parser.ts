import { Lexer, Token, TokenKind } from "../lexer/lexer";
import {
    BooleanLiteral,
    Expression,
    ExpressionStatement,
    Identifier,
    InfixExpression,
    IntegerLiteral,
    LetStatement,
    PrefixExpression,
    Program,
    ReturnStatement,
    Statement,
} from "../ast/ast";

type PrefixParseFn = () => Expression;
type InfixParseFn = (left: Expression) => Expression;

enum Precedence {
    LOWEST = 0,
    EQUALS = 1,
    COMPARE = 2,
    SUM = 3,
    PRODUCT = 4,
    PREFIX = 5,
    CALL = 6,
}
const precedences = new Map<TokenKind, Precedence>([
    [TokenKind.EQ, Precedence.EQUALS],
    [TokenKind.NOT_EQ, Precedence.EQUALS],
    [TokenKind.LT, Precedence.COMPARE],
    [TokenKind.GT, Precedence.COMPARE],
    [TokenKind.PLUS, Precedence.SUM],
    [TokenKind.MINUS, Precedence.SUM],
    [TokenKind.SLASH, Precedence.PRODUCT],
    [TokenKind.ASTERISK, Precedence.PRODUCT],
]);

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
        this.prefixParseFns.set(TokenKind.TRUE, this.parseBooleanLiteral);
        this.prefixParseFns.set(TokenKind.FALSE, this.parseBooleanLiteral);
        this.prefixParseFns.set(TokenKind.BANG, this.parsePrefixExpression);
        this.prefixParseFns.set(TokenKind.MINUS, this.parsePrefixExpression);
        this.prefixParseFns.set(TokenKind.LPAREN, this.parseGroupedExpression);
        // set-up prefix functions
        this.infixParseFns.set(TokenKind.PLUS, this.parseInfixExpression);
        this.infixParseFns.set(TokenKind.MINUS, this.parseInfixExpression);
        this.infixParseFns.set(TokenKind.BANG, this.parseInfixExpression);
        this.infixParseFns.set(TokenKind.ASTERISK, this.parseInfixExpression);
        this.infixParseFns.set(TokenKind.SLASH, this.parseInfixExpression);
        this.infixParseFns.set(TokenKind.LT, this.parseInfixExpression);
        this.infixParseFns.set(TokenKind.GT, this.parseInfixExpression);
        this.infixParseFns.set(TokenKind.EQ, this.parseInfixExpression);
        this.infixParseFns.set(TokenKind.NOT_EQ, this.parseInfixExpression);
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

    currPrecedence(): Precedence {
        return precedences.get(this.currToken.kind) ?? Precedence.LOWEST;
    }

    peekPrecedence(): Precedence {
        return precedences.get(this.peekToken.kind) ?? Precedence.LOWEST;
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
        const expression = this.parseExpression(Precedence.LOWEST);

        // Note: support missing semicolons for the REPL
        if (this.peekTokenIs(TokenKind.SEMICOLON)) {
            this.nextToken();
        }

        return new ExpressionStatement(expression);
    }

    parseExpression(precedence: Precedence): Expression {
        const prefixFn = this.prefixParseFns.get(this.currToken.kind);
        if (!prefixFn) {
            throw new Error(
                `No prefix function for token ${this.currToken.kind}`
            );
        }
        let leftExpr = prefixFn();

        while (
            !this.peekTokenIs(TokenKind.SEMICOLON) &&
            precedence < this.peekPrecedence()
        ) {
            const infixFn = this.infixParseFns.get(this.peekToken.kind);
            if (!infixFn) {
                return leftExpr;
            }
            this.nextToken();
            const rightExpr = infixFn(leftExpr);
            leftExpr = rightExpr;
        }

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

    parseBooleanLiteral = (): BooleanLiteral => {
        const value = this.currTokenIs(TokenKind.TRUE);
        return new BooleanLiteral(value);
    };

    // !10
    // -5
    parsePrefixExpression = (): PrefixExpression => {
        const operator = this.currToken.literal;
        this.nextToken();
        const right = this.parseExpression(Precedence.PREFIX);
        return new PrefixExpression(operator, right);
    };

    // 1 + 3
    // 3 != 1
    parseInfixExpression = (left: Expression): InfixExpression => {
        const operator = this.currToken.literal;
        const precedence = this.currPrecedence();
        this.nextToken();
        const right = this.parseExpression(precedence);
        return new InfixExpression(operator, left, right);
    };

    // (<expression>)
    parseGroupedExpression = (): Expression => {
        this.expectToken(TokenKind.LPAREN);

        const expression = this.parseExpression(Precedence.LOWEST);

        this.expectPeek(TokenKind.RPAREN);

        return expression;
    };
}
