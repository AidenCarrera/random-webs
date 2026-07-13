import type React from "react";

export type FileSystemNode = {
  type: "file" | "dir";
  permissions: string;
  owner: string;
  group: string;
  size: number;
  modifiedDate: string;
  children?: Record<string, FileSystemNode>;
  content?: string;
};

export type FileSystem = Record<string, FileSystemNode>;

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface NavigatorWithDeviceInfo extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
  };
}

export type TerminalTheme = {
  id: string;
  name: string;
  bg: string;
  panel: string;
  border: string;
  text: string;
  shadow: string;
};

export interface ShellContext {
  cwd: string;
  setCwd: (path: string) => void;
  env: Record<string, string>;
  setEnv: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setHistory: React.Dispatch<React.SetStateAction<string[]>>;
  commandHistory: string[];
  isMatrixMode: boolean;
  setIsMatrixMode: (value: boolean) => void;
  setIsPanic: (value: boolean) => void;
  isSudoElevated: boolean;
  resolveAbsolutePath: (path: string) => string;
  getNodeByAbsolutePath: (
    absolutePath: string,
    currentFs?: FileSystem,
  ) => FileSystemNode | null;
  getParentAndName: (absolutePath: string) => {
    parent: string;
    name: string;
  };
  createNode: (
    parentAbsolutePath: string,
    name: string,
    node: FileSystemNode,
  ) => boolean;
  deleteNode: (parentAbsolutePath: string, name: string) => boolean;
  getUptime?: () => string;
}

export type CommandHandler = (
  args: string[],
  flags: Record<string, boolean | string>,
  context: ShellContext,
) => CommandResult | Promise<CommandResult>;

export interface ChainedCommand {
  cmdLine: string;
  operator: "&&" | "||" | ";" | "|" | null;
}
