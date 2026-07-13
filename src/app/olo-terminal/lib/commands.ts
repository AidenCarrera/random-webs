import { ADVICE, ASCII_ART, FORTUNES, JOKES, SYSTEM_INFO } from "../constants";
import type {
  CommandHandler,
  FileSystemNode,
  NavigatorWithDeviceInfo,
} from "../types";
import { getVirtualCPU } from "./browser-info";

// Command definitions registry
export const COMMAND_REGISTRY: Record<string, CommandHandler> = {
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
        stdout:
          "OloOS browser-simulation 5.15.0-olo-generic #1 SMP Jul 4 x86_64 OloOS",
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

  df: () => {
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
    const browserNavigator =
      typeof navigator !== "undefined"
        ? (navigator as NavigatorWithDeviceInfo)
        : null;
    const memInfo = browserNavigator?.deviceMemory
      ? `${browserNavigator.deviceMemory} GB`
      : "Unknown / Sandbox Memory";

    // Theme state
    const activeTheme = ctx.isMatrixMode
      ? "Matrix Phosphor Green"
      : "Tokyo Night (Lavender)";

    // Connection
    const connType = browserNavigator?.connection
      ? ` (${browserNavigator.connection.effectiveType || "WiFi"})`
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

  sudo: (args) => {
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
