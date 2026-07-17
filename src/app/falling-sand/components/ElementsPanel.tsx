import type { CSSProperties } from "react";

import { MATERIAL_ICONS } from "../data/material-icons";
import { DRAWABLE_MATERIALS } from "../data/materials";
import styles from "../styles.module.css";
import { Material, type MaterialDefinition } from "../types";

type ElementsPanelProps = {
  material: Material;
  onMaterialChange: (material: Material) => void;
  selectedMaterial: MaterialDefinition;
};

export function ElementsPanel({
  material,
  onMaterialChange,
  selectedMaterial,
}: ElementsPanelProps) {
  return (
    <section
      id="panel-elements"
      role="tabpanel"
      aria-labelledby="tab-elements"
      className={styles.materialSection}
    >
      <div className={styles.sectionHeading}>
        <div>
          <h2>Elements</h2>
          <p>{selectedMaterial.description}</p>
        </div>
      </div>
      <div className={styles.materialGrid}>
        {DRAWABLE_MATERIALS.map((item) => {
          const Icon = MATERIAL_ICONS[item.id];
          const selected = item.id === material;
          return (
            <button
              key={item.id}
              type="button"
              className={selected ? styles.materialActive : undefined}
              onClick={() => onMaterialChange(item.id)}
              aria-pressed={selected}
              style={{ "--material-color": item.color } as CSSProperties}
              title={`${item.name} (${item.shortcut})`}
            >
              <span className={styles.materialIcon}>
                <Icon size={21} strokeWidth={2.25} />
              </span>
              <span>{item.name}</span>
              <kbd>{item.shortcut}</kbd>
            </button>
          );
        })}
      </div>
    </section>
  );
}
