import { ImageCaptureSettings } from './image-capture-settings';

export interface IImageCapture {
  track: MediaStreamTrack;
  getPhotoCapabilities(): Promise<MediaCapabilities>;
  getPhotoSettings(): Promise<MediaStreamConstraints>;
  grabFrame(): Promise<ImageBitmap>;
  takePhoto(settings?: ImageCaptureSettings): Promise<Blob>;
}
