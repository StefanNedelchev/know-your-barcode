import { IDetectedBarcode } from 'barcode-detector-api-polyfill';

export interface BarcodeScannerResult {
  barcodes: IDetectedBarcode[];
  instantSearch: boolean;
}
