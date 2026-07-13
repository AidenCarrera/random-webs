import { FractalExplorerPage } from "./components/FractalExplorerPage";
import styles from "./styles.module.css";

export default function Page() {
  return (
    <div className={styles.root}>
      <FractalExplorerPage />
    </div>
  );
}
