import { WeighingRecord } from '../types/weighing';

export const APPS_SCRIPT_TEMPLATE = `/**
 * ====================================================================
 * SKRIP GOOGLE APPS SCRIPT: SISTEM TIMBANGAN RAM SAWIT BERKAH JAYA
 * Lokasi: Desa Sukajadi RT 10/RW 03, Kec. Lalan, Musi Banyuasin
 * HP: 081355473807
 * ====================================================================
 */

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    var headers = [
      "No Seri",
      "No Polisi",
      "Tanggal Masuk",
      "Jam Masuk",
      "Jam Keluar",
      "Supplier",
      "Alamat / Asal",
      "Gross (Kg)",
      "Tare (Kg)",
      "Bruto (Kg)",
      "Rafaksi (%)",
      "Rafaksi (Kg)",
      "Netto (Kg)",
      "Harga/Kg (Rp)",
      "Jumlah Dibayar (Rp)",
      "Operator",
      "Waktu Pencatatan"
    ];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#15803d");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
}

function doPost(e) {
  return handleDataSave(e);
}

function doGet(e) {
  if (e && e.parameter && (e.parameter.data || e.parameter.noSeri)) {
    return handleDataSave(e);
  }
  setupSheet();
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script RAM SAWIT BERKAH JAYA Siap Menerima Data!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleDataSave(e) {
  try {
    setupSheet();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      if (e.parameter.data) {
        try {
          data = JSON.parse(e.parameter.data);
        } catch (err) {
          data = e.parameter;
        }
      } else {
        data = e.parameter;
      }
    }
    
    var row = [
      data.noSeri || "",
      data.noPolisi || "",
      data.tanggalMasuk || "",
      data.jamMasuk || "",
      data.jamKeluar || "",
      data.supplier || "",
      data.alamatSupplier || data.alamat || "",
      Number(data.gross || 0),
      Number(data.tare || 0),
      Number(data.bruto || 0),
      Number(data.rafaksiPersen || 0),
      Number(data.rafaksiKg || 0),
      Number(data.netto || 0),
      Number(data.hargaPerKg || 0),
      Number(data.jumlahDibayar || 0),
      data.namaOperator || "YUNUS",
      new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    ];
    
    sheet.appendRow(row);
    
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 8, 1, 6).setNumberFormat("#,##0");
    sheet.getRange(lastRow, 14, 1, 2).setNumberFormat('"Rp"#,##0');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data penimbangan berhasil disimpan ke Google Sheet",
      rowNumber: lastRow,
      noSeri: data.noSeri
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

function sendViaHiddenForm(url: string, payload: Record<string, any>): void {
  try {
    let iframe = document.getElementById('gscript_hidden_iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'gscript_hidden_iframe';
      iframe.name = 'gscript_hidden_iframe';
      iframe.style.position = 'absolute';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.opacity = '0';
      document.body.appendChild(iframe);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = 'gscript_hidden_iframe';
    form.style.display = 'none';

    // JSON payload input
    const jsonInput = document.createElement('input');
    jsonInput.type = 'hidden';
    jsonInput.name = 'data';
    jsonInput.value = JSON.stringify(payload);
    form.appendChild(jsonInput);

    // Also populate direct fields
    Object.keys(payload).forEach((key) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(payload[key] ?? '');
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
      try {
        form.remove();
      } catch (e) {}
    }, 3000);
  } catch (e) {
    console.warn('sendViaHiddenForm error:', e);
  }
}

export async function sendRecordToGoogleSheets(
  webAppUrl: string,
  record: WeighingRecord
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi atau tidak valid.',
    };
  }

  const cleanUrl = webAppUrl.trim();

  const payload: Record<string, any> = {
    noSeri: record.noSeri,
    noPolisi: record.noPolisi,
    tanggalMasuk: record.tanggalMasuk,
    jamMasuk: record.jamMasuk,
    jamKeluar: record.jamKeluar,
    supplier: record.supplier,
    alamatSupplier: record.alamatSupplier,
    gross: record.gross,
    tare: record.tare,
    bruto: record.bruto,
    rafaksiPersen: record.rafaksiPersen,
    rafaksiKg: record.rafaksiKg,
    netto: record.netto,
    hargaPerKg: record.hargaPerKg,
    jumlahDibayar: record.jumlahDibayar,
    namaOperator: record.namaOperator,
    timestamp: new Date().toISOString(),
  };

  // 1. Send via Hidden Form (bypasses browser CORS preflight & handles redirects natively)
  sendViaHiddenForm(cleanUrl, payload);

  // 2. Also send via fetch (text/plain and no-cors)
  try {
    await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });
  } catch (fetchErr) {
    console.warn('fetch no-cors error:', fetchErr);
  }

  return {
    success: true,
    message: 'Data berhasil dikirim ke Google Sheet!',
  };
}

export async function testConnectionGoogleSheets(
  webAppUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Masukkan URL Google Apps Script yang diawali https://script.google.com/...',
    };
  }

  try {
    const res = await fetch(webAppUrl, {
      method: 'GET',
    });
    const text = await res.text();
    if (res.url.includes('accounts.google.com') || text.includes('ServiceLogin') || text.includes('Sign in')) {
      return {
        success: false,
        message: 'Akses Ditolak Google: Pengaturan "Siapa yang memiliki akses" di Apps Script masih "Hanya saya". Wajib diubah ke "Siapa saja" (Anyone)!',
      };
    }
    return {
      success: true,
      message: `Terhubung sukses! Web App siap menerima data penimbangan.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal menghubungi Google Apps Script. Pastikan akses diatur ke "Siapa saja" (Anyone).',
    };
  }
}
