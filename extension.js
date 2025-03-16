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

	// Handle active editor changes - only fold when a new file is opened
	const changeActiveEditor = vscode.window.onDidChangeActiveTextEditor(async editor => {
		if (editor && foldingProvider.enabled) {
			// Check if this is a supported file type
			if (supportedLanguages.includes(editor.document.languageId)) {
				await foldingProvider.foldRanges(editor);
			}
		}
	});

	// Automatically fold in the active editor when extension activates
	if (vscode.window.activeTextEditor && foldingProvider.enabled) {
		const editor = vscode.window.activeTextEditor;
		if (supportedLanguages.includes(editor.document.languageId)) {
			foldingProvider.foldRanges(editor);
		}
	}

	context.subscriptions.push(
		helloWorld,
		disposableFolding,
		toggleCommand,
		changeActiveEditor,
		foldingProvider.foldedDecoration,
		foldingProvider.hiddenDecoration
	);
}

class MUISXFoldingProvider {
	constructor() {
		this.enabled = true;
		this.debounceTimeout = null;
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
		
		// First unfold everything to ensure we start from a clean state
		await vscode.commands.executeCommand('editor.unfoldAll');
		
		const ranges = this.findSXRanges(document);
		
		// Store current cursor position
		const currentPosition = editor.selection.active;
		
		// Fold each range using VSCode's folding commands
		for (const range of ranges) {
			// Only fold if the sx prop is multiline
			if (range.end > range.start) {
				const line = document.lineAt(range.start);
				const sxMatch = line.text.match(/\bsx\s*=/);
				if (sxMatch) {
					// Check if the sx prop content is actually multiline
					const startLine = document.lineAt(range.start).text;
					const endLine = document.lineAt(range.end).text;
					
					// Skip if the opening and closing braces are on the same line
					if (startLine.includes('{') && startLine.includes('}')) {
						continue;
					}
					
					const sxStart = sxMatch.index;
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
		
		// Restore cursor position
		editor.selection = new vscode.Selection(currentPosition, currentPosition);
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

			// Match sx props more precisely
			const sxMatch = text.match(/\bsx\s*=\s*{/);
			if (sxMatch) {
				let openBraces = 0;
				let startLine = i;
				let endLine = i;
				let startColumn = sxMatch.index + sxMatch[0].length - 1; // Position of the opening brace

				// Find the matching closing brace for this specific sx prop
				for (let j = i; j < document.lineCount; j++) {
					const currentLine = document.lineAt(j).text;
					
					// For the first line, start from where we found the sx prop
					const startPos = j === i ? startColumn : 0;
					
					for (let k = startPos; k < currentLine.length; k++) {
						const char = currentLine[k];
						if (char === '{') {
							openBraces++;
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
