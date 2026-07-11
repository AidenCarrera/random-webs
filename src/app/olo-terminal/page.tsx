"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, Settings, Terminal, Maximize2, X, Minus } from "lucide-react";
import {
  ADVICE,
  ASCII_ART,
  FILESYSTEM,
  FORTUNES,
  getVirtualCPU,
  JOKES,
  MATRIX_THEME,
  SYSTEM_INFO,
  TERMINAL_THEMES,
  type TerminalTheme,
} from "./utils";

type FileSystemNode = {
  type: "file" | "dir";
  permissions: string;
  owner: string;
  group: string;
  size: number;
  modifiedDate: string;
  children?: Record<string, FileSystemNode>;
  content?: string;
};

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface ShellContext {
  fs: Record<string, FileSystemNode>;
  setFs: React.Dispatch<React.SetStateAction<Record<string, FileSystemNode>>>;
  cwd: string;
  setCwd: (path: string) => void;
  env: Record<string, string>;
  setEnv: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  history: string[];
  setHistory: React.Dispatch<React.SetStateAction<string[]>>;
  commandHistory: string[];
  setCommandHistory: React.Dispatch<React.SetStateAction<string[]>>;
  isMatrixMode: boolean;
  setIsMatrixMode: (val: boolean) => void;
  isPanic: boolean;
  setIsPanic: (val: boolean) => void;
  isSudoElevated: boolean;
  setIsSudoElevated: (val: boolean) => void;
  resolveAbsolutePath: (path: string) => string;
  getNodeByAbsolutePath: (
    absPath: string,
    currentFs?: Record<string, FileSystemNode>,
  ) => FileSystemNode | null;
  getParentAndName: (absPath: string) => { parent: string; name: string };
  createNode: (
    parentAbsPath: string,
    name: string,
    node: FileSystemNode,
  ) => boolean;
  deleteNode: (parentAbsPath: string, name: string) => boolean;
  getUptime?: () => string;
}

type CommandHandler = (
  args: string[],
  flags: Record<string, boolean | string>,
  context: ShellContext,
) => CommandResult | Promise<CommandResult>;

// Proper Unix Shell Tokenizer supporting Quotes & Escapes
const tokenizeArguments = (line: string): string[] => {
  const args: string[] = [];
  let current = "";
  let inDoubleQuotes = false;
  let inSingleQuotes = false;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"' && !inSingleQuotes) {
      inDoubleQuotes = !inDoubleQuotes;
      continue;
    }

    if (char === "'" && !inDoubleQuotes) {
      inSingleQuotes = !inSingleQuotes;
      continue;
    }

    if ((char === " " || char === "\t") && !inDoubleQuotes && !inSingleQuotes) {
      if (current !== "") {
        args.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current !== "") {
    args.push(current);
  }

  return args;
};

// Command flag and arguments parser
const parseArgsAndFlags = (
  parts: string[],
): { args: string[]; flags: Record<string, boolean | string> } => {
  const args: string[] = [];
  const flags: Record<string, boolean | string> = {};

  for (const part of parts) {
    if (part.startsWith("--")) {
      const eqIdx = part.indexOf("=");
      if (eqIdx !== -1) {
        const name = part.substring(2, eqIdx);
        const value = part.substring(eqIdx + 1);
        flags[name] = value;
      } else {
        const name = part.substring(2);
        flags[name] = true;
      }
    } else if (part.startsWith("-") && part !== "-") {
      const chars = part.substring(1).split("");
      for (const char of chars) {
        flags[char] = true;
      }
    } else {
      args.push(part);
    }
  }

  return { args, flags };
};

// Expand environment variables
const expandEnvVars = (line: string, env: Record<string, string>): string => {
  return line.replace(
    /\$(\{([a-zA-Z0-9_]+)\}|([a-zA-Z0-9_]+))/g,
    (match, p1, p2, p3) => {
      const varName = p2 || p3;
      return env[varName] !== undefined ? env[varName] : "";
    },
  );
};

// Chained tokenizer
interface ChainedCommand {
  cmdLine: string;
  operator: "&&" | "||" | ";" | "|" | null;
}

const tokenizeCommandLine = (line: string): ChainedCommand[] => {
  const result: ChainedCommand[] = [];
  let current = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === "&" && nextChar === "&") {
      result.push({ cmdLine: current.trim(), operator: "&&" });
      current = "";
      i++;
    } else if (char === "|" && nextChar === "|") {
      result.push({ cmdLine: current.trim(), operator: "||" });
      current = "";
      i++;
    } else if (char === ";") {
      result.push({ cmdLine: current.trim(), operator: ";" });
      current = "";
    } else if (char === "|") {
      result.push({ cmdLine: current.trim(), operator: "|" });
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push({ cmdLine: current.trim(), operator: null });
  }

  return result;
};

// Command expansions helper
const expandHistory = (
  line: string,
  cmdHistory: string[],
): { expanded: string; error?: string } => {
  let expanded = line;
  const regex = /!(!|\d+|[a-zA-Z_]+)/g;
  let match;
  let errorMsg: string | undefined;

  while ((match = regex.exec(line)) !== null) {
    const fullMatch = match[0];
    const target = match[1];
    let resolved = "";

    if (target === "!") {
      if (cmdHistory.length === 0) {
        errorMsg = "bash: !!: event not found";
        break;
      }
      resolved = cmdHistory[cmdHistory.length - 1];
    } else if (/^\d+$/.test(target)) {
      const index = parseInt(target, 10) - 1;
      if (index < 0 || index >= cmdHistory.length) {
        errorMsg = `bash: !${target}: event not found`;
        break;
      }
      resolved = cmdHistory[index];
    } else {
      let found = "";
      for (let i = cmdHistory.length - 1; i >= 0; i--) {
        if (cmdHistory[i].startsWith(target)) {
          found = cmdHistory[i];
          break;
        }
      }
      if (!found) {
        errorMsg = `bash: !${target}: event not found`;
        break;
      }
      resolved = found;
    }
    expanded = expanded.replace(fullMatch, resolved);
  }

  return { expanded, error: errorMsg };
};

// Command definitions registry
const COMMAND_REGISTRY: Record<string, CommandHandler> = {
  help: () => {
    const isSmallScreen =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px)").matches;
    const list = isSmallScreen
      ? [
          "OLO Shell - Try These",
          "=====================",
          "help        - Show this list",
          "ls          - See files",
          "cd docs     - Move around",
          "cat file    - Read a file",
          "clear       - Clean the screen",
          "joke        - Read a dev joke",
          "advice      - Get a bit of guidance",
          "fortune     - Reveal your future",
          "cowsay hi   - Make it moo",
          "matrix      - Toggle rain mode",
          "fetch       - System card",
        ]
      : [
          "OLO Shell v2.0 - Core Commands",
          "================================",
          "help                  - Display this help information",
          "ls [-l] [-a] [path]   - List files and directories",
          "cd [path]             - Change current working directory",
          "pwd                   - Print absolute working directory",
          "mkdir [-p] [path]     - Make new directory",
          "touch [path]          - Update timestamp or create empty file",
          "cat [path...]         - Output file content",
          "rm [-r] [-f] [path]   - Delete file or folder",
          "clear                 - Clear screen buffer",
          "whoami                - Show current active user",
          "joke                  - Read a developer joke",
          "advice                - Get a bit of guidance",
          "fortune               - Reveal your future",
          "cowsay [text...]      - Speak through a cow bubble",
          "ghostsay [text...]    - Speak through a ghost bubble",
          "matrix                - Toggle Matrix digital rain theme",
          "fetch / neofetch      - Fetch system/browser info card",
          "sudo [cmd...]         - Execute command as superuser",
          "",
          "Supports: pipes, chaining, variables, tab completion",
        ];
    return { stdout: list.join("\n"), stderr: "", exitCode: 0 };
  },

  clear: (args, flags, ctx) => {
    ctx.setHistory([]);
    return { stdout: "", stderr: "", exitCode: 0 };
  },

  pwd: (args, flags, ctx) => {
    return { stdout: ctx.cwd, stderr: "", exitCode: 0 };
  },

  whoami: (args, flags, ctx) => {
    return { stdout: ctx.env.USER || "user", stderr: "", exitCode: 0 };
  },

  date: () => {
    return { stdout: new Date().toString(), stderr: "", exitCode: 0 };
  },

  echo: (args) => {
    return { stdout: args.join(" "), stderr: "", exitCode: 0 };
  },

  history: (args, flags, ctx) => {
    const list = ctx.commandHistory.map((cmd, i) => `  ${i + 1}  ${cmd}`);
    return { stdout: list.join("\n"), stderr: "", exitCode: 0 };
  },

  uname: (args, flags) => {
    if (flags.a) {
      return {
        stdout: "OloOS browser-simulation 5.15.0-olo-generic #1 SMP Jul 4 x86_64 OloOS",
        stderr: "",
        exitCode: 0,
      };
    }
    return { stdout: "OloOS", stderr: "", exitCode: 0 };
  },

  export: (args, flags, ctx) => {
    if (args.length === 0) {
      const list = Object.keys(ctx.env).map(
        (k) => `declare -x ${k}="${ctx.env[k]}"`,
      );
      return { stdout: list.join("\n"), stderr: "", exitCode: 0 };
    }
    for (const arg of args) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const name = arg.substring(0, eqIdx);
        const val = arg.substring(eqIdx + 1);
        ctx.setEnv((prev) => ({ ...prev, [name]: val }));
      } else {
        ctx.setEnv((prev) => ({ ...prev, [arg]: "" }));
      }
    }
    return { stdout: "", stderr: "", exitCode: 0 };
  },

  ls: (args, flags, ctx) => {
    const target = args[0] || "";
    const targetAbsPath = ctx.resolveAbsolutePath(target);
    const node = ctx.getNodeByAbsolutePath(targetAbsPath);

    if (!node) {
      return {
        stdout: "",
        stderr: `ls: cannot access '${target}': No such file or directory`,
        exitCode: 2,
      };
    }

    const showAll = flags.a === true;
    const showLong = flags.l === true;

    if (node.type === "file") {
      if (showLong) {
        const linkCount = 1;
        const out = `${node.permissions} ${linkCount} ${node.owner} ${node.group} ${node.size.toString().padStart(5)} ${node.modifiedDate} ${target}`;
        return { stdout: out, stderr: "", exitCode: 0 };
      }
      return { stdout: target, stderr: "", exitCode: 0 };
    }

    // Directory
    if (node.children) {
      let entries = Object.keys(node.children);
      if (showAll) {
        entries = [".", "..", ...entries];
      }

      const formatted = entries.map((name) => {
        let childNode: FileSystemNode;
        if (name === ".") {
          childNode = node;
        } else if (name === "..") {
          const parentPath = ctx.getParentAndName(targetAbsPath).parent;
          childNode = ctx.getNodeByAbsolutePath(parentPath) || node;
        } else {
          childNode = node.children![name];
        }

        if (showLong) {
          const linkCount = childNode.type === "dir" ? 2 : 1;
          const display = childNode.type === "dir" ? `${name}/` : name;
          return `${childNode.permissions} ${linkCount} ${childNode.owner} ${childNode.group} ${childNode.size.toString().padStart(5)} ${childNode.modifiedDate} ${display}`;
        } else {
          return childNode.type === "dir" ? `${name}/` : name;
        }
      });

      return {
        stdout: formatted.join(showLong ? "\n" : "  "),
        stderr: "",
        exitCode: 0,
      };
    }

    return { stdout: "", stderr: "", exitCode: 0 };
  },

  cd: (args, flags, ctx) => {
    const target = args[0] || "~";
    const targetAbsPath = ctx.resolveAbsolutePath(target);
    const node = ctx.getNodeByAbsolutePath(targetAbsPath);

    if (!node) {
      return {
        stdout: "",
        stderr: `-bash: cd: ${target}: No such file or directory`,
        exitCode: 1,
      };
    }
    if (node.type === "file") {
      return {
        stdout: "",
        stderr: `-bash: cd: ${target}: Not a directory`,
        exitCode: 1,
      };
    }

    ctx.setCwd(targetAbsPath);
    return { stdout: "", stderr: "", exitCode: 0 };
  },

  cat: (args, flags, ctx) => {
    if (args.length === 0) {
      return { stdout: "", stderr: "cat: missing file operand", exitCode: 1 };
    }

    const outs: string[] = [];
    for (const file of args) {
      const absPath = ctx.resolveAbsolutePath(file);
      const node = ctx.getNodeByAbsolutePath(absPath);
      if (!node) {
        return {
          stdout: "",
          stderr: `cat: ${file}: No such file or directory`,
          exitCode: 1,
        };
      }
      if (node.type === "dir") {
        return {
          stdout: "",
          stderr: `cat: ${file}: Is a directory`,
          exitCode: 1,
        };
      }
      outs.push(node.content || "");
    }
    return { stdout: outs.join("\n"), stderr: "", exitCode: 0 };
  },

  mkdir: (args, flags, ctx) => {
    if (args.length === 0) {
      return { stdout: "", stderr: "mkdir: missing operand", exitCode: 1 };
    }

    const target = args[0];
    const targetAbsPath = ctx.resolveAbsolutePath(target);
    const existingNode = ctx.getNodeByAbsolutePath(targetAbsPath);
    const makeParents = flags.p === true;

    if (existingNode && !makeParents) {
      return {
        stdout: "",
        stderr: `mkdir: cannot create directory '${target}': File exists`,
        exitCode: 1,
      };
    }

    const parentAndName = ctx.getParentAndName(targetAbsPath);
    const parentNode = ctx.getNodeByAbsolutePath(parentAndName.parent);

    if (!parentNode && !makeParents) {
      return {
        stdout: "",
        stderr: `mkdir: cannot create directory '${target}': No such file or directory`,
        exitCode: 1,
      };
    }

    // Unified directory creation logic helper
    const createDirAt = (parentPath: string, name: string): boolean => {
      return ctx.createNode(parentPath, name, {
        type: "dir",
        permissions: "drwxr-xr-x",
        owner: ctx.isSudoElevated ? "root" : "user",
        group: ctx.isSudoElevated ? "root" : "user",
        size: 4096,
        modifiedDate: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        children: {},
      });
    };

    if (makeParents) {
      const parts = targetAbsPath.replace("~/", "").split("/").filter(Boolean);
      let current = "~";
      for (const part of parts) {
        const next = current === "~" ? `~/${part}` : `${current}/${part}`;
        const node = ctx.getNodeByAbsolutePath(next);
        if (!node) {
          const parentPath = ctx.getParentAndName(next).parent;
          const success = createDirAt(parentPath, part);
          if (!success)
            return {
              stdout: "",
              stderr: `mkdir: creation failed`,
              exitCode: 1,
            };
        }
        current = next;
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    } else {
      const success = createDirAt(parentAndName.parent, parentAndName.name);
      return success
        ? { stdout: "", stderr: "", exitCode: 0 }
        : { stdout: "", stderr: `mkdir: creation failed`, exitCode: 1 };
    }
  },

  touch: (args, flags, ctx) => {
    if (args.length === 0) {
      return { stdout: "", stderr: "touch: missing file operand", exitCode: 1 };
    }

    const target = args[0];
    const targetAbsPath = ctx.resolveAbsolutePath(target);
    const existingNode = ctx.getNodeByAbsolutePath(targetAbsPath);

    if (existingNode) {
      existingNode.modifiedDate = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return { stdout: "", stderr: "", exitCode: 0 };
    }

    const parentAndName = ctx.getParentAndName(targetAbsPath);
    const success = ctx.createNode(parentAndName.parent, parentAndName.name, {
      type: "file",
      permissions: "-rw-r--r--",
      owner: ctx.isSudoElevated ? "root" : "user",
      group: ctx.isSudoElevated ? "root" : "user",
      size: 0,
      modifiedDate: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      content: "",
    });

    return success
      ? { stdout: "", stderr: "", exitCode: 0 }
      : {
          stdout: "",
          stderr: `touch: cannot create '${target}': Directory structure missing`,
          exitCode: 1,
        };
  },

  rm: (args, flags, ctx) => {
    const isRecursive = flags.r === true || flags.R === true;
    const isForce = flags.f === true;
    const noPreserveRoot = flags["no-preserve-root"] === true;

    if (args.length === 0) {
      return { stdout: "", stderr: "rm: missing operand", exitCode: 1 };
    }

    const target = args[0];
    const targetAbsPath = ctx.resolveAbsolutePath(target);

    if (targetAbsPath === "~" || targetAbsPath === "/") {
      if (!noPreserveRoot) {
        return {
          stdout: "",
          stderr:
            "rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this fail-safe",
          exitCode: 1,
        };
      }
      ctx.setIsPanic(true);
      return {
        stdout: "rm: deleting system layout files...",
        stderr: "",
        exitCode: 0,
      };
    }

    const node = ctx.getNodeByAbsolutePath(targetAbsPath);
    if (!node) {
      if (isForce) return { stdout: "", stderr: "", exitCode: 0 };
      return {
        stdout: "",
        stderr: `rm: cannot remove '${target}': No such file or directory`,
        exitCode: 1,
      };
    }

    if (node.type === "dir" && !isRecursive) {
      return {
        stdout: "",
        stderr: `rm: cannot remove '${target}': Is a directory`,
        exitCode: 1,
      };
    }

    const parentAndName = ctx.getParentAndName(targetAbsPath);
    ctx.deleteNode(parentAndName.parent, parentAndName.name);
    return { stdout: "", stderr: "", exitCode: 0 };
  },

  rmdir: (args, flags, ctx) => {
    if (args.length === 0) {
      return { stdout: "", stderr: "rmdir: missing operand", exitCode: 1 };
    }

    const target = args[0];
    const targetAbsPath = ctx.resolveAbsolutePath(target);
    const node = ctx.getNodeByAbsolutePath(targetAbsPath);

    if (!node) {
      return {
        stdout: "",
        stderr: `rmdir: failed to remove '${target}': No such file or directory`,
        exitCode: 1,
      };
    }
    if (node.type === "file") {
      return {
        stdout: "",
        stderr: `rmdir: failed to remove '${target}': Not a directory`,
        exitCode: 1,
      };
    }
    if (node.children && Object.keys(node.children).length > 0) {
      return {
        stdout: "",
        stderr: `rmdir: failed to remove '${target}': Directory not empty`,
        exitCode: 1,
      };
    }

    const parentAndName = ctx.getParentAndName(targetAbsPath);
    ctx.deleteNode(parentAndName.parent, parentAndName.name);
    return { stdout: "", stderr: "", exitCode: 0 };
  },

  ps: (args, flags, ctx) => {
    const list = [
      "  PID TTY          TIME CMD",
      "    1 ?        00:00:02 init",
      "   10 ?        00:00:05 next-router-worker",
      "   15 ?        00:00:12 node-dev-server",
      "   20 ?        00:00:04 chromium-render-sandbox",
      "  102 tty1     00:00:01 bash",
      ...(ctx.isMatrixMode ? ["  105 tty1     00:00:15 matrix-rain"] : []),
      "  108 tty1     00:00:00 ps",
    ];
    return { stdout: list.join("\n"), stderr: "", exitCode: 0 };
  },

  free: (args, flags) => {
    const isHuman = flags.h === true;

    const total = 16384;
    const used = Math.floor(4000 + Math.random() * 500);
    const free = total - used;

    if (isHuman) {
      return {
        stdout: [
          "              total        used        free      shared  buff/cache   available",
          "Mem:           16Gi       3.9Gi        12Gi       256Mi       4.0Gi        12Gi",
          "Swap:         4.0Gi       512Mi       3.5Gi",
        ].join("\n"),
        stderr: "",
        exitCode: 0,
      };
    }

    return {
      stdout: [
        "              total        used        free      shared  buff/cache   available",
        `Mem:          ${total}        ${used}       ${free}         256        4096       12000`,
        "Swap:          4096         512        3584",
      ].join("\n"),
      stderr: "",
      exitCode: 0,
    };
  },

  df: (args, flags) => {
    return {
      stdout: [
        "Filesystem      Size  Used Avail Use% Mounted on",
        "/dev/sda1        50G   12G   38G  24% /",
        "tmpfs           8.0G     0  8.0G   0% /dev/shm",
      ].join("\n"),
      stderr: "",
      exitCode: 0,
    };
  },

  grep: (args, flags, ctx) => {
    if (args.length === 0) {
      return { stdout: "", stderr: "grep: search query required", exitCode: 1 };
    }
    const query = args[0];
    const isCaseInsensitive = flags.i === true;

    let textToSearch = "";

    if (args.length > 1) {
      const remainingArgs = args.slice(1);
      const fileContents: string[] = [];

      for (const arg of remainingArgs) {
        const absPath = ctx.resolveAbsolutePath(arg);
        const node = ctx.getNodeByAbsolutePath(absPath);
        if (node && node.type === "file") {
          fileContents.push(node.content || "");
        } else {
          fileContents.push(arg);
        }
      }
      textToSearch = fileContents.join("\n");
    } else {
      return { stdout: "", stderr: "", exitCode: 0 };
    }

    const lines = textToSearch.split("\n");
    const matches = lines.filter((line) => {
      if (isCaseInsensitive) {
        return line.toLowerCase().includes(query.toLowerCase());
      }
      return line.includes(query);
    });

    return { stdout: matches.join("\n"), stderr: "", exitCode: 0 };
  },

  fortune: () => {
    const item = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    return { stdout: item, stderr: "", exitCode: 0 };
  },

  advice: () => {
    const item = ADVICE[Math.floor(Math.random() * ADVICE.length)];
    return { stdout: item, stderr: "", exitCode: 0 };
  },

  joke: () => {
    const item = JOKES[Math.floor(Math.random() * JOKES.length)];
    return { stdout: item, stderr: "", exitCode: 0 };
  },

  cowsay: (args) => {
    const text = args.join(" ") || "Moo";
    const bubble = [
      `     ${"_".repeat(text.length + 2)}`,
      `    < ${text} >`,
      `     ${"-".repeat(text.length + 2)}`,
      ASCII_ART.cow,
    ].join("\n");
    return { stdout: bubble, stderr: "", exitCode: 0 };
  },

  ghostsay: (args) => {
    const text = args.join(" ") || "boo!";
    const bubble = [
      `     ${"_".repeat(text.length + 2)}`,
      `    ( ${text} )`,
      `     ${"-".repeat(text.length + 2)}`,
      ASCII_ART.ghost,
    ].join("\n");
    return { stdout: bubble, stderr: "", exitCode: 0 };
  },

  fix: () => {
    const lines = ["1 bug fixed.", "3 new bugs created :(."];
    return { stdout: lines.join("\n"), stderr: "", exitCode: 0 };
  },

  matrix: (args, flags, ctx) => {
    const nextMode = !ctx.isMatrixMode;
    ctx.setIsMatrixMode(nextMode);
    const msg = nextMode
      ? "Wake up, Neo..."
      : "Deactivating Matrix protocol...";
    return { stdout: msg, stderr: "", exitCode: 0 };
  },

  fetch: (args, flags, ctx) => {
    const isMobilePortrait =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px) and (orientation: portrait)")
        .matches;
    const resolution =
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight}`
        : SYSTEM_INFO.resolution;
    const userAgent =
      typeof navigator !== "undefined"
        ? navigator.userAgent.split(" ").slice(-2).join(" ")
        : "Unknown Browser Agent";
    const hostname =
      typeof window !== "undefined" ? window.location.host : SYSTEM_INFO.host;

    // Dynamic browser uptime details
    const sessionUptime = ctx.getUptime ? ctx.getUptime() : SYSTEM_INFO.uptime;

    // Memory info
    const memInfo =
      typeof navigator !== "undefined" && (navigator as any).deviceMemory
        ? `${(navigator as any).deviceMemory} GB`
        : "Unknown / Sandbox Memory";

    // Theme state
    const activeTheme = ctx.isMatrixMode
      ? "Matrix Phosphor Green"
      : "Tokyo Night (Lavender)";

    // Connection
    const connType =
      typeof navigator !== "undefined" && (navigator as any).connection
        ? ` (${(navigator as any).connection.effectiveType || "WiFi"})`
        : "";

    const info = [
      `OS: ${SYSTEM_INFO.os}`,
      `Host: ${hostname}`,
      `Kernel: ${SYSTEM_INFO.kernel}`,
      `Uptime: ${sessionUptime}`,
      `Directory: ${ctx.cwd}`,
      `Theme: ${activeTheme}`,
      `Memory: ${memInfo}`,
      `Browser: ${userAgent}${connType}`,
      `Shell: Olo-Shell v2.0`,
      `Resolution: ${resolution}`,
      `Terminal: OloTerm (React Canvas)`,
      `CPU: ${getVirtualCPU()}`,
      `GPU: ${SYSTEM_INFO.gpu}`,
    ];

    const asciiLines = SYSTEM_INFO.ascii
      .split("\n")
      .filter((l) => l.trim() !== "");

    if (isMobilePortrait) {
      return {
        stdout: [...asciiLines, "", ...info].join("\n"),
        stderr: "",
        exitCode: 0,
      };
    }

    const maxAsciiHeight = asciiLines.length;
    const maxInfoHeight = info.length;
    const maxHeight = Math.max(maxAsciiHeight, maxInfoHeight);

    const lines = [];
    for (let i = 0; i < maxHeight; i++) {
      const asciiLine = asciiLines[i] || " ".repeat(20);
      const infoLine = info[i] || "";
      const paddedAscii = asciiLine.padEnd(25, " ");
      lines.push(`${paddedAscii} ${infoLine}`);
    }
    return { stdout: lines.join("\n"), stderr: "", exitCode: 0 };
  },

  sudo: (args, flags, ctx) => {
    if (args.length === 0) {
      return { stdout: "usage: sudo [command]", stderr: "", exitCode: 1 };
    }
    const subcmd = args.join(" ");
    if (subcmd === "rm -rf /") {
      return {
        stdout: "",
        stderr: "Permission denied.  Nice try.",
        exitCode: 1,
      };
    }
    return {
      stdout: `INITIATE_PASSWORD_PROMPT:${subcmd}`,
      stderr: "",
      exitCode: 0,
    };
  },
};

export default function OloTerminal() {
  const loadTimeRef = useRef(Date.now());
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
  const [fs, setFs] = useState<Record<string, FileSystemNode>>(
    FILESYSTEM as unknown as Record<string, FileSystemNode>,
  );

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

  // System States: Booting & Panic screen
  const [isBooting, setIsBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [isPanic, setIsPanic] = useState(false);
  const [panicLogs, setPanicLogs] = useState<string[]>([]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [history, bootLogs, panicLogs]);

  // Session uptime helper
  const getUptime = (): string => {
    const diffSec = Math.floor((Date.now() - loadTimeRef.current) / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Dynamic Browser environment CPU detection helper
  const getBrowserCPU = (): string => {
    return getVirtualCPU();
  };

  // Dynamic Browser memory helper
  const getBrowserMemory = (): string => {
    if (typeof navigator !== "undefined") {
      const mem = (navigator as any).deviceMemory || 16;
      return `${mem * 1024}MB RAM`;
    }
    return "16384MB RAM";
  };

  // BIOS Boot sequence log lines
  const BOOT_SEQUENCE = [
    "OLO-BIOS v2.04 (C) 2026 Olo Technologies, Inc.",
    `CPU: ${getBrowserCPU()}`,
    `Memory Test: ${getBrowserMemory()} OK`,
    "Detecting storage devices... /dev/sda1 (50GB SSD) detected.",
    "Loading kernel olo-kernel-5.15.0-olo-generic... done.",
    "Mounting root filesystem (type ext4) on /dev/sda1...",
    "Initializing OloOS system services...",
    "[  OK  ] Started LVM Metadata Daemon.",
    "[  OK  ] Started Network Time Service.",
    "[  OK  ] Started D-Bus System Message Bus.",
    "[  OK  ] Started Logger Service.",
    "[  OK  ] Reached target Multi-User System.",
    "[  OK  ] Started Olo Shell Environment.",
    "",
    "Welcome to OloOS v2.0 browser terminal.",
    "Type 'help' to see available commands.",
    "",
  ];

  // Starts BIOS loading boot sequence interval
  const startBootSequence = () => {
    setIsBooting(true);
    setBootLogs([]);
    let index = 0;
    const interval = setInterval(() => {
      if (index < BOOT_SEQUENCE.length) {
        setBootLogs((prev) => [...prev, BOOT_SEQUENCE[index]]);
        index++;
      } else {
        clearInterval(interval);
        setIsBooting(false);
      }
    }, 120);
    return interval;
  };

  useEffect(() => {
    const bootInterval = startBootSequence();
    return () => clearInterval(bootInterval);
  }, []);

  // Bricked system panic screen timeout handler
  useEffect(() => {
    if (!isPanic) return;

    setPanicLogs([
      "[    0.000000] Kernel panic - not syncing: Attempted to kill init! exitcode=0x00000007",
      "[    0.000000] CPU: 0 PID: 1 Comm: init Not tainted 5.15.0-fake-generic #1",
      "[    0.000000] Hardware name: Browser Simulation Container",
      "[    0.000000] Call Trace:",
      "[    0.000000]  [<ffffffff8107ef4c>] dump_stack+0x4d/0x63",
      "[    0.000000]  [<ffffffff81057e9b>] panic+0xc8/0x1d7",
      "[    0.000000]  [<ffffffff8105c316>] do_exit+0xa56/0xa60",
      "[    0.000000]  [<ffffffff8105c3fc>] do_group_exit+0x3c/0xa0",
      "[    0.000000]  [<ffffffff8105c474>] __wake_up_parent+0x0/0x30",
      "[    0.000000]  [<ffffffff8100215b>] system_call_fastpath+0x16/0x1b",
      "[    0.000000] ---[ end Kernel panic - not syncing: Attempted to kill init! exitcode=0x00000007 ]---",
      "",
      "CRITICAL FAULT: SYSTEM FILES DELETED.",
      "Initiating hardware reboot sequence in 5 seconds...",
    ]);

    const panicTimer = setTimeout(() => {
      setFs(structuredClone(FILESYSTEM) as Record<string, FileSystemNode>);
      setIsPanic(false);
      startBootSequence();
    }, 5000);

    return () => clearTimeout(panicTimer);
  }, [isPanic]);

  // Matrix Rain Canvas Animation
  useEffect(() => {
    if (!isMatrixMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const chars =
      "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890THEMATRIX";
    const fontSize = 16;
    const columns = Math.floor(width / fontSize) + 1;
    const drops = Array(columns)
      .fill(0)
      .map(() => Math.floor(Math.random() * -30));

    let animationId: number;
    let lastTime = 0;
    const fps = 15;
    const interval = 1000 / fps;

    const draw = (timestamp: number) => {
      animationId = requestAnimationFrame(draw);

      const elapsed = timestamp - lastTime;
      if (elapsed < interval) return;

      lastTime = timestamp - (elapsed % interval);

      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y >= 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fillText(char, x, y);

          ctx.fillStyle = "#00ff41";
          ctx.fillText(char, x, y - fontSize);

          ctx.fillStyle = "#008f11";
          ctx.fillText(char, x, y - fontSize * 2);
        }

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMatrixMode]);

  // Path resolution utilities
  const resolveAbsolutePath = (path: string): string => {
    if (!path) return cwd;
    let clean = path.trim();
    if (clean === "~") return "~";

    let resolvedParts: string[] = [];
    if (clean.startsWith("~") || clean.startsWith("/")) {
      clean = clean.replace(/^~?\/?/, "");
    } else {
      resolvedParts = cwd
        .replace(/^~?\/?/, "")
        .split("/")
        .filter(Boolean);
    }

    const segments = clean.split("/").filter(Boolean);
    for (const segment of segments) {
      if (segment === ".") {
        continue;
      } else if (segment === "..") {
        resolvedParts.pop();
      } else {
        resolvedParts.push(segment);
      }
    }
    return resolvedParts.length === 0 ? "~" : `~/${resolvedParts.join("/")}`;
  };

  const getNodeByAbsolutePath = (
    absPath: string,
    currentFs: Record<string, FileSystemNode> = fs,
  ): FileSystemNode | null => {
    if (absPath === "~") return currentFs["~"];
    const parts = absPath.replace("~/", "").split("/").filter(Boolean);
    let current: FileSystemNode = currentFs["~"];
    for (const part of parts) {
      if (current.children && current.children[part]) {
        current = current.children[part];
      } else {
        return null;
      }
    }
    return current;
  };

  const getParentAndName = (
    absPath: string,
  ): { parent: string; name: string } => {
    if (absPath === "~") return { parent: "~", name: "~" };
    const parts = absPath.replace("~/", "").split("/").filter(Boolean);
    const name = parts.pop() || "";
    const parent = parts.length === 0 ? "~" : `~/${parts.join("/")}`;
    return { parent, name };
  };

  const createNode = (
    parentAbsPath: string,
    name: string,
    node: FileSystemNode,
  ): boolean => {
    const clone = structuredClone(fs) as Record<string, FileSystemNode>;
    const parentNode = getNodeByAbsolutePath(parentAbsPath, clone);
    if (parentNode && parentNode.type === "dir") {
      if (!parentNode.children) parentNode.children = {};
      parentNode.children[name] = node;
      setFs(clone);
      return true;
    }
    return false;
  };

  const deleteNode = (parentAbsPath: string, name: string): boolean => {
    const clone = structuredClone(fs) as Record<string, FileSystemNode>;
    const parentNode = getNodeByAbsolutePath(parentAbsPath, clone);
    if (
      parentNode &&
      parentNode.type === "dir" &&
      parentNode.children &&
      parentNode.children[name]
    ) {
      delete parentNode.children[name];
      setFs(clone);
      return true;
    }
    return false;
  };

  // Find git repository main branch indicator
  const getGitBranch = (): string | null => {
    let currentPath = cwd;
    while (true) {
      const node = getNodeByAbsolutePath(currentPath);
      if (
        node &&
        node.type === "dir" &&
        node.children &&
        node.children[".git"]
      ) {
        return "main";
      }
      if (currentPath === "~") break;
      const parts = currentPath.split("/");
      parts.pop();
      currentPath = parts.join("/");
    }
    return null;
  };

  const getPromptString = (): string => {
    const git = getGitBranch();
    const branchText = git ? ` git:(${git})` : "";
    const currentUser = env.USER || "user";
    const symbol = currentUser === "root" ? "#" : "$";
    return `${currentUser}@olo:${cwd}${branchText}${symbol}`;
  };

  const selectedTheme =
    TERMINAL_THEMES.find((theme) => theme.id === themeId) ||
    TERMINAL_THEMES[0];
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

    const baseContext: ShellContext = {
      fs,
      setFs,
      cwd,
      setCwd,
      env,
      setEnv,
      history,
      setHistory,
      commandHistory,
      setCommandHistory,
      isMatrixMode,
      setIsMatrixMode,
      isPanic,
      setIsPanic,
      isSudoElevated,
      setIsSudoElevated,
      resolveAbsolutePath,
      getNodeByAbsolutePath,
      getParentAndName,
      createNode,
      deleteNode,
      getUptime,
    };

    const runContext = { ...baseContext, ...customContext };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let cmdToRun = token.cmdLine;

      if (pipeInput !== null) {
        cmdToRun = `${cmdToRun} ${pipeInput}`;
        pipeInput = null;
      }

      lastResult = await executeCommand(cmdToRun);

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
  const executeCommand = async (line: string): Promise<CommandResult> => {
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
      fs,
      setFs,
      cwd,
      setCwd,
      env,
      setEnv,
      history,
      setHistory,
      commandHistory,
      setCommandHistory,
      isMatrixMode,
      setIsMatrixMode,
      isPanic,
      setIsPanic,
      isSudoElevated,
      setIsSudoElevated,
      resolveAbsolutePath,
      getNodeByAbsolutePath,
      getParentAndName,
      createNode,
      deleteNode,
      getUptime,
    };

    try {
      let result = await handler(args, flags, context);

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
    } catch (err: any) {
      return {
        stdout: "",
        stderr: `bash: error executing ${commandName}: ${err.message}`,
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

  if (isPanic) {
    return (
      <div className="min-h-screen bg-black text-[#ff0033] flex items-center justify-center p-6 font-mono animate-panic select-none">
        <div className="w-full max-w-4xl border-2 border-[#ff0033]/60 bg-black/90 p-8 rounded-lg shadow-[0_0_30px_rgba(255,0,51,0.4)]">
          <div className="mb-4 border-b border-[#ff0033]/40 pb-2 flex gap-2 items-center font-bold">
            <X className="h-5 w-5 animate-pulse" />
            <span>!!! SYSTEM KERNEL PANIC !!!</span>
          </div>
          <div className="overflow-y-auto leading-relaxed h-[60vh] text-sm font-bold">
            {panicLogs.map((line, i) => (
              <div
                key={i}
                className="whitespace-pre-wrap break-all mb-1 font-bold"
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        <style jsx global>{`
          @keyframes panic-flicker {
            0% {
              opacity: 0.96;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0.96;
            }
          }
          .animate-panic {
            animation: panic-flicker 0.15s infinite;
          }
        `}</style>
      </div>
    );
  }

  if (isBooting) {
    return (
      <div
        className="min-h-screen bg-[#1a1b26] text-[#a9b1d6] flex items-center justify-center p-4 font-mono select-none"
        onClick={handleBootSkip}
      >
        <div className="w-full max-w-3xl border border-[#414868] bg-[#16161e] p-6 rounded shadow-xl flex flex-col justify-between h-[60vh]">
          <div className="overflow-y-auto leading-normal text-sm flex-1 scrollbar-none font-bold">
            {bootLogs.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all mb-1">
                {line}
              </div>
            ))}
            <div className="w-1.5 h-4 bg-[#a9b1d6] animate-ping inline-block ml-1" />
          </div>
          <div className="text-center text-xs opacity-50 mt-4 font-bold border-t border-[#414868]/45 pt-2">
            [ Press any key or click to skip boot sequence ]
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 font-mono flex items-center justify-center transition-[background-color,color] duration-200 ease-out"
      style={
        {
          backgroundColor: activeTheme.bg,
          color: activeTheme.text,
        } as React.CSSProperties
      }
    >
      {isMatrixMode && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none opacity-[0.22] z-0"
        />
      )}

      <div
        className="relative z-10 w-full max-w-5xl border-2 overflow-hidden p-6 rounded-lg min-h-[80vh] flex flex-col transition-[background-color,border-color,color,box-shadow] duration-200 ease-out"
        style={{
          backgroundColor: activeTheme.panel,
          borderColor: `${activeTheme.border}99`,
          boxShadow: activeTheme.shadow,
        }}
      >
        {isMatrixMode && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] z-50 bg-scanlines bg-size-[100%_4px]" />
        )}

        {/* Header / Window Controls */}
        <div
          className="mb-4 flex items-center justify-between border-b pb-2 transition-[border-color,color] duration-200 ease-out"
          style={{ borderColor: `${activeTheme.border}73` }}
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <span className="text-sm font-bold tracking-wider">
              {isMatrixMode ? "@@@@@@@@@@" : "OLO_SHELL_V2.0"}
            </span>
          </div>
          <div className="relative flex gap-2">
            <button
              type="button"
              aria-label="Open settings"
              title="Settings"
              onClick={() => setSettingsOpen((open) => !open)}
              className="opacity-60 hover:opacity-100 cursor-pointer"
            >
              <Settings className="h-4 w-4" />
            </button>
            <Minus className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer" />
            <Maximize2 className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer" />
            <X className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer" />
            {settingsOpen && (
              <div
                className="absolute right-0 top-7 z-60 w-56 rounded border p-3 text-xs shadow-xl transition-[background-color,border-color,color,box-shadow] duration-200 ease-out"
                onMouseLeave={() => setPreviewThemeId(null)}
                style={{
                  backgroundColor: activeTheme.panel,
                  borderColor: `${activeTheme.border}99`,
                  boxShadow: activeTheme.shadow,
                }}
              >
                <div className="mb-2 font-bold uppercase tracking-wider opacity-80">
                  Settings
                </div>
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {TERMINAL_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      title={theme.name}
                      onMouseEnter={() => setPreviewThemeId(theme.id)}
                      onFocus={() => setPreviewThemeId(theme.id)}
                      onBlur={() => setPreviewThemeId(null)}
                      onClick={() => {
                        setThemeId(theme.id);
                        setPreviewThemeId(null);
                        setCustomAccent("");
                        setCustomBackground("");
                        setSettingsOpen(false);
                      }}
                      className="flex h-9 items-center justify-center rounded border opacity-75 hover:opacity-100 transition-[background-color,border-color,color,opacity] duration-200 ease-out"
                      style={{
                        backgroundColor: theme.panel,
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                    >
                      {themeId === theme.id &&
                      !customAccent &&
                      !customBackground ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="h-3 w-3 rounded-full border border-current" />
                      )}
                    </button>
                  ))}
                </div>
                <label className="mb-2 flex items-center justify-between gap-3">
                  <span className="opacity-75">Accent</span>
                  <input
                    type="color"
                    value={customAccent || selectedTheme.text}
                    onFocus={() => setPreviewThemeId(null)}
                    onChange={(event) => {
                      setPreviewThemeId(null);
                      setCustomAccent(event.target.value);
                    }}
                    className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span className="opacity-75">Background</span>
                  <input
                    type="color"
                    value={customBackground || selectedTheme.bg}
                    onFocus={() => setPreviewThemeId(null)}
                    onChange={(event) => {
                      setPreviewThemeId(null);
                      setCustomBackground(event.target.value);
                    }}
                    className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Terminal Output */}
        <div
          className="flex-1 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-current scrollbar-track-transparent pr-2 font-bold transition-colors duration-200 ease-out"
          onClick={() => inputRef.current?.focus()}
        >
          {history.map((line, i) => {
            const isPromptLine = line.includes("@olo:");
            if (isPromptLine) {
              const colonIndex = line.indexOf(":");
              const symbolIndex = line.includes("#")
                ? line.indexOf("#")
                : line.indexOf("$");
              const host = line.substring(0, colonIndex);
              const path = line.substring(colonIndex + 1, symbolIndex + 1);
              const rest = line.substring(symbolIndex + 1);
              return (
                <div
                  key={i}
                  className="whitespace-pre-wrap break-all mb-0.5 text-[13px] leading-tight transition-colors duration-200 ease-out sm:mb-1 sm:text-base sm:leading-relaxed"
                >
                  <span style={{ color: activeTheme.text }}>{host}</span>
                  <span style={{ color: activeTheme.text }}>:</span>
                  <span style={{ color: activeTheme.text }}>{path}</span>
                  <span style={{ color: activeTheme.text }}>{rest}</span>
                </div>
              );
            }
            return (
              <div
                key={i}
                className="whitespace-pre-wrap break-all mb-0.5 text-[12px] leading-tight transition-colors duration-200 ease-out sm:mb-1 sm:text-sm sm:leading-relaxed"
              >
                {line}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold leading-tight transition-colors duration-200 ease-out sm:gap-2 sm:text-lg sm:leading-normal">
          {passwordState ? (
            <span className="break-all" style={{ color: activeTheme.text }}>
              [sudo] password for user:
            </span>
          ) : (
            <span className="break-all" style={{ color: activeTheme.text }}>
              {getPromptString()}
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`olo-shell-input min-w-0 flex-1 bg-transparent border-none text-base outline-none sm:text-lg ${
              passwordState ? "text-transparent caret-transparent" : ""
            } transition-colors duration-200 ease-out`}
            style={
              passwordState
                ? undefined
                : ({
                    color: activeTheme.text,
                    caretColor: activeTheme.text,
                  } as React.CSSProperties)
            }
            autoFocus
            autoComplete="off"
            enterKeyHint="send"
            inputMode="text"
            placeholder=""
            spellCheck="false"
          />
        </div>
      </div>

      {/* Global scanline styling */}
      <style jsx global>{`
        .bg-scanlines {
          background: linear-gradient(
            rgba(0, 0, 0, 0) 50%,
            rgba(0, 0, 0, 0.7) 50%
          );
        }
      `}</style>
    </div>
  );
}
