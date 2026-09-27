import React, { useState, useEffect } from 'react';
import {
  Scale,
  History,
  FileSpreadsheet,
  Settings,
  BarChart3,
  Printer,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { WeighingRecord, AppSettings } from './types/weighing';
import { WeighingForm } from './components/WeighingForm';
import { ReceiptPrint } from './components/ReceiptPrint';
import { ReceiptModal } from './components/ReceiptModal';
import { WeighingHistory } from './components/WeighingHistory';
import { GoogleSheetSettings } from './components/GoogleSheetSettings';
import { DailyStats } from './components/DailyStats';
import { sendRecordToGoogleSheets } from './utils/googleSheets';
import { executePrint, openPrintTab } from './utils/printHelper';
import { PERMANENT_GOOGLE_APPS_SCRIPT_URL } from './config/appsScriptConfig';

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'RAM SAWIT BERKAH JAYA',
  companyAddress: 'Desa sukajadi RT 10/RW 03, Kec. Lalan, Musi Banyuasin',
  companyPhone: '081355473807',
  defaultOperator: 'YUNUS',
  defaultPrice: 2625,
  googleAppScriptUrl: PERMANENT_GOOGLE_APPS_SCRIPT_URL || '',
  autoPrintAfterSave: true,
  autoSyncToSheets: true,
  paperWidthCm: 21,
  paperHeightCm: 14,
  warningNote: 'KAMI TIDAK MENERIMA BUAH ILEGAL',
};

// Seed with the exact record from the user's uploaded photo
const INITIAL_RECORDS: WeighingRecord[] = [
  {
    id: 'SBJ-SAMPLE-001',
    noSeri: '001/SBJ/IX/2026',
    noPolisi: 'BG 8421 LN',
    tanggalMasuk: 'Minggu, 27 September 2026',
    jamMasuk: '08:15',
    jamKeluar: '09:30',
    supplier: 'Suenah',
    alamatSupplier: 'P6',
    gross: 2500,
    tare: 1200,
    bruto: 1300,
    rafaksiPersen: 12,
    rafaksiKg: 156,
    netto: 1144,
    hargaPerKg: 2625,
    jumlahDibayar: 3003000,
    namaOperator: 'YUNUS',
    createdAt: new Date().toISOString(),
    syncedToSheets: false,
    catatan: 'Contoh Data Nota Asli',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'stats' | 'settings'>('form');

  // App Settings with LocalStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('sbj_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If address is the old unformatted one, update to user's requested text
        if (!parsed.companyAddress || parsed.companyAddress.includes('Kab.Musi Banyuasin')) {
          parsed.companyAddress = DEFAULT_SETTINGS.companyAddress;
        }
        // Always enforce requested 21cm width x 14cm height
        parsed.paperWidthCm = 21;
        parsed.paperHeightCm = 14;

        // If permanent URL is configured in code, always use it
        if (PERMANENT_GOOGLE_APPS_SCRIPT_URL) {
          parsed.googleAppScriptUrl = PERMANENT_GOOGLE_APPS_SCRIPT_URL;
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Records with LocalStorage
  const [records, setRecords] = useState<WeighingRecord[]>(() => {
    const saved = localStorage.getItem('sbj_weighing_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        return INITIAL_RECORDS;
      }
    }
    return INITIAL_RECORDS;
  });

  // Modal & Print states
  const [modalRecord, setModalRecord] = useState<WeighingRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activePrintRecord, setActivePrintRecord] = useState<WeighingRecord>(records[0] || INITIAL_RECORDS[0]);
  const [toastNotification, setToastNotification] = useState<{
    msg: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Save to LocalStorage whenever records or settings change
  useEffect(() => {
    localStorage.setItem('sbj_weighing_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('sbj_settings', JSON.stringify(settings));
  }, [settings]);

  const showToast = (msg: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToastNotification({ msg, type });
    setTimeout(() => setToastNotification(null), 4500);
  };

  // Handler for Save & Print (primary flow requested by user: opens new tab & print preview directly!)
  const handleSaveAndPrint = async (newRecord: WeighingRecord) => {
    const savedRecord = { ...newRecord, syncedToSheets: false };

    // 1. Immediately save to history state
    setRecords((prev) => [savedRecord, ...prev]);
    setActivePrintRecord(savedRecord);
    setModalRecord(savedRecord);
    setIsModalOpen(true);

    // 2. Open new tab directly with immediate print preview!
    try {
      await openPrintTab(savedRecord, settings);
    } catch (e) {
      console.warn('openPrintTab error, fallback to executePrint', e);
      await executePrint(savedRecord, settings);
    }

    // 3. Send to Google Sheets in background if configured
    if (settings.googleAppScriptUrl && settings.googleAppScriptUrl.trim()) {
      showToast('Menyimpan data ke Google Sheets...', 'info');
      sendRecordToGoogleSheets(settings.googleAppScriptUrl, savedRecord).then((res) => {
        if (res.success) {
          handleUpdateRecordSync(savedRecord.id, true);
          showToast('Data berhasil masuk ke Google Sheets!', 'success');
        } else {
          handleUpdateRecordSync(savedRecord.id, false, res.message);
          showToast(`Tersimpan di riwayat. Info Sheets: ${res.message}`, 'warning');
        }
      });
    } else {
      showToast('Nota tersimpan ke riwayat. Hubungkan Google Sheet di menu Pengaturan!', 'info');
    }
  };

  // Handler for Save Draft only
  const handleSaveOnly = (newRecord: WeighingRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    showToast(`Nota ${newRecord.noSeri} berhasil disimpan ke Riwayat!`, 'success');
  };

  // Handler for Previewing Receipt
  const handlePreview = (record: WeighingRecord) => {
    setModalRecord(record);
    setActivePrintRecord(record);
    setIsModalOpen(true);
  };

  // Handler for Reprinting from History
  const handleReprint = (record: WeighingRecord) => {
    setModalRecord(record);
    setActivePrintRecord(record);
    setIsModalOpen(true);
  };

  // Handler for deleting a record
  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Data penimbangan berhasil dihapus.', 'info');
  };

  // Handler for updating sync state of a record
  const handleUpdateRecordSync = (id: string, synced: boolean, error?: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              syncedToSheets: synced,
              syncError: error,
              syncTimestamp: new Date().toISOString(),
            }
          : r
      )
    );
  };

  // Unique list of suppliers and plates for autocomplete
  const recentSuppliers = Array.from(new Set(records.map((r) => r.supplier).filter(Boolean)));
  const recentPlates = Array.from(new Set(records.map((r) => r.noPolisi).filter(Boolean)));

  const unsyncedCount = records.filter((r) => !r.syncedToSheets).length;

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 flex flex-col font-sans antialiased">
      {/* ========================================================= */}
      {/* DEDICATED PRINT CONTAINER (USED EXCLUSIVELY BY WINDOW.PRINT) */}
      {/* ========================================================= */}
      <div className="hidden print:block print-only-container">
        {activePrintRecord && (
          <ReceiptPrint record={activePrintRecord} settings={settings} isPrintMode={true} />
        )}
      </div>

      {/* ========================================================= */}
      {/* MAIN APPLICATION VIEW (HIDDEN ON PRINT) */}
      {/* ========================================================= */}
      <div className="no-print flex-1 flex flex-col">
        {/* TOP NAVBAR */}
        <header className="bg-emerald-950 text-white border-b border-emerald-800 shadow-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-18">
              {/* Logo & RAM Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-inner text-white font-black text-xl shrink-0">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white uppercase">
                      {settings.companyName || 'RAM SAWIT BERKAH JAYA'}
                    </h1>
                    <span className="hidden sm:inline-block bg-emerald-800/80 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-700">
                      Sistem Timbangan TBS
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-300 truncate max-w-xs sm:max-w-md">
                    {settings.companyAddress} &bull; HP: {settings.companyPhone}
                  </p>
                </div>
              </div>

              {/* Header Status & Quick Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Google Sheet Connection Badge */}
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                    settings.googleAppScriptUrl
                      ? 'bg-emerald-900/60 border-emerald-700 text-emerald-200 hover:bg-emerald-900'
                      : 'bg-amber-950/60 border-amber-700 text-amber-200 hover:bg-amber-900'
                  }`}
                  title={
                    settings.googleAppScriptUrl
                      ? 'Google Sheet Terhubung'
                      : 'Klik untuk menghubungkan Google Sheet'
                  }
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {settings.googleAppScriptUrl ? 'Google Sheet Aktif' : 'Sambungkan Sheets'}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      settings.googleAppScriptUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="bg-emerald-900/90 border-t border-emerald-800/80 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-3 overflow-x-auto py-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === 'form'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Penimbangan Baru</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 relative ${
                  activeTab === 'history'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Riwayat Timbangan</span>
                {records.length > 0 && (
                  <span className="bg-emerald-950 text-emerald-200 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-emerald-700">
                    {records.length}
                  </span>
                )}
                {unsyncedCount > 0 && (
                  <span
                    className="w-2 h-2 bg-amber-400 rounded-full"
                    title={`${unsyncedCount} belum masuk Google Sheet`}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === 'stats'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Rekap &amp; Statistik</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan &amp; Google Sheets</span>
              </button>
            </div>
          </div>
        </header>

        {/* TOAST FLOATING ALERT */}
        {toastNotification && (
          <div className="fixed bottom-5 right-5 z-50 animate-bounce">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${
                toastNotification.type === 'success'
                  ? 'bg-emerald-900 text-white border-emerald-600'
                  : toastNotification.type === 'warning'
                  ? 'bg-amber-900 text-amber-100 border-amber-700'
                  : 'bg-gray-900 text-white border-gray-700'
              }`}
            >
              {toastNotification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <span>{toastNotification.msg}</span>
            </div>
          </div>
        )}

        {/* BODY CONTAINER */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
          {/* NOTICE IF GOOGLE SHEETS IS NOT SET YET */}
          {!settings.googleAppScriptUrl && activeTab === 'form' && (
            <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl shadow-xs text-xs sm:text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold block">
                    Integrasi Google Sheet belum dikonfigurasi
                  </span>
                  <span className="text-amber-800 text-xs">
                    Data penimbangan tetap tersimpan di riwayat aplikasi ini. Hubungkan Google Sheet
                    agar data otomatis masuk spreadsheet saat cetak nota.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-xs shrink-0 cursor-pointer flex items-center gap-1 self-start sm:self-center"
              >
                <span>Panduan Pasang Sheets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: FORM PENIMBANGAN BARU */}
          {activeTab === 'form' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form Input Area */}
              <div className="lg:col-span-8">
                <WeighingForm
                  settings={settings}
                  onSaveAndPrint={handleSaveAndPrint}
                  onSaveOnly={handleSaveOnly}
                  onPreview={handlePreview}
                  totalRecordsToday={records.length}
                  recentSuppliers={recentSuppliers}
                  recentPlates={recentPlates}
                />
              </div>

              {/* Side Live Receipt Preview */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Printer className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-xs uppercase tracking-wider text-gray-800">
                        Pratinjau Nota (Ukuran 21 x 24 cm)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreview(activePrintRecord)}
                      className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                    >
                      Buka Penuh
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-500 mb-3">
                    Tampilan nota di bawah persis format foto nota timbangan asli dengan QR code operator.
                  </p>

                  <div className="overflow-hidden border border-gray-300 rounded shadow-inner bg-gray-50 flex justify-center p-2">
                    <div className="transform scale-[0.45] sm:scale-[0.52] origin-top my-[-110px]">
                      <ReceiptPrint record={activePrintRecord} settings={settings} />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t text-[11px] text-gray-500 flex items-center justify-between">
                    <span>RAM SAWIT BERKAH JAYA</span>
                    <span className="font-mono text-emerald-700 font-bold">210 &times; 240 mm</span>
                  </div>
                </div>

                {/* Quick Info Box */}
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-xs text-emerald-950 space-y-2">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Scale className="w-4 h-4 text-emerald-700" />
                    Cara Kerja Cetak &amp; Sinkron:
                  </span>
                  <p className="leading-relaxed text-gray-700">
                    1. Isi timbangan <strong>GROSS</strong> saat truk masuk membawa sawit.
                    <br />
                    2. Isi timbangan <strong>TARE</strong> saat truk keluar kosong.
                    <br />
                    3. Klik tombol hijau <strong>CETAK NOTA &amp; SIMPAN KE GOOGLE SHEET</strong>. Nota
                    langsung dicetak dan baris baru otomatis tercatat di Google Sheet pemilik RAM.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RIWAYAT PENIMBANGAN */}
          {activeTab === 'history' && (
            <WeighingHistory
              records={records}
              settings={settings}
              onReprint={handleReprint}
              onDeleteRecord={handleDeleteRecord}
              onUpdateRecordSync={handleUpdateRecordSync}
            />
          )}

          {/* TAB 3: REKAP & STATISTIK */}
          {activeTab === 'stats' && <DailyStats records={records} />}

          {/* TAB 4: PENGATURAN & GOOGLE SHEETS */}
          {activeTab === 'settings' && (
            <GoogleSheetSettings
              settings={settings}
              onSaveSettings={(newSettings) => {
                setSettings(newSettings);
                showToast('Pengaturan RAM & Google Sheets berhasil diperbarui!', 'success');
              }}
            />
          )}
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-gray-200 mt-12 py-5 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-bold text-gray-800">
                {settings.companyName || 'RAM SAWIT BERKAH JAYA'}
              </span>{' '}
              &bull; {settings.companyAddress} &bull; HP: {settings.companyPhone}
            </div>
            <div className="text-[11px] text-gray-400">
              Format Nota Timbangan 21 &times; 24 cm &bull; Integrasi Google Sheets Apps Script
            </div>
          </div>
        </footer>
      </div>

      {/* RECEIPT PREVIEW / PRINT MODAL */}
      <ReceiptModal
        record={modalRecord}
        settings={settings}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateRecordSync={handleUpdateRecordSync}
      />
    </div>
  );
}
