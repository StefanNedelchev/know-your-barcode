import { TestBed } from '@angular/core/testing';
import { BarcodeDetector as BarcodeDetectorPolyfill, IBarcodeDetector, IDetectedBarcode } from 'barcode-detector-api-polyfill';
import { BarcodeDetectService } from './barcode-detect.service';

describe('BarcodeDetectService', () => {
  let service: BarcodeDetectService;

  const detectorMocks = {
    constructorCalls: 0,
    getSupportedFormats: (): Promise<string[]> => Promise.resolve([]),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    detect: (image: ImageBitmapSource): Promise<IDetectedBarcode[]> => Promise.resolve([]),
  };

  class BarcodeDetectorMock implements IBarcodeDetector {
    constructor() {
      detectorMocks.constructorCalls += 1;
    }

    public static getSupportedFormats(): Promise<string[]> {
      return detectorMocks.getSupportedFormats();
    }

    public detect(image: ImageBitmapSource): Promise<IDetectedBarcode[]> {
      return detectorMocks.detect(image);
    }
  }

  beforeEach(() => {
    detectorMocks.constructorCalls = 0;
    detectorMocks.getSupportedFormats = () => Promise.resolve([]);
    detectorMocks.detect = () => Promise.resolve([]);

    Object.defineProperty(window, 'BarcodeDetector', {
      value: BarcodeDetectorMock,
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    service = TestBed.inject(BarcodeDetectService);
    expect(service).toBeTruthy();
  });

  describe('#getSupportedFormats', () => {
    it('should initialize supported formats from native API', async () => {
      // Arrange
      const supportedFormats = ['test1', 'test2'];
      const testSpy = spyOn(detectorMocks, 'getSupportedFormats').and.resolveTo(supportedFormats);
      service = TestBed.inject(BarcodeDetectService);

      // Act
      const result = await service.getSupportedFormats();

      // Assert
      expect(testSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(supportedFormats);
    });

    it('should initialize supported formats from zxing polyfill', async () => {
      // Arrange
      delete (
        window as (Window & typeof globalThis & { BarcodeDetector?: unknown })
      ).BarcodeDetector;
      const getFormatsSpy = spyOn(BarcodeDetectorPolyfill, 'getSupportedFormats').and.callThrough();
      const zxingSupportedFormats = await BarcodeDetectorPolyfill.getSupportedFormats();
      service = TestBed.inject(BarcodeDetectService);

      // Act
      const result = await service.getSupportedFormats();

      // Assert
      expect(getFormatsSpy).toHaveBeenCalled();
      expect(result).toEqual(zxingSupportedFormats);
    });
  });

  describe('#detect', () => {
    it('should detect barcode from image source', async () => {
      // Arrange
      const detectedBarcodes: IDetectedBarcode[] = [
        {
          boundingBox: new DOMRectReadOnly(),
          cornerPoints: [],
          format: 'ean_13',
          rawValue: '123456',
        },
        {
          boundingBox: new DOMRectReadOnly(),
          cornerPoints: [],
          format: 'code_39',
          rawValue: '789012',
        },
      ];
      const detectSpy = spyOn(detectorMocks, 'detect').and.resolveTo(detectedBarcodes);
      const imgSource = new Image();
      service = TestBed.inject(BarcodeDetectService);

      // Act
      const results = await service.detect(imgSource);

      // Assert
      expect(detectorMocks.constructorCalls).toBe(1);
      expect(detectSpy).toHaveBeenCalledOnceWith(imgSource);
      expect(results).toEqual(detectedBarcodes);
    });

    it('should detect barcode via zxing polyfill', async () => {
      // Arrange
      const detectedBarcodes: IDetectedBarcode[] = [
        {
          boundingBox: new DOMRectReadOnly(),
          cornerPoints: [],
          format: 'ean_13',
          rawValue: '123456',
        },
        {
          boundingBox: new DOMRectReadOnly(),
          cornerPoints: [],
          format: 'code_39',
          rawValue: '789012',
        },
      ];
      const detectSpy = spyOn(BarcodeDetectorPolyfill.prototype, 'detect').and.resolveTo(detectedBarcodes);
      delete (window as (Window & typeof globalThis & { BarcodeDetector?: unknown })).BarcodeDetector;
      const imgSource = new Image();
      service = TestBed.inject(BarcodeDetectService);

      // Act
      const results = await service.detect(imgSource);

      // Assert
      expect(detectorMocks.constructorCalls).toBe(0);
      expect(detectSpy).toHaveBeenCalledOnceWith(imgSource);
      expect(results).toEqual(detectedBarcodes);
    });

    it('should reuse already initialized detector', async () => {
      // Arrange
      const detectedBarcodes: IDetectedBarcode[] = [{
        boundingBox: new DOMRectReadOnly(),
        cornerPoints: [],
        format: 'ean_13',
        rawValue: '123456',
      }];
      spyOn(detectorMocks, 'detect').and.resolveTo(detectedBarcodes);
      const imgSource = new Image();
      service = TestBed.inject(BarcodeDetectService);
      // First detect
      await service.detect(imgSource);

      // Act
      await service.detect(imgSource);

      // Assert
      expect(detectorMocks.constructorCalls).toBe(1);
    });
  });
});
