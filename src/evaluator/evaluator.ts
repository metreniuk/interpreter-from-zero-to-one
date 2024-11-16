import { Node } from "../ast/ast";
import { Value } from "./value";

export function evaluate(node: Node): Value {
    throw new Error(`Unknown node "${node.display()}"`);
}
