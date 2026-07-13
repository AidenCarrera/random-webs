import React, { useEffect, useRef, useState } from "react";

import { FILESYSTEM, MATRIX_THEME, TERMINAL_THEMES } from "../constants";
import type {
  ChainedCommand,
  CommandResult,
  FileSystem,
  FileSystemNode,
  ShellContext,
} from "../types";
import { COMMAND_REGISTRY } from "../lib/commands";
import {
  findGitBranch,
  getNodeByAbsolutePath as getNode,
  getParentAndName as getPathParentAndName,
  resolveAbsolutePath as resolvePath,
} from "../lib/filesystem";
import {
  expandEnvVars,
  expandHistory,
  parseArgsAndFlags,
  tokenizeArguments,
  tokenizeCommandLine,
} from "../lib/shell";
import { useAutoScroll } from "./use-auto-scroll";
import { useBootSequence } from "./use-boot-sequence";
import { useMatrixRain } from "./use-matrix-rain";
import { useSessionUptime } from "./use-session-uptime";

export function useTerminalController() {
  const [history, setHistory] = useState<string[]>([
    "Welcome to OloOS v2.0 browser terminal.",
    "Initializing OloOS environment...",
    "System loaded.",
    "Type 'help' for available commands.",
  ]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState<string>("~");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMatrixMode, setIsMatrixMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeId, setThemeId] = useState("tokyo");
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [customAccent, setCustomAccent] = useState("");
  const [customBackground, setCustomBackground] = useState("");
  const [fs, setFs] = useState<FileSystem>(FILESYSTEM);

  // Shell Features: Environmental variables & Sudo states
  const [env, setEnv] = useState<Record<string, string>>({
    HOME: "~",
    PATH: "/usr/bin:/bin",
    USER: "user",
  });
  const [isSudoElevated, setIsSudoElevated] = useState(false);
  const [passwordState, setPasswordState] = useState<{
    command: string;
  } | null>(null);

  const { bootLogs, isBooting, setIsBooting, startBootSequence } =
    useBootSequence();
  const [isPanic, setIsPanic] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useAutoScroll(history, bootLogs);
  const canvasRef = useMatrixRain(isMatrixMode);
  const getUptime = useSessionUptime();

  // Bricked system panic screen timeout handler
  useEffect(() => {
    if (!isPanic) return;

    const panicTimer = setTimeout(() => {
      setFs(structuredClone(FILESYSTEM));
      setIsPanic(false);
      startBootSequence();
    }, 5000);

    return () => clearTimeout(panicTimer);
  }, [isPanic, startBootSequence]);

  // Stateful filesystem adapters for command handlers.
  const resolveAbsolutePath = (path: string) => resolvePath(path, cwd);
  const getNodeByAbsolutePath = (
    absolutePath: string,
    currentFileSystem: FileSystem = fs,
  ) => getNode(absolutePath, currentFileSystem);
  const getParentAndName = getPathParentAndName;

  const createNode = (
    parentAbsolutePath: string,
    name: string,
    node: FileSystemNode,
  ): boolean => {
    const clone = structuredClone(fs);
    const parentNode = getNode(parentAbsolutePath, clone);
    if (parentNode?.type !== "dir") return false;

    if (!parentNode.children) parentNode.children = {};
    parentNode.children[name] = node;
    setFs(clone);
    return true;
  };

  const deleteNode = (parentAbsolutePath: string, name: string): boolean => {
    const clone = structuredClone(fs);
    const parentNode = getNode(parentAbsolutePath, clone);
    if (parentNode?.type !== "dir" || !parentNode.children?.[name]) {
      return false;
    }

    delete parentNode.children[name];
    setFs(clone);
    return true;
  };

  // Find git repository main branch indicator
  const getGitBranch = (): string | null => findGitBranch(cwd, fs);

  const getPromptString = (): string => {
    const git = getGitBranch();
    const branchText = git ? ` git:(${git})` : "";
    const currentUser = env.USER || "user";
    const symbol = currentUser === "root" ? "#" : "$";
    return `${currentUser}@olo:${cwd}${branchText}${symbol}`;
  };

  const selectedTheme =
    TERMINAL_THEMES.find((theme) => theme.id === themeId) || TERMINAL_THEMES[0];
  const previewTheme =
    TERMINAL_THEMES.find((theme) => theme.id === previewThemeId) || null;
  const activeTheme = isMatrixMode
    ? MATRIX_THEME
    : previewTheme
      ? previewTheme
      : {
          ...selectedTheme,
          bg: customBackground || selectedTheme.bg,
          panel: customBackground || selectedTheme.panel,
          border: customAccent || selectedTheme.border,
          text: customAccent || selectedTheme.text,
        };

  // Executing pipeline logic chaining
  const executeChainedCommands = async (
    tokens: ChainedCommand[],
    customContext?: Partial<ShellContext>,
  ): Promise<CommandResult> => {
    let lastResult: CommandResult = { stdout: "", stderr: "", exitCode: 0 };
    let pipeInput: string | null = null;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let cmdToRun = token.cmdLine;

      if (pipeInput !== null) {
        cmdToRun = `${cmdToRun} ${pipeInput}`;
        pipeInput = null;
      }

      lastResult = await executeCommand(cmdToRun, customContext);

      if (token.operator === "|") {
        pipeInput = lastResult.stdout || lastResult.stderr;
      } else if (token.operator === "&&") {
        if (lastResult.exitCode !== 0) break;
      } else if (token.operator === "||") {
        if (lastResult.exitCode === 0) break;
      }
    }

    return lastResult;
  };

  // Execute single command line string with redirections support
  const executeCommand = async (
    line: string,
    customContext?: Partial<ShellContext>,
  ): Promise<CommandResult> => {
    const trimmed = line.trim();
    if (!trimmed) return { stdout: "", stderr: "", exitCode: 0 };

    // Redirection parser
    let redirectType: "write" | "append" | null = null;
    let redirectFile: string | null = null;
    let cmdToRun = trimmed;

    if (trimmed.includes(" >> ")) {
      redirectType = "append";
      const parts = trimmed.split(" >> ");
      cmdToRun = parts[0].trim();
      redirectFile = parts[1].trim();
    } else if (trimmed.includes(" > ")) {
      redirectType = "write";
      const parts = trimmed.split(" > ");
      cmdToRun = parts[0].trim();
      redirectFile = parts[1].trim();
    }

    // Env expansion
    const expandedCmd = expandEnvVars(cmdToRun, env);

    // Shell Arguments Tokenizer (supporting single quotes, double quotes, and escapes)
    const rawParts = tokenizeArguments(expandedCmd);
    if (rawParts.length === 0) return { stdout: "", stderr: "", exitCode: 0 };

    const commandName = rawParts[0].toLowerCase();
    const { args, flags } = parseArgsAndFlags(rawParts.slice(1));

    const handler = COMMAND_REGISTRY[commandName];
    if (!handler) {
      return {
        stdout: "",
        stderr: `bash: ${commandName}: command not found`,
        exitCode: 127,
      };
    }

    const context: ShellContext = {
      cwd,
      setCwd,
      env,
      setEnv,
      setHistory,
      commandHistory,
      isMatrixMode,
      setIsMatrixMode,
      setIsPanic,
      isSudoElevated,
      resolveAbsolutePath,
      getNodeByAbsolutePath,
      getParentAndName,
      createNode,
      deleteNode,
      getUptime,
      ...customContext,
    };

    try {
      const result = await handler(args, flags, context);

      // Redirection execution!
      if (redirectFile && result.exitCode === 0) {
        const targetAbsPath = resolveAbsolutePath(redirectFile);
        const parentAndName = getParentAndName(targetAbsPath);
        const parentNode = getNodeByAbsolutePath(parentAndName.parent);

        if (!parentNode || parentNode.type !== "dir") {
          return {
            stdout: "",
            stderr: `bash: ${redirectFile}: No such file or directory`,
            exitCode: 1,
          };
        }

        const existingNode = parentNode.children?.[parentAndName.name];
        if (existingNode && existingNode.type === "dir") {
          return {
            stdout: "",
            stderr: `bash: ${redirectFile}: Is a directory`,
            exitCode: 1,
          };
        }

        const contentToWrite = result.stdout || result.stderr;
        const newContent =
          redirectType === "append" && existingNode?.content
            ? existingNode.content + "\n" + contentToWrite
            : contentToWrite;

        const success = createNode(parentAndName.parent, parentAndName.name, {
          type: "file",
          permissions: "-rw-r--r--",
          owner: isSudoElevated ? "root" : "user",
          group: isSudoElevated ? "root" : "user",
          size: newContent.length,
          modifiedDate: new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          content: newContent,
        });

        if (!success) {
          return {
            stdout: "",
            stderr: `bash: ${redirectFile}: Failed to write file`,
            exitCode: 1,
          };
        }
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        stdout: "",
        stderr: `bash: error executing ${commandName}: ${message}`,
        exitCode: 1,
      };
    }
  };

  // Write commands stdout logs
  const printResultToHistory = (line: string, res: CommandResult) => {
    const promptLine = `${getPromptString()} ${line}`;
    const outputLines: string[] = [];

    if (res.stdout) {
      outputLines.push(...res.stdout.split("\n"));
    }
    if (res.stderr) {
      outputLines.push(...res.stderr.split("\n"));
    }

    setHistory((prev) => [...prev, promptLine, ...outputLines]);
  };

  const submitCurrentInput = () => {
    const lineToRun = input;
    setInput("");
    setHistoryIndex(-1);
    inputRef.current?.focus();

    if (!lineToRun.trim() && !passwordState) return;

    if (passwordState) {
      // Accept any sudo password and elevate
      setHistory((prev) => [...prev, "[sudo] password for user: "]);

      setIsSudoElevated(true);
      setEnv((prev) => ({ ...prev, USER: "root" }));

      const tokens = tokenizeCommandLine(passwordState.command);
      executeChainedCommands(tokens, { isSudoElevated: true }).then((res) => {
        printResultToHistory(passwordState.command, res);
        setIsSudoElevated(false);
        setEnv((prev) => ({ ...prev, USER: "user" }));
      });
      setPasswordState(null);
      return;
    }

    // Expansions log check
    const { expanded, error: expError } = expandHistory(
      lineToRun,
      commandHistory,
    );
    if (expError) {
      setHistory((prev) => [
        ...prev,
        `${getPromptString()} ${lineToRun}`,
        expError,
      ]);
      return;
    }

    setCommandHistory((prev) => [...prev, lineToRun]);

    const tokens = tokenizeCommandLine(expanded);

    executeChainedCommands(tokens).then((res) => {
      // Intercept sudo request initiate password prompts
      if (res.stdout.startsWith("INITIATE_PASSWORD_PROMPT:")) {
        const targetCmd = res.stdout.replace("INITIATE_PASSWORD_PROMPT:", "");
        setPasswordState({
          command: targetCmd,
        });
        setHistory((prev) => [...prev, `${getPromptString()} ${lineToRun}`]);
        return;
      }

      printResultToHistory(lineToRun, res);
    });
  };

  // Tab completion
  const handleTabComplete = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const text = input;
    const parts = text.split(" ");

    const isCommand = parts.length === 1 && !text.endsWith(" ");
    const searchWord = text.endsWith(" ") ? "" : parts[parts.length - 1];

    const commandsList = Object.keys(COMMAND_REGISTRY);

    if (isCommand) {
      const matches = commandsList.filter((cmd) => cmd.startsWith(searchWord));
      if (matches.length === 1) {
        setInput(matches[0] + " ");
      } else if (matches.length > 1) {
        setHistory((prev) => [
          ...prev,
          `${getPromptString()} ${text}`,
          matches.join("   "),
        ]);
      }
    } else {
      let parentAbsPath = "";
      let prefix = "";

      if (text.endsWith(" ")) {
        parentAbsPath = resolveAbsolutePath("");
        prefix = "";
      } else {
        const absPath = resolveAbsolutePath(searchWord);
        const parentAndName = getParentAndName(absPath);
        parentAbsPath = parentAndName.parent;
        prefix = parentAndName.name;
      }

      const parentNode = getNodeByAbsolutePath(parentAbsPath);
      if (parentNode && parentNode.type === "dir" && parentNode.children) {
        const childNames = Object.keys(parentNode.children);
        const matches = childNames.filter((name) => name.startsWith(prefix));

        if (matches.length === 1) {
          const matchName = matches[0];
          const isDir = parentNode.children[matchName].type === "dir";
          const completedPart =
            matchName.substring(prefix.length) + (isDir ? "/" : " ");
          setInput((prev) => prev + completedPart);
        } else if (matches.length > 1) {
          setHistory((prev) => [
            ...prev,
            `${getPromptString()} ${text}`,
            matches
              .map((m) => {
                const isDir = parentNode.children![m].type === "dir";
                return isDir ? `${m}/` : m;
              })
              .join("   "),
          ]);
        }
      }
    }
  };

  // Keyboard shortcut catches
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+L (Clear logs)
    if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setHistory([]);
      return;
    }
    // Ctrl+C (Interrupt command)
    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      if (passwordState) {
        setHistory((prev) => [
          ...prev,
          "^C",
          "sudo: password prompt cancelled",
        ]);
        setPasswordState(null);
      } else {
        setHistory((prev) => [...prev, `${getPromptString()} ${input}^C`]);
      }
      setInput("");
      return;
    }
    // Ctrl+D (Log out/exit)
    if (e.ctrlKey && e.key === "d") {
      e.preventDefault();
      if (!input) {
        setHistory((prev) => [...prev, "logout", "Closing browser session..."]);
        setTimeout(() => {
          startBootSequence();
        }, 1500);
      }
      return;
    }

    if (e.key === "Tab") {
      handleTabComplete(e);
      return;
    }

    if (e.key === "Enter") {
      submitCurrentInput();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
        if (historyIndex === commandHistory.length - 1) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  // Skip boot sequences instantly on key press
  const handleBootSkip = () => {
    setIsBooting(false);
  };

  return {
    activeTheme,
    bootLogs,
    canvasRef,
    customAccent,
    customBackground,
    endRef,
    getPromptString,
    handleBootSkip,
    handleKeyDown,
    history,
    input,
    inputRef,
    isBooting,
    isMatrixMode,
    isPanic,
    passwordState,
    selectedTheme,
    setCustomAccent,
    setCustomBackground,
    setInput,
    setPreviewThemeId,
    setSettingsOpen,
    settingsOpen,
    setThemeId,
    themeId,
  };
}

export type TerminalController = ReturnType<typeof useTerminalController>;
