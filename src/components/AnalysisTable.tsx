import { useState, useMemo } from "react";
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
  onViewDetails: (id: string) => void;
  onBulkAction: (action: "delete" | "rerun", ids: string[]) => void;
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

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleStartCrawl = async (id: string | number) => {
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
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      {/* Header with search and filters */}
      <div className="p-6 border-b border-border/50">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search URLs..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {/* Polling indicator */}
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
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} selected
              </span>
              <button
                onClick={() => onBulkAction("rerun", selectedIds)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Rerun
              </button>
              <button
                onClick={() => onBulkAction("delete", selectedIds)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">All Status</option>
                <option value="queued">Queued</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="error">Error</option>
                <option value="stopped">Stopped</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="p-4 text-left">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center justify-center w-5 h-5"
                >
                  {selectedIds.length === analyses.length &&
                  analyses.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort("title")}
                  className="flex items-center gap-2 font-medium hover:text-purple-400 transition-colors"
                >
                  Title {getSortIcon("title")}
                </button>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort("htmlVersion")}
                  className="flex items-center gap-2 font-medium hover:text-purple-400 transition-colors"
                >
                  HTML Version {getSortIcon("htmlVersion")}
                </button>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort("internalLinks")}
                  className="flex items-center gap-2 font-medium hover:text-purple-400 transition-colors"
                >
                  Internal Links {getSortIcon("internalLinks")}
                </button>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort("externalLinks")}
                  className="flex items-center gap-2 font-medium hover:text-purple-400 transition-colors"
                >
                  External Links {getSortIcon("externalLinks")}
                </button>
              </th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading analyses...
                  </div>
                </td>
              </tr>
            ) : analyses.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-muted-foreground"
                >
                  No analyses found. Add a URL to get started.
                </td>
              </tr>
            ) : (
              analyses.map((analysis) => (
                <tr
                  key={analysis.id}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="p-4">
                    <button
                      onClick={() => handleSelectRow(analysis.id)}
                      className="flex items-center justify-center w-5 h-5"
                    >
                      {selectedIds.includes(analysis.id) ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium">
                        {analysis.page_title || "Untitled"}
                      </div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {analysis.url}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{analysis.html_version}</td>
                  <td className="p-4">{analysis.internal_links}</td>
                  <td className="p-4">{analysis.external_links}</td>
                  <td className="p-4">{getStatusBadge(analysis.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getActionButton(analysis)}
                      <button
                        onClick={() => onViewDetails(analysis.id)}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-border/50 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onPageChange({
                  ...{
                    page: pagination.page - 1,
                    limit: pagination.limit,
                    sortBy,
                    sortOrder,
                  },
                  search: search || undefined,
                  filters: statusFilter ? { status: statusFilter } : undefined,
                })
              }
              disabled={pagination.page <= 1}
              className="px-3 py-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <span className="px-4 py-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() =>
                onPageChange({
                  ...{
                    page: pagination.page + 1,
                    limit: pagination.limit,
                    sortBy,
                    sortOrder,
                  },
                  search: search || undefined,
                  filters: statusFilter ? { status: statusFilter } : undefined,
                })
              }
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
