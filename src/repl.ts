import { createInterface } from "node:readline";
import { Lexer } from "./lexer/lexer";
import { Parser } from "./parser/parser";
import { evaluate } from "./evaluator/evaluator";

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
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    try {
        const program = parser.parseProgram();
        const value = evaluate(program);
        console.log(value.inspect());
    } catch (err: any) {
        console.log(err);
    }

    // Display the prompt again after handling input
    rl.prompt();
});

// Handle when the user closes the REPL (e.g., with Ctrl+C or exit)
rl.on("close", () => {
    console.log("Exiting REPL.");
    process.exit(0);
});
