# Interpreter from Zero to One

## Set-up the environment

1.  run `git init` (add `.gitignore` with `node_modules`)
2.  run `npm init -y`
3.  replace the `package.json` with the following one:

```json
{
    "name": "interpreter-from-zero-to-one",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
        "lint": "tsc --noEmit",
        "test": "vitest"
    },
    "keywords": [],
    "author": "metreniuk@gmail.com",
    "license": "MIT",
    "dependencies": {
        "@types/node": "^22.7.5",
        "tsx": "^4.19.1",
        "typescript": "^5.6.3",
        "vitest": "^2.1.2"
    }
}
```

4.  run `npm install`

## Warm-up

1. We will be coding quite a while so let's warm up first. Create a `src/warmup.ts` file and implement the `factorial` function.
2. Implement the `fibonacci` function.
3. Run the functions to see if they work

-   add a script to `package.json` to run the file `tsx ./src/warmup.ts`
-   `factorial(10) === 3628800`
-   `fibonacci(10) === 55`

## Lexing

1. Set-up the folder structure:
    - `lexer`
        - `lexer.ts`
        - `lexer.spec.ts`
2. Add `test-lexer` script to `package.json`

```json
{
    "scripts": {
        "test-lexer": "vitest ./src/lexer/lexer.spec.ts"
    }
}
```

3. Define a `Token` type

```ts
// src/lexer/lexer.ts

export type Token = {
    kind: TokenKind;
    literal: string;
};
```

4. Define the `TokenKind` object. Define a type `TokenKind` (in Typescript it's allowed for a value to share the same name with a type).

```ts
// src/lexer/lexer.ts

export const TokenKind = {
    ILLEGAL: "ILLEGAL",
    EOF: "EOF",
    // Identifiers + literals
    IDENT: "IDENT", // add, foobar, x, y, ...
    INT: "INT", // 1343456
    // Operators
    ASSIGN: "=",
    PLUS: "+",
    // Delimiters
    COMMA: ",",
    SEMICOLON: ";",
    LPAREN: "(",
    RPAREN: ")",
    LBRACE: "{",
    RBRACE: "}",
    // Keywords
    FUNCTION: "FUNCTION",
    LET: "LET",
} as const;
type TokenKindKey = keyof typeof TokenKind;
type TokenKind = (typeof TokenKind)[TokenKindKey];
```

5. Add a test for operators and delimiters tokenization

```ts
import { assert, it } from "vitest";
import { TokenKind } from "./lexer";

it("tokenizes operators and delimiters", () => {
    const lexer = new Lexer("=+(){},;");

    const tokens = [
        [TokenKind.ASSIGN, "="],
        [TokenKind.PLUS, "+"],
        [TokenKind.LPAREN, "("],
        [TokenKind.RPAREN, ")"],
        [TokenKind.LBRACE, "{"],
        [TokenKind.RBRACE, "}"],
        [TokenKind.COMMA, ","],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.EOF, "<EOF>"],
    ];
    for (let [token, literal] of tokens) {
        const nextToken = lexer.nextToken();
        assert.equal(nextToken.kind, token);
        assert.equal(nextToken.literal, literal);
    }
});
```

6. We are ready to introduce the `Lexer` class. It receives the `input` of the program in the constructor and exposes the `nextToken` method. It allows to change the representation of our program from text to a stream of tokens.

```ts
// src/lexer/lexer.ts

export class Lexer {
    input: string;
    position: number = 0;
    char: string = "";

    constructor(input: string) {
        this.input = input;
        this.char = input[0] ?? "";
    }

    advance() {
        this.position++;
        this.char = this.input[this.position] ?? "";
    }

    createToken(kind: TokenKind, literal?: string): Token {
        return { kind, literal: literal ?? kind };
    }

    nextToken(): Token {
        let token: Token;

        switch (this.char) {
            case "=":
                token = this.createToken(TokenKind.ASSIGN);
                break;
            case "+":
                token = this.createToken(TokenKind.PLUS);
                break;
            case ",":
                token = this.createToken(TokenKind.COMMA);
                break;
            case ";":
                token = this.createToken(TokenKind.SEMICOLON);
                break;
            case "(":
                token = this.createToken(TokenKind.LPAREN);
                break;
            case ")":
                token = this.createToken(TokenKind.RPAREN);
                break;
            case "{":
                token = this.createToken(TokenKind.LBRACE);
                break;
            case "}":
                token = this.createToken(TokenKind.RBRACE);
                break;
            case "":
                token = this.createToken(TokenKind.EOF, "<EOF>");
                break;
            default:
                token = this.createToken(TokenKind.ILLEGAL, this.char);
        }

        this.advance();

        return token;
    }
}
```

7. Add a test for keywords and identifiers tokenization

```ts
it("tokenizes keywords and identifiers", () => {
    const input = `
    let add = fn(x, y) {
        x + y;
    };
    let result = add(5, 10);
    `;
    const lexer = new Lexer(input);

    const tokens = [
        [TokenKind.LET, "let"],
        [TokenKind.IDENT, "add"],
        [TokenKind.ASSIGN, "="],
        [TokenKind.FUNCTION, "fn"],
        [TokenKind.LPAREN, "("],
        [TokenKind.IDENT, "x"],
        [TokenKind.COMMA, ","],
        [TokenKind.IDENT, "y"],
        [TokenKind.RPAREN, ")"],
        [TokenKind.LBRACE, "{"],
        [TokenKind.IDENT, "x"],
        [TokenKind.PLUS, "+"],
        [TokenKind.IDENT, "y"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.RBRACE, "}"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.LET, "let"],
        [TokenKind.IDENT, "result"],
        [TokenKind.ASSIGN, "="],
        [TokenKind.IDENT, "add"],
        [TokenKind.LPAREN, "("],
        [TokenKind.INT, "5"],
        [TokenKind.COMMA, ","],
        [TokenKind.INT, "10"],
        [TokenKind.RPAREN, ")"],
    ];
    for (let [token, literal] of tokens) {
        const nextToken = lexer.nextToken();
        assert.deepEqual(nextToken, { kind: token, literal });
    }
});
```

8. Thest are failing, but why?

<details>
<summary>solution</summary>

We encountered `\n` which is a whitespace. We need to skip whitespaces during tokenization.

```ts
class Lexer {
    // ...
    skipWhitespace() {
        while (isWhitespace(this.char)) {
            this.advance();
        }
    }

    nextToken(): Token {
        let token: Token;

        this.skipWhitespace();
        // ...
    }
    // ...
}

function isWhitespace(char: string) {
    return char === " " || char === "\r" || char === "\t" || char === "\n";
}
```

</details>
<br>

9. That's better! But the tests are still failing. We need to tokenize identifiers and keywords.

We will have simple rules for those:

-   If the lexer encounters a **letter** it keeps advancing until it sees a character which is not a **letter**. The string in-between will be the **identifier**.
-   We have a reserved set of **identifiers** that we will call **keywords**. When the lexer envounters an identifier that matches a **keyword** it creates a token with the respective `kind` (example: `let` is `TokenKind.LET`)

<details>
<summary>code</summary>

```ts
class Lexer {
    input: string;
    position: number = 0;
    char: string = "";
    keywords: Record<string, TokenKind> = {
        let: TokenKind.LET,
        fn: TokenKind.FUNCTION,
    };

    // ...

    readIdentifier(): Token {
        const start = this.position;
        while (isLetter(this.char)) {
            this.advance();
        }
        const literal = this.input.slice(start, this.position);
        const keyword = this.keywords[literal];
        if (keyword) {
            return this.createToken(keyword, literal);
        }
        return this.createToken(TokenKind.IDENT, literal);
    }

    nextToken(): Token {
        // ...
        switch (this.char) {
            // ...
            default:
                if (isLetter(this.char)) {
                    token = this.readIdentifier();
                    return token;
                }
                token = this.createToken(TokenKind.ILLEGAL, this.char);
        }
        // ...
    }
}

function isLetter(char: string) {
    return (
        (char.charCodeAt(0) >= "a".charCodeAt(0) &&
            char.charCodeAt(0) <= "z".charCodeAt(0)) ||
        (char.charCodeAt(0) >= "A".charCodeAt(0) &&
            char.charCodeAt(0) <= "Z".charCodeAt(0)) ||
        char === "_"
    );
}
```

</details>
<br>

10. We almost fixed the tests. Let's tokenize the **integers**. We would do the same thing we did for **identifiers**: when encounter a **digit** advanced until you hit a character which is not a **digit**.

<details>

<summary>code</summary>

```ts
class Lexer() {
    // ...
    readInteger(): Token {
        const start = this.position;
        while (isDigit(this.char)) {
            this.advance();
        }
        const literal = this.input.slice(start, this.position);
        return this.createToken(TokenKind.INT, literal);
    }

    nextToken(): Token {
        // ...
        switch (this.char) {
            // ...
            default:
                if (isLetter(this.char)) {
                    token = this.readIdentifier();
                    return token;
                }
                if (isDigit(this.char)) {
                    token = this.readInteger();
                    return token;
                }
                token = this.createToken(TokenKind.ILLEGAL, this.char);
        }
    }
    // ...
}
// ...
function isDigit(char: string) {
    return (
        char.charCodeAt(0) >= "0".charCodeAt(0) &&
        char.charCodeAt(0) <= "9".charCodeAt(0)
    );
}
```

</details>
<br>

11. Good job! Let's continue by adding a test for tokenizing more operators.

```ts
it("tokenizes operators and delimiters", () => {
    const input = `
        =+(){},;
        !-/*5;
        5 < 10 > 5;
    `;
    const tokens = [
        // ...
        [TokenKind.SEMICOLON, ";"],
        // more
        [TokenKind.BANG, "!"],
        [TokenKind.MINUS, "-"],
        [TokenKind.SLASH, "/"],
        [TokenKind.ASTERISK, "*"],
        [TokenKind.INT, "5"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.INT, "5"],
        [TokenKind.LT, "<"],
        [TokenKind.INT, "10"],
        [TokenKind.GT, ">"],
        [TokenKind.INT, "5"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.EOF, "<EOF>"],
    ];
});
```

12. We have some new tokens, let's add them to `TokenKind` and handle them in `nextToken`.

<details>

<summary>code</summary>

```ts
// src/lexer/lexer.ts

export const TokenKind = {
    // ...
    PLUS: "+",
    MINUS: "-",
    BANG: "!",
    ASTERISK: "*",
    SLASH: "/",
    LT: "<",
    GT: ">",
    // ...
};

class Lexer {
    // ...
    nextToken(): Token {
        // ...
        switch (this.char) {
            // ...
            case "+":
                token = this.createToken(TokenKind.PLUS);
                break;
            case "-":
                token = this.createToken(TokenKind.MINUS);
                break;
            case "!":
                token = this.createToken(TokenKind.BANG);
                break;
            case "*":
                token = this.createToken(TokenKind.ASTERISK);
                break;
            case "/":
                token = this.createToken(TokenKind.SLASH);
                break;
            case "<":
                token = this.createToken(TokenKind.LT);
                break;
            case ">":
                token = this.createToken(TokenKind.GT);
                break;
            // ...
        }
    }
}
```

</details>
<br>

13. Let's add support for more keywords. Add the test case and adjust `TokenKind` and `Lexer`.

```ts
// src/lexer/lexer.spec.ts

it("tokenizes keywords and identifiers", () => {
    const input = `
    // ...
    if (5 < 10) {
        return true;
    } else {
        return false;
    }
    `;
    // ...

    const tokens = [
        // ...
        [TokenKind.SEMICOLON, ";"],
        // more
        [TokenKind.IF, "if"],
        [TokenKind.LPAREN, "("],
        [TokenKind.INT, "5"],
        [TokenKind.LT, "<"],
        [TokenKind.INT, "10"],
        [TokenKind.RPAREN, ")"],
        [TokenKind.LBRACE, "{"],
        [TokenKind.RETURN, "return"],
        [TokenKind.TRUE, "true"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.RBRACE, "}"],
        [TokenKind.ELSE, "else"],
        [TokenKind.LBRACE, "{"],
        [TokenKind.RETURN, "return"],
        [TokenKind.FALSE, "false"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.RBRACE, "}"],
        [TokenKind.EOF, "<EOF>"],
    ];
    // ...
});
```

<details>

<summary>code</summary>

```ts
// src/lexer/lexer.ts

export const TokenKind = {
    // ...
    // Keywords
    FUNCTION: "FUNCTION",
    LET: "LET",
    TRUE: "TRUE",
    FALSE: "FALSE",
    IF: "IF",
    ELSE: "ELSE",
    RETURN: "RETURN",
} as const;

export class Lexer {
    // ...
    keywords: Record<string, TokenKind> = {
        let: TokenKind.LET,
        fn: TokenKind.FUNCTION,
        true: TokenKind.TRUE,
        false: TokenKind.FALSE,
        if: TokenKind.IF,
        else: TokenKind.ELSE,
        return: TokenKind.RETURN,
    };
    // ...
}
```

</details>
<br>

14. We are almost done with the lexer. Let's add support for two-symbol operators: `==` and `!=`. When encountering `=` or `!` look ahead one character to decide which token it is (this is where the LL(1) parser, also known as the one-lookahead parser, originates).

```ts
// src/lexer/lexer.spec.ts

it("tokenizes operators and delimiters", () => {
    const input = `
        // ...
        10 == 10;
        10 != 9;
    `;
    // ...
    const tokens = [
        // ...
        [TokenKind.INT, "10"],
        [TokenKind.EQ, "=="],
        [TokenKind.INT, "10"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.INT, "10"],
        [TokenKind.NOT_EQ, "!="],
        [TokenKind.INT, "9"],
        [TokenKind.SEMICOLON, ";"],
        [TokenKind.EOF, "<EOF>"],
    ];
    // ...
});
```

<details>

<summary>code</summary>

```ts
// src/lexer/lexer.ts

export const TokenKind = {
    // ...
    EQ: "==",
    NOT_EQ: "!=",
    // ...
};

class Lexer {
    // ...
    peek(): string {
        return this.input[this.position + 1] ?? "";
    }
    // ...
    nextToken(): Token {
        // ...
        switch (this.char) {
            case "=":
                if (this.peek() === "=") {
                    this.advance();
                    token = this.createToken(TokenKind.EQ);
                } else {
                    token = this.createToken(TokenKind.ASSIGN);
                }
                break;
            // ...
            case "!":
                if (this.peek() === "=") {
                    this.advance();
                    token = this.createToken(TokenKind.NOT_EQ);
                } else {
                    token = this.createToken(TokenKind.BANG);
                }
                break;
        }
        // ...
    }
    // ...
}
```

</details>
<br>

15. Lexer is done! Let's add a REPL (read-evaluate-print-loop), or in our case it's RLPL (read-lexing-print-loop), to see how it feels. Start by setting up the boilerplate in a `src/repl.ts` file.

```ts
import { createInterface } from "node:readline";
import { Lexer, Token } from "./lexer/lexer";

// Create an interface for reading lines from stdin
const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "REPL> ", // Customize the prompt here
});

// Display the initial prompt
rl.prompt();

// Handle each line of input
rl.on("line", (input: string) => {
    if (input.trim() === ".exit") {
        rl.close();
    }

    // <lexing goes here>
    console.log(input);

    // Display the prompt again after handling input
    rl.prompt();
});

// Handle when the user closes the REPL (e.g., with Ctrl+C or exit)
rl.on("close", () => {
    console.log("Exiting REPL.");
    process.exit(0);
});
```

16. Now add `Lexer` to the RLPL.

```ts
rl.on("line", (input: string) => {
    if (input.trim() === ".exit") {
        rl.close();
    }

    const lexer = new Lexer(input);

    let token: Token;
    while ((token = lexer.nextToken()).kind !== TokenKind.EOF) {
        console.log(token);
    }
    // ...
});
```

17. Add a `repl` script to `package.json`

```json
{
    "scripts": {
        "repl": "tsx ./src/repl.ts"
    }
}
```

18. Congratulations on writing a lexer from scratch!

## Parsing

https://www.tldraw.com/ro/38a7SSvjj2jarYqWr1UUW?d=v-6150.7313.11535.7799.page

1. Create an `ast` module (`src/ast/ast.ts`)
2. Declare `Node`, `Expression`, and `Statement`. Declare `Program` class that implements `Node`.

```ts
// src/ast/ast.ts

interface Node {
    display(): string;
}

interface Statement extends Node {}

interface Expression extends Node {}

class Program implements Node {
    statements: Statement[];

    constructor(statements: Statement[]) {
        this.statements = statements;
    }

    display(): string {
        return this.statements.map((x) => x.display()).join("");
    }
}
```

3. Declare `Identifier` class that implements `Expression`. Declare `LetStatement` class that implements `Statement`.

```ts
// src/ast/ast.ts

class Identifier implements Expression {
    value: string;

    constructor(value: string) {
        this.value = value;
    }

    display(): string {
        // ex: foo
        return this.value;
    }
}

class LetStatement implements Statement {
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
```

4. Add `kind` property to `Expression` and `Statement` to differenciate them due to Typescript structural type-system.

```ts
// src/ast/ast.ts

interface Statement extends Node {
    kind: "LetStatement";
}

interface Expression extends Node {
    kind: "Identifier";
}

// ...

class Identifier implements Expression {
    kind = "Identifier" as const;
    // ...
}

class LetStatement implements Statement {
    kind = "LetStatement" as const;
    // ...
}
```

5. Add `parser` module (`src/parser/parser.ts`) and declare a `Parser` class.

```ts
// src/parser/parser.ts

import { Lexer, Token } from "../lexer/lexer";

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
```

6. Add a test for parsing "let" statements and add a script to run the parser tests.

```ts
// src/parser/parser.spec.ts

import { assert, it } from "vitest";
import { Lexer } from "../lexer/lexer";
import { Parser } from "./parser";
import { LetStatement } from "../ast/ast";

it("parses let statements", () => {
    const input = `
        let x = 5;
        let y = 10;
        let foobar = 838383;
   `;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 3);

    const expectedNames = ["x", "y", "foobar"];

    for (let i in program.statements) {
        const statement = program.statements[i];
        const name = expectedNames[i];

        if (statement instanceof LetStatement) {
            assert.equal(statement.name.value, name);
        } else {
            throw new Error(
                `Node "${statement.display()}" is not an instance of "LetStatement"`
            );
        }
    }
});
```

```json
{
    "scripts": {
        "test-parser": "vitest ./src/parser/parser.spec.ts"
    }
}
```

7.  Let's start parsing the "let" statements. We will start with declaring some helper methods which we will be using a lot.

```ts
// src/parser/parser.ts

class Parser {
    // ...
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
    // ...
}
```

Let's start from the entry point `parseProgram` and move step by step towards `parseLetStatement`.

```ts
// src/parser/parser.ts

class Parser {
    // ...
    parseProgram(): Program {
        const statements = [];

        while (!this.currTokenIs(TokenKind.EOF)) {
            const statement = this.parseStatement();
            statements.push(statement);
            this.expectToken(TokenKind.SEMICOLON);
        }
        return new Program(statements);
    }
}
```

Now add `parseStatement` that decides what kind of statement we need to parse based on the current token.

```ts
// src/parser/parser.ts

class Parser {
    // ...
    parseStatement(): Statement {
        if (this.currTokenIs(TokenKind.LET)) {
            return this.parseLetStatement();
        }
        throw new Error(`Unknown statement "${this.currToken.kind}"`);
    }
}
```

A "let" statement has a following schema: `let <identifier> = <expression>;`. We are starting at the `LET` token. We will ignore for now the `<expression>` part as it's pretty complex. We will come back to it later.

```ts
// src/parser/parser.ts

class Parser {
    // ...

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
}
```

Parsing the identifier is pretty straightforward.

```ts
// src/parser/parser.ts

class Parser {
    // ...
    parseIdentifier(): Identifier {
        return new Identifier(this.currToken.literal);
    }
}
```

Tests are passing, great!

8.  Let's do the same steps for "return" statements. Start with a test case.

```ts
it("parses return statements", () => {
    const input = `
        return 5;
        return 10;
        return 993322;
    `;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 3);

    for (let i in program.statements) {
        const statement = program.statements[i];
        if (!(statement instanceof ReturnStatement)) {
            throw new Error(
                `Node "${statement.display()}" is not an instance of "ReturnStatement"`
            );
        }
    }
});
```

Declare `ReturnStatement` that implements `Statement`. Update `kind` property of `Statement`.

```ts
// src/ast/ast.ts

//...
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
```

Add a `parseReturnStatement` method and use it inside `parseStatement`.

<details>
<summary>code</summary>

```ts
class Parser {
    // ...
    parseStatement(): Statement {
        // ...
        if (this.currTokenIs(TokenKind.RETURN)) {
            return this.parseReturnStatement();
        }
        throw new Error(`Unknown statement "${this.currToken.kind}"`);
    }
    // ...
    // return <expression>;
    parseReturnStatement(): ReturnStatement {
        this.expectToken(TokenKind.RETURN);

        // TODO: parse expression
        while (!this.currTokenIs(TokenKind.SEMICOLON)) {
            this.nextToken();
        }

        return new ReturnStatement(undefined!);
    }
}
```

</details>
<br>

Tests should pass now. Let's extract the `instanceof` assertion from tests to `ast/utils.ts`. Introduce `assertNodeType` helper and use it in `parser/parser.spec.ts`.

```ts
// src/ast/utils.ts
import { Node } from "./ast";

export function assertNodeType<T extends Node>(
    value: Node,
    ExpectedClass: new (...args: any[]) => T
): asserts value is T {
    if (!(value instanceof ExpectedClass)) {
        throw new Error(
            `Node "${value.display?.() ?? value}" is not an instance of ${
                ExpectedClass.name
            }`
        );
    }
}
```

```ts
// src/parser/parser.ts

it("parses let statements", () => {
    // ...
    for (let i in program.statements) {
        const statement = program.statements[i];
        const name = expectedNames[i];

        assertNodeType(statement, LetStatement);
        assert.equal(statement.name.value, name);
    }
});

it("parses return statements", () => {
    // ...
    for (let i in program.statements) {
        const statement = program.statements[i];
        assertNodeType(statement, ReturnStatement);
    }
});
```

9.  Let's talk expressions.

https://www.tldraw.com/ro/38a7SSvjj2jarYqWr1UUW?d=v-5258.11811.5580.3773.page

We are implementing what is known a Pratt Parser which is based on recursive descent. The main idea is simple but brilliant: all expressions can be divided into two kinds "prefix" and "infix" expressions. Let's look at some examples:

`-5` is a **prefix** expression, where `-` is the **prefix** operator

`1 + 2` is an **infix** expression, where `+` is the **infix** operator

We will apply this concept of prefix/infix operators not only to mathematical operation but for all kinds of tokens, for example **identifiers**. One of the simplest expression is an **identifier**.

As we've seen earlier a `Program` is composed of `Statement`s. So what kind of `Statement` is composed of one `Expression`? An `ExpressionStatement`.

Let's start with adding a test.

```ts
// parser/parser.spec.ts
it("parses identifier expressions", () => {
    const input = `foobar;`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    assert.equal(program.statements.length, 1);
    const statement = program.statements[0];

    assertNodeType(statement, ExpressionStatement);
    assertNodeType(statement.expression, Identifier);
    assert.equal(statement.expression.value, "foobar");
});
```

Throwing an error in the `Parser` code will help us figure-out the next step we need to take.
Let's introduce `ExpressionStatement`.

```ts
// parser/ast.ts

export class ExpressionStatement implements Statement {
    kind = "ExpressionStatement" as const;

    expression: Expression;

    constructor(expression: Expression) {
        this.expression = expression;
    }

    display(): string {
        // ex: foobar;
        return `return ${this.expression.display()};`;
    }
}
```

For each prefix/infix operators we will have a mapping of token to parse function. Let's declare two maps `prefixParseFns` and `infixParseFns`. You can see that the infix parsing function receives another expression as an argument. That's because we already parsed the **left** side and the current token is on the **operator**, thus we need a parsing function that would parse the **right** side and combine the results.

```
Prefix:

    -          5
<operator>  <right>


Infix:

   1         +          2
 <left>  <operator>  <right>
           ^^ this.currToken


Prefix without operator:

      5
  <integer>

     foo
 <identifier>
```

```ts
// parser/parser.ts

type PrefixParseFn = () => Expression;
type InfixParseFn = (left: Expression) => Expression;

export class Parser {
    // ...
    prefixParseFns: Map<TokenKind, PrefixParseFn> = new Map();
    infixParseFns: Map<TokenKind, InfixParseFn> = new Map();
}
```

Let's start with the prefix expressions only. When we encounter a token that has a **prefix** function we use it to parse the expression.

```ts
// parser/parser.ts

export class Parser {
    // ...

    parseStatement(): Statement {
        // ...
        return this.parseExpressionStatement();
    }

    // ...

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
}
```

You can see now a different error: `No prefix function for token IDENT`. Let's set a prefix function for `IDENT` token.

```ts
// parser/parser.ts
export class Parser {
    constructor(public lexer: Lexer) {
        // ...
        // set-up prefix functions
        this.prefixParseFns.set(TokenKind.IDENT, this.parseIdentifier);
    }
}
```

**Note:** change `parseIdentifier` method to an arrow-function or bind it to maintain `this` context.

10. We can now parse any expression that has only one identifier. Now let's do the same thing for parsing **integers**. Start with a test.

```ts
// parser/parser.spec.ts

it("parses integer literal expressions", () => {
    const input = `5;`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 1);

    const statement = program.statements[0];

    assertNodeType(statement, ExpressionStatement);
    assertNodeType(statement.expression, IntegerLiteral);

    assert.equal(statement.expression.value, 5);
});
```

Add `IntegerLiteral` class and use it in tests.

<details>
<summary>code</summary>

```ts
// ast/ast.ts

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
```

</details>
<br>

Add a method for parsing integers and set it as a prefix function for `INT` token.

<details>
<summary>code</summary>

```ts
export class Parser {
    // ...

    constructor(public lexer: Lexer) {
        // ...
        this.prefixParseFns.set(TokenKind.INT, this.parseIntegerLiteral);
    }

    // ...

    parseIntegerLiteral = (): IntegerLiteral => {
        const value = parseInt(this.currToken.literal, 10);
        if (!Number.isInteger(value)) {
            throw new Error(
                `Unknown IntegerLiteral "${this.currToken.literal}"`
            );
        }
        return new IntegerLiteral(value);
    };
}
```

</details>
<br>

11. Let's now parse prefix expressions with operators. As always, first add a test.

```ts
// parsers/parser.spec.ts

it("parses prefix expression", () => {
    const inputs = [
        { input: "!5;", operator: "!", value: 5 },
        { input: "-15;", operator: "-", value: 15 },
    ];

    for (const { input, operator, value } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        assert.equal(program.statements.length, 1);

        const statement = program.statements[0];

        assertNodeType(statement, ExpressionStatement);
        assertNodeType(statement.expression, PrefixExpression);

        assert.equal(statement.expression.operator, operator);

        assertNodeType(statement.expression.right, IntegerLiteral);
        assert.equal(statement.expression.right.value, value);
    }
});
```

Declare the `PrefixExpression` class. You can check the test case to see the required fields.

<details>
<summary>code</summary>

```ts
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
```

</details>
<br>

Add a parse method for all prefix expressions(`parsePrefixExpression`) and set it for `BANG` and `MINUS` tokens.

<details>
<summary>code</summary>

```ts
export class Parser {
    // ...
    constructor(public lexer: Lexer) {
        // ...
        this.prefixParseFns.set(TokenKind.BANG, this.parsePrefixExpression);
        this.prefixParseFns.set(TokenKind.MINUS, this.parsePrefixExpression);
    }

    // ...

    // !10
    // -5
    parsePrefixExpression = (): PrefixExpression => {
        const operator = this.currToken.literal;
        this.nextToken();
        const right = this.parseExpression();
        return new PrefixExpression(operator, right);
    };
}
```

</details>
<br>

12. Let's introduce `assertIntegerLiteral` helper and use it in `parser.spec.ts`. We will rely more heavily on it later.

```ts
// ast/utils.ts
export function assertIntegerLiteral(
    expression: Expression,
    expectedValue: number
) {
    assertNodeType(expression, IntegerLiteral);
    assert.equal(expression.value, expectedValue);
}
```

13. Time to parse infix expressions: `+`, `-`, `<`, `==`, etc.

Some tests first

```ts
// parser/parser.spec.ts
it("parses infix expression", () => {
    const inputs = [
        { input: "5 + 5;", leftValue: 5, operator: "+", rightValue: 5 },
        { input: "5 - 5;", leftValue: 5, operator: "-", rightValue: 5 },
        { input: "5 * 5;", leftValue: 5, operator: "*", rightValue: 5 },
        { input: "5 / 5;", leftValue: 5, operator: "/", rightValue: 5 },
        { input: "5 > 5;", leftValue: 5, operator: ">", rightValue: 5 },
        { input: "5 < 5;", leftValue: 5, operator: "<", rightValue: 5 },
        { input: "5 == 5;", leftValue: 5, operator: "==", rightValue: 5 },
        { input: "5 != 5;", leftValue: 5, operator: "!=", rightValue: 5 },
    ];
    for (const { input, operator, leftValue, rightValue } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        assert.equal(program.statements.length, 1);
        const statement = program.statements[0];
        assertNodeType(statement, ExpressionStatement);

        assertNodeType(statement.expression, InfixExpression);
        assert.equal(statement.expression.operator, operator);
        assertIntegerLiteral(statement.expression.left, leftValue);
        assertIntegerLiteral(statement.expression.right, rightValue);
    }
});
```

Create the `InfixExpression` class.

<details>
<summary>code</summary>

```ts
// ast/ast.ts

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
```

</details>
<br>

Add `parseInfixExpression` similar to `parsePrefixExpression` and use it inside `parseExpression`. Set-up `parseInfixExpression` for relevant tokens.

```ts
// parser/parser.ts
export class Parser {
    // ...
    constructor(public lexer: Lexer) {
        // ...
        this.prefixParseFns.set(TokenKind.MINUS, this.parsePrefixExpression);
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
    // ...
    // 1 + 3
    // 3 != 1
    parseInfixExpression = (left: Expression): InfixExpression => {
        const operator = this.currToken.literal;
        this.nextToken();
        const right = this.parseExpression();
        return new InfixExpression(token, operator, left, right);
    };

    // Note: use peekToken for infix operator lookup
    parseExpression(): Expression {
        // ...
        let leftExpr = prefix();
        while (!this.peekTokenIs(TokenKind.SEMICOLON)) {
            const infix = this.infixParseFns.get(this.peekToken.kind);
            if (!infix) {
                return leftExpr;
            }
            this.nextToken();
            const rightExpr = infix(leftExpr);
            leftExpr = rightExpr;
        }
        return leftExpr;
    }
}
```

14. We are ready to introduce operation precedence.

```ts
// parser/parser.spec.ts

it("parses expressions with precedence", () => {
    const inputs = [
        { input: "!-a", expected: "(!(-a))" },
        { input: "a + b / c", expected: "(a + (b / c))" },
        { input: "a * -b", expected: "(a * (-b))" },
        { input: "a + b + c", expected: "((a + b) + c)" },
        { input: "a + b - c", expected: "((a + b) - c)" },
        { input: "a * b * c", expected: "((a * b) * c)" },
        { input: "a * b / c", expected: "((a * b) / c)" },
        {
            input: "a + b * c + d / e - f",
            expected: "(((a + (b * c)) + (d / e)) - f)",
        },
        { input: "3 + 4; -5 * 5", expected: "(3 + 4)((-5) * 5)" },
        { input: "5 > 4 == 3 < 4", expected: "((5 > 4) == (3 < 4))" },
        { input: "5 < 4 != 3 > 4", expected: "((5 < 4) != (3 > 4))" },
        {
            input: "3 + 4 * 5 == 3 * 1 + 4 * 5",
            expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
        },
        {
            input: "3 + 4 * 5 == 3 * 1 + 4 * 5",
            expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
        },
    ];

    for (const { input, expected } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        assert.equal(program.display(), expected);
    }
});
```

Let's declare `Precedence` enum and add some helpers.

```ts
// parser/parser.ts

enum Precedence {
    LOWEST = 0,
    EQUALS = 1,
    COMPARE = 2,
    SUM = 3,
    PRODUCT = 4,
    PREFIX = 5, // used in parsePrefixExpression in the next step
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
    // ...

    currPrecedence(): Precedence {
        return precedences.get(this.currToken.kind) ?? Precedence.LOWEST;
    }

    peekPrecedence(): Precedence {
        return precedences.get(this.peekToken.kind) ?? Precedence.LOWEST;
    }

    // ...
}
```

Account for precedence in expression parsing.

**Tip:** You can change `parseExpression` method to accept `precedence: Precedence` parameter and TypeScript will show all the places where it needs to be adjusted.

```ts
// parser/parser.ts

export class Parser {
    // ...

    parseExpressionStatement(): ExpressionStatement {
        const expression = this.parseExpression(Precedence.LOWEST);
        // ...
    }

    parseExpression(precedence: Precedence): Expression {
        // ...

        while (
            !this.peekTokenIs(TokenKind.SEMICOLON) &&
            precedence < this.peekPrecedence()
        ) {
            // ...
        }
        // ...
    }

    // ...

    parsePrefixExpression = (): PrefixExpression => {
        // ...
        const right = this.parseExpression(Precedence.PREFIX);
        // ...
    };

    parseInfixExpression = (left: Expression): InfixExpression => {
        const operator = this.currToken.literal;
        const precedence = this.currPrecedence();
        // ...
    };
}
```

15. Let's parse boolean literals. Update the existing tests.

```ts
// parser/parser.ts

it("parses infix expression", () => {
    const inputs = [
        // ...
        {
            input: "true == true;",
            leftValue: true,
            operator: "==",
            rightValue: true,
        },
        {
            input: "true != false;",
            leftValue: true,
            operator: "!=",
            rightValue: false,
        },
        {
            input: "false == false;",
            leftValue: false,
            operator: "==",
            rightValue: false,
        },
    ]
    // ...
}

it("parses expressions with precedence", () => {
    const inputs = [
        // ...
        {
            input: "3 > 5 == false",
            expected: "((3 > 5) == false)",
        },
        {
            input: "3 < 5 == true",
            expected: "((3 < 5) == true)",
        },
    ];
    // ...
}

```

Declare the `BooleanLiteral` class

<details>
<summary>code</summary>

```ts
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
```

</details>
<br>

Introduce a new helper `assertLiteral` and replace `assertIntegerLiteral` in all the tests.

```ts
// ast/utils.ts

export function assertLiteral(
    expression: Expression,
    expectedValue: number | string | boolean
) {
    const expectedType = typeof expectedValue;

    if (expectedType === "number") {
        assertNodeType(expression, IntegerLiteral);
        assert.equal(expression.value, expectedValue);
    } else if (expectedType === "string") {
        assertNodeType(expression, Identifier);
        assert.equal(expression.value, expectedValue);
    } else if (expectedType === "boolean") {
        assertNodeType(expression, BooleanLiteral);
        assert.equal(expression.value, expectedValue);
    } else {
        throw new Error(
            `Unknown literal type "${expectedType}" of expected value "${expectedValue}"`
        );
    }
}
```

Parse boolean literals. Create a `parseBooleanLiteral` method
which checks the current token and creates a `BooleanLiteral` instance.
Set `parseBooleanLiteral` as a prefix function for `TokenKind.TRUE` and `TokenKind.FALSE`.

```ts
// parser/parser.ts

export class Parser {
    // ...
    constructor(public lexer: Lexer) {
        // ...
        // set-up prefix functions
        this.prefixParseFns.set(TokenKind.TRUE, this.parseBooleanLiteral);
        this.prefixParseFns.set(TokenKind.FALSE, this.parseBooleanLiteral);
        // ...
    }

    // ...

    parseBooleanLiteral = (): BooleanLiteral => {
        const value = this.currTokenIs(TokenKind.TRUE);
        return new BooleanLiteral(value);
    };
}
```

16. Parse grouped expressions.

```ts
it("parses expressions with precedence", () => {
    const inputs = [
        // ...
        {
            input: "1 + (2 + 3) + 4",
            expected: "((1 + (2 + 3)) + 4)",
        },
        {
            input: "(5 + 5) * 2",
            expected: "((5 + 5) * 2)",
        },
        {
            input: "2 / (5 + 5)",
            expected: "(2 / (5 + 5))",
        },
        {
            input: "-(5 + 5)",
            expected: "(-(5 + 5))",
        },
        {
            input: "!(true == true)",
            expected: "(!(true == true))",
        },
    ];
    // ...
```

For `LPAREN` token add a prefix parsing function `parseGroupedExpression`.

```ts
export class Parser {
    // ...

    constructor(public lexer: Lexer) {
        // ...
        // set-up prefix functions
        this.prefixParseFns.set(TokenKind.LPAREN, this.parseGroupedExpression);
    }

    // ...
    parseGroupedExpression = (): Expression => {
        this.expectToken(TokenKind.LPAREN);

        const expression = this.parseExpression(Precedence.LOWEST);

        this.expectPeek(TokenKind.RPAREN);

        return expression;
    };
```

17. Parse if expressions.

Add test helper `assertInfix` and use it in the `parses infix expression` test case.

```ts
// ast/utils.ts

export type ExpectedNodeValue = number | string | boolean;

export function assertInfix(
    expression: Expression,
    leftValue: ExpectedNodeValue,
    operator: string,
    rightValue: ExpectedNodeValue
) {
    assertNodeType(expression, InfixExpression);
    assert.equal(expression.operator, operator);
    assertLiteral(expression.left, leftValue);
    assertLiteral(expression.right, rightValue);
}
```

Add a new tests for if expressions.

```ts
// parser/parser.spec.ts

it("parses if expressions", () => {
    const input = `if (x < y) { x }`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 1);
    const statement = program.statements[0];

    assertNodeType(statement, ExpressionStatement);

    const { expression } = statement;
    assertNodeType(expression, IfExpression);
    assertInfix(expression.condition, "x", "<", "y");

    assert.equal(expression.consequence.statements.length, 1);
    assertNodeType(expression.consequence.statements[0], ExpressionStatement);
    assertLiteral(expression.consequence.statements[0].expression, "x");
});

it("parses if expressions with alternative", () => {
    const input = `if (x < y) { x } else { y }`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assert.equal(program.statements.length, 1);
    const statement = program.statements[0];

    assertNodeType(statement, ExpressionStatement);

    const { expression } = statement;
    assertNodeType(expression, IfExpression);
    assertInfix(expression.condition, "x", "<", "y");

    assert.equal(expression.consequence.statements.length, 1);
    assertNodeType(expression.consequence.statements[0], ExpressionStatement);
    assertLiteral(expression.consequence.statements[0].expression, "x");

    assert.equal(expression.alternative!.statements.length, 1);
    assertNodeType(expression.alternative!.statements[0], ExpressionStatement);
    assertLiteral(expression.alternative!.statements[0].expression, "y");
});
```

Declare the `IfExpression` class.

Tip: You would need to create a new class for both branches. We are going to use it later for other `Expression`s.

<details>
<summary>code</summary>

```ts
// ast/ast.ts

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
```

</details>
<br>

You know the drill: add a `parseIfExpression` method as a prefix function for `TokenKind.IF`

<details>
<summary>code</summary>

```ts
export class Parser {
    // ...

    constructor(public lexer: Lexer) {
        // ...
        // set-up prefix functions
        this.prefixParseFns.set(TokenKind.IF, this.parseIfExpression);
    }

    // ...
    // if (<expression>) <block-statement> [else <block-statement>]
    parseIfExpression = (): IfExpression => {
        this.expectToken(TokenKind.IF);
        this.expectToken(TokenKind.LPAREN);

        const condition = this.parseExpression(Precedence.LOWEST);

        this.expectPeek(TokenKind.RPAREN);
        this.expectPeek(TokenKind.LBRACE);

        const consequence = this.parseBlockStatement();

        let alternative = undefined;
        if (this.peekTokenIs(TokenKind.ELSE)) {
            this.expectPeek(TokenKind.ELSE);
            this.expectPeek(TokenKind.LBRACE);
            alternative = this.parseBlockStatement();
        }

        return new IfExpression(condition, consequence, alternative);
    };

    parseBlockStatement = (): BlockStatement => {
        this.expectToken(TokenKind.LBRACE);
        const statements: Statement[] = [];

        while (
            !this.currTokenIs(TokenKind.RBRACE) &&
            !this.currTokenIs(TokenKind.EOF)
        ) {
            statements.push(this.parseStatement());
            this.nextToken();
        }

        return new BlockStatement(statements);
    };
```

</details>
<br>

18. Ready to parse some functions? Add tests first.

```ts
// parser/parser.ts
it("parses function literals", () => {
    const input = `fn(x, y) { x + y; }`;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    assertNodeType(program.statements[0], ExpressionStatement);
    const { expression } = program.statements[0];

    assertNodeType(expression, FunctionLiteral);
    assertLiteral(expression.parameters[0], "x");
    assertLiteral(expression.parameters[1], "y");

    assertNodeType(expression.body.statements[0], ExpressionStatement);
    const { expression: innerExpression } = expression.body.statements[0];

    assertNodeType(innerExpression, InfixExpression);
    assertInfix(innerExpression, "x", "+", "y");
});

it("parses function parameters", () => {
    const inputs = [
        { input: `fn() {}`, expectedParameters: [] },
        { input: `fn(x) {}`, expectedParameters: ["x"] },
        { input: `fn(x, y) {}`, expectedParameters: ["x", "y"] },
    ];

    for (const { input, expectedParameters } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        assertNodeType(program.statements[0], ExpressionStatement);
        const { expression } = program.statements[0];
        assertNodeType(expression, FunctionLiteral);
        assert.equal(expression.parameters.length, expectedParameters.length);

        expectedParameters.forEach((param, i) => {
            assertLiteral(expression.parameters[i], param);
        });
    }
});
```

Declare `FunctionLiteral`.

<details>
<summary>code</summary>

```ts
// ast/ast.ts

export class FunctionLiteral implements Expression {
    kind = "FunctionLiteral" as const;

    parameters: Identifier[];
    body: BlockStatement;

    constructor(parameters: Identifier[], body: BlockStatement) {
        this.parameters = parameters;
        this.body = body;
    }

    display(): string {
        return `fn (${this.parameters
            .map((x) => x.display())
            .join(", ")}) ${this.body.display()}`;
    }
}
```

</details>
<br>

Add `parseFunctionLiteral` as a prefix function for `TokenKind.FUNCTION`.

```ts
export class Parser {
    // ...

    constructor(public lexer: Lexer) {
        // ...
        // set-up prefix functions
        this.prefixParseFns.set(TokenKind.FUNCTION, this.parseFunctionLiteral);
    }

    // ...
    // fn (<identifier>, <identifier>, ...) <block-statement>
    // fn (<identifier>) <block-statement>
    // fn () <block-statement>
    parseFunctionLiteral = (): FunctionLiteral => {
        this.expectPeek(TokenKind.LPAREN);

        const parameters = this.parseFunctionParameters();

        this.expectPeek(TokenKind.LBRACE);

        const body = this.parseBlockStatement();

        return new FunctionLiteral(parameters, body);
    };

    parseFunctionParameters = (): Identifier[] => {
        if (this.peekTokenIs(TokenKind.RPAREN)) {
            this.nextToken();
            return [];
        }
        this.expectPeek(TokenKind.IDENT);

        const parameters = [this.parseIdentifier()];

        while (this.peekTokenIs(TokenKind.COMMA)) {
            this.nextToken();
            this.expectPeek(TokenKind.IDENT);
            parameters.push(this.parseIdentifier());
        }

        this.expectPeek(TokenKind.RPAREN);

        return parameters;
    };
}
```

19. Let's parse the function calls. We will call them "call expressions".

Add tests

```ts
it("parses call expressions", () => {
    const input = `add(1, 2 + 3, 4 * 5);`;
    const program = parseProgram(input);

    assertNodeType(program.statements[0], ExpressionStatement);
    const { expression } = program.statements[0];
    assertNodeType(expression, CallExpression);

    assertLiteral(expression.callee, "add");
    assertLiteral(expression.args[0], 1);
    assertInfix(expression.args[1], 2, "+", 3);
    assertInfix(expression.args[2], 4, "*", 5);
});
```

Add `CallExpression` class.

<details>
<summary>code</summary>

```ts
export class CallExpression implements Expression {
    kind = "CallExpression" as const;

    callee: Expression;
    args: Expression[];

    constructor(
        callee: Expression, // Identifier or FunctionLiteral
        args: Expression[]
    ) {
        this.callee = callee;
        this.args = args;
    }

    display(): string {
        return `${this.callee.display()}(${this.args
            .map((x) => x.display())
            .join(", ")})`;
    }
}
```

</details>
<br>

Parse call expressions. How do we start parsing the call? What's the prefix/infix token?

`add(1, 2)`

<details>
<summary>code</summary>

```ts
export class Parser {
    constructor(public lexer: Lexer) {
        // ...
        this.infixParseFns.set(TokenKind.LPAREN, this.parseCallExpression);
    }
}
```

</details>
<br>

Why the error is about the `RPAREN`?

`Expected peek token to be ")", but got ","`

```ts
enum Precedence {
    // ...
    CALL = 6,
}

const precedences = new Map<TokenKind, Precedence>([
    // ...
    [TokenKind.LPAREN, Precedence.CALL],
]);
```

What other `Expression` is similar in parsing to `CallExpression`?

```ts
export class Parser {
    // ...
    parseCallExpression = (callee: Expression): CallExpression => {
        const args = this.parseCallArguments();
        return new CallExpression(callee, args);
    };

    parseCallArguments = (): Expression[] => {
        if (this.peekTokenIs(TokenKind.RPAREN)) {
            this.nextToken();
            return [];
        }
        this.nextToken();
        const args = [this.parseExpression(Precedence.LOWEST)];
        while (this.peekTokenIs(TokenKind.COMMA)) {
            this.nextToken();
            this.nextToken();
            args.push(this.parseExpression(Precedence.LOWEST));
        }
        this.expectPeek(TokenKind.RPAREN);
        return args;
    };
}
```

Let's add more tests to check for precedence.

```ts
it("parses expressions with precedence", () => {
    // ...
    const inputs = [
        {
            input: "a + add(b * c) + d",
            expected: "((a + add((b * c))) + d)",
        },
        {
            input: "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
            expected: "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
        },
        {
            input: "add(a + b + c * d / f + g)",
            expected: "add((((a + b) + ((c * d) / f)) + g))",
        },
    ];
    // ...
});
```

20. We can come back to `LetStatement` and `ReturnStatement` and parse them properly.

Update the tests.

```ts
it("parses let statements", () => {
    const inputs = [
        { input: `let x = 5;`, name: "x", value: 5 },
        { input: `let y = true;`, name: "y", value: true },
        { input: `let foobar = x;`, name: "foobar", value: "x" },
    ];

    for (let { name, value, input } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        const statement = program.statements[0];

        assertNodeType(statement, LetStatement);
        assert.equal(statement.name.value, name);
        assertLiteral(statement.value, value);
    }
});

it("parses return statements", () => {
    const inputs = [
        { input: `return 5;`, value: 5 },
        { input: `return true;`, value: true },
        { input: `return x;`, value: "x" },
    ];

    for (let { input, value } of inputs) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        const statement = program.statements[0];
        assertNodeType(statement, ReturnStatement);
        assertLiteral(statement.returnValue, value);
    }
});
```

Parse the `value` and `returnValue` respectively.

<details>
<summary>code</summary>

```ts
export class Parser {
    // ...
    // let <identifier> = <expression>;
    parseLetStatement(): LetStatement {
        this.expectPeek(TokenKind.IDENT);
        const identifier = this.parseIdentifier();
        this.expectPeek(TokenKind.ASSIGN);
        this.nextToken();

        const value = this.parseExpression(Precedence.LOWEST);

        if (this.peekTokenIs(TokenKind.SEMICOLON)) {
            this.nextToken();
        }

        return new LetStatement(identifier, value);
    }

    parseIdentifier = (): Identifier => {
        return new Identifier(this.currToken.literal);
    };

    // return <expression>;
    parseReturnStatement(): ReturnStatement {
        this.expectToken(TokenKind.RETURN);

        const returnValue = this.parseExpression(Precedence.LOWEST);

        if (this.peekTokenIs(TokenKind.SEMICOLON)) {
            this.nextToken();
        }

        return new ReturnStatement(returnValue);
    }
    // ...
}
```

</details>
<br>

21. Add the `Parser` to the `REPL`.

```ts
// src/repl.ts

//...
const lexer = new Lexer(input);
const parser = new Parser(lexer);

try {
    const program = parser.parseProgram();
    console.log(program.display());
} catch (err: any) {
    console.log(err);
}
// ...
```

22. You did it! This was by far the most complex part of the Interpreter.
    Take a deep breath. Play with the REPL. Take a look at the code. Check the [diagram](https://www.tldraw.com/ro/38a7SSvjj2jarYqWr1UUW?d=v-6432.7415.13153.8893.page).

## Evaluation

1. Set-up for evaluating the simplest possible program: `"5"`

Create a new `evaluator` module (`src/evaluator/evaluator.ts`).

Add the `evaluate` function that receives a `Node` as an argument and return a `Value`.

```ts
// src/evaluator/evaluator.ts
export function evaluate(node: Node): Value {
    throw new Error(`Unknown node "${node.display()}"`);
}
```

Let's define the `Value` interface. What primitive values can we add considering the `Parser` functionality?

<details>
<summary>code</summary>

```ts
// src/evaluator/value.ts

export type ValueType = "INTEGER" | "BOOLEAN" | "NULL";

export interface Value {
    type: ValueType;
    inspect(): string;
}

export class Integer implements Value {
    type = "INTEGER" as const;

    value: number;

    constructor(value: number) {
        this.value = value;
    }

    inspect() {
        return `INTEGER<${this.value}>`;
    }
}

export class Bool implements Value {
    type = "BOOLEAN" as const;

    value: boolean;

    constructor(value: boolean) {
        this.value = value;
    }

    inspect() {
        return `BOOLEAN<${this.value}>`;
    }
}

export class Null implements Value {
    type = "NULL" as const;

    value = null;

    constructor() {}
    inspect() {
        return `NULL`;
    }
}
```

</details>
<br>

Let's add a testing script `npm run test-eval` and add a simple test

```json
{
    "scripts": {
        "test-eval": "vitest ./src/evaluator/evaluator.spec.ts"
    }
}
```

```ts
// src/evaluator/evaluator.spec.ts

it("evaluates integers", () => {
    const value = evaluateProgram("5");

    assertValueType(value, Integer);
    assert.equal(value.value, 5);
});

export function evaluateProgram(input: string): Value {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    return evaluate(program);
}
```

Let's add `assertValueType` that is similar to the one in `parser.spec.ts`.

```ts
// src/evaluator/value.ts

// ...
export function assertValueType<T extends Value>(
    value: Value,
    ExpectedClass: new (...args: any[]) => T
): asserts value is T {
    if (!(value instanceof ExpectedClass)) {
        throw new Error(
            `Value "${value.inspect?.() ?? value}" is not an instance of ${
                ExpectedClass.name
            }`
        );
    }
}
```

2. Time to evaluate the simplest program: `5;`

In the `evaluate` function recursively evaluate nodes until you hit `IntegerLiteral`.

**Tip:** use `console.log` and the errors to guide your way through

<details>
<summary>code</summary>

```ts
// src/evaluator/evaluator.ts

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
    throw new Error(`Unknown node ${node.display()}"`);
}

function evaluateStatements(statements: Statement[]): Value {
    let result: Value | undefined;
    for (const statement of statements) {
        result = evaluate(statement);
    }
    return result!;
}
```

</details>
<br>

3. Let's make our REPL fulfill its purpose by evaluating the program!

```ts
// src/repl.ts

try {
    const program = parser.parseProgram();
    const value = evaluate(program);
    console.log(value.inspect());
    // ...
} catch (err: any) {
    // ...
}
```

4. Same but different: evaluate `true;`

First, let's adjust tests to use `assertValue`. Now add a basic boolean test.

```ts
// src/evaluator/evaluator.spec.ts

function assertValue(value: Value, expectedValue: ExpectedValue) {
    const expectedType = typeof expectedValue;
    if (expectedType === "boolean") {
        assertValueType(value, Bool);
        assert.equal(value.value, expectedValue);
    } else if (expectedType === "number") {
        assertValueType(value, Integer);
        assert.equal(value.value, expectedValue);
    }
}

it("evaluates integers", () => {
    const inputs = [
        { input: "5", expected: 5 },
        { input: "10", expected: 10 },
    ];

    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

it("evaluates booleans", () => {
    const inputs = [
        { input: "true", expected: true },
        { input: "false", expected: false },
    ];

    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});
```

evaluate `BooleanLiteral` using our `Bool` value.

```ts
export function evaluate(node: Node): Value {
    // ...
    if (node instanceof BooleanLiteral) {
        return new Bool(node.value);
    }
    // ...
}
```

What potential problems do you see in this code? How it will impact the memory consumption of the evaluation of the program?
What can we do to avoid creating _garbage_?

<details>
<summary>tip</summary>
Consider the case when we have this line:

```ts
let x = true || false || true || false || true;
```

How many `Bool` instances would we create?

</details>
<br>

<details>
<summary>code</summary>

```ts
// src/evaluator/value.ts

// ...
export const TRUE = new Bool(true);
export const FALSE = new Bool(false);
export const NULL = new Null();
```

```ts
// src/evaluator/evaluator.ts

export function evaluate(node: Node): Value {
    // ...
    if (node instanceof BooleanLiteral) {
        return new Bool(node.value);
    }
    // ...
}

// ...

function boolToValue(value: boolean) {
    return value ? TRUE : FALSE;
}
```

</details>
<br>

5. Let's add operators into the mix. Evaluate: `!true;`

Add tests

```ts
it("evaluates logical negation", () => {
    const inputs = [
        { input: "!true", expected: false },
        { input: "!false", expected: true },
        { input: "!5", expected: false },
        { input: "!!true", expected: true },
        { input: "!!false", expected: false },
        { input: "!!5", expected: true },
    ];
    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});
```

Let's parse `PrefixExpression`. We will add a function `evaluatePrefixExpression` which accepts an `operator: string` and `right: Value`.
Notice that it returns a `Value`. That's a pattern that we will use for all `evaluate*` functions.

```ts
// src/evaluator/evaluator.ts

export function evaluate(node: Node): Value {
    // ...
    if (node instanceof PrefixExpression) {
        const right = evaluate(node.right);
        return evaluatePrefixExpression(node.operator, right);
    }
    // ...
}

// ...

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
```

We already made an assumption about our program execution in `evaluateNotExpression`.
We've added coercion to boolean for the `!` operator. You can choose to throw an error.
It's up to you, it's your language now!

6. Evaluate integer prefix operation: `-5;`

Add tests

```ts
it("evaluates integers", () => {
    const inputs = [
        // ...
        { input: "-5", expected: -5 },
        { input: "-10", expected: -10 },
    ];
    // ...
});
```

Handle the `-` operator in `evaluatePrefixExpression`. It's important to return `Value`.

**Tip:** You might want to use `assertValueType` to assure TypeScript that you can create the `Integer` value.

<details>
<summary>code</summary>

```ts
function evaluatePrefixExpression(operator: string, right: Value): Value {
    // ...
    if (operator === "-") {
        return evaluateMinusExpression(right);
    }
    // ...
}

// ...

function evaluateMinusExpression(value: Value): Value {
    assertValueType(value, Integer);
    return new Integer(-value.value);
}
```

</details>
<br>

7. We are ready for infix expressions, let's start with integers and add some tests.

```ts
it("evaluates integer expressions", () => {
    const inputs = [
        { input: "5 + 5 + 5 + 5 - 10", expected: 10 },
        { input: "2 * 2 * 2 * 2 * 2", expected: 32 },
        { input: "-50 + 100 + -50", expected: 0 },
        { input: "5 * 2 + 10", expected: 20 },
        { input: "5 + 2 * 10", expected: 25 },
        { input: "20 + 2 * -10", expected: 0 },
        { input: "50 / 2 * 2 + 10", expected: 60 },
        { input: "2 * (5 + 10)", expected: 30 },
        { input: "3 * 3 * 3 + 10", expected: 37 },
        { input: "3 * (3 * 3) + 10", expected: 37 },
        { input: "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50 },
    ];

    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

it("evaluates boolean expressions", () => {
    const inputs = [
        { input: "1 < 2", expected: true },
        { input: "1 > 2", expected: false },
        { input: "1 < 1", expected: false },
        { input: "1 > 1", expected: false },
        { input: "1 == 1", expected: true },
        { input: "1 != 1", expected: false },
        { input: "1 == 2", expected: false },
        { input: "1 != 2", expected: true },
    ];

    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});
```

This is a bit more involved than prefix expressions. To handle `InfixExpression` you would need to:

-   `evaluate` the `node`'s properties `left` and `right`.
-   Check that both `Value`s are `Integer`, overwise throw a type error.
-   For each operator use corresponding TypeScript operators. You might notice that one `Integer` operator doesn't map nicely to the JavaScript runtime and needs adjustments.

<details>
<summary>code</summary>

```ts
export function evaluate(node: Node): Value {
    // ...
    if (node instanceof InfixExpression) {
        const left = evaluate(node.left);
        const right = evaluate(node.right);
        return evaluateInfixExpression(node.operator, left, right);
    }
    // ...
}

// ...

function evaluateInfixExpression(
    operator: string,
    left: Value,
    right: Value
): Value {
    if (left instanceof Integer && right instanceof Integer) {
        return evaluateIntegerInfixExpression(operator, left, right);
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
        return numberToValue(Math.floor(left.value / right.value));
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

function boolToValue(value: boolean) {
    return value ? TRUE : FALSE;
}

function numberToValue(value: number) {
    return new Integer(value);
}
```

</details>
<br>

7. Let's do the same for boolean infix expressions, starting with tests.

```ts
it("evaluates boolean expressions", () => {
    const inputs = [
        // ...
        { input: "true == true", expected: true },
        { input: "false == false", expected: true },
        { input: "true == false", expected: false },
        { input: "true != false", expected: true },
        { input: "false != true", expected: true },
        { input: "(1 < 2) == true", expected: true },
        { input: "(1 < 2) == false", expected: false },
        { input: "(1 > 2) == true", expected: false },
        { input: "(1 > 2) == false", expected: true },
    ];
    // ...
});
```

Handle booleans in `evaluateInfixExpression`

<details>
<summary>code</summary>

```ts
// ...
function evaluateInfixExpression(
    operator: string,
    left: Value,
    right: Value
): Value {
    // ...
    if (left instanceof Bool && right instanceof Bool) {
        return evaluateBoolInfixExpression(operator, left, right);
    }
    // ...
}

// ...

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
```

</details>
<br>

**Note:** in our language the evaluation is more restrictive than in JavaScript. As a fun exercise you can support coercion for more operators. For example, `true != 4` now throws but is a completely reasonable code.

We can evaluate any (integer and boolean) expressions now! Try it in the REPL. If you ever wanted to write a calculator from scratch... Congratulations!

8. Now let's go into the control flow and evaluate if expressions!

Add new tests

```ts
it("evaluates if expressions", () => {
    const inputs = [
        { input: "if (true) { 10 }", expected: 10 },
        { input: "if (false) { 10 }", expected: null },
        { input: "if (1) { 10 }", expected: 10 },
        { input: "if (1 < 2) { 10 }", expected: 10 },
        { input: "if (1 > 2) { 10 }", expected: null },
        { input: "if (1 > 2) { 10 } else { 20 }", expected: 20 },
        { input: "if (1 < 2) { 10 } else { 20 }", expected: 10 },
    ];
    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});

function assertValue(value: Value, expectedValue: boolean | number | null) {
    // ...
    } else if (expectedValue === null) {
        assertValueType(value, Null);
        assert.equal(value.value, expectedValue);
    } else {
        throw new Error(
            `Unknown value type "${expectedType}" of expected value "${expectedValue}"`
        );
    }
}
```

We can re-use `evaluateStatements` from previous step to evaluate `BlockStatement`.

```ts
export function evaluate(node: Node): Value {
    // ...
    if (node instanceof IfExpression) {
        return evaluateIfExpression(node);
    }
    if (node instanceof BlockStatement) {
        return evaluateStatements(node.statements);
    }
    // ...
}

function evaluateIfExpression(node: IfExpression): Value {
    const condition = evaluate(node.condition);
    if (isTruthy(condition)) {
        return evaluate(node.consequence);
    } else if (node.alternative) {
        return evaluate(node.alternative);
    }
    return NULL;
}

function isTruthy(condition: Value): boolean {
    const isFalsy = condition === FALSE || condition === NULL;
    return !isFalsy;
}
```

9. We are almost ready for the final boss: functions. Let's set-up the stage with support for return statements. For now, let's consider our whole program as "root function".

How does a return statement affect the execution flow?

```ts
it("evaluates return statements", () => {
    const inputs = [
        { input: "return 10;", expected: 10 },
        { input: "return 10; 9;", expected: 10 },
        { input: "return 2 * 5; 9;", expected: 10 },
        { input: "9; return 2 * 5; 9;", expected: 10 },
    ];
    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});
```

We will introduce an inner `ReturnValue` data class and unwrap it in the `Program` evaluation.

```ts
// src/evaluator/value.ts

export class ReturnValue implements Value {
    type = "RETURN_VALUE" as const;

    innerValue: Value;

    constructor(innerValue: Value) {
        this.innerValue = innerValue;
    }

    inspect() {
        return `RETURN_VALUE<${this.innerValue.inspect()}>`;
    }
}
```

Handle `ReturnStatement` in `evaluate`. We will add an early return if the result of `evaluate(statement)` is `ReturnValue`. Unwrap it and return the `innerValue`.

```ts
// src/evaluator/evaluator.ts

export function evaluate(node: Node): Value {
    // ...
    if (node instanceof ReturnStatement) {
        const innerValue = evaluate(node.returnValue);
        return new ReturnValue(innerValue);
    }
    // ...
}

// ...

function evaluateStatements(statements: Statement[]): Value {
    let result: Value | undefined;
    for (const statement of statements) {
        result = evaluate(statement);
        if (result instanceof ReturnValue) {
            return result.innerValue;
        }
    }

    return result!;
}
```

10. You might notice that we still have a bug in our return statement evaluation. Can you figure out why this test fails?

```ts
it("evaluates return statements", () => {
    const inputs = [
        // ...
        {
            input: `
            if (10 > 1) {
                if (10 > 1) {
                    return 10;
                }
                return 1; 
            }`,
            expected: 10,
        },
    ];
    // ...
});
```

<details>
<summary>answer & code</summary>

The problem is that the return value doesn't bubble up to the top level but breaks only the block scope. We will add a new function that will do the unwraping only in the right context: `evaluateProgram`.

```ts
export function evaluate(node: Node): Value {
    if (node instanceof Program) {
        return evaluateProgram(node.statements);
    }
    // ...
}

function evaluateProgram(statements: Statement[]): Value {
    const result = evaluateStatements(statements);
    if (result instanceof ReturnValue) {
        return result.innerValue;
    }
    return result;
}

function evaluateStatements(statements: Statement[]): Value {
    // ...
    if (result instanceof ReturnValue) {
        return result;
    }
    // ...
}
```

</details>
<br>

11. Let's continue with let statements.

```ts
it("evaluates let statements", () => {
    const inputs = [
        { input: "let a = 5; a;", expected: 5 },
        { input: "let a = 5 * 5; a;", expected: 25 },
        { input: "let a = 5; let b = a; b;", expected: 5 },
        { input: "let a = 5; let b = a; let c = a + b + 5; c;", expected: 15 },
    ];
    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});
```

The program is running within a certain **environment** that has a **scope**. We want to be able to save values by name and get their values later. Let's declare an `Environement` class that does exactly that.

```ts
// src/evaluator/value.ts
export class Environment {
    scope: Map<string, Value> = new Map();

    getIdentifier = (name: string) => {
        return this.scope.get(name);
    };

    setIdentifier = (name: string, val: Value) => {
        return this.scope.set(name, val);
    };
}
```

Now for `LetStatement` node save the identifier value in the `Environment` and for `Identifier` get the value from `Environment` and return it.

To accomplish this we will add a second parameter to the `evaluate` function. Your `evaluator.ts` will become red from errors and that's fine. Just pass the `Environment` to every `evaluate` call.

```ts
export function evaluate(node: Node, env: Environment): Value {
    // ...
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
    // ...
}
```

**Note:** don't forget to pass the `Environement` in tests and REPL.

12. We are now **ready** to tackle the hardest part of the evaluator: function declaration and application.

We are going to introduce a new `Value` for the function: `FunctionValue`.

```ts
export class FunctionValue implements Value {
    type = "FUNCTION" as const;

    parameters: Identifier[];
    body: BlockStatement;
    env: Environment;

    constructor(parameters: Identifier[], body: BlockStatement) {
        this.parameters = parameters;
        this.body = body;
        this.env = env;
    }
    inspect() {
        return `fn (${this.parameters
            .map((x) => x.display())
            .join(", ")}) ${this.body.display()}`;
    }
}
```

Let's add some tests.

```ts
it("evaluates function application", () => {
    const inputs = [
        { input: "let identity = fn(x) { x; }; identity(5);", expected: 5 },
        {
            input: "let identity = fn(x) { return x; }; identity(5);",
            expected: 5,
        },
        { input: "let double = fn(x) { x * 2; }; double(5);", expected: 10 },
        { input: "let add = fn(x, y) { x + y; }; add(5, 5);", expected: 10 },
        {
            input: "let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));",
            expected: 20,
        },
        { input: "fn(x) { x; }(5)", expected: 5 },
    ];

    for (const { input, expected } of inputs) {
        const value = evaluateProgram(input);
        assertValue(value, expected);
    }
});
```

Let's handle `FunctionLiteral` and `CallExpression` in `evaluate`. We will create a function `applyFunction` that will:

-   check that the `callee` is a `FunctionValue`
-   set all the function parameters to the arguments values through `env`
-   evaluate the `body` of the function

```ts
export function evaluate(node: Node, env: Environment): Value {
    // ...
    if (node instanceof FunctionLiteral) {
        return new FunctionValue(node.parameters, node.body, env);
    }
    if (node instanceof CallExpression) {
        const callee = evaluate(node.callee, env);
        const args = node.args.map((arg) => evaluate(arg, env));
        return applyFunction(callee, args);
    }
    // ...
}

// ...

function applyFunction(callee: Value, args: Value[]): Value {
    assertValueType(callee, FunctionValue);
    const env = callee.env;

    callee.parameters.forEach((param, i) => {
        env.setIdentifier(param.value, args[i]);
    });

    return evaluate(callee.body, callee.env);
}
```

13. Let's figure out the issues with current implementation. Here is a test for it.

```ts
it("evaluates function application", () => {
    const inputs = [
        // ...
        {
            input: `
            let x = 5;
            let f = fn() {
                let x = 3;
                return x; 
            };
            let y = f();
            x
            `,
            expected: 5,
        },
    ];
    // ...
});
```

What's the problem?

<details>
<summary>code</summary>

On function application (function call) we need to create a separate `Environement` for the function.

**Note:** If a variable is not declared in the function scope it will check every parent scope until it reaches the program root.

```ts
// src/evaluator/value.ts

export class Environment {
    scope: Map<string, Value> = new Map();
    parentEnv: Environment | undefined;

    static withParent(parentEnv: Environment) {
        const env = new Environment();
        env.parentEnv = parentEnv;
        return env;
    }

    getIdentifier = (name: string): Value | undefined => {
        const value = this.scope.get(name);
        if (!value && this.parentEnv) {
            return this.parentEnv.getIdentifier(name);
        }
        return value;
    };
    // ...
}
```

```ts
// src/evaluator/evaluator.ts

function applyFunction(callee: Value, args: Value[]): Value {
    // ...
    const env = Environment.withParent(callee.env);

    // ...

    return evaluate(callee.body, env);
}
```

</details>
<br>

14. There is another issue we have.

```ts
it("evaluates function application", () => {
    const inputs = [
        // ...
        {
            input: `
            let fa = fn(x, y) {
                return x + y;
            };
            let fb = fn(x, y) {
                let z = fa(x, y);
                return z + x;
            };
            fb(1, 2)`,
            expected: 4,
        },
    ];
    // ...
});
```

The function application doesn't handle the return value. Let's unwrap it.

```ts
function applyFunction(callee: Value, args: Value[]): Value {
    // ...
    const result = evaluate(callee.body, env);

    if (result instanceof ReturnValue) {
        return result.innerValue;
    }
    return result;
}
```

15. Time to support higher order function. Start with a test.

```ts
it("evaluates function application", () => {
    const inputs = [
        // ...
        {
            input: `
            let newAdder = fn(x) {
                return fn(y) { x + y };
            };
            let addTwo = newAdder(2);
            addTwo(2);`,
            expected: 4,
        },
    ];
    // ...
});
```

It passes! It turned out that we didn't have to do anything, because functions are just values. We support higher-order functions!

**Note:** if you remove the `return` keyword (`return fn(y) { x + y };` -> `fn(y) { x + y };`) the test will pass anyway. Do you know why?

16. We are ready to write a program in our own langugage that we just created! I know two programs that we can write: `fibonacci` and `factorial`.

Add them as separate tests for convenience.

<details>
<summary>code</summary>

```ts
it("fibonacci", () => {
    const input = `
        let fibonacci = fn(x) {
            if (x < 2) {
                return x;
            }
            return fibonacci(x - 1) + fibonacci(x - 2);
        };
        fibonacci(10)
    `;

    const value = evaluateProgram(input);

    assertValue(value, 55);
});

it("factorial", () => {
    const input = `
        let factorial = fn(x) {
            if (x < 2) {
                return 1;
            }
            return x * factorial(x - 1);
        };
        factorial(10)
    `;

    const value = evaluateProgram(input);

    assertValue(value, 3628800);
});
```

</details>
<br>

Hooray! You did it! You wrote an interpreter that contains: operation precendence, control flow, functions, and closures. What a journey!

The only remaining things are: strings, string operations, floats, arrays, hashmaps, built-ins, classes... The good news is that you have all the tools to implement them on you own. Good luck!


### References
1. [Writing An Interpreter In Go](https://interpreterbook.com/)
2. [Simple but Powerful Pratt Parsing](https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html)
3. [Top Down Operator Precedence. Vaughan R. Pratt](https://tdop.github.io/)
