import {
    BooleanLiteral,
    ExpressionStatement,
    IntegerLiteral,
    Node,
    PrefixExpression,
    Program,
    Statement,
} from "../ast/ast";
import { FALSE, Integer, NULL, TRUE, Value } from "./value";

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
    if (node instanceof PrefixExpression) {
        const right = evaluate(node.right);
        return evaluatePrefixExpression(node.operator, right);
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

function evaluatePrefixExpression(operator: string, right: Value): Value {
    if (operator === "!") {
        return evaluateNotExpression(right);
    }
    throw new Error(`Unknown prefix operator "${operator}"`);
}

function evaluateNotExpression(value: Value): Value {
    if (value === TRUE) {
        return FALSE;
    } else if (value === FALSE) {
        return TRUE;
    } else if (value === NULL) {
        return TRUE;
    }
    return FALSE;
}

function boolToValue(value: boolean) {
    return value ? TRUE : FALSE;
}
