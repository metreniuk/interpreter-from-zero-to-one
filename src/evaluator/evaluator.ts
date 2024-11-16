import {
    BlockStatement,
    BooleanLiteral,
    CallExpression,
    ExpressionStatement,
    FunctionLiteral,
    Identifier,
    IfExpression,
    InfixExpression,
    IntegerLiteral,
    LetStatement,
    Node,
    PrefixExpression,
    Program,
    ReturnStatement,
    Statement,
} from "../ast/ast";
import {
    assertValueType,
    Bool,
    Environment,
    FALSE,
    FunctionValue,
    Integer,
    NULL,
    ReturnValue,
    TRUE,
    Value,
} from "./value";

export function evaluate(node: Node, env: Environment): Value {
    if (node instanceof Program) {
        return evaluateProgram(node.statements, env);
    }
    if (node instanceof ExpressionStatement) {
        return evaluate(node.expression, env);
    }
    if (node instanceof IntegerLiteral) {
        return numberToValue(node.value);
    }
    if (node instanceof BooleanLiteral) {
        return boolToValue(node.value);
    }
    if (node instanceof PrefixExpression) {
        const right = evaluate(node.right, env);
        return evaluatePrefixExpression(node.operator, right);
    }
    if (node instanceof InfixExpression) {
        const left = evaluate(node.left, env);
        const right = evaluate(node.right, env);
        return evaluateInfixExpression(node.operator, left, right);
    }
    if (node instanceof IfExpression) {
        return evaluateIfExpression(node, env);
    }
    if (node instanceof BlockStatement) {
        return evaluateStatements(node.statements, env);
    }
    if (node instanceof ReturnStatement) {
        const innerValue = evaluate(node.returnValue, env);
        return new ReturnValue(innerValue);
    }
    if (node instanceof LetStatement) {
        const value = evaluate(node.value, env);
        env.setIdentifier(node.name.value, value);
        return NULL;
    }
    if (node instanceof Identifier) {
        const value = env.getIdentifier(node.value);
        if (value) {
            return value;
        }
        throw new Error(`Used an undeclared value "${node.value}"`);
    }
    if (node instanceof FunctionLiteral) {
        return new FunctionValue(node.parameters, node.body, env);
    }
    if (node instanceof CallExpression) {
        const callee = evaluate(node.callee, env);
        const args = node.args.map((arg) => evaluate(arg, env));
        return applyFunction(callee, args);
    }
    throw new Error(`Unknown node "${node.kind}<${node.display()}>"`);
}

function evaluateProgram(statements: Statement[], env: Environment): Value {
    const result = evaluateStatements(statements, env);
    if (result instanceof ReturnValue) {
        return result.innerValue;
    }
    return result;
}

function evaluateStatements(statements: Statement[], env: Environment): Value {
    let result: Value | undefined;
    for (const statement of statements) {
        result = evaluate(statement, env);
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

function evaluateIfExpression(node: IfExpression, env: Environment): Value {
    if (isTruthy(evaluate(node.condition, env))) {
        return evaluate(node.consequence, env);
    } else if (node.alternative) {
        return evaluate(node.alternative, env);
    }
    return NULL;
}

function applyFunction(callee: Value, args: Value[]): Value {
    assertValueType(callee, FunctionValue);
    const env = callee.env;

    callee.parameters.forEach((param, i) => {
        env.setIdentifier(param.value, args[i]);
    });

    return evaluate(callee.body, callee.env);
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
