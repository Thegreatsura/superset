import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export interface WorkspaceConfig {
	workspaces: Array<{
		id: string;
		name: string;
		repoPath: string;
		branch: string;
		layout: unknown;
		createdAt: string;
		updatedAt: string;
	}>;
}

class ConfigManager {
	private static instance: ConfigManager;
	private configPath: string;
	private configDir: string;

	private constructor() {
		this.configDir = path.join(os.homedir(), ".superset");
		this.configPath = path.join(this.configDir, "config.json");
		this.ensureConfigExists();
	}

	static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager();
		}
		return ConfigManager.instance;
	}

	private ensureConfigExists(): void {
		// Create directory if it doesn't exist
		if (!existsSync(this.configDir)) {
			mkdirSync(this.configDir, { recursive: true });
		}

		// Create config file with default structure if it doesn't exist
		if (!existsSync(this.configPath)) {
			const defaultConfig: WorkspaceConfig = {
				workspaces: [],
			};
			writeFileSync(
				this.configPath,
				JSON.stringify(defaultConfig, null, 2),
				"utf-8",
			);
		}
	}

	read(): WorkspaceConfig {
		try {
			const content = readFileSync(this.configPath, "utf-8");
			return JSON.parse(content) as WorkspaceConfig;
		} catch (error) {
			console.error("Failed to read config:", error);
			// Return default config if read fails
			return { workspaces: [] };
		}
	}

	write(config: WorkspaceConfig): boolean {
		try {
			writeFileSync(this.configPath, JSON.stringify(config, null, 2), "utf-8");
			return true;
		} catch (error) {
			console.error("Failed to write config:", error);
			return false;
		}
	}

	getConfigPath(): string {
		return this.configPath;
	}
}

export default ConfigManager.getInstance();
