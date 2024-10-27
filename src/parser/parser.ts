import { Lexer, Token } from "../lexer/lexer";
import { Program } from "../ast/ast";

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

    parseProgram(): Program {
        return new Program([]);
    }
}
