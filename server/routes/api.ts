import { Router, Request, Response } from 'express';
import { storage } from '../storage.js';
import { isValidUrl, generateShortCode, generateQrCode } from '../utils/shortener.js';
import { isUsingMongo } from '../db.js';

export const apiRouter = Router();

// Helper to determine base URL
function resolveBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

// POST /api/shorten
apiRouter.post('/shorten', async (req: Request, res: Response) => {
  try {
    const { originalUrl, customAlias, title, tags, expiresAt } = req.body;

    if (!originalUrl || typeof originalUrl !== 'string') {
      res.status(400).json({ error: 'Valid "originalUrl" is required' });
      return;
    }

    const trimmedUrl = originalUrl.trim();
    if (!isValidUrl(trimmedUrl)) {
      res.status(400).json({
        error: 'Invalid URL format. Please include http:// or https:// (e.g., https://example.com)',
      });
      return;
    }

    const baseUrl = resolveBaseUrl(req);
    let shortCode = '';

    if (customAlias && typeof customAlias === 'string') {
      const sanitizedAlias = customAlias.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (sanitizedAlias.length < 3 || sanitizedAlias.length > 30) {
        res.status(400).json({ error: 'Custom alias must be between 3 and 30 alphanumeric characters' });
        return;
      }
      // Check if already taken
      const existing = await storage.getUrlByCode(sanitizedAlias, baseUrl);
      if (existing) {
        res.status(409).json({ error: `Alias "${sanitizedAlias}" is already in use. Please choose another.` });
        return;
      }
      shortCode = sanitizedAlias;
    } else {
      // Generate unique short code
      let attempts = 0;
      while (attempts < 5) {
        const candidate = generateShortCode(6);
        const existing = await storage.getUrlByCode(candidate, baseUrl);
        if (!existing) {
          shortCode = candidate;
          break;
        }
        attempts++;
      }
      if (!shortCode) {
        shortCode = generateShortCode(8);
      }
    }

    const fullShortUrl = `${baseUrl}/r/${shortCode}`;
    const qrCodeDataUrl = await generateQrCode(fullShortUrl);

    let parsedExpiry: Date | null = null;
    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (!isNaN(expDate.getTime())) {
        parsedExpiry = expDate;
      }
    }

    const processedTags = Array.isArray(tags)
      ? tags.map((t: string) => String(t).trim()).filter(Boolean)
      : typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const newUrl = await storage.createUrl({
      shortCode,
      originalUrl: trimmedUrl,
      title: title ? String(title).trim() : undefined,
      customAlias: customAlias ? String(customAlias).trim() : undefined,
      expiresAt: parsedExpiry,
      tags: processedTags,
      qrCode: qrCodeDataUrl,
      baseUrl,
    });

    res.status(201).json({
      success: true,
      url: newUrl,
    });
  } catch (error: any) {
    console.error('Error shortening URL:', error);
    res.status(500).json({ error: error.message || 'Internal server error while shortening URL' });
  }
});

// GET /api/urls
apiRouter.get('/urls', async (req: Request, res: Response) => {
  try {
    const baseUrl = resolveBaseUrl(req);
    let urls = await storage.listUrls(baseUrl);

    const { q, tag } = req.query;
    if (typeof q === 'string' && q.trim()) {
      const query = q.toLowerCase();
      urls = urls.filter(
        (u) =>
          u.shortCode.toLowerCase().includes(query) ||
          u.originalUrl.toLowerCase().includes(query) ||
          (u.title && u.title.toLowerCase().includes(query))
      );
    }

    if (typeof tag === 'string' && tag.trim()) {
      const tagQuery = tag.toLowerCase();
      urls = urls.filter((u) => u.tags?.some((t) => t.toLowerCase() === tagQuery));
    }

    res.json({ urls });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve URLs' });
  }
});

// GET /api/urls/:shortCode
apiRouter.get('/urls/:shortCode', async (req: Request, res: Response) => {
  try {
    const baseUrl = resolveBaseUrl(req);
    const url = await storage.getUrlByCode(req.params.shortCode, baseUrl);
    if (!url) {
      res.status(404).json({ error: 'Short URL not found' });
      return;
    }
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve URL' });
  }
});

// GET /api/urls/:shortCode/analytics
apiRouter.get('/urls/:shortCode/analytics', async (req: Request, res: Response) => {
  try {
    const baseUrl = resolveBaseUrl(req);
    const analytics = await storage.getAnalytics(req.params.shortCode, baseUrl);
    if (!analytics) {
      res.status(404).json({ error: 'Short URL not found for analytics' });
      return;
    }
    res.json({ analytics });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load analytics' });
  }
});

// DELETE /api/urls/:shortCode
apiRouter.delete('/urls/:shortCode', async (req: Request, res: Response) => {
  try {
    const success = await storage.deleteUrl(req.params.shortCode);
    if (!success) {
      res.status(404).json({ error: 'URL not found or already deleted' });
      return;
    }
    res.json({ success: true, message: 'URL deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete URL' });
  }
});

// PATCH /api/urls/:shortCode/toggle
apiRouter.patch('/urls/:shortCode/toggle', async (req: Request, res: Response) => {
  try {
    const updated = await storage.toggleActive(req.params.shortCode);
    if (!updated) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }
    res.json({ success: true, url: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to toggle URL status' });
  }
});

// GET /api/stats
apiRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await storage.getGlobalStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get statistics' });
  }
});

// GET /api/status
apiRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const stats = await storage.getGlobalStats();
    res.json({
      status: 'operational',
      dbType: isUsingMongo() ? 'mongodb' : 'embedded',
      isMongoConnected: isUsingMongo(),
      mongoUriConfigured: Boolean(process.env.MONGODB_URI),
      totalUrls: stats.totalUrls,
      totalClicks: stats.totalClicks,
      uptime: process.uptime(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/seed
apiRouter.post('/seed', async (req: Request, res: Response) => {
  try {
    const baseUrl = resolveBaseUrl(req);
    await storage.seedDemoData(baseUrl);
    res.json({ success: true, message: 'Demo data seeded successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to seed demo data' });
  }
});
