/**
 * VietQR Helper Functions
 * Generate QR codes for bank transfers using VietQR API
 * https://www.vietqr.io/
 */

export interface VietQRConfig {
  bankId: string;          // Bank ID (e.g., "970416" for ACB)
  accountNo: string;       // Bank account number
  accountName: string;     // Account holder name
  amount?: number;         // Transaction amount
  addInfo?: string;        // Transfer description
  template?: 'compact' | 'compact2' | 'qr_only' | 'print'; // Template style
}

/**
 * Generate VietQR image URL
 * @param config VietQR configuration
 * @returns Image URL for the QR code
 */
export function generateVietQRUrl(config: VietQRConfig): string {
  const {
    bankId,
    accountNo,
    accountName,
    amount = 0,
    addInfo = '',
    template = 'compact2'
  } = config;

  // VietQR API endpoint
  const baseUrl = 'https://img.vietqr.io/image';

  // Build URL
  const params = new URLSearchParams();
  if (amount > 0) {
    params.append('amount', amount.toString());
  }
  if (addInfo) {
    params.append('addInfo', addInfo);
  }
  params.append('accountName', accountName);

  // Format: https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-{TEMPLATE}.png?params
  const url = `${baseUrl}/${bankId}-${accountNo}-${template}.png${params.toString() ? '?' + params.toString() : ''}`;

  return url;
}

/**
 * Get bank list supported by VietQR
 */
export const VIETQR_BANKS = [
  { id: '970415', name: 'Vietinbank', shortName: 'VTB' },
  { id: '970418', name: 'BIDV', shortName: 'BIDV' },
  { id: '970405', name: 'Agribank', shortName: 'AGB' },
  { id: '970422', name: 'MB Bank', shortName: 'MB' },
  { id: '970407', name: 'Techcombank', shortName: 'TCB' },
  { id: '970416', name: 'ACB', shortName: 'ACB' },
  { id: '970423', name: 'TPBank', shortName: 'TPB' },
  { id: '970403', name: 'Sacombank', shortName: 'STB' },
  { id: '970437', name: 'HDBank', shortName: 'HDB' },
  { id: '970432', name: 'VPBank', shortName: 'VPB' },
  { id: '970436', name: 'Vietcombank', shortName: 'VCB' },
] as const;

/**
 * Default bank configuration for the system
 * Load from environment variables
 */
export const DEFAULT_BANK_CONFIG: VietQRConfig = {
  bankId: process.env.NEXT_PUBLIC_SEPAY_BANK_ID || '970418',           // BIDV
  accountNo: process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NUMBER || '1160976779',
  accountName: process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NAME || 'TO TRONG HIEU',
  template: 'compact2'
};

/**
 * Generate QR code for an order
 * @param orderCode Order code
 * @param amount Order amount
 * @returns QR code image URL
 */
export function generateOrderQR(orderCode: string, amount: number): string {
  return generateVietQRUrl({
    ...DEFAULT_BANK_CONFIG,
    amount,
    addInfo: `Thanh toan ${orderCode}`
  });
}
