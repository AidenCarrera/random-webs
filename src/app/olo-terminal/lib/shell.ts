import type { ChainedCommand } from "../types";

export const tokenizeArguments = (line: string): string[] => {
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
export const parseArgsAndFlags = (
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
export const expandEnvVars = (
  line: string,
  env: Record<string, string>,
): string => {
  return line.replace(
    /\$(\{([a-zA-Z0-9_]+)\}|([a-zA-Z0-9_]+))/g,
    (match, p1, p2, p3) => {
      const varName = p2 || p3;
      return env[varName] !== undefined ? env[varName] : "";
    },
  );
};

// Chained tokenizer
export const tokenizeCommandLine = (line: string): ChainedCommand[] => {
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
export const expandHistory = (
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
