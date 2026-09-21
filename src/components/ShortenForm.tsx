import React, { useState } from 'react';
import { Sparkles, SlidersHorizontal, ArrowRight, Copy, Check, QrCode, ExternalLink, BarChart3, AlertCircle } from 'lucide-react';
import { UrlItem } from '../types/index.js';

interface ShortenFormProps {
  onUrlCreated: (newUrl: UrlItem) => void;
  onOpenQr: (url: UrlItem) => void;
  onOpenAnalytics: (shortCode: string) => void;
}

export const ShortenForm: React.FC<ShortenFormProps> = ({
  onUrlCreated,
  onOpenQr,
  onOpenAnalytics,
}) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<UrlItem | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setOriginalUrl(text);
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let urlToSubmit = originalUrl.trim();
    if (!urlToSubmit) {
      setError('Please provide a URL to shorten.');
      return;
    }

    // Auto-prefix https:// if missing
    if (!/^https?:\/\//i.test(urlToSubmit)) {
      urlToSubmit = 'https://' + urlToSubmit;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: urlToSubmit,
          customAlias: customAlias.trim() || undefined,
          title: title.trim() || undefined,
          tags: tags.trim() || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      setLastCreated(data.url);
      onUrlCreated(data.url);
      setOriginalUrl('');
      setCustomAlias('');
      setTitle('');
      setTags('');
      setExpiresAt('');
      setShowOptions(false);
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl mb-10">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-blue-400" />
          Shorten a Destination URL
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Generate fast, tracked short URLs with QR codes, analytics, and custom aliases.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main URL Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              id="original-url-input"
              type="text"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="Paste long URL (e.g. https://mywebsite.com/campaign/launch-event)..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-100 text-sm sm:text-base rounded-xl px-4 py-3.5 pr-20 placeholder:text-slate-500 transition-all outline-none"
              disabled={loading}
              required
            />
            {originalUrl.length === 0 && (
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded bg-blue-500/10 transition"
              >
                Paste
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              id="toggle-options-btn"
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`px-3.5 py-3.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition ${
                showOptions
                  ? 'bg-slate-700 text-slate-200 border-slate-600'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              title="Custom alias, title, expiry, tags"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden md:inline">Options</span>
            </button>

            <button
              id="submit-shorten-btn"
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Shorten</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Options */}
        {showOptions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-700/60 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Custom Alias (optional)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-slate-500 font-mono">/r/</span>
                <input
                  id="custom-alias-input"
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="spring-sale"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Title / Label (optional)
              </label>
              <input
                id="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product Landing Page"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tags (comma separated)
              </label>
              <input
                id="tags-input"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="marketing, social, ads"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Expiration Date (optional)
              </label>
              <input
                id="expiry-input"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Success Banner / Card */}
      {lastCreated && (
        <div className="mt-6 p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-lg animate-in fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Check className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                    Short URL Created
                  </span>
                  {lastCreated.title && (
                    <span className="text-xs text-slate-400 truncate">
                      • {lastCreated.title}
                    </span>
                  )}
                </div>
                <div className="font-mono text-base sm:text-lg font-bold text-slate-100 truncate mt-1">
                  {lastCreated.shortUrl}
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5 max-w-xl">
                  Points to: <span className="text-slate-300">{lastCreated.originalUrl}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
              <button
                id="copy-short-url-btn"
                type="button"
                onClick={() => handleCopy(lastCreated.shortUrl)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                id="qr-preview-btn"
                type="button"
                onClick={() => onOpenQr(lastCreated)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-400" />
                <span>QR Code</span>
              </button>

              <a
                id="test-redirect-link"
                href={`/r/${lastCreated.shortCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Redirect</span>
              </a>

              <button
                id="view-analytics-btn"
                type="button"
                onClick={() => onOpenAnalytics(lastCreated.shortCode)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
