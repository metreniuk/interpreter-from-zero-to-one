import {
    BlockStatement,
    BooleanLiteral,
    ExpressionStatement,
    IfExpression,
    InfixExpression,
    IntegerLiteral,
    Node,
    PrefixExpression,
    Program,
    ReturnStatement,
    Statement,
} from "../ast/ast";
import {
    assertValueType,
    Bool,
    FALSE,
    Integer,
    NULL,
    ReturnValue,
    TRUE,
    Value,
} from "./value";

export function evaluate(node: Node): Value {
    if (node instanceof Program) {
        return evaluateProgram(node.statements);
    }
    if (node instanceof ExpressionStatement) {
        return evaluate(node.expression);
    }
    if (node instanceof IntegerLiteral) {
        return numberToValue(node.value);
    }
    if (node instanceof BooleanLiteral) {
        return boolToValue(node.value);
    }
    if (node instanceof PrefixExpression) {
        const right = evaluate(node.right);
        return evaluatePrefixExpression(node.operator, right);
    }
    if (node instanceof InfixExpression) {
        const left = evaluate(node.left);
        const right = evaluate(node.right);
        return evaluateInfixExpression(node.operator, left, right);
    }
    if (node instanceof IfExpression) {
        return evaluateIfExpression(node);
    }
    if (node instanceof BlockStatement) {
        return evaluateStatements(node.statements);
    }
    if (node instanceof ReturnStatement) {
        const innerValue = evaluate(node.returnValue);
        return new ReturnValue(innerValue);
    }
    throw new Error(`Unknown node "${node.kind}<${node.display()}>"`);
}

function evaluateProgram(statements: Statement[]): Value {
    const result = evaluateStatements(statements);
    if (result instanceof ReturnValue) {
        return result.innerValue;
    }
    return result;
}

function evaluateStatements(statements: Statement[]): Value {
    let result: Value | undefined;
    for (const statement of statements) {
        result = evaluate(statement);
        if (result instanceof ReturnValue) {
            return result;
        }
    }

    return result!;
}

function evaluatePrefixExpression(operator: string, right: Value): Value {
    if (operator === "!") {
        return evaluateNotExpression(right);
    }
    if (operator === "-") {
        return evaluateMinusExpression(right);
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

function evaluateMinusExpression(value: Value): Value {
    assertValueType(value, Integer);
    return numberToValue(-value.value);
}

function evaluateInfixExpression(
    operator: string,
    left: Value,
    right: Value
): Value {
    if (left instanceof Integer && right instanceof Integer) {
        return evaluateIntegerInfixExpression(operator, left, right);
    }
    if (left instanceof Bool && right instanceof Bool) {
        return evaluateBoolInfixExpression(operator, left, right);
    }

    throw new Error(
        `Infix operator type mismatch\n left: ${left.inspect()}\n right: ${right.inspect()}`
    );
}

function evaluateIntegerInfixExpression(
    operator: string,
    left: Integer,
    right: Integer
): Value {
    if (operator === "+") {
        return numberToValue(left.value + right.value);
    }
    if (operator === "-") {
        return numberToValue(left.value - right.value);
    }
    if (operator === "*") {
        return numberToValue(left.value * right.value);
    }
    if (operator === "/") {
        return numberToValue(left.value / right.value);
    }
    if (operator === "<") {
        return boolToValue(left.value < right.value);
    }
    if (operator === ">") {
        return boolToValue(left.value > right.value);
    }
    if (operator === "==") {
        return boolToValue(left.value == right.value);
    }
    if (operator === "!=") {
        return boolToValue(left.value != right.value);
    }
    throw new Error(`Unknown Integer infix operator ${operator}`);
}

function evaluateBoolInfixExpression(
    operator: string,
    left: Bool,
    right: Bool
): Value {
    if (operator === "<") {
        return boolToValue(left.value < right.value);
    }
    if (operator === ">") {
        return boolToValue(left.value > right.value);
    }
    if (operator === "==") {
        return boolToValue(left.value == right.value);
    }
    if (operator === "!=") {
        return boolToValue(left.value != right.value);
    }
    throw new Error(`Unknown Boolean infix operator ${operator}`);
}

function evaluateIfExpression(node: IfExpression): Value {
    if (isTruthy(evaluate(node.condition))) {
        return evaluate(node.consequence);
    } else if (node.alternative) {
        return evaluate(node.alternative);
    }
    return NULL;
}

function isTruthy(value: Value): boolean {
    const isFalsy = value === FALSE || value === NULL;
    return !isFalsy;
}

function boolToValue(value: boolean) {
    return value ? TRUE : FALSE;
}

function numberToValue(value: number) {
    return new Integer(value);
}
