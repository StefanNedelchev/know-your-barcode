import {
  Component, ChangeDetectionStrategy, effect, signal, input, ElementRef, output,
  AfterViewInit, computed, viewChild,
} from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';
import { BarcodeResultItem } from '../../core/models';
import { BarcodeSearchService } from '../../core/services/barcode-search.service';

@Component({
  selector: 'app-product-search-dialog',
  imports: [SpinnerComponent],
  templateUrl: './product-search-dialog.component.html',
  styleUrls: ['./product-search-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSearchDialogComponent implements AfterViewInit {
  public readonly barcode = input<BarcodeResultItem<true> | null>(null);

  public readonly dialogClose = output();
  protected readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  public readonly isLoading = signal<boolean>(true);
  public readonly searchResult = signal<string | null>(null);
  public readonly hasResult = computed<boolean>(() => this.searchResult() !== null);

  private readonly _isViewInitialized = signal<boolean>(false);

  constructor(private readonly barcodeSarch: BarcodeSearchService) {
    effect(() => {
      const barcode = this.barcode();
      if (barcode && this._isViewInitialized() && !this.dialog().nativeElement.open) {
        this.searchBarcode(barcode.rawValue);
      }
    });
  }

  public ngAfterViewInit(): void {
    this._isViewInitialized.set(true);

    const barcode = this.barcode();
    if (barcode) {
      this.searchBarcode(barcode.rawValue);
    }
  }

  public closeProductInfo(): void {
    this.dialog().nativeElement.close();
    this.isLoading.set(false);
    this.dialogClose.emit();
  }

  private searchBarcode(rawValue: string): void {
    this.isLoading.set(true);
    this.dialog().nativeElement.showModal();
    this.barcodeSarch.searchProductName(rawValue).subscribe({
      next: (productName) => {
        this.searchResult.set(productName);
        this.isLoading.set(false);
      },
      error: () => this.closeProductInfo(),
    });
  }
}
