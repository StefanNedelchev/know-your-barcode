import { CameraMode, ResizeMode } from './image-media-track-constraint-set';

export interface ImageMediaTrackCapabilities extends MediaTrackCapabilities {
  whiteBalanceMode?: CameraMode[];
  exposureMode?: CameraMode[];
  focusMode?: CameraMode[];
  resizeMode?: ResizeMode[];
  colorTemperature?: DoubleRange;
  exposureCompensation?: DoubleRange;
  iso?: DoubleRange;
  brightness?: DoubleRange;
  contrast?: DoubleRange;
  saturation?: DoubleRange;
  sharpness?: DoubleRange;
  focusDistance?: DoubleRange;
  zoom?: DoubleRange;
  torch?: boolean;
}
