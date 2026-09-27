import React, { useState, useRef } from 'react';
import {
  Printer,
  X,
  Cloud,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Download,
  Info,
  Image as ImageIcon,
} from 'lucide-react';
import { WeighingRecord, AppSettings } from '../types/weighing';
import { ReceiptPrint } from './ReceiptPrint';
import { sendRecordToGoogleSheets } from '../utils/googleSheets';
import { executePrint, openPrintTab, generateReceiptHtml } from '../utils/printHelper';
import { downloadReceiptAsJpg } from '../utils/receiptImageGenerator';

interface ReceiptModalProps {
  record: WeighingRecord | null;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRecordSync?: (id: string, synced: boolean, error?: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  record,
  settings,
  isOpen,
  onClose,
  onUpdateRecordSync,
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isDownloadingJpg, setIsDownloadingJpg] = useState<boolean>(false);
  const receiptCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !record) return null;

  const handlePrint = async () => {
    setIsPrinting(true);

    // Trigger print in new tab with immediate print preview
    try {
      await openPrintTab(record, settings);
    } catch (e) {
      console.warn('openPrintTab failed, invoking executePrint directly', e);
      await executePrint(record, settings);
    }

    setTimeout(() => setIsPrinting(false), 2000);

    // Sync to Google Sheets in background if not synced
    if (!record.syncedToSheets && settings.googleAppScriptUrl) {
      setIsSyncing(true);
      setSyncStatus('Mengirim ke Google Sheet...');
      sendRecordToGoogleSheets(settings.googleAppScriptUrl, record).then((res) => {
        setIsSyncing(false);
        if (res.success) {
          setSyncStatus('Berhasil dikirim ke Google Sheet!');
          if (onUpdateRecordSync) {
            onUpdateRecordSync(record.id, true);
          }
        } else {
          setSyncStatus(`Info: ${res.message}`);
          if (onUpdateRecordSync) {
            onUpdateRecordSync(record.id, false, res.message);
          }
        }
      });
    }
  };

  const handleOpenNewTab = async () => {
    await openPrintTab(record, settings);
  };

  const handleDownloadJpg = async () => {
    setIsDownloadingJpg(true);
    try {
      await downloadReceiptAsJpg(record, settings, receiptCardRef.current);
    } catch (err) {
      console.error('Failed to download JPG', err);
    } finally {
      setIsDownloadingJpg(false);
    }
  };

  const handleDownloadHtml = async () => {
    const html = await generateReceiptHtml(record, settings);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nota_${record.noSeri.replace(/\//g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleManualSync = async () => {
    if (!settings.googleAppScriptUrl) {
      setSyncStatus('URL Google Apps Script belum diisi di Pengaturan!');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Mengirim ke Google Sheet...');
    const res = await sendRecordToGoogleSheets(settings.googleAppScriptUrl, record);
    setIsSyncing(false);
    if (res.success) {
      setSyncStatus('Berhasil tersimpan di Google Sheet!');
      if (onUpdateRecordSync) {
        onUpdateRecordSync(record.id, true);
      }
    } else {
      setSyncStatus(`Gagal: ${res.message}`);
      if (onUpdateRecordSync) {
        onUpdateRecordSync(record.id, false, res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="bg-emerald-950 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base tracking-wide">
              Nota Timbangan RAM SAWIT BERKAH JAYA
            </span>
            <span className="text-xs bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-mono border border-emerald-700">
              {record.noSeri}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={isDownloadingJpg}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md"
              title="Unduh nota ini sebagai gambar JPG kualitas tinggi"
            >
              <ImageIcon className="w-4 h-4 text-stone-900" />
              <span>{isDownloadingJpg ? 'Menyimpan JPG...' : 'Unduh JPG'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Membuka Printer...' : 'Cetak Nota (Print)'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync Status & Info Bar (Hidden on Print) */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-700 no-print">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-700" />
            <span className="font-medium">Google Sheet:</span>
            {record.syncedToSheets ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Tersimpan di Spreadsheet
              </span>
            ) : settings.googleAppScriptUrl ? (
              <span className="inline-flex items-center gap-1 text-amber-800 font-medium bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Otomatis dikirim saat cetak
              </span>
            ) : (
              <span className="text-gray-500 italic">
                (Belum disambungkan ke Google Sheet)
              </span>
            )}
            {syncStatus && (
              <span className="font-semibold text-emerald-800 ml-2 animate-pulse">
                {syncStatus}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {settings.googleAppScriptUrl && !record.syncedToSheets && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync ke Sheets Sekarang</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
              title="Gunakan jika printer tidak muncul di jendela pratinjau"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Tab Baru</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content (Receipt preview) */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-gray-200 flex justify-center items-center print:bg-white print:p-0">
          <div ref={receiptCardRef} className="bg-white shadow-2xl scale-90 sm:scale-100 origin-top print:shadow-none print:scale-100">
            <ReceiptPrint record={record} settings={settings} />
          </div>
        </div>

        {/* Modal Footer Controls (Hidden on Print) */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Ukuran nota kertas: <strong>21 cm (lebar) &times; 14 cm (tinggi)</strong>.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={isDownloadingJpg}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded-lg cursor-pointer flex items-center gap-1.5 transition shadow-xs"
              title="Download gambar nota dalam format JPG"
            >
              <ImageIcon className="w-4 h-4 text-stone-900" />
              <span>{isDownloadingJpg ? 'Menyimpan JPG...' : 'Unduh Nota (JPG)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg cursor-pointer flex items-center gap-1.5 transition"
              title="Simpan file nota HTML"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Unduh HTML</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="px-3.5 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 bg-blue-50 border border-blue-300 rounded-lg cursor-pointer flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>Buka di Tab Baru</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 cursor-pointer shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Membuka Printer...' : 'Cetak Nota'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
