import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import type { ZenGardenController } from "../hooks/useZenGarden";

type GardenExportPreviewProps = Pick<
  ZenGardenController,
  | "isTouchDevice"
  | "previewFileName"
  | "previewImage"
  | "savePreviewImage"
  | "setPreviewImage"
  | "shareUrl"
>;

export function GardenExportPreview({
  isTouchDevice,
  previewFileName,
  previewImage,
  savePreviewImage,
  setPreviewImage,
  shareUrl,
}: GardenExportPreviewProps) {
  if (!previewImage) return null;

  return (
    <ExportPreviewModal
      description="You can save the image manually or share it here."
      fileName={previewFileName}
      imageAlt="Zen garden export preview"
      imageSrc={previewImage}
      isTouchDevice={isTouchDevice}
      onClose={() => setPreviewImage(null)}
      onSaveImage={savePreviewImage}
      shareHeading="Share with friends"
      shareUrl={shareUrl}
      title="Zen Garden Snap"
    />
  );
}
