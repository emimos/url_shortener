import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { connectToDatabase } from './server/db.js';
import { apiRouter } from './server/routes/api.js';
import { storage } from './server/storage.js';
import { parseUserAgentDetails, sanitizeReferrer } from './server/utils/shortener.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Attempt database connection (MongoDB with embedded fallback)
  await connectToDatabase();

  // Initialize initial sample records if database is fresh
  try {
    await storage.seedDemoData();
  } catch (err) {
    console.error('Error during initial seed check:', err);
  }

  // API routes
  app.use('/api', apiRouter);

  // Explicit short URL redirection handler: /r/:shortCode
  app.get('/r/:shortCode', async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    try {
      const url = await storage.getUrlByCode(shortCode);

      if (!url) {
        res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Link Not Found - URL Shortener</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
                h1 { color: #f43f5e; margin-top: 0; font-size: 24px; }
                p { color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
                a { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>404 - Short Link Not Found</h1>
                <p>The shortened link <strong>/r/${encodeURIComponent(shortCode)}</strong> does not exist or has been removed.</p>
                <a href="/">Go to Shortener Dashboard</a>
              </div>
            </body>
          </html>
        `);
        return;
      }

      if (!url.isActive) {
        res.status(410).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Link Disabled - URL Shortener</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; }
                h1 { color: #f59e0b; margin-top: 0; font-size: 24px; }
                p { color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
                a { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Link Temporarily Deactivated</h1>
                <p>This short link is currently paused by its administrator.</p>
                <a href="/">Go to Shortener Dashboard</a>
              </div>
            </body>
          </html>
        `);
        return;
      }

      if (url.expiresAt && new Date(url.expiresAt).getTime() < Date.now()) {
        res.status(410).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Link Expired - URL Shortener</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; }
                h1 { color: #f43f5e; margin-top: 0; font-size: 24px; }
                p { color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
                a { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Link Expired</h1>
                <p>This link reached its expiration date and is no longer active.</p>
                <a href="/">Go to Shortener Dashboard</a>
              </div>
            </body>
          </html>
        `);
        return;
      }

      // Collect analytics parameters
      const rawForwarded = req.headers['x-forwarded-for'];
      const rawIp = typeof rawForwarded === 'string' ? rawForwarded.split(',')[0].trim() : req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || '';
      const referrerHeader = (req.headers['referer'] || req.headers['referrer']) as string | undefined;

      const uaDetails = parseUserAgentDetails(userAgent);
      const referrer = sanitizeReferrer(referrerHeader);

      // Record click asynchronously
      storage
        .recordClick(shortCode, {
          ip: rawIp,
          referrer,
          userAgent,
          browser: uaDetails.browser,
          os: uaDetails.os,
          device: uaDetails.device,
        })
        .catch((err) => console.error('Failed to log click event:', err));

      // Fast 302 redirect
      res.redirect(302, url.originalUrl);
    } catch (err) {
      console.error('Redirection error:', err);
      res.redirect(302, '/');
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 URL Shortener & Analytics Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
});
