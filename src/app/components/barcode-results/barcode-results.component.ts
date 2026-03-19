import {
  ChangeDetectionStrategy, Component, computed, effect, input, signal,
} from '@angular/core';
import { IDetectedBarcode } from 'barcode-detector-api-polyfill';
import { BarcodeResultItem, BarcodeScannerResult } from '../../core/models';
import { ProductSearchDialogComponent } from '../product-search-dialog/product-search-dialog.component';

@Component({
  selector: 'app-barcode-results',
  imports: [ProductSearchDialogComponent],
  templateUrl: './barcode-results.component.html',
  styleUrls: ['./barcode-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeResultsComponent {
  public readonly scannerResult = input.required<BarcodeScannerResult>();

  public readonly barcodeResults = computed<BarcodeResultItem[]>(() =>
    this.scannerResult().barcodes.map((barcode) => this.parseBarcode(barcode)));

  public readonly selectedBarcode = signal<BarcodeResultItem<true> | null>(null);

  private readonly _matrixFormats = new Set<string>(['aztec', 'data_matrix', 'pdf417', 'qr_code', 'unknown']);
  private readonly _externalWindow = signal<Window | null>(null);

  constructor() {
    effect(() => {
      const result = this.scannerResult();
      if (!result.instantSearch) {
        return;
      }

      const searchableBarcode = this.barcodeResults().find((b) => b.searchable);
      if (searchableBarcode) {
        this.selectBarcode(searchableBarcode);
        return;
      }

      const linkBarcode = this.barcodeResults().find((b) => b.url && !b.url.startsWith('https://www.google'));
      if (linkBarcode) {
        if (this._externalWindow()?.closed) {
          this._externalWindow.set(null);
        }
        this._externalWindow.update((w) => w ?? window.open(linkBarcode.url, '_blank'));
      }
    }, { allowSignalWrites: true });
  }

  public selectBarcode(barcode: BarcodeResultItem): void {
    if (barcode.searchable) {
      this.selectedBarcode.set(barcode as BarcodeResultItem<true>);
    }
  }

  private parseBarcode(barcode: IDetectedBarcode): BarcodeResultItem {
    const resultItem: BarcodeResultItem = {
      rawValue: barcode.rawValue,
      searchable: !this._matrixFormats.has(barcode.format),
    };

    try {
      const url = new URL(barcode.rawValue);
      resultItem.url = url.href;
    } catch (e) {
      if (!resultItem.searchable) {
        resultItem.url = `https://www.google.com/search?q=${barcode.rawValue}`;
      }
    }

    return resultItem;
  }
}
