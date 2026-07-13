"use client";

import { useTerminalController } from "../hooks/use-terminal-controller";

import { BootScreen } from "./boot-screen";
import { PanicScreen } from "./panic-screen";
import { TerminalWindow } from "./terminal-window";

export function OloTerminal() {
  const terminal = useTerminalController();

  if (terminal.isPanic) return <PanicScreen />;
  if (terminal.isBooting) {
    return (
      <BootScreen
        bootLogs={terminal.bootLogs}
        onSkip={terminal.handleBootSkip}
      />
    );
  }

  return <TerminalWindow terminal={terminal} />;
}
