import {
  ChangeDetectionStrategy, Component, Input, signal,
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
  @Input()
  public set scannerResult(result: BarcodeScannerResult) {
    this.barcodeResults.set(
      result.barcodes.map((barcode) => this.parseBarcode(barcode)),
    );

    if (result.instantSearch) {
      const searchableBarcode = this.barcodeResults().find((b) => b.searchable);
      if (searchableBarcode) {
        this.selectBarcode(searchableBarcode);
        return;
      }

      const linkBarcode = this.barcodeResults().find((b) => b.url && !b.url.startsWith('https://www.google'));
      if (linkBarcode) {
        if (this._externalWindow?.closed) {
          this._externalWindow = null;
        }

        if (!this._externalWindow) {
          this._externalWindow = window.open(linkBarcode.url, '_blank');
        }
      }
    }
  }

  public selectedBarcode = signal<BarcodeResultItem<true> | null>(null);
  public barcodeResults = signal<BarcodeResultItem[]>([]);

  private _matrixFormats = ['aztec', 'data_matrix', 'pdf417', 'qr_code', 'unknown'];
  private _externalWindow: Window | null = null;

  public selectBarcode(barcode: BarcodeResultItem): void {
    if (barcode.searchable) {
      this.selectedBarcode.set(barcode as BarcodeResultItem<true>);
    }
  }

  private parseBarcode(barcode: IDetectedBarcode): BarcodeResultItem {
    const resultItem: BarcodeResultItem = {
      rawValue: barcode.rawValue,
      searchable: !this._matrixFormats.includes(barcode.format),
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
