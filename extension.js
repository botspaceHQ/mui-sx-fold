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
		// Decoration to show the folded content
		this.foldedDecoration = vscode.window.createTextEditorDecorationType({
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
			after: {
				contentText: '{{...}}',
				color: new vscode.ThemeColor('editorGhostText.foreground'),
				margin: '0 0 0 0'
			}
		});
		// Decoration to hide the original content
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
		
		const foldedRanges = [];
		const hiddenRanges = [];

		for (const range of ranges) {
			if (range.end > range.start) {
				const startLine = document.lineAt(range.start);
				const sxMatch = startLine.text.match(/(\bsx\s*=\s*){/);
				
				if (sxMatch) {
					const sxStart = startLine.text.indexOf(sxMatch[0]);
					const braceStart = sxStart + sxMatch[1].length;

					// Fold only the content inside the sx prop
					foldedRanges.push({
						range: new vscode.Range(
							range.start,
							braceStart,
							range.start,
							startLine.text.length
						)
					});

					// Hide the lines between (not including the first and last braces)
					if (range.end > range.start) {
						hiddenRanges.push({
							range: new vscode.Range(
								range.start,
								startLine.text.length,
								range.end,
								0
							)
						});
					}
				}
			}
		}

		editor.setDecorations(this.foldedDecoration, foldedRanges);
		editor.setDecorations(this.hiddenDecoration, hiddenRanges);
	}

	async unfoldRanges(editor) {
		if (!editor) return;
		editor.setDecorations(this.foldedDecoration, []);
		editor.setDecorations(this.hiddenDecoration, []);
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

				// Count braces in the current line
				for (const char of text) {
					if (char === '{') openBraces++;
					if (char === '}') openBraces--;
				}

				// If we have unclosed braces, look for the closing ones
				if (openBraces > 0) {
					for (let j = i + 1; j < document.lineCount; j++) {
						const currentLine = document.lineAt(j).text;
						
						for (const char of currentLine) {
							if (char === '{') openBraces++;
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
