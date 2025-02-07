import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BarcodeSearchService {
  constructor(private readonly http: HttpClient) { }

  public searchProductName(barcode: string): Observable<string | null> {
    return this.http.get<{ product: string | null }>(
      `${environment.functionsBaseUrl}/search-barcode`,
      { params: { barcode } },
    ).pipe(
      map((res) => res.product),
    );
  }
}
