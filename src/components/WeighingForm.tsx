import React, { useState, useEffect } from 'react';
import {
  Printer,
  Clock,
  RotateCcw,
  Eye,
  CheckCircle2,
  Calendar,
  Truck,
  User,
  MapPin,
  Scale,
  DollarSign,
  Percent,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { WeighingRecord, AppSettings } from '../types/weighing';
import {
  getIndonesianFormattedDate,
  getCurrentTimeHHMM,
  generateSerialNumber,
  formatRupiah,
  formatNumber,
  angkaKeTerbilang,
} from '../utils/formatters';

interface WeighingFormProps {
  settings: AppSettings;
  onSaveAndPrint: (record: WeighingRecord) => void;
  onSaveOnly: (record: WeighingRecord) => void;
  onPreview: (record: WeighingRecord) => void;
  totalRecordsToday: number;
  recentSuppliers: string[];
  recentPlates: string[];
}

export const WeighingForm: React.FC<WeighingFormProps> = ({
  settings,
  onSaveAndPrint,
  onSaveOnly,
  onPreview,
  totalRecordsToday,
  recentSuppliers,
  recentPlates,
}) => {
  const [noSeri, setNoSeri] = useState<string>('');
  const [noPolisi, setNoPolisi] = useState<string>('');
  const [tanggalMasuk, setTanggalMasuk] = useState<string>('');
  const [jamMasuk, setJamMasuk] = useState<string>('');
  const [jamKeluar, setJamKeluar] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [alamatSupplier, setAlamatSupplier] = useState<string>('');

  // Weight states
  const [gross, setGross] = useState<string>('2500');
  const [tare, setTare] = useState<string>('1200');
  const [rafaksiMode, setRafaksiMode] = useState<'percent' | 'kg'>('percent');
  const [rafaksiPersen, setRafaksiPersen] = useState<string>('12');
  const [rafaksiKgManual, setRafaksiKgManual] = useState<string>('0');
  const [hargaPerKg, setHargaPerKg] = useState<string>(String(settings.defaultPrice || 2625));
  const [namaOperator, setNamaOperator] = useState<string>(settings.defaultOperator || 'YUNUS');
  const [catatan, setCatatan] = useState<string>('');

  // Quick message feedback
  const [formAlert, setFormAlert] = useState<string | null>(null);

  // Initialize values on mount
  useEffect(() => {
    initForm();
  }, [totalRecordsToday]);

  const initForm = (isClear = false) => {
    const today = new Date();
    setTanggalMasuk(getIndonesianFormattedDate(today));
    setNoSeri(generateSerialNumber(totalRecordsToday + 1, today));
    setJamMasuk(getCurrentTimeHHMM(today));
    setJamKeluar('');
    if (isClear) {
      setSupplier('');
      setAlamatSupplier('');
      setNoPolisi('');
      setGross('');
      setTare('');
    } else {
      // Default to sample so user can immediately click Print and test
      setSupplier('Suenah');
      setAlamatSupplier('P6');
      setNoPolisi('BG 8421 LN');
      setGross('2500');
      setTare('1200');
    }
    setRafaksiMode('percent');
    setRafaksiPersen('12');
    setRafaksiKgManual('0');
    setHargaPerKg(String(settings.defaultPrice || 2625));
    setNamaOperator(settings.defaultOperator || 'YUNUS');
    setCatatan('');
  };

  // Calculations
  const grossNum = parseFloat(gross) || 0;
  const tareNum = parseFloat(tare) || 0;
  // In palm oil weighing (as seen on the ticket):
  // GROSS = 2500, TARE = 1200 -> BRUTO = GROSS - TARE = 1300
  const brutoNum = Math.max(0, grossNum - tareNum);

  let calculatedRafaksiKg = 0;
  let rafaksiPercentVal = 0;

  if (rafaksiMode === 'percent') {
    rafaksiPercentVal = parseFloat(rafaksiPersen) || 0;
    calculatedRafaksiKg = Math.round((brutoNum * rafaksiPercentVal) / 100);
  } else {
    calculatedRafaksiKg = parseFloat(rafaksiKgManual) || 0;
    rafaksiPercentVal = brutoNum > 0 ? Number(((calculatedRafaksiKg / brutoNum) * 100).toFixed(1)) : 0;
  }

  // NETTO = BRUTO - RAFAKSI
  const nettoNum = Math.max(0, brutoNum - calculatedRafaksiKg);
  const hargaNum = parseFloat(hargaPerKg) || 0;
  const jumlahDibayarNum = Math.round(nettoNum * hargaNum);

  const buildRecordObject = (): WeighingRecord => {
    return {
      id: 'SBJ-' + Date.now(),
      noSeri: noSeri.trim() || generateSerialNumber(totalRecordsToday + 1),
      noPolisi: noPolisi.trim().toUpperCase(),
      tanggalMasuk: tanggalMasuk.trim() || getIndonesianFormattedDate(),
      jamMasuk: jamMasuk.trim() || getCurrentTimeHHMM(),
      jamKeluar: jamKeluar.trim() || getCurrentTimeHHMM(),
      supplier: supplier.trim() || 'Umum',
      alamatSupplier: alamatSupplier.trim() || '',
      gross: grossNum,
      tare: tareNum,
      bruto: brutoNum,
      rafaksiPersen: rafaksiPercentVal,
      rafaksiKg: calculatedRafaksiKg,
      netto: nettoNum,
      hargaPerKg: hargaNum,
      jumlahDibayar: jumlahDibayarNum,
      namaOperator: namaOperator.trim() || 'YUNUS',
      catatan: catatan.trim(),
      createdAt: new Date().toISOString(),
      syncedToSheets: false,
    };
  };

  const validate = (): boolean => {
    if (!supplier.trim()) {
      setFormAlert('Harap isi nama supplier terlebih dahulu!');
      return false;
    }
    if (grossNum <= 0) {
      setFormAlert('Harap masukkan nilai Gross (timbangan isi)!');
      return false;
    }
    if (tareNum < 0) {
      setFormAlert('Nilai Tare (timbangan kosong) tidak boleh minus!');
      return false;
    }
    if (grossNum < tareNum) {
      setFormAlert('Perhatian: Gross harus lebih besar daripada Tare!');
      return false;
    }
    setFormAlert(null);
    return true;
  };

  const handlePrintAndSave = () => {
    if (!validate()) return;
    const rec = buildRecordObject();
    onSaveAndPrint(rec);
  };

  const handleSaveDraft = () => {
    if (!validate()) return;
    const rec = buildRecordObject();
    onSaveOnly(rec);
  };

  const handlePreviewNota = () => {
    const rec = buildRecordObject();
    onPreview(rec);
  };

  const fillSampleData = () => {
    setSupplier('mextri');
    setAlamatSupplier('P6');
    setNoPolisi('BG 8421 LN');
    setGross('2500');
    setTare('1200');
    setRafaksiMode('percent');
    setRafaksiPersen('12');
    setHargaPerKg('2625');
    setJamMasuk('08:15');
    setJamKeluar('09:30');
    setNamaOperator('YUNUS');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-300" />
            <h2 className="text-xl font-bold tracking-tight">Formulir Penimbangan Sawit</h2>
          </div>
          <p className="text-xs text-emerald-200 mt-0.5">
            RAM SAWIT BERKAH JAYA &bull; Desa Sukajadi RT 10 / RW 03, Kec. Lalan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fillSampleData}
            className="text-xs bg-emerald-700/70 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg border border-emerald-500/50 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Isi Contoh Foto</span>
          </button>
          <button
            type="button"
            onClick={() => initForm(true)}
            className="text-xs bg-emerald-900/80 hover:bg-emerald-900 text-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Form</span>
          </button>
        </div>
      </div>

      {formAlert && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-md text-amber-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>{formAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormAlert(null)}
            className="text-amber-700 font-bold hover:text-amber-900 px-2"
          >
            &times;
          </button>
        </div>
      )}

      <form className="p-4 sm:p-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* SECTION 1: IDENTITAS TRANSAKSI & KENDARAAN */}
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b pb-2 mb-4">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>1. DATA SURAT & IDENTITAS KENDARAAN</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* No Seri */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                No Seri Nota (Otomatis)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={noSeri}
                  onChange={(e) => setNoSeri(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                  placeholder="001/SBJ/IX/2026"
                />
              </div>
            </div>

            {/* No Polisi */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                No Polisi Kendaraan (Plat Nomor)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={noPolisi}
                  onChange={(e) => setNoPolisi(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold tracking-wider uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Contoh: BG 8421 LN"
                />
                {recentPlates.length > 0 && !noPolisi && (
                  <div className="flex gap-1 mt-1 overflow-x-auto py-0.5">
                    {recentPlates.slice(0, 3).map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setNoPolisi(plat)}
                        className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        {plat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tanggal Masuk */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tanggal Masuk (Format Nota)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Minggu, 27 September 2026"
                />
                <button
                  type="button"
                  title="Gunakan Tanggal Hari Ini"
                  onClick={() => setTanggalMasuk(getIndonesianFormattedDate())}
                  className="absolute right-2 text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {/* Supplier */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                <span>Nama Supplier / Pemilik Buah *</span>
                <span className="text-[10px] text-gray-400 font-normal">Tulis Manual</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nama Supplier (misal: mextri, H. Mahmud, dll)"
                  required
                />
                {recentSuppliers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] text-gray-400 self-center">Riwayat:</span>
                    {recentSuppliers.slice(0, 4).map((sup) => (
                      <button
                        key={sup}
                        type="button"
                        onClick={() => setSupplier(sup)}
                        className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                      >
                        {sup}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Alamat Supplier */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Alamat / Asal Kebun
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={alamatSupplier}
                  onChange={(e) => setAlamatSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Misal: P6, Lalan, Desa Sukajadi, Blok B"
                />
                <div className="flex gap-1 mt-1.5">
                  {['P6', 'Sukajadi', 'Lalan', 'P5', 'P7'].map((almt) => (
                    <button
                      key={almt}
                      type="button"
                      onClick={() => setAlamatSupplier(almt)}
                      className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      {almt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Jam Masuk & Jam Keluar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-gray-50/70 p-3 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Jam Masuk
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={jamMasuk}
                  onChange={(e) => setJamMasuk(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="08:15"
                />
                <button
                  type="button"
                  onClick={() => setJamMasuk(getCurrentTimeHHMM())}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                  title="Gunakan Jam Sekarang"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sekarang</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Jam Keluar
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={jamKeluar}
                  onChange={(e) => setJamKeluar(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="09:30"
                />
                <button
                  type="button"
                  onClick={() => setJamKeluar(getCurrentTimeHHMM())}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                  title="Gunakan Jam Sekarang"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PERHITUNGAN TIMBANGAN */}
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b pb-2 mb-4">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>2. HASIL TIMBANGAN & POTONGAN RAFAKSI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GROSS */}
            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                GROSS (Truk + Isi)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="any"
                  value={gross}
                  onChange={(e) => setGross(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 text-xl font-bold font-mono text-gray-900 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  placeholder="2500"
                />
                <span className="absolute right-3 font-semibold text-gray-500 text-sm">
                  Kg
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Berat kotor pertama</p>
            </div>

            {/* TARE */}
            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                TARE (Truk Kosong)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="any"
                  value={tare}
                  onChange={(e) => setTare(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 text-xl font-bold font-mono text-gray-900 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                  placeholder="1200"
                />
                <span className="absolute right-3 font-semibold text-gray-500 text-sm">
                  Kg
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Berat tara kendaraan</p>
            </div>

            {/* BRUTO (GROSS - TARE) */}
            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
              <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                BRUTO (Gross - Tare)
              </label>
              <div className="flex items-baseline justify-between py-2 px-3 bg-white border border-blue-200 rounded-lg">
                <span className="text-xl font-extrabold font-mono text-blue-900">
                  {formatNumber(brutoNum)}
                </span>
                <span className="font-semibold text-blue-800 text-sm">Kg</span>
              </div>
              <p className="text-[11px] text-blue-600 mt-1">Dihitung otomatis</p>
            </div>
          </div>

          {/* RAFAKSI & HARGA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Rafaksi Settings */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  RAFAKSI (Potongan)
                </label>
                <div className="flex rounded-md overflow-hidden border border-gray-300 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setRafaksiMode('percent')}
                    className={`px-2 py-0.5 font-medium cursor-pointer ${
                      rafaksiMode === 'percent'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    Persen (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRafaksiMode('kg')}
                    className={`px-2 py-0.5 font-medium cursor-pointer ${
                      rafaksiMode === 'kg'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    Kg Manual
                  </button>
                </div>
              </div>

              {rafaksiMode === 'percent' ? (
                <div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      value={rafaksiPersen}
                      onChange={(e) => setRafaksiPersen(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 text-lg font-bold font-mono text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                      placeholder="12"
                    />
                    <span className="absolute right-3 font-semibold text-gray-600 text-sm">
                      %
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[0, 2, 3, 5, 8, 10, 12, 15].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setRafaksiPersen(String(pct))}
                        className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${
                          Number(rafaksiPersen) === pct
                            ? 'bg-emerald-700 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-gray-700 flex justify-between bg-white px-2 py-1 rounded border">
                    <span>Potongan Rafaksi:</span>
                    <span className="font-mono text-red-600 font-bold">
                      {formatNumber(calculatedRafaksiKg)} Kg
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="any"
                      value={rafaksiKgManual}
                      onChange={(e) => setRafaksiKgManual(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 text-lg font-bold font-mono text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                      placeholder="156"
                    />
                    <span className="absolute right-3 font-semibold text-gray-600 text-sm">
                      Kg
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-gray-700 flex justify-between bg-white px-2 py-1 rounded border">
                    <span>Setara Persen:</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {rafaksiPercentVal}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* NETTO */}
            <div className="bg-emerald-100/60 p-3 rounded-xl border-2 border-emerald-400 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1">
                  NETTO (Bruto - Rafaksi)
                </label>
                <div className="py-2 px-3 bg-white border border-emerald-300 rounded-lg flex items-baseline justify-between shadow-inner">
                  <span className="text-2xl font-black font-mono text-emerald-900">
                    {formatNumber(nettoNum)}
                  </span>
                  <span className="font-bold text-emerald-800 text-base">Kg</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-emerald-800">
                Berat bersih yang dihitung bayar
              </div>
            </div>

            {/* HARGA PER KG */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                Harga per Kg (Rp)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-semibold text-gray-500 text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  value={hargaPerKg}
                  onChange={(e) => setHargaPerKg(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-lg font-bold font-mono text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  placeholder="2625"
                />
              </div>
              <div className="flex gap-1 mt-1.5">
                {[2500, 2600, 2625, 2650, 2700, 2750].map((prc) => (
                  <button
                    key={prc}
                    type="button"
                    onClick={() => setHargaPerKg(String(prc))}
                    className={`text-[10px] px-1 py-0.5 rounded cursor-pointer ${
                      Number(hargaPerKg) === prc
                        ? 'bg-emerald-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {prc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* JUMLAH YANG DIBAYAR SUMMARY CARD */}
          <div className="mt-4 p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-green-950 rounded-xl text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/60 pb-3">
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-300 font-semibold">
                  TOTAL PEMBAYARAN KEPADA SUPPLIER
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-1">
                  {formatRupiah(jumlahDibayarNum)}
                </div>
              </div>
              <div className="text-right sm:text-right text-xs text-emerald-200">
                <div>Formula: {formatNumber(nettoNum)} Kg &times; {formatRupiah(hargaNum)}</div>
                <div className="text-[11px] text-emerald-300 font-sans mt-0.5 italic">
                  &ldquo;{angkaKeTerbilang(jumlahDibayarNum)}&rdquo;
                </div>
              </div>
            </div>

            {/* Operator and Additional Notes in Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-300 font-medium">Nama Operator:</span>
                <input
                  type="text"
                  value={namaOperator}
                  onChange={(e) => setNamaOperator(e.target.value.toUpperCase())}
                  className="bg-emerald-950/80 border border-emerald-600 rounded px-2.5 py-1 text-white font-bold uppercase focus:ring-1 focus:ring-emerald-400 w-36"
                  placeholder="YUNUS"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-300 font-medium">Catatan:</span>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="bg-emerald-950/80 border border-emerald-600 rounded px-2.5 py-1 text-white focus:ring-1 focus:ring-emerald-400 flex-1"
                  placeholder="Opsional (misal: Buah Restan, Mutu Bagus)"
                />
              </div>
            </div>
          </div>
        </div>

        {formAlert && (
          <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-md text-amber-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="font-semibold">{formAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormAlert(null)}
              className="text-amber-700 font-bold hover:text-amber-900 px-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* SECTION 3: ACTION BUTTONS (CETAK NOTA & SIMPAN KE GOOGLE SHEETS) */}
        <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePreviewNota}
            className="w-full sm:w-auto px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition flex items-center justify-center gap-2 border border-gray-300 cursor-pointer text-sm"
          >
            <Eye className="w-4 h-4 text-gray-600" />
            <span>Lihat Pratinjau Nota</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-emerald-50 text-emerald-800 font-semibold rounded-xl transition flex items-center justify-center gap-2 border-2 border-emerald-600 cursor-pointer text-sm shadow-sm"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Simpan ke Riwayat Saja</span>
            </button>

            {/* MAIN ACTION BUTTON: PRINT & AUTO SYNC TO GOOGLE SHEETS */}
            <button
              type="button"
              onClick={handlePrintAndSave}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer text-base"
            >
              <Printer className="w-5 h-5 text-emerald-100 animate-pulse" />
              <span>CETAK NOTA &amp; SIMPAN KE GOOGLE SHEET</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
