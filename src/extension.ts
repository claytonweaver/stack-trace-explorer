// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { normalize } from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "stack-trace-explorer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('stack-trace-explorer.pasteStackTrace', () => {
		handlePasteStackTrace();
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }


async function handlePasteStackTrace() {
	try {
		const stackTrace = await vscode.window.showInputBox({
			placeHolder: 'Paste your C# stack trace here...',
			ignoreFocusOut: true,
			prompt: 'Paste your C# stack trace here:'
		});

		if (stackTrace) {
			// Define the regex pattern to match file paths and line numbers in the stack trace.
			const regex = /at .+? in (.+?):line (\d+)/g;

			let match;
			const matches = [];

			// Find all matches in the stack trace.
			while ((match = regex.exec(stackTrace))) {
				const [, filePath, lineNumber] = match;
				matches.push({ filePath, lineNumber });
			}

			if (matches.length > 0) {
				// Handle the first match in the stack trace.
				const { filePath, lineNumber } = matches[0];

				// Normalize the file path to handle different separators on each platform.
				const normalizedPath = normalize(filePath);

				const uri = vscode.Uri.file(normalizedPath);

				// Check if the file exists in the workspace.
				const fileExists = await vscode.workspace.fs.stat(uri).then(
					() => true,
					() => false
				);

				if (fileExists) {
					const position = new vscode.Position(Number(lineNumber) - 1, 0);
					const textDocument = await vscode.workspace.openTextDocument(uri);
					const editor = await vscode.window.showTextDocument(textDocument);
					editor.selection = new vscode.Selection(position, position);
					vscode.commands.executeCommand('revealLine', { lineNumber: Number(lineNumber), at: 'center' });
				} else {
					vscode.window.showErrorMessage(`File not found: ${normalizedPath}`);
				}
			} else {
				vscode.window.showWarningMessage('No file name and line number found in the stack trace.');
			}
		}
	} catch (error) {
		vscode.window.showErrorMessage('An error occurred while processing the stack trace.');
	}
}