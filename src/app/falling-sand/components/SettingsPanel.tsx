import { Brush } from "lucide-react";

import styles from "../styles.module.css";
import { SettingToggle } from "./SettingToggle";

type SettingsPanelProps = {
  autoPauseWhenHidden: boolean;
  autoSave: boolean;
  brushSize: number;
  displayFrameRate: boolean;
  onAutoPauseWhenHiddenChange: (checked: boolean) => void;
  onAutoSaveChange: (checked: boolean) => void;
  onBrushSizeChange: (size: number) => void;
  onDisplayFrameRateChange: (checked: boolean) => void;
  onPauseWhileDrawingChange: (checked: boolean) => void;
  onRightClickErasesChange: (checked: boolean) => void;
  onShowCanvasHintChange: (checked: boolean) => void;
  pauseWhileDrawing: boolean;
  rightClickErases: boolean;
  showCanvasHint: boolean;
};

export function SettingsPanel(props: SettingsPanelProps) {
  return (
    <section
      id="panel-settings"
      role="tabpanel"
      aria-labelledby="tab-settings"
      className={styles.physicsSection}
    >
      <div className={styles.settingsGroup}>
        <h3>Drawing</h3>
        <div className={styles.rangeHeading}>
          <label htmlFor="sand-brush-size">
            <Brush size={18} strokeWidth={2.2} />
            Brush size
          </label>
          <output htmlFor="sand-brush-size">{props.brushSize}</output>
        </div>
        <input
          id="sand-brush-size"
          className={styles.range}
          type="range"
          min="1"
          max="14"
          step="1"
          value={props.brushSize}
          onChange={(event) =>
            props.onBrushSizeChange(Number(event.target.value))
          }
        />
        <SettingToggle
          checked={props.rightClickErases}
          description="Hold the secondary pointer button to erase."
          label="Right-click erases"
          onChange={props.onRightClickErasesChange}
        />
        <SettingToggle
          checked={props.pauseWhileDrawing}
          description="Hold particles still until the stroke ends."
          label="Pause while drawing"
          onChange={props.onPauseWhileDrawingChange}
        />
      </div>
      <div className={styles.settingsGroup}>
        <h3>Display</h3>
        <SettingToggle
          checked={props.displayFrameRate}
          description="Show live rendering performance on the canvas."
          label="Display frame rate"
          onChange={props.onDisplayFrameRateChange}
        />
        <SettingToggle
          checked={props.showCanvasHint}
          description="Keep the drawing instructions visible."
          label="Drawing tips"
          onChange={props.onShowCanvasHintChange}
        />
      </div>
      <div className={styles.settingsGroup}>
        <h3>Simulation</h3>
        <SettingToggle
          checked={props.autoPauseWhenHidden}
          description="Stop physics when this browser tab is hidden."
          label="Pause in background"
          onChange={props.onAutoPauseWhenHiddenChange}
        />
        <SettingToggle
          checked={props.autoSave}
          description="Store the current world every 15 seconds."
          label="Auto-save world"
          onChange={props.onAutoSaveChange}
        />
      </div>
    </section>
  );
}
