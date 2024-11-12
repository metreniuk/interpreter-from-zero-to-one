export interface Node {
    display(): string;
}

export interface Statement extends Node {
    kind:
        | "LetStatement"
        | "ReturnStatement"
        | "ExpressionStatement"
        | "BlockStatement";
}

export interface Expression extends Node {
    kind:
        | "Identifier"
        | "IntegerLiteral"
        | "BooleanLiteral"
        | "PrefixExpression"
        | "InfixExpression"
        | "IfExpression";
}

export class Program implements Node {
    statements: Statement[];

    constructor(statements: Statement[]) {
        this.statements = statements;
    }

    display(): string {
        return this.statements.map((x) => x.display()).join("");
    }
}

export class Identifier implements Expression {
    kind = "Identifier" as const;

    value: string;

    constructor(value: string) {
        this.value = value;
    }

    display(): string {
        // ex: foo
        return this.value;
    }
}

export class LetStatement implements Statement {
    kind = "LetStatement" as const;

    name: Identifier;
    value: Expression;

    constructor(name: Identifier, value: Expression) {
        this.name = name;
        this.value = value;
    }

    display(): string {
        // ex: let foo = 5;
        return `let ${this.name.display()} = ${this.value.display()};`;
    }
}

export class ReturnStatement implements Statement {
    kind = "ReturnStatement" as const;

    returnValue: Expression;

    constructor(returnValue: Expression) {
        this.returnValue = returnValue;
    }

    display(): string {
        // ex: return foo;
        return `return ${this.returnValue.display()};`;
    }
}

export class ExpressionStatement implements Statement {
    kind = "ExpressionStatement" as const;

    expression: Expression;

    constructor(expression: Expression) {
        this.expression = expression;
    }

    display(): string {
        // ex: foobar;
        return this.expression.display();
    }
}

export class IntegerLiteral implements Expression {
    kind = "IntegerLiteral" as const;

    value: number;

    constructor(value: number) {
        this.value = value;
    }

    display(): string {
        return `${this.value}`;
    }
}

export class BooleanLiteral implements Expression {
    kind = "BooleanLiteral" as const;

    value: boolean;

    constructor(value: boolean) {
        this.value = value;
    }

    display(): string {
        return `${this.value}`;
    }
}

export class PrefixExpression implements Expression {
    kind = "PrefixExpression" as const;

    operator: string;
    right: Expression;

    constructor(operator: string, right: Expression) {
        this.operator = operator;
        this.right = right;
    }

    display(): string {
        return `(${this.operator}${this.right.display()})`;
    }
}

export class InfixExpression implements Expression {
    kind = "InfixExpression" as const;

    operator: string;
    left: Expression;
    right: Expression;

    constructor(operator: string, left: Expression, right: Expression) {
        this.operator = operator;
        this.left = left;
        this.right = right;
    }

    display(): string {
        return `(${this.left.display()} ${
            this.operator
        } ${this.right.display()})`;
    }
}

export class BlockStatement implements Statement {
    kind = "BlockStatement" as const;

    statements: Statement[];

    constructor(statements: Statement[]) {
        this.statements = statements;
    }

    display(): string {
        let str = "{ ";
        for (let stm of this.statements) {
            str += stm.display();
        }
        str += " }";
        return str;
    }
}

export class IfExpression implements Expression {
    kind = "IfExpression" as const;

    condition: Expression;
    consequence: BlockStatement;
    alternative: BlockStatement | undefined;

    constructor(
        condition: Expression,
        consequence: BlockStatement,
        alternative: BlockStatement | undefined
    ) {
        this.condition = condition;
        this.consequence = consequence;
        this.alternative = alternative;
    }

    display(): string {
        let str = `if ${this.condition.display()} ${this.consequence.display()}`;
        if (this.alternative) {
            str += `else ${this.alternative.display()}`;
        }
        return str;
    }
}
