export interface BarcodeResultItem<SearchableType extends boolean = boolean> {
  rawValue: string;
  searchable: SearchableType;
  url?: string;
}
