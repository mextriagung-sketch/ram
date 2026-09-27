import { toJpeg } from 'html-to-image';
import QRCode from 'qrcode';
import { WeighingRecord, AppSettings } from '../types/weighing';

export async function downloadReceiptAsJpg(
  record: WeighingRecord,
  settings: AppSettings,
  element?: HTMLElement | null
): Promise<void> {
  let targetElement = element;
  let tempWrapper: HTMLDivElement | null = null;

  try {
    // If no existing DOM element is provided, generate a clean temporary one
    if (!targetElement) {
      tempWrapper = document.createElement('div');
      tempWrapper.style.position = 'fixed';
      tempWrapper.style.left = '-9999px';
      tempWrapper.style.top = '0';
      tempWrapper.style.width = '210mm';
      tempWrapper.style.height = '140mm';
      tempWrapper.style.background = '#ffffff';
      tempWrapper.style.zIndex = '-1000';
      tempWrapper.style.boxSizing = 'border-box';
      tempWrapper.style.padding = '12px 20px';
      tempWrapper.style.fontFamily = 'Arial, sans-serif';
      tempWrapper.style.color = '#000000';

      let qrDataUrl = '';
      try {
        const qrPayload = `RAM SAWIT BERKAH JAYA\nNo Seri: ${record.noSeri}\nTanggal: ${record.tanggalMasuk}\nSupplier: ${record.supplier}\nNetto: ${record.netto} Kg\nTotal: Rp ${record.jumlahDibayar.toLocaleString('id-ID')}\nOperator: ${record.namaOperator || 'YUNUS'}`;
        qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 120, margin: 1 });
      } catch (e) {
        console.warn('QR generation error', e);
      }

      const formatNum = (n: number) => n.toLocaleString('id-ID');
      const formatRp = (n: number) =>
        new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(n);

      tempWrapper.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; box-sizing: border-box;">
          <div>
            <h1 style="font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 0 0 2px 0; letter-spacing: 0.5px;">${settings.companyName || 'RAM SAWIT BERKAH JAYA'}</h1>
            <p style="font-size: 10px; font-weight: 500; margin: 0; color: #222;">Alamat: ${settings.companyAddress || 'Desa sukajadi RT 10/RW 03, Kec. Lalan, Musi Banyuasin'}, HP : ${settings.companyPhone || '081355473807'}</p>
          </div>
          <div style="border-top: 1.5px solid #000; margin: 4px 0;"></div>
          <table style="width: 100%; font-size: 10.5px; line-height: 1.3; margin: 2px 0;">
            <tr>
              <td style="width: 75px; font-weight: 500;">No Seri</td><td style="width: 12px;">:</td><td style="font-weight: bold; font-family: monospace;">${record.noSeri}</td>
              <td style="width: 80px; font-weight: 500;">Jam Masuk</td><td style="width: 12px;">:</td><td>${record.jamMasuk || '-'}</td>
            </tr>
            <tr>
              <td style="font-weight: 500;">No Polisi</td><td>:</td><td style="font-weight: bold; font-family: monospace;">${record.noPolisi || '-'}</td>
              <td style="font-weight: 500;">Jam Keluar</td><td>:</td><td>${record.jamKeluar || '-'}</td>
            </tr>
            <tr>
              <td style="font-weight: 500;">Tgl Masuk</td><td>:</td><td>${record.tanggalMasuk}</td>
              <td colspan="3"></td>
            </tr>
            <tr>
              <td style="font-weight: 500;">Supplier</td><td>:</td><td style="font-weight: bold;">${record.supplier}</td>
              <td colspan="3"></td>
            </tr>
            <tr>
              <td style="font-weight: 500;">Alamat</td><td>:</td><td>${record.alamatSupplier || '-'}</td>
              <td colspan="3"></td>
            </tr>
          </table>
          <div style="border-top: 1px solid #000; margin: 3px 0;"></div>
          <div style="text-align: center; font-size: 11px; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin: 2px 0;">NOTA TIMBANGAN</div>
          <table style="width: 100%; font-size: 11px; padding: 0 15px; margin: 2px 0; line-height: 1.35;">
            <tr>
              <td style="width: 90px; font-weight: bold;">GROSS</td><td style="width: 85px; text-align: right; font-family: monospace; font-size: 12.5px; font-weight: 600;">${formatNum(record.gross)}</td><td style="padding-left: 14px;">Kg</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">TARE</td><td style="text-align: right; font-family: monospace; font-size: 12.5px; font-weight: 600;">${formatNum(record.tare)}</td><td style="padding-left: 14px;">Kg</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">BRUTO</td><td style="text-align: right; font-family: monospace; font-size: 12.5px; font-weight: 600;">${formatNum(record.bruto)}</td><td style="padding-left: 14px; opacity: 0;">Kg</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">RAFAKSI</td><td style="text-align: right; font-family: monospace; font-size: 12.5px; font-weight: 600;">${formatNum(record.rafaksiKg)}</td><td style="padding-left: 14px;">${record.rafaksiPersen > 0 ? `${record.rafaksiPersen}%` : ''}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">NETTO</td><td style="text-align: right; font-family: monospace; font-size: 13px; font-weight: bold;">${formatNum(record.netto)}</td><td style="padding-left: 14px; font-weight: bold;">Harga : ${formatRp(record.hargaPerKg)}</td>
            </tr>
          </table>
          <div style="border-top: 1px solid #000; margin: 3px 0;"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 2px 15px; font-size: 12px; font-weight: bold;">
            <span>Jumlah yang dibayar</span>
            <span style="font-size: 15px; font-family: monospace;">${formatRp(record.jumlahDibayar)}</span>
          </div>
          <div style="border-top: 2.5px double #000; margin: 3px 0;"></div>
          <div style="display: flex; justify-content: space-between; padding: 0 15px; margin-top: 3px; font-size: 10px;">
            <div style="display: flex; flex-direction: column; justify-content: space-between; height: 48px;">
              <span style="font-weight: bold;">SOPIR</span>
              <div style="border-bottom: 1px solid #000; width: 110px;"></div>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
              <div style="font-weight: bold; margin-right: 6px;">OPERATOR</div>
              ${qrDataUrl ? `<img src="${qrDataUrl}" style="width: 44px; height: 44px; margin: 1px 6px 1px 0;" />` : ''}
              <div style="font-weight: bold; text-transform: uppercase; margin-right: 6px;">${record.namaOperator || 'YUNUS'}</div>
            </div>
          </div>
          <div style="border: 1px solid #000; max-width: 290px; margin: 6px auto 0; padding: 2px 8px; text-align: center;">
            <div style="font-size: 8px; font-weight: bold; letter-spacing: 0.5px;">PERHATIAN :</div>
            <div style="font-size: 9.5px; font-weight: bold; letter-spacing: 0.5px;">${settings.warningNote || 'KAMI TIDAK MENERIMA BUAH ILEGAL'}</div>
          </div>
        </div>
      `;

      document.body.appendChild(tempWrapper);
      targetElement = tempWrapper;
    }

    // High quality JPEG rendering (pixelRatio: 2.5 for crisp text on phones/screens)
    const dataUrl = await toJpeg(targetElement, {
      quality: 0.95,
      backgroundColor: '#ffffff',
      pixelRatio: 2.5,
      cacheBust: true,
    });

    const safeNoSeri = record.noSeri.replace(/[/\\?%*:|"<>]/g, '_');
    const fileName = `Nota_${safeNoSeri}_${record.supplier.replace(/\s+/g, '_')}.jpg`;

    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } finally {
    if (tempWrapper && tempWrapper.parentNode) {
      tempWrapper.parentNode.removeChild(tempWrapper);
    }
  }
}
