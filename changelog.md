# Change Log

All notable changes to the "AI Config Switcher" extension will be documented in this file.

## [1.0.0] - 2024-12-16

### Added
- Initial release of AI Config Switcher
- Support for multiple AI coding tools (Cursor, Windsurf, Kilo Code, Claude Dev, GitHub Copilot)
- Profile management system with create, edit, delete, and switch functionality
- Auto-detection of existing AI configurations in workspace
- Sync current configuration to create new profiles
- Backup system before switching profiles
- Tree view for easy profile management
- Command palette integration with all major functions
- Comprehensive configuration options
- Smart file pattern matching for different AI tools
- Global profile storage across VS Code instances

### Features
- **Profile Management**: Create and manage multiple AI configuration profiles
- **Smart Detection**: Automatically detect AI tool configurations
- **One-Click Switching**: Switch between profiles with single command
- **Backup System**: Automatic backup before profile switches
- **Multi-Tool Support**: Support for 6+ popular AI coding tools
- **Tree View Interface**: Visual profile management in sidebar
- **Configuration Sync**: Capture existing setups as profiles
- **Auto-Suggestions**: Intelligent suggestions for profile creation

### Supported AI Tools
- Cursor (`.cursorrules`, `.cursorignore`, `cursor.json`)
- Windsurf (`.windsurfrules`, `.windsurfignore`, `windsurf.json`)
- Kilo Code (`.kilorules`, `.kiloignore`, `kilo.json`)
- Claude Dev (`.claude-rules`, `.claude-ignore`, `claude-dev.json`)
- GitHub Copilot (`.copilot-rules`, `.copilot-ignore`, `copilot.json`)
- Custom/Other AI tools (`.ai-rules`, `.ai-ignore`, `ai.json`)

### Commands
- `aiConfigSwitcher.switchProfile` - Switch AI Profile
- `aiConfigSwitcher.createProfile` - Create New AI Profile
- `aiConfigSwitcher.editProfile` - Edit AI Profile
- `aiConfigSwitcher.syncFromCurrent` - Sync Config from Current Setup
- `aiConfigSwitcher.manageProfiles` - Manage AI Profiles

### Configuration Options
- `aiConfigSwitcher.autoDetect` - Auto-detect AI tools (default: true)
- `aiConfigSwitcher.backupBeforeSwitch` - Backup before switching (default: true)
- `aiConfigSwitcher.showNotifications` - Show switch notifications (default: true)
- `aiConfigSwitcher.defaultProfile` - Default profile for new workspaces

## [Planned Features]

### [1.1.0] - Future Release
- Import/Export profiles for team sharing
- Workspace-specific profile storage
- Profile templates for common configurations
- Integration with popular project generators
- Enhanced backup management with restore functionality

### [1.2.0] - Future Release
- Custom AI tool configuration support
- Profile inheritance and composition
- Bulk profile operations
- Advanced file pattern matching
- Integration with VS Code settings sync

---

## Contributing

We welcome contributions! Please check our GitHub repository for:
- Bug reports and feature requests
- Code contributions and improvements
- Documentation updates
- Testing and feedback

## License

This extension is licensed under the MIT License.