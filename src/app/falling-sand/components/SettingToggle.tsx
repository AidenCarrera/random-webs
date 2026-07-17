import styles from "../styles.module.css";

type SettingToggleProps = {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
};

export function SettingToggle({
  checked,
  description,
  label,
  onChange,
}: SettingToggleProps) {
  return (
    <label className={styles.settingToggle}>
      <span className={styles.settingCopy}>
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.toggleTrack} aria-hidden="true">
        <span />
      </span>
    </label>
  );
}
