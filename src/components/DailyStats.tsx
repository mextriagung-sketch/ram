import React from 'react';
import {
  TrendingUp,
  Scale,
  DollarSign,
  Users,
  Award,
  Calendar,
  CheckCircle,
  Truck,
} from 'lucide-react';
import { WeighingRecord } from '../types/weighing';
import { formatNumber, formatRupiah } from '../utils/formatters';

interface DailyStatsProps {
  records: WeighingRecord[];
}

export const DailyStats: React.FC<DailyStatsProps> = ({ records }) => {
  const today = new Date();
  const todayRecords = records.filter((r) => {
    const d = new Date(r.createdAt);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  const todayGross = todayRecords.reduce((acc, r) => acc + (r.gross || 0), 0);
  const todayTare = todayRecords.reduce((acc, r) => acc + (r.tare || 0), 0);
  const todayBruto = todayRecords.reduce((acc, r) => acc + (r.bruto || 0), 0);
  const todayNetto = todayRecords.reduce((acc, r) => acc + (r.netto || 0), 0);
  const todayBayar = todayRecords.reduce((acc, r) => acc + (r.jumlahDibayar || 0), 0);
  const todayRafaksiKg = todayRecords.reduce((acc, r) => acc + (r.rafaksiKg || 0), 0);

  const avgRafaksi =
    todayBruto > 0 ? ((todayRafaksiKg / todayBruto) * 100).toFixed(1) : '0';

  // Supplier frequency
  const supplierCount: Record<string, { count: number; totalNetto: number }> = {};
  records.forEach((r) => {
    const s = r.supplier || 'Umum';
    if (!supplierCount[s]) {
      supplierCount[s] = { count: 0, totalNetto: 0 };
    }
    supplierCount[s].count += 1;
    supplierCount[s].totalNetto += r.netto || 0;
  });

  const topSuppliers = Object.entries(supplierCount)
    .sort((a, b) => b[1].totalNetto - a[1].totalNetto)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* TODAY BANNER */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-700/60 pb-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-300 font-semibold flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> REKAP OPERASIONAL HARI INI
            </span>
            <h2 className="text-2xl font-black mt-1">Ringkasan TBS Masuk</h2>
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-200">Total Pembayaran Hari Ini</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-100">
              {formatRupiah(todayBayar)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-gray-900">
          <div className="bg-white/95 rounded-xl p-3.5 shadow-xs">
            <div className="text-xs font-semibold text-gray-500">Truk Masuk Hari Ini</div>
            <div className="text-xl font-bold font-mono text-gray-900 mt-1">
              {todayRecords.length} <span className="text-xs font-normal text-gray-500">Rit/Truk</span>
            </div>
          </div>

          <div className="bg-white/95 rounded-xl p-3.5 shadow-xs">
            <div className="text-xs font-semibold text-emerald-700">Total Netto Bersih</div>
            <div className="text-xl font-bold font-mono text-emerald-900 mt-1">
              {formatNumber(todayNetto)} <span className="text-xs font-normal text-emerald-700">Kg</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {(todayNetto / 1000).toFixed(2)} Ton
            </div>
          </div>

          <div className="bg-white/95 rounded-xl p-3.5 shadow-xs">
            <div className="text-xs font-semibold text-amber-700">Potongan Rafaksi</div>
            <div className="text-xl font-bold font-mono text-amber-900 mt-1">
              {formatNumber(todayRafaksiKg)} <span className="text-xs font-normal text-amber-700">Kg</span>
            </div>
            <div className="text-[11px] text-amber-600 mt-0.5">Rata-rata: {avgRafaksi}%</div>
          </div>

          <div className="bg-white/95 rounded-xl p-3.5 shadow-xs">
            <div className="text-xs font-semibold text-blue-700">Total Gross Masuk</div>
            <div className="text-xl font-bold font-mono text-blue-900 mt-1">
              {formatNumber(todayGross)} <span className="text-xs font-normal text-blue-700">Kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP SUPPLIERS & ALL-TIME OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Suppliers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5">
          <div className="flex items-center gap-2 text-gray-800 font-bold mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm">Peringkat Supplier Terbanyak (Tonase)</h3>
          </div>

          {topSuppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Belum ada riwayat supplier tercatat.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topSuppliers.map(([supName, val], idx) => (
                <div
                  key={supName}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-gray-900 block">{supName}</span>
                      <span className="text-[10px] text-gray-500">{val.count} kali pengiriman</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-emerald-800">{formatNumber(val.totalNetto)} Kg</span>
                    <span className="block text-[10px] text-gray-400">
                      {(val.totalNetto / 1000).toFixed(2)} Ton
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operational Palm Weight Guide */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5">
          <div className="flex items-center gap-2 text-gray-800 font-bold mb-4">
            <Truck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm">Petunjuk Operasional RAM SAWIT BERKAH JAYA</h3>
          </div>

          <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="font-bold text-emerald-900 block mb-0.5">
                Alur Kerja Penimbangan Cepat:
              </span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Truk datang bermuatan sawit: timbang dan masukkan nilai <strong>GROSS</strong>.</li>
                <li>Setelah buah dibongkar: timbang kembali truk kosong untuk nilai <strong>TARE</strong>.</li>
                <li>Sistem otomatis menghitung <strong>BRUTO = GROSS - TARE</strong>.</li>
                <li>Tentukan potongan <strong>RAFAKSI</strong> (sampah, tangkai panjang, buah mentah).</li>
                <li>Tekan tombol <strong>CETAK NOTA &amp; SIMPAN KE GOOGLE SHEET</strong>.</li>
              </ul>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-900 block mb-0.5">
                Peringatan Legalitas Buah:
              </span>
              <p>
                Sesuai peraturan, RAM SAWIT BERKAH JAYA menegaskan: <strong>KAMI TIDAK MENERIMA BUAH ILEGAL</strong>. Nota timbangan dilengkapi kode QR untuk verifikasi keaslian transaksi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
