import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { WeighingRecord, AppSettings } from '../types/weighing';
import { formatNumber, formatRupiah } from '../utils/formatters';

interface ReceiptPrintProps {
  record: WeighingRecord;
  settings: AppSettings;
  className?: string;
  isPrintMode?: boolean;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({
  record,
  settings,
  className = '',
  isPrintMode = false,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR code containing the verification text
    const qrText = `RAM SAWIT BERKAH JAYA\nNo Seri: ${record.noSeri}\nNo Polisi: ${record.noPolisi}\nTgl: ${record.tanggalMasuk}\nSupplier: ${record.supplier} (${record.alamatSupplier || '-'})\nNetto: ${record.netto} Kg\nTotal: ${formatRupiah(record.jumlahDibayar)}\nOperator: ${record.namaOperator}\nVERIFIED AUTHENTIC`;
    QRCode.toDataURL(qrText, {
      width: 140,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [record]);

  return (
    <div
      className={`receipt-container bg-white text-black font-sans leading-tight p-4 select-text ${
        isPrintMode ? 'print-page' : 'shadow-xl border border-gray-300 rounded-sm'
      } ${className}`}
      style={{
        width: '210mm',
        height: '140mm',
        minHeight: '140mm',
        maxHeight: '140mm',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      <div>
        {/* KOP NOTA */}
        <div className="kop-nota mb-1 text-left">
          <h1 className="text-lg font-extrabold tracking-tight text-black uppercase font-sans leading-tight">
            {settings.companyName || 'RAM SAWIT BERKAH JAYA'}
          </h1>
          <p className="text-[10px] font-medium text-gray-900 tracking-tight font-sans leading-tight">
            Alamat: {settings.companyAddress || 'Desa sukajadi RT 10/RW 03, Kec. Lalan, Musi Banyuasin'}, HP : {settings.companyPhone || '081355473807'}
          </p>
        </div>

        {/* TOP DIVIDER GARIS PEMBATAS KOP */}
        <div className="border-t-[1.5px] border-black my-1"></div>

        {/* METADATA SECTION */}
        <div className="grid grid-cols-12 text-[11px] gap-x-2 my-1 text-gray-900 leading-snug">
          {/* Left Column */}
          <div className="col-span-7 space-y-0.5">
            <div className="flex">
              <span className="w-20 inline-block font-medium">No Seri</span>
              <span className="w-3">:</span>
              <span className="font-bold font-mono">{record.noSeri}</span>
            </div>
            <div className="flex">
              <span className="w-20 inline-block font-medium">No Polisi</span>
              <span className="w-3">:</span>
              <span className="font-semibold">{record.noPolisi || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-20 inline-block font-medium">Tgl Masuk</span>
              <span className="w-3">:</span>
              <span>{record.tanggalMasuk}</span>
            </div>
            <div className="flex">
              <span className="w-20 inline-block font-medium">Supplier</span>
              <span className="w-3">:</span>
              <span className="font-semibold">{record.supplier}</span>
            </div>
            <div className="flex">
              <span className="w-20 inline-block font-medium">Alamat</span>
              <span className="w-3">:</span>
              <span>{record.alamatSupplier || '-'}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-5 space-y-0.5 pl-2">
            <div className="flex">
              <span className="w-22 inline-block font-medium">Jam Masuk</span>
              <span className="w-3">:</span>
              <span>{record.jamMasuk || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-22 inline-block font-medium">Jam Keluar</span>
              <span className="w-3">:</span>
              <span>{record.jamKeluar || '-'}</span>
            </div>
          </div>
        </div>

        {/* SECOND DIVIDER */}
        <div className="border-t border-black my-1"></div>

        {/* NOTA TIMBANGAN TITLE */}
        <div className="text-center my-1">
          <span className="font-bold text-xs underline tracking-wider uppercase">
            NOTA TIMBANGAN
          </span>
        </div>

        {/* TABLE OF WEIGHING */}
        <div className="px-4 py-0.5">
          <div className="space-y-0.5 text-xs text-gray-900 leading-snug">
            {/* GROSS */}
            <div className="flex items-center">
              <span className="w-28 font-bold tracking-wide">GROSS</span>
              <span className="w-24 text-right font-mono font-medium text-sm">
                {formatNumber(record.gross)}
              </span>
              <span className="ml-4 text-xs font-medium">Kg</span>
            </div>

            {/* TARE */}
            <div className="flex items-center">
              <span className="w-28 font-bold tracking-wide">TARE</span>
              <span className="w-24 text-right font-mono font-medium text-sm">
                {formatNumber(record.tare)}
              </span>
              <span className="ml-4 text-xs font-medium">Kg</span>
            </div>

            {/* BRUTO */}
            <div className="flex items-center">
              <span className="w-28 font-bold tracking-wide">BRUTO</span>
              <span className="w-24 text-right font-mono font-medium text-sm">
                {formatNumber(record.bruto)}
              </span>
              <span className="ml-4 text-xs font-medium opacity-0">Kg</span>
            </div>

            {/* RAFAKSI */}
            <div className="flex items-center">
              <span className="w-28 font-bold tracking-wide">RAFAKSI</span>
              <span className="w-24 text-right font-mono font-medium text-sm">
                {formatNumber(record.rafaksiKg)}
              </span>
              <span className="ml-4 text-xs font-medium">
                {record.rafaksiPersen > 0 ? `${record.rafaksiPersen}%` : ''}
              </span>
            </div>

            {/* NETTO */}
            <div className="flex items-center">
              <span className="w-28 font-bold tracking-wide">NETTO</span>
              <span className="w-24 text-right font-mono font-bold text-sm">
                {formatNumber(record.netto)}
              </span>
              <div className="ml-8 text-xs font-bold">
                Harga : {formatRupiah(record.hargaPerKg)}
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER BEFORE TOTAL */}
        <div className="border-t border-black my-1"></div>

        {/* JUMLAH YANG DIBAYAR */}
        <div className="flex justify-between items-center py-0.5 px-4 text-xs font-bold text-gray-900">
          <span className="tracking-wide">Jumlah yang dibayar</span>
          <span className="text-base font-mono tracking-tight">
            {formatRupiah(record.jumlahDibayar)}
          </span>
        </div>

        {/* DOUBLE DIVIDER */}
        <div className="border-b-[2.5px] border-double border-black my-1"></div>

        {/* SIGNATURE SECTION */}
        <div className="grid grid-cols-2 mt-1 px-4 text-xs">
          {/* Driver Signature */}
          <div className="flex flex-col justify-between h-14">
            <span className="font-bold tracking-wider text-[11px]">SOPIR</span>
            <div className="border-b border-black w-28 mb-1"></div>
          </div>

          {/* Operator Signature with QR Code */}
          <div className="flex flex-col items-end text-right">
            <span className="font-bold tracking-wider text-[11px] mb-0.5 pr-2">OPERATOR</span>
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code Validasi"
                className="w-11 h-11 object-contain border border-gray-300 p-0.5 mr-2"
              />
            ) : (
              <div className="w-11 h-11 bg-gray-100 flex items-center justify-center text-[8px] mr-2 border">
                QR
              </div>
            )}
            <span className="font-bold text-xs tracking-wider uppercase mt-0.5 pr-2">
              {record.namaOperator || 'YUNUS'}
            </span>
          </div>
        </div>

        {/* WARNING FOOTER BOX (DINAIKKAN TEPAT DI BAWAH TANDA TANGAN) */}
        <div className="mt-2.5">
          <div className="border border-black max-w-xs mx-auto py-0.5 px-3 text-center">
            <div className="text-[8px] font-bold tracking-wider text-gray-700 leading-none">
              PERHATIAN :
            </div>
            <div className="text-[9.5px] font-bold tracking-wide text-black leading-tight">
              {settings.warningNote || 'KAMI TIDAK MENERIMA BUAH ILEGAL'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
