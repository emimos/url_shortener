export interface UrlItem {
  id: string;
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
  title?: string;
  customAlias?: string;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  tags?: string[];
  isActive: boolean;
  qrCode?: string;
}

export interface ClickLog {
  id: string;
  shortCode: string;
  timestamp: string;
  ip: string;
  referrer: string;
  browser: string;
  os: string;
  device: string;
}

export interface AnalyticsSummary {
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
  title?: string;
  totalClicks: number;
  createdAt: string;
  clicksOverTime: { date: string; clicks: number }[];
  devices: { name: string; value: number }[];
  referrers: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
  operatingSystems: { name: string; value: number }[];
  recentClicks: ClickLog[];
}

export interface GlobalStats {
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  mostVisitedUrl?: UrlItem | null;
}

export interface SystemStatus {
  status: string;
  dbType: 'mongodb' | 'embedded';
  isMongoConnected: boolean;
  mongoUriConfigured: boolean;
  totalUrls: number;
  totalClicks: number;
  uptime: number;
}
