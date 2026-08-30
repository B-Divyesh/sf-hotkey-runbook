import { invoke, isTauri } from "@tauri-apps/api/core";
import type { AppState, DirectoryInspection, NativeBridge, PreparedRun, RunResult } from "./types";

const unavailable = () => Promise.reject(new Error("Directory access and command execution are available in the installed desktop app."));

const demoState: AppState = {
  runbooks: [], directories: [], errors: [], demoMode: false,
};

export const bridge: NativeBridge = isTauri() ? {
  available: true,
  getState: () => invoke<AppState>("get_state"),
  inspectDirectory: (path) => invoke<DirectoryInspection>("inspect_directory", { path }),
  trustDirectory: (path, digest, acknowledged) => invoke<AppState>("trust_directory", { path, digest, acknowledged }),
  removeDirectory: (path) => invoke<AppState>("remove_directory", { path }),
  loadSampleProject: () => invoke<AppState>("load_sample_project"),
  resetDemoProject: () => invoke<AppState>("reset_demo_project"),
  resetSampleProject: () => invoke<AppState>("reset_sample_project"),
  prepareRun: (runbookId, parameters) => invoke<PreparedRun>("prepare_run", { runbookId, parameters }),
  executeRun: (runbookId, parameters, confirmation) => invoke<RunResult>("execute_run", { runbookId, parameters, confirmation }),
  history: () => invoke<RunResult[]>("get_history"),
  clearHistory: () => invoke<void>("clear_history"),
} : {
  available: false,
  getState: async () => demoState,
  inspectDirectory: unavailable,
  trustDirectory: unavailable,
  removeDirectory: unavailable,
  loadSampleProject: unavailable,
  resetDemoProject: unavailable,
  resetSampleProject: unavailable,
  prepareRun: unavailable,
  executeRun: unavailable,
  history: async () => [],
  clearHistory: async () => undefined,
};
