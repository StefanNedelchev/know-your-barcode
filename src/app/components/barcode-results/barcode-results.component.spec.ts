import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { BarcodeResultsComponent } from './barcode-results.component';
import { ProductSearchDialogComponent } from '../product-search-dialog/product-search-dialog.component';
import { BarcodeResultItem, BarcodeScannerResult } from '../../core/models';

describe('BarcodeResultsComponent', () => {
  let component: BarcodeResultsComponent;
  let fixture: ComponentFixture<BarcodeResultsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BarcodeResultsComponent, MockComponent(ProductSearchDialogComponent)],
    });
    fixture = TestBed.createComponent(BarcodeResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('#scannerResult', () => {
    it('should correctly map barcode results from scanner', () => {
      // Arrange
      const input: BarcodeScannerResult = {
        instantSearch: false,
        barcodes: [
          {
            boundingBox: new DOMRectReadOnly(),
            cornerPoints: [],
            format: 'ean_13',
            rawValue: '123456',
          },
          {
            boundingBox: new DOMRectReadOnly(),
            cornerPoints: [],
            format: 'qr_code',
            rawValue: 'https://test.com/test',
          },
          {
            boundingBox: new DOMRectReadOnly(),
            cornerPoints: [],
            format: 'qr_code',
            rawValue: 'something_to_search',
          },
        ],
      };
      const expectedOutput: BarcodeResultItem[] = [
        { rawValue: '123456', searchable: true },
        { rawValue: 'https://test.com/test', searchable: false, url: 'https://test.com/test' },
        { rawValue: 'something_to_search', searchable: false, url: 'https://www.google.com/search?q=something_to_search' },
      ];

      // Act
      component.scannerResult = input;
      fixture.detectChanges();

      // Assert
      expect(component.barcodeResults).toEqual(expectedOutput);
    });

    it('should NOT do instant search if there are no barcodes', () => {
      // Arrange
      const input: BarcodeScannerResult = {
        instantSearch: true,
        barcodes: [],
      };

      // Act
      component.scannerResult = input;
      fixture.detectChanges();

      // Assert
      expect(component.selectedBarcode()).toBeNull();
    });

    it('should NOT do instant search if the barcode is not searchable', () => {
      // Arrange
      const input: BarcodeScannerResult = {
        instantSearch: true,
        barcodes: [{
          boundingBox: new DOMRectReadOnly(),
          cornerPoints: [],
          format: 'qr_code',
          rawValue: 'https://test.com/test',
        }],
      };

      // Act
      component.scannerResult = input;
      fixture.detectChanges();

      // Assert
      expect(component.selectedBarcode()).toBeNull();
    });

    it('should do an instant search if there is a searchable barcode', () => {
      // Arrange
      const input: BarcodeScannerResult = {
        instantSearch: true,
        barcodes: [
          {
            boundingBox: new DOMRectReadOnly(),
            cornerPoints: [],
            format: 'qr_code',
            rawValue: 'https://test.com/test',
          },
          {
            boundingBox: new DOMRectReadOnly(),
            cornerPoints: [],
            format: 'ean_13',
            rawValue: '123456',
          },
        ],
      };

      // Act
      component.scannerResult = input;
      fixture.detectChanges();

      // Assert
      expect(component.selectedBarcode()).toEqual({ rawValue: '123456', searchable: true });
    });
  });

  describe('#selectBarcode', () => {
    it('should NOT select barcode if not searchable', () => {
      // Act
      component.selectBarcode({ rawValue: '12345', searchable: false });

      // Assert
      expect(component.selectedBarcode()).toBeNull();
    });

    it('should select barcode if searchable', () => {
      // Act
      const barcodeResult: BarcodeResultItem<true> = { rawValue: '12345', searchable: true };
      component.selectBarcode(barcodeResult);

      // Assert
      expect(component.selectedBarcode()).toEqual(barcodeResult);
    });
  });
});
