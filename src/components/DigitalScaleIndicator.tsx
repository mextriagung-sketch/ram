import React, { useState } from 'react';
import {
  Cable,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  PowerOff,
  Sliders,
  ArrowDownToLine,
  HelpCircle,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { UseSerialScaleReturn } from '../hooks/useSerialScale';

interface DigitalScaleIndicatorProps {
  scale: UseSerialScaleReturn;
  onApplyGross: (weight: number) => void;
  onApplyTare: (weight: number) => void;
}

export const DigitalScaleIndicator: React.FC<DigitalScaleIndicatorProps> = ({
  scale,
  onApplyGross,
  onApplyTare,
}) => {
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const {
    isSupported,
    isIframe,
    isConnected,
    currentWeight,
    rawString,
    isStable,
    statusText,
    error,
    baudRate,
    setBaudRate,
    connectScale,
    disconnectScale,
    openInStandaloneTab,
  } = scale;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-md text-white mb-6">
      {/* Top Bar */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <Cable className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-slate-100">
                INDIKATOR TIMBANGAN DIGITAL (RS-232 / USB)
              </span>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  TERHUBUNG
                </span>
              ) : (
                <span className="text-[11px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  OFFLINE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {statusText}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition"
            title="Petunjuk Penyambungan Kabel"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition"
            title="Pengaturan Port / Baud Rate"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Setelan ({baudRate})</span>
          </button>

          {!isConnected ? (
            <button
              type="button"
              onClick={connectScale}
              disabled={!isSupported}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm ${
                isSupported
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Power className="w-3.5 h-3.5 text-emerald-200" />
              <span>Sambungkan Timbangan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={disconnectScale}
              className="text-xs font-semibold bg-rose-600/80 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <PowerOff className="w-3.5 h-3.5" />
              <span>Putus</span>
            </button>
          )}
        </div>
      </div>

      {/* Iframe Notice Banner (Web Serial requires top-level window in Chrome) */}
      {isIframe && (
        <div className="bg-sky-950/80 border-b border-sky-700/60 p-3 px-4 text-xs text-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block sm:inline font-semibold">
                Perhatian Port USB/Serial:
              </strong>{' '}
              Browser Chrome melarang akses kabel serial di dalam panel pratinjau tertanam (*iframe*). Klik tombol di samping untuk membuka aplikasi di tab penuh agar port timbangan bisa dipilih!
            </div>
          </div>
          <button
            type="button"
            onClick={openInStandaloneTab}
            className="self-start sm:self-auto shrink-0 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka di Tab Baru</span>
          </button>
        </div>
      )}

      {/* Browser Warning if not supported */}
      {!isSupported && (
        <div className="bg-amber-950/50 border-b border-amber-800/60 p-3 px-4 text-xs text-amber-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Fitur Web Serial memerlukan browser Chrome atau Edge di Laptop/Komputer:</strong> Jika Anda membuka dari HP Android/iPhone, gunakan pengisian angka manual atau sambungkan kabel ke laptop timbangan.
          </div>
        </div>
      )}

      {/* Error alert with Action */}
      {error && (
        <div className="bg-rose-950/70 border-b border-rose-800/70 p-3 px-4 text-xs text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          {isIframe && (
            <button
              type="button"
              onClick={openInStandaloneTab}
              className="self-start sm:self-auto shrink-0 bg-rose-500 hover:bg-rose-400 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Tab Baru Sekarang</span>
            </button>
          )}
        </div>
      )}

      {/* Config Drawer */}
      {showConfig && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Baud Rate (Kecepatan Serial):</span>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={isConnected}
              className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="1200">1200 bps</option>
              <option value="2400">2400 bps</option>
              <option value="4800">4800 bps</option>
              <option value="9600">9600 bps (Standar Yaohua/A12E/MK)</option>
              <option value="19200">19200 bps</option>
              <option value="115200">115200 bps</option>
            </select>
          </div>
          <span className="text-slate-500 text-[11px]">
            *Umumnya indikator Yaohua / MK-Cells / CAS menggunakan 9600 atau 2400 atau 4800.
          </span>
        </div>
      )}

      {/* Guide / Help Drawer */}
      {showHelp && (
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="font-bold text-emerald-400">💡 Panduan Menghubungkan Indikator Timbangan:</p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300">
            <li>Gunakan kabel <strong>RS-232 to USB</strong> dari lubang port di belakang timbangan ke colokan USB Laptop/PC.</li>
            <li>Klik tombol hijau <strong>"Sambungkan Timbangan"</strong> di atas.</li>
            <li>Browser Chrome/Edge akan memunculkan jendela pop-up daftar port (contoh: <em>USB-Serial Controller</em> atau <em>COM3/COM4</em>).</li>
            <li>Pilih port tersebut lalu klik <strong>"Connect"</strong>.</li>
            <li>Angka timbangan akan langsung tampil di layar hijau di bawah ini secara real-time!</li>
          </ol>
        </div>
      )}

      {/* Live Digital Display & Capture Buttons */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Seven Segment LED Style Display */}
        <div className="flex-1 bg-black rounded-lg border-2 border-slate-700 p-4 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className={`text-[10px] uppercase font-bold tracking-widest ${isStable ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isConnected ? (isStable ? 'STABIL' : 'GERAK...') : 'OFF'}
              </span>
              <Activity className={`w-4 h-4 mt-0.5 ${isConnected ? (isStable ? 'text-emerald-400' : 'text-amber-400 animate-pulse') : 'text-slate-600'}`} />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl sm:text-5xl font-black tracking-wider text-emerald-400 select-all drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                {isConnected && currentWeight !== null
                  ? currentWeight.toLocaleString('id-ID')
                  : '------'}
              </span>
              <span className="font-mono text-xl font-bold text-emerald-500">KG</span>
            </div>
          </div>

          {/* Raw string telemetry for debugging */}
          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="block text-[10px] text-slate-500 font-mono">Data Serial Masuk:</span>
            <span className="font-mono text-[11px] text-slate-300 truncate max-w-[200px] inline-block">
              {rawString ? rawString : '(Menunggu sinyal RS232...)'}
            </span>
          </div>
        </div>

        {/* Quick Insert Buttons into Gross and Tare */}
        <div className="flex flex-row md:flex-col gap-2 shrink-0">
          <button
            type="button"
            disabled={!isConnected || currentWeight === null}
            onClick={() => {
              if (currentWeight !== null) {
                onApplyGross(currentWeight);
              }
            }}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${
              isConnected && currentWeight !== null
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
            title="Masukkan angka timbangan saat ini ke kolom GROSS (Truk + Isi)"
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-300" />
            <span>Kunci ke GROSS (Isi)</span>
          </button>

          <button
            type="button"
            disabled={!isConnected || currentWeight === null}
            onClick={() => {
              if (currentWeight !== null) {
                onApplyTare(currentWeight);
              }
            }}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${
              isConnected && currentWeight !== null
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
            title="Masukkan angka timbangan saat ini ke kolom TARE (Truk Kosong)"
          >
            <ArrowDownToLine className="w-4 h-4 text-amber-300" />
            <span>Kunci ke TARE (Tara)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
