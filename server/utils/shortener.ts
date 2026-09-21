import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { UAParser } from 'ua-parser-js';

export function isValidUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function generateShortCode(length: number = 6): string {
  // Use URL-safe alphanumeric characters
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return code;
}

export async function generateQrCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

export function parseUserAgentDetails(userAgentString?: string) {
  if (!userAgentString) {
    return {
      browser: 'Direct / Unknown',
      os: 'Unknown',
      device: 'Desktop',
    };
  }

  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const browser = result.browser.name
    ? `${result.browser.name}${result.browser.major ? ' ' + result.browser.major : ''}`
    : 'Unknown Browser';

  const os = result.os.name
    ? `${result.os.name}${result.os.version ? ' ' + result.os.version : ''}`
    : 'Unknown OS';

  let device = 'Desktop';
  if (result.device.type === 'mobile') {
    device = 'Mobile';
  } else if (result.device.type === 'tablet') {
    device = 'Tablet';
  } else if (result.device.type === 'smarttv') {
    device = 'Smart TV';
  } else if (
    userAgentString.includes('Mobile') ||
    userAgentString.includes('Android') ||
    userAgentString.includes('iPhone')
  ) {
    device = 'Mobile';
  }

  return {
    browser,
    os,
    device,
  };
}

export function sanitizeReferrer(refHeader?: string): string {
  if (!refHeader || refHeader.trim() === '') return 'Direct / None';
  try {
    const url = new URL(refHeader);
    let host = url.hostname.replace(/^www\./, '');
    if (host.includes('google.')) return 'Google Search';
    if (host.includes('bing.')) return 'Bing';
    if (host.includes('twitter.') || host.includes('t.co') || host.includes('x.com')) return 'X / Twitter';
    if (host.includes('linkedin.')) return 'LinkedIn';
    if (host.includes('facebook.') || host.includes('fb.me')) return 'Facebook';
    if (host.includes('instagram.')) return 'Instagram';
    if (host.includes('reddit.')) return 'Reddit';
    if (host.includes('github.')) return 'GitHub';
    if (host.includes('youtube.')) return 'YouTube';
    return host;
  } catch {
    return 'Other Web Referral';
  }
}
