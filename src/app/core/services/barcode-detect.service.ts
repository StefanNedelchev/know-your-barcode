import { Injectable } from '@angular/core';
import { IBarcodeDetector, IDetectedBarcode } from 'barcode-detector-api-polyfill';

declare const BarcodeDetector: {
  prototype: IBarcodeDetector;
  new(options?: { formats: string[] }): IBarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
};

@Injectable({
  providedIn: 'root',
})
export class BarcodeDetectService {
  private _isSupported = ('BarcodeDetector' in window);
  private _DetectorApi!: typeof BarcodeDetector;
  private _detector?: IBarcodeDetector;

  public async getSupportedFormats(): Promise<string[]> {
    await this.initializeDetector();
    return this._DetectorApi.getSupportedFormats();
  }

  public async detect(source: ImageBitmapSource): Promise<IDetectedBarcode[]> {
    const detector = await this.initializeDetector();
    return detector.detect(source);
  }

  private async initializeDetector(): Promise<IBarcodeDetector> {
    if (this._detector) {
      return this._detector;
    }

    if (!this._isSupported) {
      const polyfillModule = await import('barcode-detector-api-polyfill');
      this._DetectorApi = polyfillModule.BarcodeDetector;
      this._detector = new polyfillModule.BarcodeDetector();
    } else {
      this._DetectorApi = BarcodeDetector;
      this._detector = new BarcodeDetector();
    }

    return this._detector;
  }
}
