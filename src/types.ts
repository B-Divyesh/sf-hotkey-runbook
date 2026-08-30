export type ParameterType = "text" | "integer" | "choice" | "boolean" | "path" | "secret";

export interface RunbookParameter {
  name: string;
  label: string;
  type: ParameterType;
  required?: boolean;
  description?: string;
  default?: string | number | boolean;
  choices?: string[];
  pattern?: string;
}

export interface RunbookSummary {
  id: string;
  name: string;
  description: string;
  tags: string[];
  risk: "low" | "medium" | "high";
  rollback: string;
  parameters: RunbookParameter[];
  stepCount: number;
  source: string;
  trusted: boolean;
}

export interface TrustedDirectory {
  path: string;
  digest: string;
  signedAt: string;
  valid: boolean;
  error?: string;
}

export interface AppState {
  runbooks: RunbookSummary[];
  directories: TrustedDirectory[];
  errors: string[];
  demoMode: boolean;
}

export interface PreparedStep { program: string; args: string[]; cwd?: string; env: Record<string, string>; display: string; }
export interface PreparedRun { runbookId: string; name: string; risk: string; rollback: string; steps: PreparedStep[]; }
export interface RunResult { id: string; runbookId: string; name: string; startedAt: string; durationMs: number; status: "success" | "failed"; exitCode?: number; output: string; rollback: string; }
export interface DirectoryInspection { path: string; digest: string; files: string[]; runbooks: RunbookSummary[]; warnings: string[]; }

export interface NativeBridge {
  available: boolean;
  getState(): Promise<AppState>;
  inspectDirectory(path: string): Promise<DirectoryInspection>;
  trustDirectory(path: string, digest: string, acknowledged: boolean): Promise<AppState>;
  removeDirectory(path: string): Promise<AppState>;
  loadSampleProject(): Promise<AppState>;
  resetSampleProject(): Promise<AppState>;
  prepareRun(runbookId: string, parameters: Record<string, unknown>): Promise<PreparedRun>;
  executeRun(runbookId: string, parameters: Record<string, unknown>, confirmation: string): Promise<RunResult>;
  history(): Promise<RunResult[]>;
  clearHistory(): Promise<void>;
}
