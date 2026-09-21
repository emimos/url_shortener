import { isUsingMongo, initLocalFileDb, saveLocalFileDb } from './db.js';
import { UrlModel } from './models/Url.js';
import { ClickEventModel } from './models/ClickEvent.js';
import { UrlItem, AnalyticsSummary, GlobalStats, ClickLog } from '../src/types/index.js';

let localDb = initLocalFileDb();

function getAppBaseUrl(): string {
  // Respect APP_URL or default to window / request host
  if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  return '';
}

export const storage = {
  async listUrls(baseUrl?: string): Promise<UrlItem[]> {
    const domain = baseUrl || getAppBaseUrl();
    if (isUsingMongo()) {
      const docs = await UrlModel.find().sort({ createdAt: -1 }).lean();
      return docs.map((doc: any) => ({
        id: doc._id.toString(),
        shortCode: doc.shortCode,
        originalUrl: doc.originalUrl,
        shortUrl: `${domain}/r/${doc.shortCode}`,
        title: doc.title,
        customAlias: doc.customAlias,
        clicks: doc.clicks || 0,
        createdAt: new Date(doc.createdAt).toISOString(),
        updatedAt: new Date(doc.updatedAt).toISOString(),
        expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : null,
        tags: doc.tags || [],
        isActive: doc.isActive !== false,
        qrCode: doc.qrCode,
      }));
    }

    // Local JSON fallback
    return localDb.urls
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((item) => ({
        ...item,
        shortUrl: `${domain}/r/${item.shortCode}`,
      }));
  },

  async getUrlByCode(shortCode: string, baseUrl?: string): Promise<UrlItem | null> {
    const domain = baseUrl || getAppBaseUrl();
    if (isUsingMongo()) {
      const doc: any = await UrlModel.findOne({ shortCode }).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        shortCode: doc.shortCode,
        originalUrl: doc.originalUrl,
        shortUrl: `${domain}/r/${doc.shortCode}`,
        title: doc.title,
        customAlias: doc.customAlias,
        clicks: doc.clicks || 0,
        createdAt: new Date(doc.createdAt).toISOString(),
        updatedAt: new Date(doc.updatedAt).toISOString(),
        expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : null,
        tags: doc.tags || [],
        isActive: doc.isActive !== false,
        qrCode: doc.qrCode,
      };
    }

    const item = localDb.urls.find((u) => u.shortCode.toLowerCase() === shortCode.toLowerCase());
    if (!item) return null;
    return {
      ...item,
      shortUrl: `${domain}/r/${item.shortCode}`,
    };
  },

  async createUrl(params: {
    shortCode: string;
    originalUrl: string;
    title?: string;
    customAlias?: string;
    expiresAt?: Date | null;
    tags?: string[];
    qrCode?: string;
    baseUrl?: string;
  }): Promise<UrlItem> {
    const domain = params.baseUrl || getAppBaseUrl();
    if (isUsingMongo()) {
      const newDoc = new UrlModel({
        shortCode: params.shortCode,
        originalUrl: params.originalUrl,
        title: params.title || '',
        customAlias: params.customAlias || '',
        clicks: 0,
        expiresAt: params.expiresAt || null,
        tags: params.tags || [],
        isActive: true,
        qrCode: params.qrCode,
      });
      const saved: any = await newDoc.save();
      return {
        id: saved._id.toString(),
        shortCode: saved.shortCode,
        originalUrl: saved.originalUrl,
        shortUrl: `${domain}/r/${saved.shortCode}`,
        title: saved.title,
        customAlias: saved.customAlias,
        clicks: 0,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
        expiresAt: saved.expiresAt ? saved.expiresAt.toISOString() : null,
        tags: saved.tags,
        isActive: true,
        qrCode: saved.qrCode,
      };
    }

    // Local JSON
    const now = new Date().toISOString();
    const newItem: UrlItem = {
      id: 'url_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      shortCode: params.shortCode,
      originalUrl: params.originalUrl,
      shortUrl: `${domain}/r/${params.shortCode}`,
      title: params.title || '',
      customAlias: params.customAlias || '',
      clicks: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: params.expiresAt ? params.expiresAt.toISOString() : null,
      tags: params.tags || [],
      isActive: true,
      qrCode: params.qrCode,
    };

    localDb.urls.push(newItem);
    saveLocalFileDb(localDb);
    return newItem;
  },

  async recordClick(
    shortCode: string,
    event: {
      ip: string;
      referrer: string;
      userAgent: string;
      browser: string;
      os: string;
      device: string;
    }
  ): Promise<void> {
    if (isUsingMongo()) {
      await Promise.all([
        UrlModel.updateOne({ shortCode }, { $inc: { clicks: 1 } }),
        ClickEventModel.create({
          shortCode,
          timestamp: new Date(),
          ...event,
        }),
      ]);
      return;
    }

    // Local JSON
    const url = localDb.urls.find((u) => u.shortCode.toLowerCase() === shortCode.toLowerCase());
    if (url) {
      url.clicks = (url.clicks || 0) + 1;
      url.updatedAt = new Date().toISOString();
    }

    const clickRecord: ClickLog = {
      id: 'clk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      shortCode,
      timestamp: new Date().toISOString(),
      ip: event.ip,
      referrer: event.referrer,
      browser: event.browser,
      os: event.os,
      device: event.device,
    };
    localDb.clicks.push(clickRecord);
    saveLocalFileDb(localDb);
  },

  async getAnalytics(shortCode: string, baseUrl?: string): Promise<AnalyticsSummary | null> {
    const url = await this.getUrlByCode(shortCode, baseUrl);
    if (!url) return null;

    let clickLogs: ClickLog[] = [];

    if (isUsingMongo()) {
      const events: any[] = await ClickEventModel.find({ shortCode })
        .sort({ timestamp: -1 })
        .limit(200)
        .lean();

      clickLogs = events.map((e) => ({
        id: e._id.toString(),
        shortCode: e.shortCode,
        timestamp: new Date(e.timestamp).toISOString(),
        ip: e.ip || 'Anonymized',
        referrer: e.referrer || 'Direct',
        browser: e.browser || 'Unknown',
        os: e.os || 'Unknown',
        device: e.device || 'Desktop',
      }));
    } else {
      clickLogs = localDb.clicks
        .filter((c) => c.shortCode.toLowerCase() === shortCode.toLowerCase())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Compute aggregations:
    // 1. Clicks over time (last 7 days grouped by date)
    const datesMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      datesMap[key] = 0;
    }

    clickLogs.forEach((c) => {
      const d = new Date(c.timestamp);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (datesMap[key] !== undefined) {
        datesMap[key] += 1;
      }
    });

    const clicksOverTime = Object.entries(datesMap).map(([date, clicks]) => ({ date, clicks }));

    // 2. Devices
    const deviceCount: Record<string, number> = {};
    clickLogs.forEach((c) => {
      const dev = c.device || 'Desktop';
      deviceCount[dev] = (deviceCount[dev] || 0) + 1;
    });
    const devices = Object.entries(deviceCount).map(([name, value]) => ({ name, value }));

    // 3. Referrers
    const refCount: Record<string, number> = {};
    clickLogs.forEach((c) => {
      const ref = c.referrer || 'Direct';
      refCount[ref] = (refCount[ref] || 0) + 1;
    });
    const referrers = Object.entries(refCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // 4. Browsers
    const browserCount: Record<string, number> = {};
    clickLogs.forEach((c) => {
      const br = c.browser || 'Other';
      browserCount[br] = (browserCount[br] || 0) + 1;
    });
    const browsers = Object.entries(browserCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // 5. Operating Systems
    const osCount: Record<string, number> = {};
    clickLogs.forEach((c) => {
      const os = c.os || 'Other';
      osCount[os] = (osCount[os] || 0) + 1;
    });
    const operatingSystems = Object.entries(osCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      shortUrl: url.shortUrl,
      title: url.title,
      totalClicks: url.clicks,
      createdAt: url.createdAt,
      clicksOverTime,
      devices,
      referrers,
      browsers,
      operatingSystems,
      recentClicks: clickLogs.slice(0, 15),
    };
  },

  async deleteUrl(shortCode: string): Promise<boolean> {
    if (isUsingMongo()) {
      await Promise.all([
        UrlModel.deleteOne({ shortCode }),
        ClickEventModel.deleteMany({ shortCode }),
      ]);
      return true;
    }

    const prevLen = localDb.urls.length;
    localDb.urls = localDb.urls.filter((u) => u.shortCode.toLowerCase() !== shortCode.toLowerCase());
    localDb.clicks = localDb.clicks.filter((c) => c.shortCode.toLowerCase() !== shortCode.toLowerCase());
    saveLocalFileDb(localDb);
    return localDb.urls.length < prevLen;
  },

  async toggleActive(shortCode: string): Promise<UrlItem | null> {
    if (isUsingMongo()) {
      const url: any = await UrlModel.findOne({ shortCode });
      if (!url) return null;
      url.isActive = !url.isActive;
      await url.save();
      return this.getUrlByCode(shortCode);
    }

    const url = localDb.urls.find((u) => u.shortCode.toLowerCase() === shortCode.toLowerCase());
    if (!url) return null;
    url.isActive = !url.isActive;
    url.updatedAt = new Date().toISOString();
    saveLocalFileDb(localDb);
    return url;
  },

  async getGlobalStats(): Promise<GlobalStats> {
    const urls = await this.listUrls();
    const totalUrls = urls.length;
    const totalClicks = urls.reduce((acc, u) => acc + (u.clicks || 0), 0);
    const activeUrls = urls.filter((u) => u.isActive).length;
    const sorted = urls.slice().sort((a, b) => b.clicks - a.clicks);
    const mostVisitedUrl = sorted.length > 0 && sorted[0].clicks > 0 ? sorted[0] : null;

    return {
      totalUrls,
      totalClicks,
      activeUrls,
      mostVisitedUrl,
    };
  },

  async seedDemoData(baseUrl?: string): Promise<void> {
    const existing = await this.listUrls();
    if (existing.length > 0) return;

    const demos = [
      {
        shortCode: 'github-node',
        originalUrl: 'https://github.com/nodejs/node',
        title: 'Node.js Official Repository',
        tags: ['development', 'backend'],
        clicks: 42,
      },
      {
        shortCode: 'mongo-docs',
        originalUrl: 'https://www.mongodb.com/docs/',
        title: 'MongoDB Developer Documentation',
        tags: ['database', 'nosql', 'docs'],
        clicks: 28,
      },
      {
        shortCode: 'react-docs',
        originalUrl: 'https://react.dev',
        title: 'React Official Portal',
        tags: ['frontend', 'react'],
        clicks: 19,
      },
    ];

    for (const demo of demos) {
      await this.createUrl({
        shortCode: demo.shortCode,
        originalUrl: demo.originalUrl,
        title: demo.title,
        tags: demo.tags,
        baseUrl,
      });

      // Populate realistic analytics click events across past few days
      const devices = ['Desktop', 'Mobile', 'Tablet'];
      const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
      const oss = ['macOS', 'Windows', 'iOS', 'Android', 'Linux'];
      const referrers = ['Google Search', 'X / Twitter', 'LinkedIn', 'Direct / None', 'GitHub', 'Reddit'];

      for (let i = 0; i < demo.clicks; i++) {
        const pastDays = Math.floor(Math.random() * 6);
        const date = new Date();
        date.setDate(date.getDate() - pastDays);
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

        await this.recordClick(demo.shortCode, {
          ip: `192.168.1.${Math.floor(Math.random() * 250)}`,
          referrer: referrers[Math.floor(Math.random() * referrers.length)],
          userAgent: 'Mozilla/5.0 Sample Browser',
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          os: oss[Math.floor(Math.random() * oss.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
        });
      }
    }
  },
};
