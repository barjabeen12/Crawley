import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  MoreVertical,
  Eye,
  RotateCcw,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
  Play,
  Pause,
  AlertTriangle,
} from "lucide-react";
import { URLAnalysis, PaginationParams } from "../types";

interface AnalysisTableProps {
  analyses: URLAnalysis[];
  loading: boolean;
  isPolling: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (params: PaginationParams) => void;
  onViewDetails: (id: number) => void;
  onBulkAction: (action: "delete" | "rerun", ids: number[]) => void;
  onStartCrawl: (id: number) => void;
  onStopCrawl: (id: number) => void;
}

export const AnalysisTable = ({
  analyses,
  loading,
  isPolling,
  pagination,
  onPageChange,
  onViewDetails,
  onBulkAction,
  onStartCrawl,
  onStopCrawl,
}: AnalysisTableProps) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<{
    [key: number]: boolean;
  }>({});

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(newOrder);
    onPageChange({
      page: pagination.page,
      limit: pagination.limit,
      sortBy: column,
      sortOrder: newOrder,
      search: search || undefined,
      filters: statusFilter ? { status: statusFilter } : undefined,
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    onPageChange({
      page: 1,
      limit: pagination.limit,
      sortBy,
      sortOrder,
      search: value || undefined,
      filters: statusFilter ? { status: statusFilter } : undefined,
    });
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    onPageChange({
      page: 1,
      limit: pagination.limit,
      sortBy,
      sortOrder,
      search: search || undefined,
      filters: status ? { status } : undefined,
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === analyses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(analyses.map((a) => a.id));
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleStartCrawl = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await onStartCrawl(id);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleStopCrawl = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await onStopCrawl(id);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      queued: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
      running: "bg-blue-500/20 text-blue-600 border-blue-500/30",
      completed: "bg-green-500/20 text-green-600 border-green-500/30",
      error: "bg-red-500/20 text-red-600 border-red-500/30",
      stopped: "bg-gray-500/20 text-gray-600 border-gray-500/30",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.queued
        }`}
      >
        {status === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
        {status === "queued" && <Pause className="w-3 h-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const getActionButton = (analysis: URLAnalysis) => {
    const isActionLoading = actionLoading[analysis.id];
    if (analysis.status === "running") {
      return (
        <button
          onClick={() => handleStopCrawl(analysis.id)}
          disabled={isActionLoading}
          className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Stop
        </button>
      );
    }
    if (
      analysis.status === "stopped" ||
      analysis.status === "error" ||
      analysis.status === "queued"
    ) {
      return (
        <button
          onClick={() => handleStartCrawl(analysis.id)}
          disabled={isActionLoading}
          className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isActionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Start
        </button>
      );
    }
    return null;
  };

  const runningJobsCount = analyses.filter(
    (a) => a.status === "running" || a.status === "queued"
  ).length;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-blue-950 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-x-auto p-0 sm:p-4 transition-all duration-300">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 rounded-t-3xl">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search URLs..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-background/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-slate-700 dark:text-slate-200"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 text-purple-700 dark:text-purple-200 hover:bg-purple-200/60 transition-colors shadow"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {isPolling && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/30">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                Auto-refreshing ({runningJobsCount} running)
              </span>
            </div>
          )}
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-300">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => onBulkAction("rerun", selectedIds)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Rerun
            </button>
            <button
              onClick={() => onBulkAction("delete", selectedIds)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        )}
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          <thead className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={selectedIds.length === analyses.length && analyses.length > 0}
                  onChange={handleSelectAll}
                  className="accent-purple-500 w-4 h-4 rounded"
                />
              </th>
              <th
                className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none"
                onClick={() => handleSort("url")}
              >
                URL {getSortIcon("url")}
              </th>
              <th
                className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none"
                onClick={() => handleSort("status")}
              >
                Status {getSortIcon("status")}
              </th>
              <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200">Title</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200">Links</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200">Broken</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-200">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading analyses...
                </td>
              </tr>
            ) : analyses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  No analyses found. Add a URL to get started!
                </td>
              </tr>
            ) : (
              analyses.map((analysis) => (
                <tr
                  key={analysis.id}
                  className={`transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${selectedIds.includes(analysis.id) ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(analysis.id)}
                      onChange={() => handleSelectRow(analysis.id)}
                      className="accent-purple-500 w-4 h-4 rounded"
                    />
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    <button
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      onClick={() => onViewDetails(analysis.id)}
                    >
                      {analysis.url}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(analysis.status)}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    {analysis.page_title || <span className="text-slate-400 italic">N/A</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-300 font-semibold">
                      {analysis.internal_links}
                    </span>
                    <span className="mx-1 text-slate-400">/</span>
                    <span className="inline-flex items-center gap-1 text-purple-500 dark:text-purple-300 font-semibold">
                      {analysis.external_links}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {analysis.broken_links > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        <AlertTriangle className="w-4 h-4" />
                        {analysis.broken_links}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                        <CheckSquare className="w-4 h-4" />
                        0
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition-all"
                      onClick={() => onViewDetails(analysis.id)}
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    {getActionButton(analysis)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 rounded-b-3xl">
        <div className="text-slate-500 dark:text-slate-300 text-sm">
          Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total analyses)
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange({ ...pagination, page: Math.max(1, pagination.page - 1) })}
            disabled={pagination.page === 1}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 text-purple-700 dark:text-purple-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange({ ...pagination, page: Math.min(pagination.totalPages, pagination.page + 1) })}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
