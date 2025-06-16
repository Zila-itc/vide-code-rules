# AI Config Switcher

A smart VS Code extension that manages configuration files for various AI coding agents like Cursor, Windsurf, Kilo Code, Claude Dev, and more. Switch between different AI tool configurations seamlessly without manually copying files.

## 🚀 Features

- **Smart Detection**: Automatically detects AI tool configurations in your workspace
- **Profile Management**: Create, edit, and manage configuration profiles for different AI tools
- **One-Click Switching**: Switch between AI configurations with a single command
- **Backup System**: Automatically backs up existing configurations before switching
- **Sync Current Config**: Capture your current AI setup and save it as a profile
- **Tree View**: Visual interface to manage and switch between profiles
- **Multi-Tool Support**: Supports Cursor, Windsurf, Kilo Code, Claude Dev, GitHub Copilot, and custom configurations


## 🎯 Use Cases

- **Multi-Project Developer**: Different projects need different AI configurations
- **Tool Experimentation**: Easily switch between different AI coding assistants
- **Team Collaboration**: Share standardized AI configurations across team members
- **Environment-Specific**: Different configs for development, testing, and production
- **Client Projects**: Maintain separate AI rules for different clients

## 📋 Commands

- `AI Config: Switch Profile` - Switch to a different AI configuration profile
- `AI Config: Create New AI Profile` - Create a new configuration profile
- `AI Config: Sync Config from Current Setup` - Capture current AI config as a new profile
- `AI Config: Edit AI Profile` - Edit an existing profile
- `AI Config: Manage AI Profiles` - Delete or view existing profiles

## 🛠️ Installation

1. **From VS Code Marketplace** (when published):
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "AI Config Switcher"
   - Click Install

2. **Manual Installation** (for development):
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd ai-config-switcher
   
   # Install dependencies
   npm install
   
   # Compile TypeScript
   npm run compile
   
   # Package the extension
   vsce package
   
   # Install the .vsix file in VS Code
   code --install-extension ai-config-switcher-1.0.0.vsix
   ```

## 🚀 Quick Start

### 1. First Time Setup

1. Open a project with existing AI configuration (e.g., Cursor project with `.cursorrules`)
2. Open Command Palette (`Ctrl+Shift+P`)
3. Run `AI Config: Sync Config from Current Setup`
4. Give your profile a name (e.g., "cursor-frontend")
5. Your current configuration is now saved as a profile!

### 2. Creating Additional Profiles

1. Switch to a different AI tool or modify your configuration
2. Run `AI Config: Sync Config from Current Setup` again
3. Save with a different name (e.g., "windsurf-backend")
4. Repeat for all your different configurations

### 3. Switching Profiles

**Method 1: Command Palette**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run `AI Config: Switch Profile`
3. Select the profile you want to activate

**Method 2: Tree View**
1. Open the AI Config Switcher panel in the Activity Bar
2. Click on any profile to switch to it

**Method 3: Auto-suggestion**
- The extension will automatically detect AI configurations and suggest creating profiles

## ⚙️ Configuration

The extension provides several settings to customize its behavior:

```json
{
  "aiConfigSwitcher.autoDetect": true,
  "aiConfigSwitcher.backupBeforeSwitch": true,
  "aiConfigSwitcher.showNotifications": true,
  "aiConfigSwitcher.defaultProfile": ""
}
```

### Settings Description

- **`autoDetect`**: Automatically detect AI tools and suggest profile switches
- **`backupBeforeSwitch`**: Create backup before switching profiles (recommended)
- **`showNotifications`**: Show notifications when switching profiles
- **`defaultProfile`**: Default AI profile to use for new workspaces

## 💡 Example Workflows

### Scenario 1: Frontend + Backend Developer
```
Profile: "cursor-react"
- .cursorrules with React/TypeScript rules
- .cursorignore excluding node_modules, dist

Profile: "windsurf-nodejs"  
- .windsurfrules with Node.js/Express rules
- .windsurfignore excluding logs, temp files
```

### Scenario 2: Multi-Client Consultant
```
Profile: "client-a-strict"
- Conservative AI rules
- Strict code review requirements

Profile: "client-b-creative"
- More permissive AI assistance
- Focus on rapid prototyping
```

### Scenario 3: Learning Different AI Tools
```
Profile: "cursor-experiment"
- Cursor configuration for testing

Profile: "windsurf-experiment"
- Windsurf configuration for comparison

Profile: "kilo-experiment"
- Kilo Code configuration for evaluation
```

## 🔧 Advanced Usage

### Custom Configuration Files

You can extend the extension to support custom AI tools by modifying the configuration mappings in your workspace settings:

```json
{
  "aiConfigSwitcher.customMappings": {
    "my-ai-tool": [".my-ai-rules", ".my-ai-ignore", "my-ai.json"]
  }
}
```

### Backup Management

Backups are stored in `.ai-config-backups/` in your workspace root. Each backup is timestamped and contains all AI-related configuration files from the time of switching.

### Profile Sharing

Profiles are stored globally in VS Code's storage. To share profiles with team members:

1. Export profiles: Copy from VS Code's global storage
2. Import profiles: Paste into team member's global storage
3. Or use workspace-specific profile files (feature in development)

## 🐛 Troubleshooting

### Common Issues

**Q: Profile switching doesn't work**
- Ensure you have write permissions in your workspace
- Check if backup is enabled and there's sufficient disk space
- Look for error messages in VS Code's Output panel

**Q: Configuration files not detected**
- Verify the file names match the supported patterns
- Check if files are in the root workspace directory
- Some AI tools use nested directory structures

**Q: Profiles not saving**
- Check VS Code's global storage permissions
- Ensure the extension is properly activated
- Try restarting VS Code

### Getting Help

1. Check the Output panel: View → Output → AI Config Switcher
2. Enable debug logging in settings
3. Report issues with:
   - VS Code version
   - Extension version
   - Operating system
   - Error messages or logs

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:

- Bug reports
- Feature requests  
- Code contributions
- Documentation improvements

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- VS Code Extension API documentation
- The AI coding tools community
- Contributors and testers

---

**Happy Coding with AI! 🤖✨**