// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('MUI SX Fold is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const helloWorld = vscode.commands.registerCommand('mui-sx-fold.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from MUI SX Fold!');
	});

	// Register the folding provider for relevant file types
	const foldingProvider = new MUISXFoldingProvider();
	const supportedLanguages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];
	
	const disposableFolding = vscode.languages.registerFoldingRangeProvider(
		supportedLanguages.map(language => ({ language })),
		foldingProvider
	);

	// Register the toggle command
	const toggleCommand = vscode.commands.registerCommand('mui-sx-fold.toggleFold', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			foldingProvider.toggleFolding(editor);
		}
	});

	// Handle active editor changes
	const changeActiveEditor = vscode.window.onDidChangeActiveTextEditor(async editor => {
		if (editor && foldingProvider.enabled) {
			await foldingProvider.foldRanges(editor);
		}
	});

	// Handle document changes
	const changeDocument = vscode.workspace.onDidChangeTextDocument(async event => {
		const editor = vscode.window.activeTextEditor;
		if (editor && event.document === editor.document && foldingProvider.enabled) {
			await foldingProvider.foldRanges(editor);
		}
	});

	// Automatically fold in the active editor when extension activates
	if (vscode.window.activeTextEditor && foldingProvider.enabled) {
		foldingProvider.foldRanges(vscode.window.activeTextEditor);
	}

	context.subscriptions.push(
		helloWorld,
		disposableFolding,
		toggleCommand,
		changeActiveEditor,
		changeDocument,
		foldingProvider.foldedDecoration,
		foldingProvider.hiddenDecoration
	);
}

class MUISXFoldingProvider {
	constructor() {
		this.enabled = true;
		// Decoration for the folded line (sx={{ ... }})
		this.foldedDecoration = vscode.window.createTextEditorDecorationType({
			after: {
				contentText: ' { ... }',
				color: new vscode.ThemeColor('editorGhostText.foreground'),
				fontStyle: 'italic',
				margin: '0 0 0 0.5em'
			}
		});
		// Decoration to hide the content
		this.hiddenDecoration = vscode.window.createTextEditorDecorationType({
			textDecoration: 'none; display: none;'
		});
	}

	provideFoldingRanges(document, context, token) {
		const ranges = this.findSXRanges(document);
		return ranges.map(range => 
			new vscode.FoldingRange(range.start, range.end, vscode.FoldingRangeKind.Region)
		);
	}

	async toggleFolding(editor) {
		this.enabled = !this.enabled;
		if (this.enabled) {
			await this.foldRanges(editor);
		} else {
			await this.unfoldRanges(editor);
		}
		vscode.window.showInformationMessage(`MUI SX Fold: ${this.enabled ? 'Enabled' : 'Disabled'}`);
	}

	async foldRanges(editor) {
		if (!editor) return;
		
		const document = editor.document;
		const ranges = this.findSXRanges(document);
		
		// Fold each range using VSCode's folding commands
		for (const range of ranges) {
			// Only fold if the sx prop is multiline
			if (range.end > range.start) {
				// Find the position of 'sx=' in the line
				const line = document.lineAt(range.start);
				const sxMatch = line.text.match(/\bsx\s*=/);
				if (sxMatch) {
					const sxStart = sxMatch.index;
					// Create a selection that starts after 'sx=' and ends at the closing brace
					const foldingRange = new vscode.Selection(
						range.start,
						sxStart + sxMatch[0].length,
						range.end,
						document.lineAt(range.end).text.length
					);
					editor.selection = foldingRange;
					await vscode.commands.executeCommand('editor.fold');
				}
			}
		}
		
		// Clear selection
		editor.selection = new vscode.Selection(0, 0, 0, 0);
	}

	async unfoldRanges(editor) {
		if (!editor) return;
		await vscode.commands.executeCommand('editor.unfoldAll');
	}

	findSXRanges(document) {
		const ranges = [];
		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			const text = line.text;

			// Match sx props
			if (text.match(/\bsx\s*=\s*{/)) {
				let openBraces = 0;
				let startLine = i;
				let endLine = i;
				let foundFirstBrace = false;

				// Find the line with the opening brace
				for (let j = i; j < document.lineCount; j++) {
					const currentLine = document.lineAt(j).text;
					
					for (let k = 0; k < currentLine.length; k++) {
						const char = currentLine[k];
						if (char === '{') {
							openBraces++;
							if (!foundFirstBrace) {
								startLine = j;
								foundFirstBrace = true;
							}
						}
						if (char === '}') {
							openBraces--;
							if (openBraces === 0) {
								endLine = j;
								break;
							}
						}
					}
					
					if (endLine !== i) break;
				}

				// Only add multiline sx props
				if (endLine > startLine) {
					ranges.push({
						start: startLine,
						end: endLine
					});
				}
			}
		}
		return ranges;
	}
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
