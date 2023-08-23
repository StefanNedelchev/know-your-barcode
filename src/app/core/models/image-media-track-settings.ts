import { CameraMode, ResizeMode } from './image-media-track-constraint-set';

export interface ImageMediaTrackSettings extends MediaTrackSettings {
  whiteBalanceMode?: CameraMode;
  exposureMode?: CameraMode;
  focusMode?: CameraMode;
  resizeMode?: ResizeMode;
  colorTemperature?: number;
  exposureCompensation?: number;
  iso?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  focusDistance?: number;
  zoom?: number;
  torch?: boolean;
}
