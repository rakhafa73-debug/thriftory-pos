/**
 * THRIFTORY POS: Formatters & Locale Helpers
 * Currency: Indonesian Rupiah (IDR) e.g. "Rp 125.000"
 * Timezone: Asia/Jakarta (WIB)
 * Date format: DD/MM/YYYY
 */

export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount || 0);
  const formattedNumber = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(rounded);
  return `Rp ${formattedNumber}`;
}

export function parseRupiahInput(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

export function formatDate(dateStringOrObj: string | Date | undefined): string {
  if (!dateStringOrObj) return '-';
  const d = new Date(dateStringOrObj);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateStringOrObj: string | Date | undefined): string {
  if (!dateStringOrObj) return '-';
  const d = new Date(dateStringOrObj);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes} WIB`;
}

export function generateInvoiceNumber(prefix = 'INV'): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${y}${m}${d}-${rand}`;
}

export function generateBarcodeString(): string {
  // 12 digit format 899 (Indonesia GS1 prefix) + 9 random digits
  const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
  return `899${randomSuffix}`;
}

export function generateSKU(brand: string, category: string, size: string, isThrift = false): string {
  const b = (brand || 'GEN').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  const c = (category || 'APP').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  const s = (size || 'OS').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const prefix = isThrift ? 'THR' : 'DST';
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${b}-${c}-${s}-${rand}`;
}
