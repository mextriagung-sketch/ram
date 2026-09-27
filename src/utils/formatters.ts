export function formatRupiah(value: number, withPrefix = true): string {
  if (isNaN(value)) return withPrefix ? 'Rp0' : '0';
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  return withPrefix ? `Rp${formatted}` : formatted;
}

export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(value);
}

const INDO_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const INDO_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function getIndonesianFormattedDate(d = new Date()): string {
  const dayName = INDO_DAYS[d.getDay()];
  const date = d.getDate();
  const monthName = INDO_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${date} ${monthName} ${year}`;
}

export function getCurrentTimeHHMM(d = new Date()): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function generateSerialNumber(countToday = 1, d = new Date()): string {
  const num = String(countToday).padStart(3, '0');
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const month = romanMonths[d.getMonth()];
  const year = d.getFullYear();
  return `${num}/SBJ/${month}/${year}`;
}

export function angkaKeTerbilang(nilai: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function konversi(n: number): string {
    if (n < 12) return bilangan[n];
    if (n < 20) return konversi(n - 10) + ' Belas';
    if (n < 100) return konversi(Math.floor(n / 10)) + ' Puluh ' + konversi(n % 10);
    if (n < 200) return 'Seratus ' + konversi(n - 100);
    if (n < 1000) return konversi(Math.floor(n / 100)) + ' Ratus ' + konversi(n % 100);
    if (n < 2000) return 'Seribu ' + konversi(n - 1000);
    if (n < 1000000) return konversi(Math.floor(n / 1000)) + ' Ribu ' + konversi(n % 1000);
    if (n < 1000000000) return konversi(Math.floor(n / 1000000)) + ' Juta ' + konversi(n % 1000000);
    if (n < 1000000000000) return konversi(Math.floor(n / 1000000000)) + ' Milyar ' + konversi(n % 1000000000);
    return '';
  }

  const hasil = konversi(Math.floor(Math.abs(nilai))).trim();
  return hasil ? `${hasil} Rupiah` : 'Nol Rupiah';
}
