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

6. Add a test for parsing "let" statements and add a script to run the parser tests and

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

7.  Let's start parsing the "let" statements. We will start with declaring some helper methods that will be using a lot.

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

Let's start from the entry point `parseProgram` and move step by step towards `parseLetStatement`

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

Now add `parseStatement` that decide what kind of statement we need to parse based on the current token.

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

A "let" statement has a following schema: `let <identifier> = <expression>;`. We are starting at the `let` token. We will ignore for now the `<expression>` part as it's pretty complex. We will come back later.

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

Parsing the identifier is pretty straightforward

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

<details>
<summary>code</summary>

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

</details>
<br>

Add a `parseReturnStatement` method and use it inside `parseStatement`

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

10. We can now parse any expression that has only one identifier. Now let's do the same thing for parsing integers. Start with a test.

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

Add `IntegerLiteral` class and use it in tests

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

11. Let's now parse prefix expressions with operators. As always, a test.

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
