import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  MousePointerClick,
  Smartphone,
  Globe2,
  Monitor,
  RefreshCw,
  Clock,
  Radio,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { AnalyticsSummary } from '../types/index.js';

interface AnalyticsDashboardProps {
  shortCode: string;
  onBack: () => void;
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ shortCode, onBack }) => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/urls/${shortCode}/analytics`);
      const json = await res.json();
      if (res.ok) {
        setData(json.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [shortCode]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 shadow-xl text-center py-20">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Aggregating MongoDB click analytics for /r/{shortCode}...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 shadow-xl text-center py-16">
        <p className="text-slate-300 text-sm mb-4">No analytics found for this short link.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold"
        >
          Back to URLs
        </button>
      </div>
    );
  }

  // Calculate top device, top referrer, top browser
  const topDevice = data.devices.length > 0 ? data.devices.reduce((prev, curr) => curr.value > prev.value ? curr : prev) : null;
  const topReferrer = data.referrers.length > 0 ? data.referrers.reduce((prev, curr) => curr.value > prev.value ? curr : prev) : null;
  const topBrowser = data.browsers.length > 0 ? data.browsers.reduce((prev, curr) => curr.value > prev.value ? curr : prev) : null;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Bar with Navigation & Link Identity */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Return to list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Link Analytics
                </span>
                {data.title && (
                  <span className="text-xs text-slate-400">• {data.title}</span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono text-xl sm:text-2xl font-bold text-slate-100 mt-1">
                <span>{data.shortUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(data.shortUrl)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition text-sm"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono truncate max-w-2xl">
                <span>Destination:</span>
                <a
                  href={data.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-blue-400 hover:underline truncate"
                >
                  {data.originalUrl}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <a
              href={`/r/${data.shortCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Trigger Test Click</span>
            </a>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Clicks</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-100 font-mono">
            {data.totalClicks.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Direct & referral visits</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Top Device</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-100 truncate">
            {topDevice ? topDevice.name : 'N/A'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {topDevice ? `${topDevice.value} visits` : 'No device data'}
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Top Referrer</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-100 truncate">
            {topReferrer ? topReferrer.name : 'N/A'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {topReferrer ? `${topReferrer.value} visits` : 'Direct or unknown'}
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Top Browser</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Monitor className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-100 truncate">
            {topBrowser ? topBrowser.name : 'N/A'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {topBrowser ? `${topBrowser.value} visits` : 'No browser info'}
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clicks Over Time (Area Chart) - 2 cols */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                Clicks Timeline
              </h3>
              <p className="text-xs text-slate-400">Volume across the last 7 recorded days</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.clicksOverTime}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#475569',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#clickGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution (Donut Chart) - 1 col */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-emerald-400" />
              Device Distribution
            </h3>
            <p className="text-xs text-slate-400">Visitor client hardware category</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center my-2">
            {data.devices.length === 0 ? (
              <p className="text-xs text-slate-500">No device data logged yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.devices.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#475569',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-700/50 text-xs">
            {data.devices.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span>{d.name}:</span>
                <span className="font-mono font-semibold text-slate-100">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referrers and Operating Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
            <Globe2 className="w-4 h-4 text-indigo-400" />
            Top Referrers
          </h3>
          <p className="text-xs text-slate-400 mb-4">Traffic source origins</p>

          {data.referrers.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-500">
              No referral traffic logged yet
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.referrers}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#475569',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Operating Systems & Browsers */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
            <Monitor className="w-4 h-4 text-amber-400" />
            Browsers & Operating Systems
          </h3>
          <p className="text-xs text-slate-400 mb-4">Client environment breakdown</p>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">Browsers</div>
              <div className="space-y-2">
                {data.browsers.map((b) => (
                  <div key={b.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{b.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((b.value / data.totalClicks) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-slate-400 w-6 text-right">{b.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/50">
              <div className="text-xs font-semibold text-slate-400 mb-2">Operating Systems</div>
              <div className="space-y-2">
                {data.operatingSystems.map((o) => (
                  <div key={o.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{o.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((o.value / data.totalClicks) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-slate-400 w-6 text-right">{o.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Clicks Stream Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Live Activity Stream
            </h3>
            <p className="text-xs text-slate-400">Recent redirection events captured by the MongoDB collection</p>
          </div>
        </div>

        {data.recentClicks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No click events recorded yet. Click &quot;Trigger Test Click&quot; above to simulate a visit!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 text-slate-400 uppercase font-medium">
                <tr>
                  <th className="pb-2.5 font-medium">Timestamp</th>
                  <th className="pb-2.5 font-medium">Referrer</th>
                  <th className="pb-2.5 font-medium">Device</th>
                  <th className="pb-2.5 font-medium">Browser</th>
                  <th className="pb-2.5 font-medium">OS</th>
                  <th className="pb-2.5 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {data.recentClicks.map((click) => {
                  const date = new Date(click.timestamp);
                  return (
                    <tr key={click.id} className="hover:bg-slate-750/30 transition">
                      <td className="py-2.5 text-slate-400 whitespace-nowrap">
                        {date.toLocaleTimeString()} ({date.toLocaleDateString()})
                      </td>
                      <td className="py-2.5 text-blue-300 font-sans font-medium whitespace-nowrap">
                        {click.referrer}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700">
                          {click.device}
                        </span>
                      </td>
                      <td className="py-2.5 font-sans whitespace-nowrap">{click.browser}</td>
                      <td className="py-2.5 font-sans whitespace-nowrap">{click.os}</td>
                      <td className="py-2.5 text-slate-400 whitespace-nowrap">{click.ip}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
