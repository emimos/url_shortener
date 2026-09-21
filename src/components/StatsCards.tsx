import React from 'react';
import { Link2, MousePointerClick, Activity, Flame } from 'lucide-react';
import { GlobalStats } from '../types/index.js';

interface StatsCardsProps {
  stats: GlobalStats | null;
  onSelectTopUrl?: (shortCode: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, onSelectTopUrl }) => {
  const totalUrls = stats?.totalUrls ?? 0;
  const totalClicks = stats?.totalClicks ?? 0;
  const activeUrls = stats?.activeUrls ?? 0;
  const mostVisited = stats?.mostVisitedUrl;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Links Card */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Shortened URLs</span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Link2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono">
            {totalUrls.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Managed endpoints</p>
        </div>
      </div>

      {/* Total Clicks Card */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Clicks</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <MousePointerClick className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-indigo-400 font-mono">
            {totalClicks.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Tracked real-time events</p>
        </div>
      </div>

      {/* Active Rate */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Active Links</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
            {activeUrls}
            <span className="text-sm font-normal text-slate-400 ml-1.5">
              / {totalUrls}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {totalUrls > 0 ? `${Math.round((activeUrls / totalUrls) * 100)}% active rate` : 'Ready to shorten'}
          </p>
        </div>
      </div>

      {/* Top Performer */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Top Performer</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div>
          {mostVisited ? (
            <div className="truncate">
              <button
                type="button"
                onClick={() => onSelectTopUrl && onSelectTopUrl(mostVisited.shortCode)}
                className="text-left group w-full"
              >
                <div className="text-base sm:text-lg font-bold text-amber-300 truncate group-hover:underline">
                  /r/{mostVisited.shortCode}
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5">
                  {mostVisited.clicks} clicks • {mostVisited.title || mostVisited.originalUrl}
                </div>
              </button>
            </div>
          ) : (
            <div>
              <div className="text-lg font-bold text-slate-400 font-mono">-</div>
              <p className="text-xs text-slate-500 mt-1">No traffic logged yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
