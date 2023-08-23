import {
  Component, ChangeDetectionStrategy, signal, Input, ViewChild, ElementRef, Output, EventEmitter, AfterViewInit, computed,
} from '@angular/core';
import {
  NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault,
} from '@angular/common';
import { SpinnerComponent } from '../spinner/spinner.component';
import { BarcodeResultItem } from '../../core/models';
import { BarcodeSearchService } from '../../core/services/barcode-search.service';

@Component({
  selector: 'app-product-search-dialog',
  standalone: true,
  imports: [NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, SpinnerComponent],
  templateUrl: './product-search-dialog.component.html',
  styleUrls: ['./product-search-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSearchDialogComponent implements AfterViewInit {
  @Input()
  public set barcode(value: BarcodeResultItem<true> | null) {
    this._barcode = value;

    if (this._barcode && this._isViewInitialized && !this.dialog.nativeElement.open) {
      this.searchBarcode(this._barcode.rawValue);
    }
  }

  @Output() public readonly dialogClose = new EventEmitter<void>();
  @ViewChild('dialog') protected readonly dialog!: ElementRef<HTMLDialogElement>;

  public isLoading = signal<boolean>(true);
  public searchResult = signal<string | null>(null);
  public hasResult = computed<boolean>(() => this.searchResult() !== null);

  private _barcode: BarcodeResultItem<true> | null = null;
  private _isViewInitialized = false;

  constructor(private readonly barcodeSarch: BarcodeSearchService) {}

  public ngAfterViewInit(): void {
    this._isViewInitialized = true;

    if (this._barcode) {
      this.searchBarcode(this._barcode.rawValue);
    }
  }

  public closeProductInfo(): void {
    this.dialog.nativeElement.close();
    this.isLoading.set(false);
    this.dialogClose.emit();
  }

  private searchBarcode(rawValue: string): void {
    this.isLoading.set(true);
    this.dialog.nativeElement.showModal();
    this.barcodeSarch.searchProductName(rawValue).subscribe({
      next: (productName) => {
        this.searchResult.set(productName);
        this.isLoading.set(false);
      },
      error: () => this.closeProductInfo(),
    });
  }
}
