import React, { useState } from 'react';
import {
  Search,
  Filter,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  BarChart3,
  Trash2,
  Power,
  Calendar,
  Tag,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { UrlItem } from '../types/index.js';

interface UrlListProps {
  urls: UrlItem[];
  loading: boolean;
  onOpenAnalytics: (shortCode: string) => void;
  onOpenQr: (url: UrlItem) => void;
  onDeleteUrl: (shortCode: string) => void;
  onToggleStatus: (shortCode: string) => void;
}

export const UrlList: React.FC<UrlListProps> = ({
  urls,
  loading,
  onOpenAnalytics,
  onOpenQr,
  onDeleteUrl,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'clicks' | 'oldest'>('newest');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(
      urls
        .flatMap((u) => u.tags || [])
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );

  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtering
  const filteredUrls = urls.filter((item) => {
    const matchesSearch =
      item.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag ? item.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  // Sorting
  const sortedUrls = [...filteredUrls].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'clicks') {
      return (b.clicks || 0) - (a.clicks || 0);
    }
    return 0;
  });

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-links-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, short code, or destination..."
              className="w-full bg-slate-900 border border-slate-700 text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2.5 text-slate-200 placeholder:text-slate-500 focus:border-blue-500 outline-none"
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sort:</span>
          </div>
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                sortBy === 'newest'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSortBy('clicks')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                sortBy === 'clicks'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Most Clicks
            </button>
            <button
              type="button"
              onClick={() => setSortBy('oldest')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                sortBy === 'oldest'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Oldest
            </button>
          </div>
        </div>
      </div>

      {/* Tag Chips Filter */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 text-xs scrollbar-none">
          <span className="text-slate-500 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3" /> Tags:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              selectedTag === null
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-20 bg-slate-900/50 rounded-xl animate-pulse border border-slate-800"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedUrls.length === 0 && (
        <div className="text-center py-12 px-4 border border-dashed border-slate-700 rounded-xl bg-slate-900/40">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Filter className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No Shortened URLs Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedTag
              ? 'No links match your search or filter criteria. Try clearing filters.'
              : 'You have not shortened any links yet. Paste a destination URL above to get started!'}
          </p>
        </div>
      )}

      {/* Links List Cards */}
      {!loading && sortedUrls.length > 0 && (
        <div className="space-y-3">
          {sortedUrls.map((item) => {
            const isCopied = copiedCode === item.shortCode;
            const isExpired = item.expiresAt && new Date(item.expiresAt).getTime() < Date.now();

            return (
              <div
                key={item.id || item.shortCode}
                id={`url-card-${item.shortCode}`}
                className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 ${
                  !item.isActive || isExpired
                    ? 'bg-slate-900/50 border-slate-800/80 opacity-70'
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600 shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Title, Short Link, Target */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {item.title ? (
                        <h4 className="text-sm sm:text-base font-semibold text-slate-100 truncate">
                          {item.title}
                        </h4>
                      ) : (
                        <h4 className="text-sm sm:text-base font-semibold text-slate-300 font-mono">
                          /r/{item.shortCode}
                        </h4>
                      )}

                      {/* Status Badges */}
                      {!item.isActive && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Paused
                        </span>
                      )}

                      {isExpired && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Expired
                        </span>
                      )}

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Short Code & Original URL details */}
                    <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                      <span className="text-blue-400 font-semibold truncate select-all">
                        {item.shortUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.shortUrl, item.shortCode)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Copy short link"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate mt-1">
                      <span className="text-slate-500 flex-shrink-0">Target:</span>
                      <a
                        href={item.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-slate-300 truncate font-mono text-[11px]"
                      >
                        {item.originalUrl}
                      </a>
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      {item.expiresAt && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          Expires: {formatDate(item.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Clicks & Action Buttons */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    {/* Click Counter Pill */}
                    <button
                      type="button"
                      onClick={() => onOpenAnalytics(item.shortCode)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition group"
                      title="View real-time click analytics"
                    >
                      <BarChart3 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <span className="text-xs font-bold font-mono text-white">
                          {item.clicks || 0}
                        </span>
                        <span className="text-[10px] text-indigo-300 ml-1">clicks</span>
                      </div>
                    </button>

                    {/* Action Toolbar */}
                    <div className="flex items-center gap-1">
                      {/* QR Code */}
                      <button
                        type="button"
                        onClick={() => onOpenQr(item)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                        title="Display QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      {/* Direct Test in Browser */}
                      <a
                        href={`/r/${item.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                        title="Open short link (Test redirect)"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      {/* Toggle Active/Inactive */}
                      <button
                        type="button"
                        onClick={() => onToggleStatus(item.shortCode)}
                        className={`p-2 rounded-lg transition ${
                          item.isActive
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-slate-500 hover:bg-slate-800'
                        }`}
                        title={item.isActive ? 'Pause short link' : 'Activate short link'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete short link "/r/${item.shortCode}" and its analytics history?`)) {
                            onDeleteUrl(item.shortCode);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete URL"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
