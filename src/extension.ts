import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as globModule from 'glob';

// Type definitions
export type AIToolType = 'cursor' | 'windsurf' | 'kilocode' | 'claude-dev' | 'copilot' | 'other';

export interface AIProfile {
  name: string;
  description: string;
  configs: {
    [fileName: string]: string | object;
  };
  ignorePatterns: string;
  rules: string;
  memoryBank: string;
  aiTool: AIToolType;
}

interface GlobOptions {
  cwd?: string;
  nodir?: boolean;
  dot?: boolean;
}

// Configuration mappings
const CONFIG_MAPPINGS: Record<AIToolType, readonly string[]> = {
  cursor: ['.cursorrules', '.cursorignore', '.cursor'],
  windsurf: ['.windsurfrules', '.windsurfignore', 'windsurf.json', '.windsurf'],
  kilocode: ['.ai_config.toml', '.pr_agent.toml', '.kiloignore', '.kilo'],
  'claude-dev': ['.claude-rules', '.claude-ignore', 'claude-dev.json', '.claude'],
  copilot: ['.github/copilot-instructions.md', '.github'],
  other: ['.aiexclude', '.amazonq', 'devfile.yaml', '.gemini', '.replit', 'replit.nix', '.cody', '.clinerules', 'memory_bank']
};

// Utility functions
async function glob(pattern: string, options: GlobOptions = {}): Promise<string[]> {
  return new Promise((resolve, reject) => {
    globModule.glob(pattern, options, (err: Error | null, matches: string[]) => {
      if (err) reject(err);
      else resolve(matches);
    });
  });
}

function handleError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// Export these for use in other files
export { CONFIG_MAPPINGS, glob, handleError };

class AIConfigManager {
  private context: vscode.ExtensionContext;
  private profilesPath: string;
  private currentWorkspace: string | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.profilesPath = path.join(context.globalStorageUri.fsPath, 'ai-profiles.json');
    this.currentWorkspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    this.ensureProfilesFile();
  }

  private async ensureProfilesFile(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.profilesPath));
      if (!(await fs.pathExists(this.profilesPath))) {
        await fs.writeJSON(this.profilesPath, {});
      }
    } catch (error) {
      console.error('Error ensuring profiles file:', handleError(error));
      throw error;
    }
  }

  async getProfiles(): Promise<{ [key: string]: AIProfile }> {
    try {
      return (await fs.readJSON(this.profilesPath)) || {};
    } catch {
      return {};
    }
  }

  async saveProfile(profileName: string, profile: AIProfile): Promise<void> {
    try {
      const profiles = await this.getProfiles();
      profiles[profileName] = profile;
      await fs.writeJSON(this.profilesPath, profiles, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save profile: ${handleError(error)}`);
    }
  }

  async saveProfiles(profiles: { [key: string]: AIProfile }): Promise<void> {
    try {
      await fs.writeJSON(this.profilesPath, profiles, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save profiles: ${handleError(error)}`);
    }
  }

  async detectAIConfigurations(): Promise<AIToolType[]> {
    if (!this.currentWorkspace) return [];

    const detectedTools: AIToolType[] = [];
    for (const [tool, patterns] of Object.entries(CONFIG_MAPPINGS)) {
      const aiTool = tool as AIToolType;
      for (const pattern of patterns) {
        try {
          const matches = await glob(pattern, { cwd: this.currentWorkspace });
          if (matches.length > 0) {
            detectedTools.push(aiTool);
            break;
          }
        } catch (error) {
          console.error(`Error detecting ${pattern}:`, handleError(error));
        }
      }
    }
    return detectedTools;
  }

  async createProfile(name: string, description: string, aiTool: AIToolType): Promise<void> {
    if (!this.currentWorkspace) {
      throw new Error('No workspace is open');
    }

    const profile: AIProfile = {
      name,
      description: description || `${aiTool} configuration`,
      configs: {},
      ignorePatterns: '',
      rules: '',
      memoryBank: '',
      aiTool
    };

    await this.saveProfile(name, profile);
  }

  async switchProfile(profileName: string): Promise<void> {
    if (!this.currentWorkspace) {
      throw new Error('No workspace is open');
    }

    const profiles = await this.getProfiles();
    const profile = profiles[profileName];
    
    if (!profile) {
      throw new Error(`Profile "${profileName}" not found`);
    }

    try {
      // Create backup if enabled
      const config = vscode.workspace.getConfiguration('aiConfigSwitcher');
      if (config.get('backupBeforeSwitch')) {
        await this.backupCurrentConfig();
      }

      // Remove existing config files
      for (const [tool, patterns] of Object.entries(CONFIG_MAPPINGS)) {
        const aiTool = tool as AIToolType;
        for (const configFile of patterns) {
          const filePath = path.join(this.currentWorkspace, configFile);
          if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
          }
        }
      }

      // Write new config files
      for (const [fileName, content] of Object.entries(profile.configs)) {
        const filePath = path.join(this.currentWorkspace, fileName);
        await fs.ensureDir(path.dirname(filePath));
        
        if (typeof content === 'string') {
          await fs.writeFile(filePath, content);
        } else {
          await fs.writeJSON(filePath, content, { spaces: 2 });
        }
      }

      // Write specialized config files
      if (profile.rules) {
        await fs.writeFile(path.join(this.currentWorkspace, '.rules'), profile.rules);
      }

      if (profile.ignorePatterns) {
        await fs.writeFile(path.join(this.currentWorkspace, '.aiignore'), profile.ignorePatterns);
      }

      if (profile.memoryBank) {
        await fs.writeFile(path.join(this.currentWorkspace, 'memory_bank'), profile.memoryBank);
      }

      if (config.get('showNotifications')) {
        vscode.window.showInformationMessage(`Switched to AI profile: ${profileName}`);
      }
    } catch (error) {
      throw new Error(`Failed to switch to profile "${profileName}": ${handleError(error)}`);
    }
  }

  private async backupCurrentConfig(): Promise<void> {
    if (!this.currentWorkspace) return;

    try {
      const backupDir = path.join(this.currentWorkspace, '.ai-config-backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup-${timestamp}`);

      await fs.ensureDir(backupDir);
      for (const [tool, patterns] of Object.entries(CONFIG_MAPPINGS)) {
        const aiTool = tool as AIToolType;
        for (const configFile of patterns) {
          const sourcePath = path.join(this.currentWorkspace, configFile);
          if (await fs.pathExists(sourcePath)) {
            const destPath = path.join(backupPath, configFile);
            await fs.ensureDir(path.dirname(destPath));
            await fs.copy(sourcePath, destPath);
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to create backup: ${handleError(error)}`);
    }
  }

  async suggestProfileCreation(): Promise<void> {
    const detectedTools = await this.detectAIConfigurations();
    if (detectedTools.length === 0) return;

    const profiles = await this.getProfiles();
    const hasMatchingProfile = Object.values(profiles).some(
      profile => detectedTools.includes(profile.aiTool)
    );

    if (!hasMatchingProfile) {
      const create = await vscode.window.showInformationMessage(
        `Detected ${detectedTools.join(', ')} configuration. Would you like to create a profile?`,
        'Yes', 'No'
      );
      
      if (create === 'Yes') {
        vscode.commands.executeCommand('aiConfigSwitcher.syncFromCurrent');
      }
    }
  }

  async getCurrentProfile(): Promise<AIProfile | undefined> {
    if (!this.currentWorkspace) return undefined;

    const detectedTools = await this.detectAIConfigurations();
    if (detectedTools.length === 0) return undefined;

    const profiles = await this.getProfiles();
    return Object.values(profiles).find(profile => detectedTools.includes(profile.aiTool));
  }
}

class AIProfileProvider implements vscode.TreeDataProvider<AIProfileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    AIProfileItem | undefined | null | void
  > = new vscode.EventEmitter<AIProfileItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AIProfileItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private configManager: AIConfigManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AIProfileItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: AIProfileItem): Promise<AIProfileItem[]> {
    if (!element) {
      const profiles = await this.configManager.getProfiles();
      const currentProfile = await this.configManager.getCurrentProfile();

      return Object.entries(profiles).map(
        ([name, profile]) =>
          new AIProfileItem(
            name,
            profile.description || `${profile.aiTool} configuration`,
            profile.aiTool,
            name === currentProfile?.name
          )
      );
    }
    return [];
  }
}

class AIProfileItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly aiTool: string,
    public readonly isActive: boolean
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${this.name}: ${this.description}`;
    this.description = `${aiTool}${isActive ? " (active)" : ""}`;
    this.iconPath = new vscode.ThemeIcon(isActive ? "check" : "gear");

    this.command = {
      command: "aiConfigSwitcher.switchProfile",
      title: "Switch Profile",
      arguments: [this.name],
    };
  }
}

class AIProfilesTreeDataProvider implements vscode.TreeDataProvider<AIProfileTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<AIProfileTreeItem | undefined | null | void> = new vscode.EventEmitter<AIProfileTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AIProfileTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
  constructor(private configManager: AIConfigManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AIProfileTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<AIProfileTreeItem[]> {
    const profiles = await this.configManager.getProfiles();
    return Object.entries(profiles).map(([name, profile]) => 
      new AIProfileTreeItem(name, profile.description, profile.aiTool)
    );
  }
}

class AIProfileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly aiTool: string
  ) {
    super(label);
    this.tooltip = description;
    this.description = aiTool;
    this.iconPath = new vscode.ThemeIcon('symbol-enum');
    this.command = {
      command: 'aiConfigSwitcher.switchProfile',
      title: 'Switch Profile',
      arguments: [label]
    };
  }
}

export function activate(context: vscode.ExtensionContext) {
  const configManager = new AIConfigManager(context);
  const treeDataProvider = new AIProfilesTreeDataProvider(configManager);

  // Register TreeView
  vscode.window.createTreeView('aiConfigProfiles', {
    treeDataProvider,
    showCollapseAll: true
  });

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('aiConfigSwitcher.switchProfile', async (profileName?: string) => {
      try {
        if (!profileName) {
          const profiles = await configManager.getProfiles();
          const items = Object.entries(profiles).map(([name, profile]) => ({
            label: name,
            description: String(profile.aiTool)
          }));

          const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a profile to switch to'
          });

          if (!selected) return;
          profileName = selected.label;
        }

        await configManager.switchProfile(profileName);
        treeDataProvider.refresh();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(errorMessage);
      }
    }),

    vscode.commands.registerCommand('aiConfigSwitcher.createProfile', async () => {
      try {
        const name = await vscode.window.showInputBox({
          placeHolder: 'Enter profile name',
          validateInput: async (value) => {
            if (!value) return 'Profile name is required';
            const profiles = await configManager.getProfiles();
            if (profiles[value]) return 'Profile already exists';
            return null;
          }
        });

        if (!name) return;

        const description = await vscode.window.showInputBox({
          placeHolder: 'Enter profile description'
        }) || '';

        const aiTools = Object.keys(CONFIG_MAPPINGS) as AIToolType[];
        const aiTool = await vscode.window.showQuickPick(aiTools, {
          placeHolder: 'Select AI tool type'
        }) as AIToolType | undefined;

        if (!aiTool) return;

        await configManager.createProfile(name, description, aiTool);
        treeDataProvider.refresh();
        vscode.window.showInformationMessage(`Created profile: ${name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(errorMessage);
      }
    }),

    vscode.commands.registerCommand('aiConfigSwitcher.editProfile', async (profileName?: string) => {
      try {
        if (!profileName) {
          const profiles = await configManager.getProfiles();
          const items = Object.entries(profiles).map(([name, profile]) => ({
            label: name,
            description: String(profile.aiTool)
          }));

          const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a profile to edit'
          });

          if (!selected) return;
          profileName = selected.label;
        }

        const profile = (await configManager.getProfiles())[profileName];
        if (!profile) {
          vscode.window.showErrorMessage(`Profile ${profileName} not found`);
          return;
        }

        const description = await vscode.window.showInputBox({
          placeHolder: 'Enter new profile description',
          value: profile.description
        });

        if (description === undefined) return;

        const aiTools = Object.keys(CONFIG_MAPPINGS) as AIToolType[];
        const aiToolItems = aiTools.map(tool => ({ label: tool }));
        const aiToolPick = await vscode.window.showQuickPick(aiToolItems, {
          placeHolder: 'Select AI tool type'
        });
        const aiTool = aiToolPick?.label as AIToolType | undefined;

        if (!aiTool) return;

        await configManager.createProfile(profileName, description, aiTool);
        treeDataProvider.refresh();
        vscode.window.showInformationMessage(`Updated profile: ${profileName}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(errorMessage);
      }
    }),

    vscode.commands.registerCommand('aiConfigSwitcher.syncFromCurrent', async () => {
      try {
        const name = await vscode.window.showInputBox({
          placeHolder: 'Enter profile name for current configuration',
          validateInput: async (value) => {
            if (!value) return 'Profile name is required';
            const profiles = await configManager.getProfiles();
            if (profiles[value]) return 'Profile already exists';
            return null;
          }
        });

        if (!name) return;

        const description = await vscode.window.showInputBox({
          placeHolder: 'Enter profile description'
        }) || '';

        const detectedTools = await configManager.detectAIConfigurations();
        if (detectedTools.length === 0) {
          vscode.window.showErrorMessage('No AI configuration detected in current workspace');
          return;
        }

        const aiTool = detectedTools[0];
        await configManager.createProfile(name, description, aiTool);
        treeDataProvider.refresh();
        vscode.window.showInformationMessage(`Created profile from current configuration: ${name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(errorMessage);
      }
    }),

    vscode.commands.registerCommand('aiConfigSwitcher.manageProfiles', async () => {
      try {
        const profiles = await configManager.getProfiles();
        const items = Object.entries(profiles).map(([name, profile]) => ({
          label: name,
          description: String(profile.aiTool),
          detail: profile.description
        }));

        const actions = ['Delete', 'Edit'];
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a profile to manage'
        });

        if (!selected) return;

        const action = await vscode.window.showQuickPick(actions, {
          placeHolder: `Choose action for ${selected.label}`
        });

        if (!action) return;

        if (action === 'Delete') {
          const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete profile "${selected.label}"?`,
            { modal: true },
            'Yes',
            'No'
          );

          if (confirm === 'Yes') {
            delete profiles[selected.label];
            await configManager.saveProfiles(profiles);
            treeDataProvider.refresh();
            vscode.window.showInformationMessage(`Deleted profile: ${selected.label}`);
          }
        } else if (action === 'Edit') {
          await vscode.commands.executeCommand('aiConfigSwitcher.editProfile', selected.label);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(errorMessage);
      }
    })
  );

  // Auto-detect on startup if enabled
  const config = vscode.workspace.getConfiguration('aiConfigSwitcher');
  if (config.get('autoDetect')) {
    configManager.suggestProfileCreation().catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Auto-detection failed: ${errorMessage}`);
    });
  }
}

export function deactivate() {
  console.log("AI Config Switcher extension deactivated");
}
