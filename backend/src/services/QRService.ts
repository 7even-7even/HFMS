import QRCode from 'qrcode';

export class QRService {
  static generateQRData(patientId: string, orderId: string, dietPlanId: string): string {
    return `HFMS_VERIFY::PT_${patientId}::ORD_${orderId}::DP_${dietPlanId}`;
  }

  static async generateQRCodeBase64(qrData: string): Promise<string> {
    try {
      const url = await QRCode.toDataURL(qrData);
      return url;
    } catch (error) {
      console.error('QR Code Generation Failed:', error);
      return '';
    }
  }

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  }

  static verifyDeliveryData(
    expectedQRData: string,
    expectedOTP: string,
    inputQRData?: string,
    inputOTP?: string
  ): { verified: boolean; method: 'QR' | 'OTP' | 'None'; error?: string } {
    if (inputQRData && inputQRData === expectedQRData) {
      return { verified: true, method: 'QR' };
    }
    if (inputOTP && inputOTP === expectedOTP) {
      return { verified: true, method: 'OTP' };
    }
    return {
      verified: false,
      method: 'None',
      error: 'Mismatch in QR Code data or Invalid Verification OTP.',
    };
  }
}
