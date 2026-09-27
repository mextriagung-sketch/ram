export interface WeighingRecord {
  id: string;
  noSeri: string;
  noPolisi: string;
  tanggalMasuk: string; // e.g. "Minggu, 27 September 2026"
  jamMasuk: string;     // e.g. "08:15"
  jamKeluar: string;    // e.g. "09:30"
  supplier: string;     // e.g. "Suenah"
  alamatSupplier: string; // e.g. "P6"
  gross: number;        // Berat Isi (kg)
  tare: number;         // Berat Kosong (kg)
  bruto: number;        // gross - tare (kg)
  rafaksiPersen: number;// e.g. 12 (%)
  rafaksiKg: number;    // e.g. 156 (kg)
  netto: number;        // bruto - rafaksiKg (kg)
  hargaPerKg: number;   // e.g. 2625 (Rp)
  jumlahDibayar: number;// netto * hargaPerKg (Rp)
  namaOperator: string; // e.g. "YUNUS"
  namaSopir?: string;
  catatan?: string;
  createdAt: string;    // ISO timestamp
  syncedToSheets: boolean;
  syncTimestamp?: string;
  syncError?: string;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  defaultOperator: string;
  defaultPrice: number;
  googleAppScriptUrl: string;
  autoPrintAfterSave: boolean;
  autoSyncToSheets: boolean;
  paperWidthCm: number;
  paperHeightCm: number;
  warningNote: string;
}
