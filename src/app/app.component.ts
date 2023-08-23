import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BarcodeScannerComponent } from './components/barcode-scanner/barcode-scanner.component';
import { BarcodeResultsComponent } from './components/barcode-results/barcode-results.component';
import { BarcodeScannerResult } from './core/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BarcodeScannerComponent, BarcodeResultsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  public scannerResult: BarcodeScannerResult = { barcodes: [], instantSearch: false };
}
