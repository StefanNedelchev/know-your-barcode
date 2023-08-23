import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BarcodeSearchService } from './barcode-search.service';

describe('BarcodeSearchService', () => {
  let service: BarcodeSearchService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpSpy },
      ],
    });
    service = TestBed.inject(BarcodeSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#searchProductName', () => {
    it('should call the barcode API and map the product name', (done: DoneFn) => {
      // Arrange
      const barcode = '12345';
      const productName = 'Test Product';
      httpSpy.get.and.returnValue(of({ product: productName }));

      // Act
      service.searchProductName(barcode).subscribe((res) => {
        // Assert
        expect(res).toEqual(productName);
        expect(httpSpy.get).toHaveBeenCalledOnceWith(
          `${environment.functionsBaseUrl}/search-barcode`,
          {
            params: { barcode },
          },
        );
        done();
      });
    });
  });
});
