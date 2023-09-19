import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
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
export class AppComponent implements OnInit {
  public scannerResult: BarcodeScannerResult = { barcodes: [], instantSearch: false };

  constructor(private readonly swUpdate: SwUpdate) {}

  public ngOnInit(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        filter((versionUpdate) => versionUpdate.type === 'VERSION_READY'),
      ).subscribe(() => {
        // eslint-disable-next-line no-alert
        if (window.confirm('A new version of Know Your Barcode has been insetalled and ready to use! '
          + 'Do you want to refresh the app and let the new changes take effect?')) {
          this.reloadPage();
        }
      });
    }
  }

  private reloadPage(): void {
    window.location.reload();
  }
}
