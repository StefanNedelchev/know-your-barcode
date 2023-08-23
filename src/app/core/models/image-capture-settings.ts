export interface ImageCaptureSettings {
  fillLightMode: 'auto' | 'flash' | 'off';
  imageHeight: ConstrainULong;
  imageWidth: ConstrainULong;
  redEyeReduction: boolean;
}
