import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

class ConfigManager {
    private workspaceRoot: string;
    private configsPath: string;
    private configFile: string;
    private activeConfig: string | null = null;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
        this.configsPath = path.join(this.workspaceRoot, '.agent-configs');
        this.configFile = path.join(this.configsPath, 'configs.json');
        this.ensureDirectoryExists();
        this.loadActiveConfig();
    }

    private ensureDirectoryExists() {
        if (!fs.existsSync(this.configsPath)) {
            fs.mkdirSync(this.configsPath);
            this.createBaseTemplates();
            this.saveConfigList([]);
        }
    }

    private createBaseTemplates() {
        const templates = ['rules', 'memory-bank', 'templates'];
        templates.forEach(dir => {
            const dirPath = path.join(this.configsPath, '.base', dir);
            fs.mkdirSync(dirPath, { recursive: true });
            fs.writeFileSync(path.join(dirPath, 'default.txt'), `# Default ${dir} configuration`);
        });
    }

    private loadActiveConfig() {
        try {
            const configs = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
            const active = configs.find((c: any) => c.active);
            this.activeConfig = active ? active.name : null;
        } catch (error) {
            this.activeConfig = null;
        }
    }

    getConfigurations() {
        try {
            return JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
        } catch (error) {
            return [];
        }
    }

    saveConfigList(configs: any[]) {
        fs.writeFileSync(this.configFile, JSON.stringify(configs, null, 2));
    }

    createConfig(name: string) {
        const configs = this.getConfigurations();
        if (configs.some((c: any) => c.name === name)) {
            vscode.window.showErrorMessage(`Configuration "${name}" already exists!`);
            return;
        }

        const basePath = path.join(this.configsPath, '.base');
        const newConfigPath = path.join(this.configsPath, name);
        
        fs.mkdirSync(newConfigPath);
        this.copyFolderRecursive(basePath, newConfigPath);
        
        configs.push({ name, active: false });
        this.saveConfigList(configs);
        vscode.window.showInformationMessage(`Configuration "${name}" created successfully!`);
    }

    private copyFolderRecursive(source: string, target: string) {
        if (!fs.existsSync(source)) return;
        
        if (fs.lstatSync(source).isDirectory()) {
            fs.mkdirSync(target, { recursive: true });
            fs.readdirSync(source).forEach(file => {
                const curSource = path.join(source, file);
                const curTarget = path.join(target, file);
                this.copyFolderRecursive(curSource, curTarget);
            });
        } else {
            fs.copyFileSync(source, target);
        }
    }

    editConfig(name: string) {
        const configPath = path.join(this.configsPath, name);
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(configPath), true);
    }

    deleteConfig(name: string) {
        const configs = this.getConfigurations();
        const filtered = configs.filter((c: any) => c.name !== name);
        
        if (filtered.length === configs.length) {
            vscode.window.showErrorMessage(`Configuration "${name}" not found!`);
            return;
        }

        if (this.activeConfig === name) {
            this.deactivateCurrent();
        }

        try {
            fs.rmSync(path.join(this.configsPath, name), { recursive: true, force: true });
            this.saveConfigList(filtered);
            vscode.window.showInformationMessage(`Configuration "${name}" deleted!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error deleting "${name}": ${error}`);
        }
    }

    activateConfig(name: string) {
        const configs = this.getConfigurations();
        const updated = configs.map((c: any) => ({
            ...c,
            active: c.name === name
        }));

        this.deactivateCurrent();
        this.activeConfig = name;

        const sourcePath = path.join(this.configsPath, name);
        const targetPath = path.join(this.workspaceRoot, `.${name}`);
        
        this.copyFolderRecursive(sourcePath, targetPath);
        this.saveConfigList(updated);
        vscode.window.showInformationMessage(`${name} configuration activated!`);
    }

    private deactivateCurrent() {
        if (!this.activeConfig) return;
        
        const activePath = path.join(this.workspaceRoot, `.${this.activeConfig}`);
        if (fs.existsSync(activePath)) {
            try {
                fs.rmSync(activePath, { recursive: true, force: true });
            } catch (error) {
                vscode.window.showErrorMessage(`Error removing old config: ${error}`);
            }
        }
    }
}

class ConfigTreeItem extends vscode.TreeItem {
    constructor(
        public readonly name: string,
        public readonly isActive: boolean,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(name, collapsibleState);
        this.tooltip = `${name} ${isActive ? '(active)' : ''}`;
        this.description = isActive ? 'active' : '';
        this.iconPath = new vscode.ThemeIcon(isActive ? 'check' : 'gear');
        this.contextValue = isActive ? 'activeConfig' : 'config';
    }
}

class ConfigTreeProvider implements vscode.TreeDataProvider<ConfigTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ConfigTreeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private manager: ConfigManager;

    constructor(manager: ConfigManager) {
        this.manager = manager;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ConfigTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ConfigTreeItem): Thenable<ConfigTreeItem[]> {
        if (element) return Promise.resolve([]);
        
        const configs = this.manager.getConfigurations();
        return Promise.resolve(
            configs.map((c: any) => 
                new ConfigTreeItem(c.name, c.active, vscode.TreeItemCollapsibleState.None)
            )
        );
    }
}

export function activate(context: vscode.ExtensionContext) {
    const manager = new ConfigManager();
    const treeProvider = new ConfigTreeProvider(manager);
    
    vscode.window.registerTreeDataProvider('agentConfigs', treeProvider);
    vscode.commands.registerCommand('agentConfigs.refresh', () => treeProvider.refresh());
    
    // Configuration commands
    vscode.commands.registerCommand('agentConfigs.create', async () => {
        const name = await vscode.window.showInputBox({ prompt: 'Enter config name' });
        if (name) manager.createConfig(name);
        treeProvider.refresh();
    });

    vscode.commands.registerCommand('agentConfigs.edit', (item: ConfigTreeItem) => {
        manager.editConfig(item.name);
    });

    vscode.commands.registerCommand('agentConfigs.delete', (item: ConfigTreeItem) => {
        vscode.window.showWarningMessage(
            `Delete configuration "${item.name}"?`,
            { modal: true },
            'Delete'
        ).then(selection => {
            if (selection === 'Delete') {
                manager.deleteConfig(item.name);
                treeProvider.refresh();
            }
        });
    });

    vscode.commands.registerCommand('agentConfigs.activate', (item: ConfigTreeItem) => {
        manager.activateConfig(item.name);
        treeProvider.refresh();
    });
}

export function deactivate() {}