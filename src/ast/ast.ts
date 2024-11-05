export interface Node {
    display(): string;
}

export interface Statement extends Node {
    kind: "LetStatement" | "ReturnStatement" | "ExpressionStatement";
}

export interface Expression extends Node {
    kind: "Identifier";
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
