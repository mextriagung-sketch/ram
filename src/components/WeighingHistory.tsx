import React, { useState } from 'react';
import {
  Search,
  Filter,
  Printer,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Scale,
  Calendar,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import { WeighingRecord, AppSettings } from '../types/weighing';
import { formatNumber, formatRupiah } from '../utils/formatters';
import { sendRecordToGoogleSheets } from '../utils/googleSheets';
import { downloadReceiptAsJpg } from '../utils/receiptImageGenerator';

interface WeighingHistoryProps {
  records: WeighingRecord[];
  settings: AppSettings;
  onReprint: (record: WeighingRecord) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateRecordSync: (id: string, synced: boolean, error?: string) => void;
}

export const WeighingHistory: React.FC<WeighingHistoryProps> = ({
  records,
  settings,
  onReprint,
  onDeleteRecord,
  onUpdateRecordSync,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');
  const [isBatchSyncing, setIsBatchSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Filter records
  const filteredRecords = records.filter((rec) => {
    // Search keyword
    const matchSearch =
      rec.noSeri.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.noPolisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.alamatSupplier && rec.alamatSupplier.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    // Date filter
    if (dateFilter === 'today') {
      const recordDate = new Date(rec.createdAt);
      const today = new Date();
      return (
        recordDate.getDate() === today.getDate() &&
        recordDate.getMonth() === today.getMonth() &&
        recordDate.getFullYear() === today.getFullYear()
      );
    } else if (dateFilter === 'month') {
      const recordDate = new Date(rec.createdAt);
      const today = new Date();
      return (
        recordDate.getMonth() === today.getMonth() &&
        recordDate.getFullYear() === today.getFullYear()
      );
    }
    return true;
  });

  // Calculate statistics for filtered records
  const totalNetto = filteredRecords.reduce((acc, r) => acc + (r.netto || 0), 0);
  const totalBayar = filteredRecords.reduce((acc, r) => acc + (r.jumlahDibayar || 0), 0);
  const totalGross = filteredRecords.reduce((acc, r) => acc + (r.gross || 0), 0);
  const totalRafaksiKg = filteredRecords.reduce((acc, r) => acc + (r.rafaksiKg || 0), 0);
  const unsyncedCount = records.filter((r) => !r.syncedToSheets).length;

  // Single sync action
  const handleSingleSync = async (record: WeighingRecord) => {
    if (!settings.googleAppScriptUrl) {
      setSyncStatusMsg('Silakan masukkan URL Google Apps Script di tab Pengaturan terlebih dahulu!');
      setTimeout(() => setSyncStatusMsg(null), 5000);
      return;
    }
    const res = await sendRecordToGoogleSheets(settings.googleAppScriptUrl, record);
    if (res.success) {
      onUpdateRecordSync(record.id, true);
    } else {
      onUpdateRecordSync(record.id, false, res.message);
      setSyncStatusMsg(`Gagal mengirim ke Sheets: ${res.message}`);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  // Batch sync action
  const handleBatchSync = async () => {
    if (!settings.googleAppScriptUrl) {
      setSyncStatusMsg('Silakan masukkan URL Google Apps Script di tab Pengaturan terlebih dahulu!');
      setTimeout(() => setSyncStatusMsg(null), 5000);
      return;
    }

    const unSyncedRecords = records.filter((r) => !r.syncedToSheets);
    if (unSyncedRecords.length === 0) {
      setSyncStatusMsg('Semua data sudah tersinkron ke Google Sheets!');
      setTimeout(() => setSyncStatusMsg(null), 5000);
      return;
    }

    setIsBatchSyncing(true);
    setSyncStatusMsg(`Mengirim ${unSyncedRecords.length} data ke Google Sheets...`);
    let successCount = 0;

    for (const rec of unSyncedRecords) {
      const res = await sendRecordToGoogleSheets(settings.googleAppScriptUrl, rec);
      if (res.success) {
        onUpdateRecordSync(rec.id, true);
        successCount++;
      }
      // slight delay
      await new Promise((r) => setTimeout(r, 400));
    }

    setIsBatchSyncing(false);
    setSyncStatusMsg(`Berhasil mengirim ${successCount} dari ${unSyncedRecords.length} data.`);
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      setSyncStatusMsg('Tidak ada data penimbangan untuk diekspor.');
      setTimeout(() => setSyncStatusMsg(null), 4000);
      return;
    }

    const headers = [
      'No Seri',
      'No Polisi',
      'Tanggal Masuk',
      'Jam Masuk',
      'Jam Keluar',
      'Supplier',
      'Alamat',
      'Gross (Kg)',
      'Tare (Kg)',
      'Bruto (Kg)',
      'Rafaksi (%)',
      'Rafaksi (Kg)',
      'Netto (Kg)',
      'Harga/Kg (Rp)',
      'Jumlah Dibayar (Rp)',
      'Operator',
      'Status Sync',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.noSeri}"`,
      `"${r.noPolisi}"`,
      `"${r.tanggalMasuk}"`,
      `"${r.jamMasuk}"`,
      `"${r.jamKeluar}"`,
      `"${r.supplier}"`,
      `"${r.alamatSupplier || ''}"`,
      r.gross,
      r.tare,
      r.bruto,
      r.rafaksiPersen,
      r.rafaksiKg,
      r.netto,
      r.hargaPerKg,
      r.jumlahDibayar,
      `"${r.namaOperator}"`,
      `"${r.syncedToSheets ? 'Tersimpan Sheets' : 'Lokal'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Timbangan_Sawit_SBJ_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Total Transaksi</div>
          <div className="text-xl font-bold font-mono text-gray-900 mt-1">
            {filteredRecords.length} <span className="text-xs font-normal text-gray-400">Nota</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-xs text-emerald-800 font-medium">Total Tonase Netto</div>
          <div className="text-xl font-bold font-mono text-emerald-900 mt-1">
            {formatNumber(totalNetto)}{' '}
            <span className="text-xs font-normal text-emerald-700">
              Kg ({(totalNetto / 1000).toFixed(2)} Ton)
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="text-xs text-blue-800 font-medium">Total Potongan Rafaksi</div>
          <div className="text-xl font-bold font-mono text-blue-900 mt-1">
            {formatNumber(totalRafaksiKg)}{' '}
            <span className="text-xs font-normal text-blue-700">Kg</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-green-300 bg-green-50/40 shadow-xs">
          <div className="text-xs text-green-900 font-medium">Total Pembayaran</div>
          <div className="text-xl font-bold font-mono text-green-950 mt-1">
            {formatRupiah(totalBayar)}
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No Seri, Supplier, Plat Nomor, Alamat..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date Filter Tabs */}
          <div className="flex rounded-lg border border-gray-300 p-0.5 bg-gray-50 text-xs">
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 font-medium rounded-md cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-white shadow-xs text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 font-medium rounded-md cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-white shadow-xs text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1 font-medium rounded-md cursor-pointer ${
                dateFilter === 'month'
                  ? 'bg-white shadow-xs text-emerald-800 font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bulan Ini
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {unsyncedCount > 0 && (
            <button
              type="button"
              onClick={handleBatchSync}
              disabled={isBatchSyncing}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBatchSyncing ? 'animate-spin' : ''}`} />
              <span>Kirim {unsyncedCount} ke Sheets</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Download file CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-100 text-gray-800 font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-3">No Seri</th>
                <th className="py-3 px-3">Tanggal &amp; Jam</th>
                <th className="py-3 px-3">No Polisi</th>
                <th className="py-3 px-3">Supplier &amp; Asal</th>
                <th className="py-3 px-3 text-right">Gross (Kg)</th>
                <th className="py-3 px-3 text-right">Tare (Kg)</th>
                <th className="py-3 px-3 text-right">Bruto (Kg)</th>
                <th className="py-3 px-3 text-right">Rafaksi</th>
                <th className="py-3 px-3 text-right font-extrabold text-emerald-900">Netto (Kg)</th>
                <th className="py-3 px-3 text-right">Harga/Kg</th>
                <th className="py-3 px-3 text-right font-extrabold text-gray-900">Total Bayar</th>
                <th className="py-3 px-3 text-center">Sheets</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-sans">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-gray-400">
                    <Scale className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-sm text-gray-500">
                      Belum ada data penimbangan tersimpan
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Silakan isi formulir timbangan di menu Penimbangan Baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                      {r.noSeri}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{r.tanggalMasuk}</div>
                      <div className="text-[10px] text-gray-500">
                        {r.jamMasuk} - {r.jamKeluar || '-'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-gray-800 whitespace-nowrap">
                      {r.noPolisi || '-'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{r.supplier}</div>
                      <div className="text-[10px] text-gray-500">{r.alamatSupplier || '-'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                      {formatNumber(r.gross)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                      {formatNumber(r.tare)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-900">
                      {formatNumber(r.bruto)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className="font-mono text-red-600 font-medium">
                        {formatNumber(r.rafaksiKg)} Kg
                      </span>
                      {r.rafaksiPersen > 0 && (
                        <span className="text-[10px] text-gray-500 block">
                          ({r.rafaksiPersen}%)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                      {formatNumber(r.netto)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-800">
                      {formatRupiah(r.hargaPerKg)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-950 text-sm whitespace-nowrap">
                      {formatRupiah(r.jumlahDibayar)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {r.syncedToSheets ? (
                        <span
                          title="Tersimpan di Google Sheets"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Sheets</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSingleSync(r)}
                          title="Klik untuk sync ke Google Sheets sekarang"
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full cursor-pointer transition"
                        >
                          <Cloud className="w-3 h-3 text-amber-600" />
                          <span>Kirim</span>
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => downloadReceiptAsJpg(r, settings)}
                          title="Unduh Nota Gambar (JPG)"
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReprint(r)}
                          title="Cetak Ulang Nota (Print)"
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus nota ${r.noSeri} (${r.supplier})?`)) {
                              onDeleteRecord(r.id);
                            }
                          }}
                          title="Hapus Data"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
