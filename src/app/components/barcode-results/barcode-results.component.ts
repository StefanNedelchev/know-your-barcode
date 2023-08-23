import {
  ChangeDetectionStrategy, Component, Input, signal,
} from '@angular/core';
import {
  NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault,
} from '@angular/common';
import { IDetectedBarcode } from 'barcode-detector-api-polyfill';
import { BarcodeResultItem, BarcodeScannerResult } from '../../core/models';
import { ProductSearchDialogComponent } from '../product-search-dialog/product-search-dialog.component';

@Component({
  selector: 'app-barcode-results',
  standalone: true,
  imports: [NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, ProductSearchDialogComponent],
  templateUrl: './barcode-results.component.html',
  styleUrls: ['./barcode-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeResultsComponent {
  @Input()
  public set scannerResult(result: BarcodeScannerResult) {
    this.barcodeResults = result.barcodes.map((barcode) => this.parseBarcode(barcode));

    if (result.instantSearch) {
      const searchableBarcode = this.barcodeResults.find((b) => b.searchable);
      if (searchableBarcode) {
        this.selectBarcode(searchableBarcode);
      }
    }
  }

  public selectedBarcode = signal<BarcodeResultItem<true> | null>(null);
  public barcodeResults: BarcodeResultItem[] = [];

  private _matrixFormats = ['aztec', 'data_matrix', 'pdf417', 'qr_code', 'unknown'];

  public trackByValue(index: number, barcodeItem: BarcodeResultItem): string {
    return barcodeItem.rawValue;
  }

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
