import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Phone,
  MapPin,
  Building2,
  Info,
} from 'lucide-react';
import { AppSettings, WeighingRecord } from '../types/weighing';
import { APPS_SCRIPT_TEMPLATE, testConnectionGoogleSheets, sendRecordToGoogleSheets } from '../utils/googleSheets';
import { PERMANENT_GOOGLE_APPS_SCRIPT_URL } from '../config/appsScriptConfig';
import { Lock, Send } from 'lucide-react';

interface GoogleSheetSettingsProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const GoogleSheetSettings: React.FC<GoogleSheetSettingsProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [copied, setCopied] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ loading: boolean; msg: string; success: boolean } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [testRowLoading, setTestRowLoading] = useState<boolean>(false);
  const [testRowResult, setTestRowResult] = useState<string | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendTestRow = async () => {
    if (!formData.googleAppScriptUrl.trim()) {
      alert('Silakan isi URL Apps Script terlebih dahulu!');
      return;
    }
    setTestRowLoading(true);
    setTestRowResult(null);

    const dummyRecord: WeighingRecord = {
      id: 'test-' + Date.now(),
      noSeri: 'SBJ-' + Math.floor(1000 + Math.random() * 9000),
      noPolisi: 'BG 8888 XX',
      tanggalMasuk: new Date().toLocaleDateString('id-ID'),
      jamMasuk: '10:00:00',
      jamKeluar: '10:15:00',
      supplier: 'Uji Coba Sistem (Tes Baris)',
      alamatSupplier: 'Desa Sukajadi RT 10/RW 03, Lalan',
      gross: 5500,
      tare: 2200,
      bruto: 3300,
      rafaksiPersen: 3,
      rafaksiKg: 99,
      netto: 3201,
      hargaPerKg: 2625,
      jumlahDibayar: 3201 * 2625,
      namaOperator: 'YUNUS',
      syncedToSheets: false,
      createdAt: new Date().toISOString(),
    };

    const res = await sendRecordToGoogleSheets(formData.googleAppScriptUrl, dummyRecord);
    setTestRowLoading(false);
    setTestRowResult(res.message);
  };

  const handleTestConnection = async () => {
    if (!formData.googleAppScriptUrl.trim()) {
      setTestResult({
        loading: false,
        msg: 'Silakan isi URL Web App Google Apps Script terlebih dahulu.',
        success: false,
      });
      return;
    }

    setTestResult({ loading: true, msg: 'Menguji koneksi ke Google Sheets...', success: false });
    const res = await testConnectionGoogleSheets(formData.googleAppScriptUrl);
    setTestResult({
      loading: false,
      msg: res.message,
      success: res.success,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Pengaturan dan URL Google Sheets berhasil disimpan!</span>
        </div>
      )}

      {/* SECTION 1: GOOGLE APPS SCRIPT SETUP */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base">Integrasi Google Sheet (Google Apps Script)</h3>
              <p className="text-xs text-emerald-200">
                Data penimbangan otomatis tersimpan ke baris Google Sheet saat Anda klik Cetak Nota
              </p>
            </div>
          </div>
          <span className="text-xs bg-emerald-700/80 px-2.5 py-1 rounded-full border border-emerald-500 font-mono">
            {formData.googleAppScriptUrl ? 'URL Terpasang' : 'Belum Terpasang'}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* STEP BY STEP TUTORIAL */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200 text-xs text-gray-800 space-y-3">
            <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-700" />
              Langkah 2 Menit Menghubungkan Google Sheet:
            </h4>
            <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
              <li>
                Buka Google Sheet baru di browser Anda:{' '}
                <a
                  href="https://sheet.new"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-800 underline inline-flex items-center gap-1"
                >
                  sheet.new <ExternalLink className="w-3 h-3" />
                </a>{' '}
                (beri judul misalnya: <em>Data Timbangan RAM Sawit Berkah Jaya</em>).
              </li>
              <li>
                Di menu atas Google Sheet, klik <strong>Ekstensi (Extensions)</strong> &rarr;{' '}
                <strong>Apps Script</strong>.
              </li>
              <li>
                Hapus semua kode di editor Apps Script, lalu klik tombol hijau{' '}
                <strong>&quot;Salin Skrip Apps Script&quot;</strong> di bawah dan tempelkan (paste).
              </li>
              <li>
                Klik tombol <strong>Simpan (ikon disket)</strong>.
              </li>
              <li>
                Klik tombol biru <strong>Terapkan (Deploy)</strong> di kanan atas &rarr;{' '}
                <strong>Penerapan baru (New deployment)</strong>.
              </li>
              <li>
                Pilih jenis: <strong>Aplikasi web (Web app)</strong>.
              </li>
              <li>
                Pada bagian <strong>Siapa yang memiliki akses (Who has access)</strong>, pilih:{' '}
                <strong className="text-emerald-900 bg-emerald-100 px-1 rounded">
                  Siapa saja (Anyone)
                </strong>
                .
              </li>
              <li>
                Klik <strong>Terapkan (Deploy)</strong>, lalu salin <strong>URL Aplikasi Web</strong>{' '}
                (berakhiran <code>/exec</code>) dan tempel ke kotak di bawah ini!
              </li>
            </ol>
          </div>

          {/* COPY CODE BUTTON */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-900 text-gray-100 p-4 rounded-xl">
            <div>
              <div className="font-bold text-sm text-white">Kode Google Apps Script Siap Pakai</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Skrip otomatis membuat judul kolom, merekam no seri, supplier, berat, rafaksi, harga, dan total.
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Skrip Apps Script'}</span>
            </button>
          </div>

          {/* WEB APP URL INPUT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                URL Aplikasi Web Google Apps Script (Web App URL)
              </label>
              {PERMANENT_GOOGLE_APPS_SCRIPT_URL && (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-300">
                  <Lock className="w-3 h-3 text-emerald-700" />
                  Terkunci Permanen di Kodingan
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={formData.googleAppScriptUrl}
                onChange={(e) =>
                  setFormData({ ...formData, googleAppScriptUrl: e.target.value.trim() })
                }
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 bg-gray-50"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testResult?.loading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-4 py-2 rounded-lg border border-gray-300 transition cursor-pointer shrink-0"
              >
                {testResult?.loading ? 'Menguji...' : 'Uji Koneksi'}
              </button>
              <button
                type="button"
                onClick={handleSendTestRow}
                disabled={testRowLoading}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testRowLoading ? 'Mengirim...' : 'Kirim 1 Baris Tes'}</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Setiap kali Anda menekan tombol Cetak Nota, transaksi langsung dikirim ke spreadsheet ini.
            </p>

            {testRowResult && (
              <div className="mt-2 p-3 text-xs rounded-lg flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{testRowResult} Silakan cek tab spreadsheet Anda sekarang!</span>
              </div>
            )}

            {testResult && (
              <div
                className={`mt-2 p-3 text-xs rounded-lg flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPANY & RECEIPT SETTINGS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="bg-gray-100 border-b border-gray-200 p-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-700" />
          <h3 className="font-bold text-sm text-gray-900">
            Identitas RAM Sawit &amp; Format Nota Timbangan
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nama RAM Sawit (Kop Nota)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  placeholder="RAM SAWIT BERKAH JAYA"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nomor HP / WhatsApp
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  placeholder="081355473807"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Alamat Lengkap RAM (Kop Nota)
            </label>
            <input
              type="text"
              value={formData.companyAddress}
              onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Desa sukajadi RT 10/RW 03, Kec. Lalan, Musi Banyuasin"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Operator Default
              </label>
              <input
                type="text"
                value={formData.defaultOperator}
                onChange={(e) => setFormData({ ...formData, defaultOperator: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-semibold focus:ring-2 focus:ring-emerald-500"
                placeholder="YUNUS"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Harga Sawit Default per Kg (Rp)
              </label>
              <input
                type="number"
                value={formData.defaultPrice}
                onChange={(e) => setFormData({ ...formData, defaultPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                placeholder="2625"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Ukuran Nota Fisik (Standar)
              </label>
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 flex items-center justify-between">
                <span>Lebar 21 cm &times; Tinggi 14 cm</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-medium">Setengah Folio</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Pesan Peringatan Bawah Nota
            </label>
            <input
              type="text"
              value={formData.warningNote}
              onChange={(e) => setFormData({ ...formData, warningNote: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-bold focus:ring-2 focus:ring-emerald-500"
              placeholder="KAMI TIDAK MENERIMA BUAH ILEGAL"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-lg flex items-center gap-2 cursor-pointer shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
