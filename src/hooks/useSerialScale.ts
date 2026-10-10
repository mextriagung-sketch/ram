/**
 * Hook to manage connection to Digital Weighing Scale via Web Serial API (RS-232 / USB)
 * Compatible with Chrome, Edge, Opera on desktop/laptop.
 * Common indicators: Yaohua (XK3190-A12E, A9), MK-Cells, CAS CI-series, Sonic, Gedge, Avery, etc.
 */
import { useState, useRef, useEffect, useCallback } from 'react';

export interface SerialScaleConfig {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
}

export interface UseSerialScaleReturn {
  isSupported: boolean;
  isIframe: boolean;
  isConnected: boolean;
  currentWeight: number | null;
  rawString: string;
  isStable: boolean;
  statusText: string;
  error: string | null;
  baudRate: number;
  setBaudRate: (rate: number) => void;
  connectScale: () => Promise<void>;
  disconnectScale: () => Promise<void>;
  openInStandaloneTab: () => void;
}

export function parseWeightFromRawData(text: string): { weight: number | null; isStable: boolean } {
  if (!text) return { weight: null, isStable: false };

  // Check for common stability indicators: 'ST' or 'US' or 'S'
  const isStable = /ST|STABLE|S(?=[,\s])/i.test(text) || !/US|UNSTABLE/i.test(text);

  // Clean and find numeric sequences (support format like +002500, = 2500, ST,GS,+  2500 kg, ww002500kg, etc.)
  // Look for sequences with digits, optionally decimal point, and optional leading +/-
  const matches = text.match(/([+-]?\s*\d+(?:\.\d+)?)/g);
  if (matches && matches.length > 0) {
    // Usually the last or largest numeric token is the main weight
    // Pick the most plausible weight candidate (often between 0 and 100,000 kg)
    for (let i = matches.length - 1; i >= 0; i--) {
      const cleaned = matches[i].replace(/\s+/g, '');
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num >= -1000 && num <= 150000) {
        return { weight: Math.round(num * 100) / 100, isStable };
      }
    }
  }

  return { weight: null, isStable: false };
}

export function useSerialScale(): UseSerialScaleReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isIframe, setIsIframe] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [rawString, setRawString] = useState<string>('');
  const [isStable, setIsStable] = useState<boolean>(true);
  const [statusText, setStatusText] = useState<string>('Siap terhubung');
  const [error, setError] = useState<string | null>(null);
  const [baudRate, setBaudRate] = useState<number>(9600);

  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const keepReadingRef = useRef<boolean>(false);
  const bufferRef = useRef<string>('');

  useEffect(() => {
    // Check if running inside an iframe (like AI Studio preview pane)
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    setIsIframe(inIframe);

    // Check if Web Serial API is supported in current browser
    if (typeof window !== 'undefined' && 'serial' in navigator) {
      setIsSupported(true);
      if (inIframe) {
        setStatusText('Timbangan siap. Buka di Tab Baru browser untuk menghubungkan kabel.');
      }
    } else {
      setIsSupported(false);
      setStatusText('Browser tidak mendukung Web Serial (Gunakan Google Chrome atau Microsoft Edge di PC/Laptop)');
    }

    return () => {
      // Disconnect on unmount
      keepReadingRef.current = false;
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {});
      }
      if (portRef.current) {
        portRef.current.close().catch(() => {});
      }
    };
  }, []);

  const openInStandaloneTab = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  }, []);

  const disconnectScale = useCallback(async () => {
    keepReadingRef.current = false;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (e: any) {
      console.warn('Disconnect error:', e);
    } finally {
      setIsConnected(false);
      setStatusText('Timbangan terputus');
      setCurrentWeight(null);
      setRawString('');
    }
  }, []);

  const connectScale = useCallback(async () => {
    setError(null);
    if (!('serial' in navigator)) {
      setError('Browser ini tidak mendukung Web Serial API. Mohon gunakan Google Chrome atau MS Edge di PC / Laptop.');
      return;
    }

    try {
      setStatusText('Memilih port timbangan...');
      // Request serial port prompt from browser
      const nav: any = navigator;
      const port = await nav.serial.requestPort();
      
      setStatusText(`Membuka koneksi (${baudRate} bps)...`);
      await port.open({
        baudRate: baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        bufferSize: 1024,
      });

      portRef.current = port;
      setIsConnected(true);
      setStatusText(`Terhubung ke Timbangan (${baudRate} bps)`);
      keepReadingRef.current = true;
      bufferRef.current = '';

      // Listen for data
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable).catch(() => {});
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      const readLoop = async () => {
        while (keepReadingRef.current) {
          try {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              bufferRef.current += value;
              // Indicators usually send data terminated by \r, \n, \r\n or STX/ETX
              if (bufferRef.current.includes('\n') || bufferRef.current.includes('\r')) {
                const lines = bufferRef.current.split(/[\r\n]+/);
                // Keep the last partial token in buffer
                bufferRef.current = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.length > 0) {
                    setRawString(trimmed);
                    const parsed = parseWeightFromRawData(trimmed);
                    if (parsed.weight !== null) {
                      setCurrentWeight(parsed.weight);
                      setIsStable(parsed.isStable);
                    }
                  }
                }
              }
            }
          } catch (readErr: any) {
            console.error('Serial read loop error:', readErr);
            break;
          }
        }
      };

      readLoop();
    } catch (err: any) {
      console.error('Gagal menghubungkan timbangan:', err);
      if (err.name === 'NotFoundError') {
        setStatusText('Pemilihan port dibatalkan.');
      } else if (
        (err.message && err.message.toLowerCase().includes('permissions policy')) ||
        (err.name && err.name === 'SecurityError')
      ) {
        setError(
          'Akses port USB/Serial tidak diizinkan di dalam bingkai pratinjau (iframe). Silakan buka aplikasi di TAB BROWSER BARU dengan menekan tombol "Buka di Tab Baru" di atas!'
        );
        setStatusText('Izin Serial dibatasi di dalam bingkai pratinjau');
      } else {
        setError(`Gagal terhubung: ${err.message || 'Periksa kabel USB/Serial'}`);
        setStatusText('Gagal terhubung');
      }
      setIsConnected(false);
    }
  }, [baudRate]);

  return {
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
  };
}
