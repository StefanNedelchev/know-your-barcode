export interface ImageMediaTrackSupportedConstraints extends MediaTrackSupportedConstraints {
  whiteBalanceMode?: boolean;
  exposureMode?: boolean;
  focusMode?: boolean;
  resizeMode?: boolean;
  colorTemperature?: boolean;
  exposureCompensation?: boolean;
  iso?: boolean;
  brightness?: boolean;
  contrast?: boolean;
  saturation?: boolean;
  sharpness?: boolean;
  focusDistance?: boolean;
  zoom?: boolean;
  torch?: boolean;
}
