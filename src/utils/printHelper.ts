import { WeighingRecord, AppSettings } from '../types/weighing';
import { formatNumber, formatRupiah } from './formatters';
import QRCode from 'qrcode';

export async function generateReceiptHtml(
  record: WeighingRecord,
  settings: AppSettings
): Promise<string> {
  let qrCodeDataUrl = '';
  try {
    const qrText = `RAM SAWIT BERKAH JAYA\nNo Seri: ${record.noSeri}\nNo Polisi: ${record.noPolisi}\nTgl: ${record.tanggalMasuk}\nSupplier: ${record.supplier} (${record.alamatSupplier || '-'})\nNetto: ${record.netto} Kg\nTotal: ${formatRupiah(record.jumlahDibayar)}\nOperator: ${record.namaOperator}\nVERIFIED AUTHENTIC`;
    qrCodeDataUrl = await QRCode.toDataURL(qrText, {
      width: 140,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch (err) {
    console.error('Error generating QR for print:', err);
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Nota Timbangan - ${record.noSeri}</title>
  <style>
    @page {
      size: 210mm 140mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #ffffff;
      color: #000000;
      display: flex;
      justify-content: center;
      padding: 0;
    }
    .nota-card {
      width: 210mm;
      height: 140mm;
      max-height: 140mm;
      padding: 3.5mm 6mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: hidden;
    }
    .header h1 {
      font-size: 16px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 1px;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .header p {
      font-size: 10px;
      font-weight: 500;
      color: #222222;
      line-height: 1.2;
    }
    .divider-solid {
      border-top: 1.5px solid #000000;
      margin: 2.5px 0;
    }
    .divider-thin {
      border-top: 1px solid #000000;
      margin: 2px 0;
    }
    .divider-double {
      border-top: 2.5px double #000000;
      margin: 2.5px 0;
    }
    .meta-table {
      width: 100%;
      font-size: 10.5px;
      margin: 1.5px 0;
      line-height: 1.25;
    }
    .meta-table td {
      vertical-align: top;
      padding: 0.5px 0;
    }
    .title-nota {
      text-align: center;
      font-size: 11px;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 2px 0;
    }
    .weight-table {
      width: 100%;
      margin: 1px 0;
      font-size: 11px;
      padding: 0 4mm;
      line-height: 1.25;
    }
    .weight-table tr td {
      padding: 1px 0;
    }
    .col-label {
      width: 90px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .col-val {
      width: 85px;
      text-align: right;
      font-family: monospace;
      font-size: 12.5px;
      font-weight: 600;
    }
    .col-unit {
      padding-left: 14px;
      font-size: 10.5px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5px 4mm;
      font-size: 11.5px;
      font-weight: bold;
    }
    .total-amount {
      font-size: 14.5px;
      font-family: monospace;
    }
    .sig-section {
      display: flex;
      justify-content: space-between;
      margin-top: 2px;
      padding: 0 4mm;
      font-size: 10px;
    }
    .sig-box-left {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 48px;
    }
    .sig-line {
      border-bottom: 1px solid #000000;
      width: 110px;
    }
    .sig-box-right {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .qr-img {
      width: 44px;
      height: 44px;
      margin: 1px 6px 1px 0;
    }
    .warning-box {
      border: 1px solid #000000;
      max-width: 290px;
      margin: 2px auto 0;
      padding: 1px 6px;
      text-align: center;
    }
    .warning-box .title {
      font-size: 8px;
      font-weight: bold;
      letter-spacing: 0.5px;
      line-height: 1;
    }
    .warning-box .text {
      font-size: 9.5px;
      font-weight: bold;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    @media print {
      body {
        padding: 0;
      }
      .nota-card {
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="nota-card">
    <div>
      <div class="header">
        <h1>${settings.companyName || 'RAM SAWIT BERKAH JAYA'}</h1>
        <p>Alamat: ${settings.companyAddress || 'Desa sukajadi RT 10/RW 03, Kec. Lalan, Musi Banyuasin'}, HP : ${settings.companyPhone || '081355473807'}</p>
      </div>

      <div class="divider-solid"></div>

      <table class="meta-table">
        <tr>
          <td style="width: 75px; font-weight: 500;">No Seri</td>
          <td style="width: 12px;">:</td>
          <td style="font-weight: bold; font-family: monospace;">${record.noSeri}</td>
          <td style="width: 80px; font-weight: 500;">Jam Masuk</td>
          <td style="width: 12px;">:</td>
          <td>${record.jamMasuk || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: 500;">No Polisi</td>
          <td>:</td>
          <td style="font-weight: bold;">${record.noPolisi || '-'}</td>
          <td style="font-weight: 500;">Jam Keluar</td>
          <td>:</td>
          <td>${record.jamKeluar || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: 500;">Tgl Masuk</td>
          <td>:</td>
          <td colspan="4">${record.tanggalMasuk}</td>
        </tr>
        <tr>
          <td style="font-weight: 500;">Supplier</td>
          <td>:</td>
          <td colspan="4" style="font-weight: bold;">${record.supplier}</td>
        </tr>
        <tr>
          <td style="font-weight: 500;">Alamat</td>
          <td>:</td>
          <td colspan="4">${record.alamatSupplier || '-'}</td>
        </tr>
      </table>

      <div class="divider-thin"></div>

      <div class="title-nota">NOTA TIMBANGAN</div>

      <table class="weight-table">
        <tr>
          <td class="col-label">GROSS</td>
          <td class="col-val">${formatNumber(record.gross)}</td>
          <td class="col-unit">Kg</td>
        </tr>
        <tr>
          <td class="col-label">TARE</td>
          <td class="col-val">${formatNumber(record.tare)}</td>
          <td class="col-unit">Kg</td>
        </tr>
        <tr>
          <td class="col-label">BRUTO</td>
          <td class="col-val">${formatNumber(record.bruto)}</td>
          <td class="col-unit"></td>
        </tr>
        <tr>
          <td class="col-label">RAFAKSI</td>
          <td class="col-val">${formatNumber(record.rafaksiKg)}</td>
          <td class="col-unit">${record.rafaksiPersen > 0 ? record.rafaksiPersen + '%' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">NETTO</td>
          <td class="col-val" style="font-weight: bold;">${formatNumber(record.netto)}</td>
          <td class="col-unit" style="font-weight: bold;">Harga : ${formatRupiah(record.hargaPerKg)}</td>
        </tr>
      </table>

      <div class="divider-thin"></div>

      <div class="total-row">
        <span>Jumlah yang dibayar</span>
        <span class="total-amount">${formatRupiah(record.jumlahDibayar)}</span>
      </div>

      <div class="divider-double"></div>

      <div class="sig-section">
        <div class="sig-box-left">
          <div style="font-weight: bold;">SOPIR</div>
          <div class="sig-line"></div>
        </div>

        <div class="sig-box-right">
          <div style="font-weight: bold; margin-right: 6px;">OPERATOR</div>
          ${
            qrCodeDataUrl
              ? `<img src="${qrCodeDataUrl}" alt="QR" class="qr-img" />`
              : `<div style="width: 44px; height: 44px; border: 1px solid #ccc; margin-right: 6px;"></div>`
          }
          <div style="font-weight: bold; text-transform: uppercase; margin-right: 6px;">${record.namaOperator || 'YUNUS'}</div>
        </div>
      </div>

      <div class="warning-box" style="margin-top: 8px;">
        <div class="title">PERHATIAN :</div>
        <div class="text">${settings.warningNote || 'KAMI TIDAK MENERIMA BUAH ILEGAL'}</div>
      </div>
    </div>
  </div>

  <div class="action-bar" style="position: fixed; top: 0; left: 0; right: 0; background: #064e3b; color: white; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.25); z-index: 9999;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-weight: bold; font-size: 14px;">🖨️ Nota Timbangan ${record.noSeri}</span>
      <span style="background: #047857; font-size: 11px; padding: 2px 8px; border-radius: 999px;">21 cm &times; 14 cm</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="downloadAsJpg()" style="background: #f59e0b; color: #1c1917; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
        🖼️ Unduh JPG
      </button>
      <button onclick="window.print()" style="background: #10b981; color: white; border: none; padding: 6px 16px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
        🖨️ Cetak / Print Preview
      </button>
      <button onclick="window.close()" style="background: #374151; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 13px; cursor: pointer;">
        ✖ Tutup
      </button>
    </div>
  </div>

  <style>
    @media screen {
      body {
        background: #f1f5f9;
        padding-top: 55px;
      }
      .nota-card {
        background: #ffffff;
        box-shadow: 0 4px 15px rgba(0,0,0,0.12);
        margin: 12px auto;
        border: 1px solid #cbd5e1;
      }
    }
    @media print {
      .action-bar {
        display: none !important;
      }
      body {
        background: #ffffff;
        padding-top: 0;
      }
      .nota-card {
        box-shadow: none;
        border: none;
        margin: 0;
      }
    }
  </style>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script>
    function downloadAsJpg() {
      var card = document.querySelector('.nota-card');
      if (!card) return;
      if (typeof html2canvas === 'undefined') {
        alert('Sedang memuat library gambar, silakan klik lagi dalam 1 detik.');
        return;
      }
      html2canvas(card, { scale: 2.5, backgroundColor: '#ffffff', useCORS: true }).then(function(canvas) {
        var link = document.createElement('a');
        link.download = 'Nota_${record.noSeri.replace(/[/\\?%*:|"<>]/g, '_')}_${record.supplier.replace(/\s+/g, '_')}.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    window.onload = function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error(e);
        }
      }, 300);
    };
  </script>
</body>
</html>`;
}

/**
 * Robust print helper:
 * 1. Tries hidden iframe print inside same origin
 * 2. Falls back to window.print()
 */
export async function executePrint(
  record: WeighingRecord,
  settings: AppSettings
): Promise<boolean> {
  try {
    const htmlContent = await generateReceiptHtml(record, settings);

    // Create or reuse hidden iframe
    let printIframe = document.getElementById('receipt-print-frame') as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'receipt-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0px';
      printIframe.style.height = '0px';
      printIframe.style.border = 'none';
      document.body.appendChild(printIframe);
    }

    const doc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          printIframe?.contentWindow?.focus();
          printIframe?.contentWindow?.print();
        } catch (iframeErr) {
          console.warn('Iframe print error, falling back to window.print()', iframeErr);
          window.print();
        }
      }, 350);
      return true;
    } else {
      window.print();
      return true;
    }
  } catch (err) {
    console.warn('executePrint error, falling back to direct window.print()', err);
    window.print();
    return true;
  }
}

/**
 * Open standalone print window in new tab and triggers immediate print preview!
 */
export async function openPrintTab(
  record: WeighingRecord,
  settings: AppSettings
): Promise<boolean> {
  let targetWin: Window | null = null;
  try {
    targetWin = window.open('', '_blank');
    if (targetWin) {
      targetWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Memuat Nota ${record.noSeri}...</title>
            <style>
              body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
              .loader { text-align: center; }
              .spinner { width: 36px; height: 36px; border: 3px solid #cbd5e1; border-top-color: #059669; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="loader">
              <div class="spinner"></div>
              <p style="font-weight: 600;">Menyiapkan Nota &amp; Dialog Print Preview...</p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (e) {
    console.warn('Direct window.open blocked, will use blob fallback', e);
  }

  const htmlContent = await generateReceiptHtml(record, settings);

  if (targetWin && !targetWin.closed) {
    try {
      targetWin.document.open();
      targetWin.document.write(htmlContent);
      targetWin.document.close();
      return true;
    } catch (writeErr) {
      console.warn('targetWin write error, fallback to blob:', writeErr);
    }
  }

  // Blob fallback if window.open was blocked or failed
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (e) {}
    }, 4000);
    return true;
  } catch (fallbackErr) {
    console.warn('Blob fallback error, executing standard print:', fallbackErr);
    return executePrint(record, settings);
  }
}
