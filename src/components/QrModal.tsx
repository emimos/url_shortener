import React, { useState } from 'react';
import { Download, Copy, Check, X, QrCode as QrIcon, ExternalLink } from 'lucide-react';
import { UrlItem } from '../types/index.js';

interface QrModalProps {
  url: UrlItem | null;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!url.qrCode) return;
    const a = document.createElement('a');
    a.href = url.qrCode;
    a.download = `qr_${url.shortCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <QrIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">QR Code Access</h3>
            <p className="text-xs text-slate-400">Scan to redirect to destination URL</p>
          </div>
        </div>

        {/* QR Code Graphic */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-2xl shadow-inner border-4 border-slate-800">
            {url.qrCode ? (
              <img
                src={url.qrCode}
                alt={`QR code for ${url.shortUrl}`}
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-700 text-xs">
                Generating QR code...
              </div>
            )}
          </div>
          <div className="text-center mt-3">
            <span className="font-mono text-sm font-bold text-blue-400 select-all">
              {url.shortUrl}
            </span>
            <p className="text-[11px] text-slate-400 truncate max-w-xs mx-auto mt-0.5">
              → {url.originalUrl}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!url.qrCode}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Works with camera scanner</span>
          <a
            href={url.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline flex items-center gap-1"
          >
            Open in browser <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
