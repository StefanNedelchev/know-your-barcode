export type CameraMode = 'none' | 'manual' | 'single-shot' | 'continuous';
export type ResizeMode = 'none' | 'crop-and-scale';

export interface ImageMediaTrackConstraintSet extends MediaTrackConstraintSet {
  whiteBalanceMode?: CameraMode;
  exposureMode?: CameraMode;
  focusMode?: CameraMode;
  resizeMode?: ResizeMode;
  colorTemperature?: ConstrainDouble;
  exposureCompensation?: ConstrainDouble;
  iso?: ConstrainDouble;
  brightness?: ConstrainDouble;
  contrast?: ConstrainDouble;
  saturation?: ConstrainDouble;
  sharpness?: ConstrainDouble;
  focusDistance?: ConstrainDouble;
  zoom?: ConstrainDouble;
  torch?: boolean;
}
