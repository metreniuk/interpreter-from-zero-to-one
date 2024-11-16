import {
    BooleanLiteral,
    ExpressionStatement,
    IntegerLiteral,
    Node,
    Program,
    Statement,
} from "../ast/ast";
import { FALSE, Integer, TRUE, Value } from "./value";

export function evaluate(node: Node): Value {
    if (node instanceof Program) {
        return evaluateStatements(node.statements);
    }
    if (node instanceof ExpressionStatement) {
        return evaluate(node.expression);
    }
    if (node instanceof IntegerLiteral) {
        return new Integer(node.value);
    }
    if (node instanceof BooleanLiteral) {
        return boolToValue(node.value);
    }

    throw new Error(`Unknown node "${node.kind}<${node.display()}>"`);
}

function evaluateStatements(statements: Statement[]): Value {
    let result: Value | undefined;
    for (const statement of statements) {
        result = evaluate(statement);
    }
    return result!;
}

function boolToValue(value: boolean) {
    return value ? TRUE : FALSE;
}
