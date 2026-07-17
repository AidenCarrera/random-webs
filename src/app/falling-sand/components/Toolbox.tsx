import type { RefObject } from "react";
import { motion, useDragControls } from "framer-motion";
import { GripHorizontal, Maximize2, Minimize2 } from "lucide-react";

import styles from "../styles.module.css";
import type {
  Material,
  MaterialDefinition,
  PanelTab,
  SandWorldStats,
} from "../types";
import { ElementsPanel } from "./ElementsPanel";
import { SettingsPanel } from "./SettingsPanel";
import { StatisticsPanel } from "./StatisticsPanel";

type ToolboxProps = {
  activeTab: PanelTab;
  autoPauseWhenHidden: boolean;
  autoSave: boolean;
  brushSize: number;
  displayFrameRate: boolean;
  isTouchDevice: boolean;
  material: Material;
  minimized: boolean;
  onActiveTabChange: (tab: PanelTab) => void;
  onAutoPauseWhenHiddenChange: (checked: boolean) => void;
  onAutoSaveChange: (checked: boolean) => void;
  onBrushSizeChange: (size: number) => void;
  onDisplayFrameRateChange: (checked: boolean) => void;
  onMaterialChange: (material: Material) => void;
  onMinimizedChange: (minimized: boolean) => void;
  onPauseWhileDrawingChange: (checked: boolean) => void;
  onRightClickErasesChange: (checked: boolean) => void;
  onShowCanvasHintChange: (checked: boolean) => void;
  pauseWhileDrawing: boolean;
  rightClickErases: boolean;
  selectedMaterial: MaterialDefinition;
  showCanvasHint: boolean;
  speed: number;
  stats: SandWorldStats;
  workspaceRef: RefObject<HTMLDivElement | null>;
};

const TABS: PanelTab[] = ["elements", "settings", "statistics"];

export function Toolbox(props: ToolboxProps) {
  const dragControls = useDragControls();
  return (
    <motion.aside
      className={`${styles.controlPanel} ${styles.glassSurface} ${props.minimized ? styles.panelMinimized : ""}`}
      aria-label="Sandbox tools"
      drag={props.isTouchDevice ? false : true}
      dragConstraints={props.workspaceRef}
      dragControls={dragControls}
      dragElastic={0}
      dragListener={false}
      dragMomentum={false}
    >
      <div
        className={styles.panelHeader}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          dragControls.start(event);
        }}
      >
        <GripHorizontal size={19} strokeWidth={2.2} aria-hidden="true" />
        <span>Toolbox</span>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => props.onMinimizedChange(!props.minimized)}
          aria-expanded={!props.minimized}
          aria-label={
            props.minimized ? "Restore control panel" : "Minimize control panel"
          }
          title={
            props.minimized ? "Restore control panel" : "Minimize control panel"
          }
        >
          {props.minimized ? (
            <Maximize2 size={17} strokeWidth={2.2} />
          ) : (
            <Minimize2 size={17} strokeWidth={2.2} />
          )}
        </button>
      </div>

      {!props.minimized ? (
        <>
          <div
            className={styles.panelTabs}
            role="tablist"
            aria-label="Toolbox views"
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={props.activeTab === tab}
                aria-controls={`panel-${tab}`}
                id={`tab-${tab}`}
                onClick={() => props.onActiveTabChange(tab)}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className={styles.panelBody}>
            {props.activeTab === "elements" ? (
              <ElementsPanel
                material={props.material}
                onMaterialChange={props.onMaterialChange}
                selectedMaterial={props.selectedMaterial}
              />
            ) : null}
            {props.activeTab === "settings" ? (
              <SettingsPanel
                autoPauseWhenHidden={props.autoPauseWhenHidden}
                autoSave={props.autoSave}
                brushSize={props.brushSize}
                displayFrameRate={props.displayFrameRate}
                onAutoPauseWhenHiddenChange={props.onAutoPauseWhenHiddenChange}
                onAutoSaveChange={props.onAutoSaveChange}
                onBrushSizeChange={props.onBrushSizeChange}
                onDisplayFrameRateChange={props.onDisplayFrameRateChange}
                onPauseWhileDrawingChange={props.onPauseWhileDrawingChange}
                onRightClickErasesChange={props.onRightClickErasesChange}
                onShowCanvasHintChange={props.onShowCanvasHintChange}
                pauseWhileDrawing={props.pauseWhileDrawing}
                rightClickErases={props.rightClickErases}
                showCanvasHint={props.showCanvasHint}
              />
            ) : null}
            {props.activeTab === "statistics" ? (
              <StatisticsPanel
                brushSize={props.brushSize}
                selectedMaterial={props.selectedMaterial}
                speed={props.speed}
                stats={props.stats}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </motion.aside>
  );
}
