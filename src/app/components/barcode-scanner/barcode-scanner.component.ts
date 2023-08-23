import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy,
  Output, ViewChild, signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { ICornerPoint } from 'barcode-detector-api-polyfill';
import {
  Subscription, from, fromEvent, of,
} from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { BarcodeScannerResult } from '../../core/models';
import { BarcodeDetectService } from '../../core/services/barcode-detect.service';
import { MediaDeviceService } from '../../core/services/media-device.service';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [NgIf, NgForOf, ReactiveFormsModule],
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeScannerComponent implements OnDestroy {
  @ViewChild('videoElement') protected readonly videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') protected readonly canvasElement!: ElementRef<HTMLCanvasElement>;

  @Input()
  public set frameRate(fps: number) {
    this._scanIntervalMs = Math.round(1000 / fps);

    if (this._scanInterval) {
      clearInterval(this._scanInterval);
      this._scanInterval = setInterval(
        () => { this.scanBarcode() },
        this._scanIntervalMs,
      ) as unknown as number;
    }
  }

  @Output() public readonly barcodeDetect = new EventEmitter<BarcodeScannerResult>();

  public canvasElementWidth = signal<number>(window.innerWidth);
  public canvasElementHeight = signal<number>(window.innerHeight);
  public isScanning = signal<boolean>(false);
  public videoDevices = signal<MediaDeviceInfo[]>([]);
  public activeStream = signal<MediaStream | null>(null);
  public instantSearch = signal<boolean>(false);
  public deviceSelectControl = new FormControl<MediaDeviceInfo | null>(null);

  private _windowResizeSubscription?: Subscription;
  private _deviceChangeSubscription?: Subscription;
  private _lineWidth: number = Math.max(Math.round(1.5 * window.devicePixelRatio), 2);
  private _ctx: CanvasRenderingContext2D | null = null;
  private _scanInterval?: number;
  private _scanIntervalMs = 100;
  private _wakeLockSentinel: WakeLockSentinel | null = null;

  constructor(
    private readonly barcodeDetectService: BarcodeDetectService,
    private readonly mediaDeviceService: MediaDeviceService,
  ) {
    this.listenForDeviceChanges();
  }

  @HostListener('document:visibilitychange')
  protected onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      this.unlockScreen();
    } else if (this._scanInterval) {
      this.lockScreen();
    }
  }

  public ngOnDestroy(): void {
    this._windowResizeSubscription?.unsubscribe();
    this._deviceChangeSubscription?.unsubscribe();
    this.unlockScreen();
    this.clearScanner();
    this.clearVideoStream();
  }

  public async onVideoLoadedMetadata(): Promise<void> {
    this.calculateScannerDimensions();
    await this.startScan();

    this._windowResizeSubscription?.unsubscribe();
    this._windowResizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(500))
      .subscribe(() => this.calculateScannerDimensions());
  }

  public calculateScannerDimensions(): void {
    const { videoWidth, videoHeight } = this.videoElement.nativeElement;
    this.canvasElementWidth.set(videoWidth);
    this.canvasElementHeight.set(videoHeight);
  }

  public async startScanner(): Promise<void> {
    if (this._scanInterval) {
      this.stopScan();
      return;
    }

    if (this.videoDevices().length === 0) {
      const videoDevices = await this.mediaDeviceService.getVideoDevices();
      this.videoDevices.set(videoDevices);
    }

    const stream = await this.mediaDeviceService.getVideoStream();
    const selectedDeviceId = this.mediaDeviceService.getDeviceFromStream(stream);
    const selectedDevice = this.videoDevices().find(({ deviceId }) => deviceId === selectedDeviceId) as MediaDeviceInfo;

    this.deviceSelectControl.setValue(selectedDevice, { emitEvent: false });
    this.activeStream.set(stream);

    if (stream) {
      await this.mediaDeviceService.applyAppropriateConstraints(stream);
    }
  }

  public resetScanner(): void {
    this.clearScanner();
    this.clearVideoStream();
    this.barcodeDetect.emit({ barcodes: [], instantSearch: this.instantSearch() });
  }

  public toggleInstantSearch(): void {
    this.instantSearch.set(!this.instantSearch());
  }

  public trackByDeviceId(index: number, device: MediaDeviceInfo): string {
    return device.deviceId;
  }

  private listenForDeviceChanges(): void {
    this._deviceChangeSubscription = this.deviceSelectControl.valueChanges
      .pipe(switchMap((device) => {
        const activeStream = this.activeStream();
        if (activeStream) {
          this.mediaDeviceService.removeTracksFromStream(activeStream);
        }

        return device ? from(this.mediaDeviceService.getVideoStream(device)) : of(activeStream);
      }))
      .subscribe((stream) => {
        if (this._scanInterval) {
          this.clearScanner();
          this.clearVideoStream();
        }
        this.activeStream.set(stream);
        if (stream) {
          this.mediaDeviceService.applyAppropriateConstraints(stream);
        }
      });
  }

  private clearVideoStream(): void {
    const stream = this.activeStream();
    if (stream) {
      this.mediaDeviceService.removeTracksFromStream(stream);
      this.activeStream.set(null);
    }
  }

  private clearScanner(): void {
    clearInterval(this._scanInterval);
    this._scanInterval = undefined;
    this._ctx?.clearRect(0, 0, this.canvasElementWidth(), this.canvasElementHeight());
    this.isScanning.set(false);
  }

  private drawBarcodeOutline(cornerPoints: ICornerPoint[]): void {
    if (!this._ctx) {
      return;
    }

    const cornerPointsCount = cornerPoints.length;

    this._ctx.beginPath();
    this._ctx.moveTo(cornerPoints[0].x, cornerPoints[0].y);

    for (let i = 1; i < cornerPointsCount; i++) {
      this._ctx.lineTo(cornerPoints[i].x, cornerPoints[i].y);
    }

    if (cornerPointsCount === 4) {
      this._ctx.closePath();
    }

    this._ctx.stroke();
  }

  private async lockScreen(): Promise<void> {
    if ('wakeLock' in navigator) {
      this._wakeLockSentinel = await navigator.wakeLock.request('screen');
    }
  }

  private async unlockScreen(): Promise<void> {
    await this._wakeLockSentinel?.release();
    this._wakeLockSentinel = null;
  }

  private async scanBarcode(): Promise<void> {
    if (!this._ctx) {
      return;
    }

    this._ctx.clearRect(0, 0, this.canvasElementWidth(), this.canvasElementHeight());
    this._ctx.lineWidth = this._lineWidth;
    this._ctx.strokeStyle = 'lime';

    const detectedBarcodes = await this.barcodeDetectService.detect(this.videoElement.nativeElement);
    detectedBarcodes.forEach(({ cornerPoints }) => this.drawBarcodeOutline(cornerPoints));
    this.barcodeDetect.emit({ barcodes: detectedBarcodes, instantSearch: this.instantSearch() });
  }

  private async startScan(): Promise<void> {
    await this.videoElement.nativeElement.play();
    await this.lockScreen();

    this._ctx = this.canvasElement.nativeElement.getContext('2d', { willReadFrequently: true });

    this._scanInterval = setInterval(
      () => { this.scanBarcode() },
      this._scanIntervalMs,
    ) as unknown as number;
    this.isScanning.set(true);
  }

  private stopScan(): void {
    this.resetScanner();
    this.unlockScreen();
  }
}
