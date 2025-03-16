# MUI SX Fold

A Visual Studio Code extension that enhances code readability by automatically folding MUI's `sx` props in your React components.

## Features

- **Automatic Folding**: Automatically folds multiline `sx` props in your JavaScript/TypeScript React files
- **Toggle Support**: Easily toggle the folding feature on/off with a command
- **Visual Indicators**: Shows a subtle `{{...` indicator for folded props
- **Language Support**: Works with JavaScript, TypeScript, and their React variants (`.js`, `.jsx`, `.ts`, `.tsx`)

Example of how it works:

Before folding:
```jsx
<Button
  sx={{
    backgroundColor: 'primary.main',
    color: 'white',
    padding: 2,
    '&:hover': {
      backgroundColor: 'primary.dark'
    }
  }}
>
  Click Me
</Button>
```

After folding:
```jsx
<Button sx={{...
  Click Me
</Button>
```

## Requirements

- Visual Studio Code version 1.98.0 or higher
- React codebase using Material-UI (MUI) components

## Extension Settings

This extension contributes the following settings:

* `mui-sx-fold.enabled`: Enable/disable automatic folding of MUI sx props (default: `true`)

## Commands

The extension provides the following commands:

* `Toggle MUI SX Fold`: Toggle the folding feature on/off

You can access these commands through the Command Palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux).

## Known Issues

None reported yet. If you find any issues, please report them on our [GitHub repository](https://github.com/botspacehq/mui-sx-fold/issues).

## Release Notes

### 0.0.1

- Initial release
- Basic folding functionality for MUI sx props
- Toggle command
- Support for JS/TS React files

---

## Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/botspacehq/mui-sx-fold).

## License

This extension is licensed under the MIT License.
