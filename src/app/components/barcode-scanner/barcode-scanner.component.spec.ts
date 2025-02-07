/* eslint-disable @typescript-eslint/no-empty-function */
import {
  ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick,
} from '@angular/core/testing';
import { IDetectedBarcode } from 'barcode-detector-api-polyfill';
import { BarcodeDetectService } from '../../core/services/barcode-detect.service';
import { MediaDeviceService } from '../../core/services/media-device.service';
import { BarcodeScannerComponent } from './barcode-scanner.component';
import { BarcodeScannerResult } from '../../core/models';

describe('BarcodeScannerComponent', () => {
  let component: BarcodeScannerComponent;
  let fixture: ComponentFixture<BarcodeScannerComponent>;
  let barcodeDetectServiceSpy: jasmine.SpyObj<BarcodeDetectService>;
  let mediaDeviceServiceSpy: jasmine.SpyObj<MediaDeviceService>;
  let wakeLockSpy: jasmine.SpyObj<WakeLock>;
  let wakeLockSentinelSpy: jasmine.SpyObj<WakeLockSentinel>;

  const mockedVideoDevices: MediaDeviceInfo[] = [
    {
      deviceId: 'video1',
      groupId: 'group1',
      kind: 'videoinput',
      label: 'Front Camera',
      toJSON() {},
    },
    {
      deviceId: 'video2',
      groupId: 'group1',
      kind: 'videoinput',
      label: 'Rear Camera',
      toJSON() {},
    },
  ];

  beforeEach(() => {
    wakeLockSpy = jasmine.createSpyObj<WakeLock>('WakeLock', ['request']);
    wakeLockSentinelSpy = jasmine.createSpyObj<WakeLockSentinel>('WakeLockSentinel', ['release']);
    wakeLockSpy.request.and.resolveTo(wakeLockSentinelSpy);
    Object.defineProperty(window.navigator, 'wakeLock', { configurable: true, writable: true, value: wakeLockSpy });

    barcodeDetectServiceSpy = jasmine.createSpyObj<BarcodeDetectService>('BarcodeDetectService', ['detect']);
    barcodeDetectServiceSpy.detect.and.resolveTo([]);

    mediaDeviceServiceSpy = jasmine.createSpyObj<MediaDeviceService>(
      'MediaDeviceService',
      ['getVideoDevices', 'getVideoStream', 'getDeviceFromStream', 'applyAppropriateConstraints', 'removeTracksFromStream'],
    );
    mediaDeviceServiceSpy.getVideoDevices.and.resolveTo(mockedVideoDevices);
    mediaDeviceServiceSpy.getVideoStream.and.resolveTo(new MediaStream());
    mediaDeviceServiceSpy.getDeviceFromStream.and.returnValue(mockedVideoDevices[0].deviceId);
    mediaDeviceServiceSpy.applyAppropriateConstraints.and.resolveTo(undefined);

    TestBed.overrideProvider(MediaDeviceService, { useValue: mediaDeviceServiceSpy });
    TestBed.overrideProvider(BarcodeDetectService, { useValue: barcodeDetectServiceSpy });
    TestBed.configureTestingModule({
      imports: [BarcodeScannerComponent],
    });
    fixture = TestBed.createComponent(BarcodeScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default properties', () => {
    expect(component.canvasElementWidth()).toBe(window.innerWidth);
    expect(component.canvasElementHeight()).toBe(window.innerHeight);
    expect(component.isScanning()).toBeFalse();
    expect(component.videoDevices().length).toBe(0);
    expect(component.activeStream()).toBeNull();
    expect(component.instantSearch()).toBeFalse();
    expect(component.deviceSelectControl.value).toBeNull();
  });

  describe('#startScanner', () => {
    it('should initialize video devices and stream', async () => {
      const testStream = new MediaStream();
      mediaDeviceServiceSpy.getVideoStream.and.resolveTo(testStream);

      // Act
      await component.startScanner();

      // Assert
      expect(component.videoDevices()).toEqual(mockedVideoDevices);
      expect(mediaDeviceServiceSpy.getVideoDevices).toHaveBeenCalled();
      expect(mediaDeviceServiceSpy.getVideoStream).toHaveBeenCalled();
      expect(mediaDeviceServiceSpy.getDeviceFromStream).toHaveBeenCalledOnceWith(testStream);
      expect(component.activeStream).not.toBeNull();
    });

    it('should skip enumerating devices if already done', async () => {
      // Arrange
      await component.startScanner();
      mediaDeviceServiceSpy.getVideoDevices.calls.reset();

      // Act
      await component.startScanner();

      // Assert
      expect(mediaDeviceServiceSpy.getVideoDevices).not.toHaveBeenCalled();
    });
  });

  describe('#onVideoLoadedMetadata', () => {
    it('should calculate canvas dimensions and start scan process', async () => {
      // Arrange
      const videoEl = (fixture.nativeElement as HTMLElement).querySelector('video') as HTMLVideoElement;
      Object.defineProperty(videoEl, 'play', { writable: true, value: () => Promise.resolve() });
      Object.defineProperty(videoEl, 'videoWidth', { writable: true, value: 1920 });
      Object.defineProperty(videoEl, 'videoHeight', { writable: true, value: 1080 });
      await component.startScanner();

      // Act
      await component.onVideoLoadedMetadata();

      // Assert
      expect(component.canvasElementWidth()).toBe(1920);
      expect(component.canvasElementHeight()).toBe(1080);
      expect(component.activeStream()).not.toBeNull();
      expect(component.isScanning()).toBeTrue();
      expect(wakeLockSpy.request).toHaveBeenCalledTimes(1);
      expect(wakeLockSentinelSpy.release).not.toHaveBeenCalled();
    });

    it('should stop scanner if already started', async () => {
      // Arrange
      const videoEl = (fixture.nativeElement as HTMLElement).querySelector('video') as HTMLVideoElement;
      Object.defineProperty(videoEl, 'play', { writable: true, value: () => Promise.resolve() });
      await component.startScanner();
      await component.onVideoLoadedMetadata();
      mediaDeviceServiceSpy.getVideoDevices.calls.reset();

      // Act
      await component.startScanner();

      // Assert
      expect(mediaDeviceServiceSpy.getVideoDevices).not.toHaveBeenCalled();
      expect(component.activeStream()).toBeNull();
      expect(component.isScanning()).toBeFalse();
      expect(wakeLockSpy.request).toHaveBeenCalledTimes(1);
      expect(wakeLockSentinelSpy.release).toHaveBeenCalledTimes(1);
    });

    it('should re-calculate canvas dimensions on window resize', fakeAsync(async () => {
      // Arrange
      const videoEl = (fixture.nativeElement as HTMLElement).querySelector('video') as HTMLVideoElement;
      Object.defineProperty(videoEl, 'play', { writable: true, value: () => Promise.resolve() });
      Object.defineProperty(videoEl, 'videoWidth', { writable: true, configurable: true, value: 1920 });
      Object.defineProperty(videoEl, 'videoHeight', { writable: true, configurable: true, value: 1080 });
      await component.startScanner();
      await component.onVideoLoadedMetadata();

      // Act
      Object.defineProperty(videoEl, 'videoWidth', { writable: true, configurable: true, value: 1280 });
      Object.defineProperty(videoEl, 'videoHeight', { writable: true, configurable: true, value: 720 });
      window.dispatchEvent(new Event('resize'));
      tick(500);
      discardPeriodicTasks();

      // Assert
      expect(component.canvasElementWidth()).toBe(1280);
      expect(component.canvasElementHeight()).toBe(720);
    }));

    it('should change stream device', async () => {
      // Arrange
      const videoEl = (fixture.nativeElement as HTMLElement).querySelector('video') as HTMLVideoElement;
      Object.defineProperty(videoEl, 'play', { writable: true, value: () => Promise.resolve() });
      await component.startScanner();
      await component.onVideoLoadedMetadata();
      const mockedVideoDevice = mockedVideoDevices[0];
      mediaDeviceServiceSpy.getVideoStream.calls.reset();
      mediaDeviceServiceSpy.getDeviceFromStream.and.returnValue(mockedVideoDevice.deviceId);

      // Act
      component.deviceSelectControl.setValue(mockedVideoDevice);

      // Assert
      expect(mediaDeviceServiceSpy.getVideoStream).toHaveBeenCalledOnceWith(mockedVideoDevice);
      expect(component.isScanning()).toBeTrue();
    });

    const testBarcodes: IDetectedBarcode[] = [{
      boundingBox: new DOMRectReadOnly(),
      cornerPoints: [
        { x: 300, y: 100 }, { x: 700, y: 110 }, { x: 700, y: 415 }, { x: 300, y: 400 },
      ],
      format: 'code_39',
      rawValue: '123456',
    }];

    it('should scan barcode and emit', fakeAsync(async () => {
      // Arrange
      let emittedBarcodes: BarcodeScannerResult = { instantSearch: false, barcodes: [] };
      barcodeDetectServiceSpy.detect.and.resolveTo(testBarcodes);
      const moveToSpy = spyOn(CanvasRenderingContext2D.prototype, 'moveTo');
      const lineToSpy = spyOn(CanvasRenderingContext2D.prototype, 'lineTo');
      const closePathSpy = spyOn(CanvasRenderingContext2D.prototype, 'closePath');
      component.barcodeDetect.subscribe((results) => { emittedBarcodes = results });
      const videoEl = (fixture.nativeElement as HTMLElement).querySelector('video') as HTMLVideoElement;
      Object.defineProperty(videoEl, 'play', { writable: true, value: () => Promise.resolve() });
      await component.startScanner();
      await component.onVideoLoadedMetadata();

      // Act
      tick(100);
      discardPeriodicTasks();

      // Assert
      expect(emittedBarcodes.barcodes).toEqual(testBarcodes);
      expect(moveToSpy).toHaveBeenCalledOnceWith(
        testBarcodes[0].cornerPoints[0].x, testBarcodes[0].cornerPoints[0].y,
      );
      expect(lineToSpy.calls.allArgs()).toEqual(
        testBarcodes[0].cornerPoints.slice(1).map((p) => ([p.x, p.y])),
      );
      expect(closePathSpy).toHaveBeenCalledTimes(1);
    }));

    it('should not draw closed path when corenr points are less than 4', fakeAsync(async () => {
      // Arrange
      const testBarcodes2: IDetectedBarcode[] = [{
        ...testBarcodes[0],
        cornerPoints: testBarcodes[0].cornerPoints.slice(0, 2),
      }];
      let emittedBarcodes: BarcodeScannerResult = { instantSearch: false, barcodes: [] };
      barcodeDetectServiceSpy.detect.and.resolveTo(testBarcodes2);
      const moveToSpy = spyOn(CanvasRenderingContext2D.prototype, 'moveTo');
      const lineToSpy = spyOn(CanvasRenderingContext2D.prototype, 'lineTo');
      const closePathSpy = spyOn(CanvasRenderingContext2D.prototype, 'closePath');
      component.barcodeDetect.subscribe((results) => { emittedBarcodes = results });
      const videoEl = (fixture.nativeElement as HTMLElement).querySelector('video') as HTMLVideoElement;
      Object.defineProperty(videoEl, 'play', { writable: true, value: () => Promise.resolve() });
      await component.startScanner();
      await component.onVideoLoadedMetadata();

      // Act
      tick(100);
      discardPeriodicTasks();

      // Assert
      expect(emittedBarcodes.barcodes).toEqual(testBarcodes2);
      expect(moveToSpy).toHaveBeenCalledOnceWith(
        testBarcodes2[0].cornerPoints[0].x,
        testBarcodes2[0].cornerPoints[0].y,
      );
      expect(lineToSpy.calls.allArgs()).toEqual(
        testBarcodes2[0].cornerPoints.slice(1).map((p) => ([p.x, p.y])),
      );
      expect(closePathSpy).not.toHaveBeenCalled();
    }));

    it('should change the frame rate of the scanner', fakeAsync(async () => {
      // Arrange
      barcodeDetectServiceSpy.detect.and.resolveTo(testBarcodes);
      const videoEl = (fixture.nativeElement as HTMLElement).querySelector('video') as HTMLVideoElement;
      Object.defineProperty(videoEl, 'play', { writable: true, value: () => Promise.resolve() });
      await component.startScanner();
      await component.onVideoLoadedMetadata();
      discardPeriodicTasks();
      component.frameRate = 3;
      const newScanInterval = Math.round(1000 / 3);
      const closePathSpy = spyOn(CanvasRenderingContext2D.prototype, 'closePath');

      // Act
      tick(100);

      // Assert
      expect(closePathSpy).not.toHaveBeenCalled();

      // Act
      tick(newScanInterval);

      // Assert
      expect(closePathSpy).toHaveBeenCalledTimes(1);

      // Act
      tick(newScanInterval);

      // Assert
      expect(closePathSpy).toHaveBeenCalledTimes(2);

      discardPeriodicTasks();
    }));
  });

  describe('#ngOnDestroy', () => {
    it('should stop scanner and stream', async () => {
      // Arrange
      const videoEl = (fixture.nativeElement as HTMLElement).querySelector('video') as HTMLVideoElement;
      Object.defineProperty(videoEl, 'play', { writable: true, value: () => Promise.resolve() });
      await component.startScanner();
      await component.onVideoLoadedMetadata();

      // Act
      fixture.destroy();

      // Assert
      expect(mediaDeviceServiceSpy.removeTracksFromStream).toHaveBeenCalled();
      expect(component.activeStream()).toBeNull();
      expect(component.isScanning()).toBeFalse();
    });
  });

  describe('#toggleInstantSearch', () => {
    it('should toggle instant search flag', () => {
      expect(component.instantSearch()).toBeFalse();

      component.toggleInstantSearch();
      expect(component.instantSearch()).toBeTrue();

      component.toggleInstantSearch();
      expect(component.instantSearch()).toBeFalse();
    });
  });

  describe('#onVisibilityChange', () => {
    it('should release and regain wake lock between visibility changes', async () => {
      // Arrange
      const videoEl = (fixture.nativeElement as HTMLElement).querySelector('video') as HTMLVideoElement;
      Object.defineProperty(videoEl, 'play', { writable: true, value: () => Promise.resolve() });
      await component.startScanner();
      await component.onVideoLoadedMetadata();

      // Act
      Object.defineProperty(window.document, 'visibilityState', { writable: true, configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));

      // Assert
      expect(wakeLockSentinelSpy.release).toHaveBeenCalled();

      // Act
      wakeLockSpy.request.calls.reset();
      wakeLockSentinelSpy.release.calls.reset();
      Object.defineProperty(window.document, 'visibilityState', { writable: true, configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));

      // Assert
      expect(wakeLockSentinelSpy.release).not.toHaveBeenCalled();
      expect(wakeLockSpy.request).toHaveBeenCalledTimes(1);
    });
  });
});
