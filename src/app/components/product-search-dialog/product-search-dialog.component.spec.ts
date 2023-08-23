import {
  ComponentFixture, TestBed, fakeAsync, tick,
} from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductSearchDialogComponent } from './product-search-dialog.component';
import { BarcodeSearchService } from '../../core/services/barcode-search.service';

describe('ProductSearchDialogComponent', () => {
  let component: ProductSearchDialogComponent;
  let fixture: ComponentFixture<ProductSearchDialogComponent>;
  let barcodeSearchServiceSpy: jasmine.SpyObj<BarcodeSearchService>;

  beforeEach(() => {
    barcodeSearchServiceSpy = jasmine.createSpyObj<BarcodeSearchService>('BarcodeSearchService', ['searchProductName']);
    barcodeSearchServiceSpy.searchProductName.and.returnValue(of(null));

    TestBed.configureTestingModule({
      imports: [ProductSearchDialogComponent],
      providers: [
        { provide: BarcodeSearchService, useValue: barcodeSearchServiceSpy },
      ],
    });
    fixture = TestBed.createComponent(ProductSearchDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('#hasResult', () => {
    it('should compute false if there is no search result', () => {
      // Act
      component.searchResult.set(null);

      // Assert
      expect(component.hasResult()).toBeFalse();
    });

    it('should compute true if there is search result', () => {
      // Act
      component.searchResult.set('Test');

      // Assert
      expect(component.hasResult()).toBeTrue();
    });
  });

  describe('#barcode', () => {
    it('should NOT call search API before view is initialized', () => {
      // Act
      component.barcode = { rawValue: '12345', searchable: true };

      // Assert
      expect(barcodeSearchServiceSpy.searchProductName).not.toHaveBeenCalled();
    });

    it('should NOT call search API if barcode input is null', () => {
      // Arrange
      fixture.detectChanges();

      // Act
      component.barcode = null;

      // Assert
      expect(barcodeSearchServiceSpy.searchProductName).not.toHaveBeenCalled();
    });

    it('should call search API after view is initialized', () => {
      // Arrange
      fixture.detectChanges();

      // Act
      component.barcode = { rawValue: '12345', searchable: true };

      // Assert
      expect(barcodeSearchServiceSpy.searchProductName).toHaveBeenCalledOnceWith('12345');
    });

    it('should correctly set local state before and after successful search', fakeAsync(() => {
      // Arrange
      const dialogEl = (fixture.nativeElement as HTMLElement).querySelector('dialog') as HTMLDialogElement;
      const productName = 'Test Product';
      const barcode = '12345';
      barcodeSearchServiceSpy.searchProductName.and.returnValue(of(productName));
      fixture.detectChanges();

      // Assert
      expect(dialogEl.open).toBeFalse();
      expect(component.isLoading()).toBeTrue();
      expect(component.searchResult()).toBeNull();

      // Act
      component.barcode = { rawValue: barcode, searchable: true };
      tick();

      // Assert
      expect(dialogEl.open).toBeTrue();
      expect(barcodeSearchServiceSpy.searchProductName).toHaveBeenCalledOnceWith(barcode);
      expect(component.isLoading()).toBeFalse();
      expect(component.searchResult()).toEqual(productName);
    }));

    it('should NOT execute a new search while result dialog is still open', fakeAsync(() => {
      // Arrange
      const dialogEl = (fixture.nativeElement as HTMLElement).querySelector('dialog') as HTMLDialogElement;
      const oldProductName = 'Old Product';
      const newProductName = 'New Product';
      barcodeSearchServiceSpy.searchProductName.and.returnValue(of(oldProductName));
      fixture.detectChanges();
      component.barcode = { rawValue: '12345', searchable: true };
      tick();
      barcodeSearchServiceSpy.searchProductName.calls.reset();
      barcodeSearchServiceSpy.searchProductName.and.returnValue(of(newProductName));

      // Act
      component.barcode = { rawValue: '67890', searchable: true };
      tick();

      // Assert
      expect(dialogEl.open).toBeTrue();
      expect(barcodeSearchServiceSpy.searchProductName).not.toHaveBeenCalled();
      expect(component.isLoading()).toBeFalse();
      expect(component.searchResult()).toEqual(oldProductName);
    }));

    it('should execute a new search after result dialog is closed', fakeAsync(() => {
      // Arrange
      const oldBarcode = '12345';
      const oldProductName = 'Old Product';
      const newBarcode = '67890';
      const newProductName = 'New Product';
      barcodeSearchServiceSpy.searchProductName.and.returnValue(of(oldProductName));
      fixture.detectChanges();
      component.barcode = { rawValue: oldBarcode, searchable: true };
      tick();
      barcodeSearchServiceSpy.searchProductName.calls.reset();
      barcodeSearchServiceSpy.searchProductName.and.returnValue(of(newProductName));
      // Close dialog
      component.closeProductInfo();

      // Act
      component.barcode = { rawValue: newBarcode, searchable: true };
      tick();

      // Assert

      expect(barcodeSearchServiceSpy.searchProductName).toHaveBeenCalledOnceWith(newBarcode);
      expect(component.searchResult()).toEqual(newProductName);
    }));
  });

  describe('#closeProductInfo', () => {
    it('should close dialog and emit close event', fakeAsync(() => {
      // Arrange
      const dialogEl = (fixture.nativeElement as HTMLElement).querySelector('dialog') as HTMLDialogElement;
      let hasEmitted = false;
      component.dialogClose.subscribe(() => { hasEmitted = true });
      barcodeSearchServiceSpy.searchProductName.and.returnValue(of('Test'));
      fixture.detectChanges();
      component.barcode = { rawValue: '12345', searchable: true };
      tick();

      // Act
      component.closeProductInfo();

      // Assert
      expect(component.isLoading()).toBeFalse();
      expect(hasEmitted).toBeTrue();
      expect(dialogEl.open).toBeFalse();
    }));

    it('should be called on search error', fakeAsync(() => {
      // Arrange
      const closeSpy = spyOn(component, 'closeProductInfo').and.callThrough();
      barcodeSearchServiceSpy.searchProductName.and.returnValue(throwError(() => new Error('Test')));
      fixture.detectChanges();

      // Act
      component.barcode = { rawValue: '12345', searchable: true };
      tick();

      // Assert
      expect(closeSpy).toHaveBeenCalled();
      expect(barcodeSearchServiceSpy.searchProductName).toHaveBeenCalledOnceWith('12345');
    }));
  });
});
