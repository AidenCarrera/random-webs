"use client";

import "../styles.css";
import { useZenGarden } from "../hooks/useZenGarden";
import { GardenCanvas } from "./GardenCanvas";
import { GardenExportPreview } from "./GardenExportPreview";
import { GardenTitle } from "./GardenTitle";
import { ImportDialog } from "./ImportDialog";
import { InteractionDock } from "./InteractionDock";
import { QuickToolbar } from "./QuickToolbar";
import { SettingsPanel } from "./SettingsPanel";
import { ToastNotification } from "./ToastNotification";

export function ZenGardenClient() {
  const garden = useZenGarden();

  return (
    <div
      className={`min-h-screen ${garden.activeTheme.textColor} select-none relative overflow-hidden transition-colors duration-1000 font-sans`}
      style={{ touchAction: "none", backgroundColor: garden.backgroundColor }}
    >
      <GardenCanvas {...garden} />
      <GardenTitle theme={garden.activeTheme} />
      <QuickToolbar {...garden} />
      <InteractionDock {...garden} />
      <SettingsPanel {...garden} />
      <ImportDialog {...garden} />
      <ToastNotification message={garden.toastMessage} />
      <GardenExportPreview {...garden} />
    </div>
  );
}
