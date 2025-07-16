// types.ts

export interface URLAnalysis {
  id?:  number;
  user_id: number;
  url: string;
  status: 'queued' | 'running' | 'completed' | 'error' | 'stopped';
  html_version?: string;
  page_title?: string;
  h1_count?: number;
  h2_count?: number;
  h3_count?: number;
  h4_count?: number;
  h5_count?: number;
  h6_count?: number;
  internal_links?: number;
  external_links?: number;
  broken_links?: number;
  has_login_form?: boolean;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface BrokenLink {
  id: number;
  crawl_job_id: number;
  url: string;
  status_code: number;
  created_at: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: 'queued' | 'running' | 'completed' | 'error' | 'stopped';
  filters?: { status: string };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface APIResponse<T> {
  data: T;
  pagination?: PaginationInfo;
  message?: string;
  error?: string;
}

export interface CrawlJobsResponse {
  jobs: URLAnalysis[];
  total: number;
  page: number;
  limit: number;
}

export interface CrawlJobDetailsResponse {
  job: URLAnalysis;
  broken_links: BrokenLink[];
}

export interface AuthResponse {
  token?: string;
  api_key: string;
  message?: string;
}

export interface User {
  id: number;
  username: string;
}

export interface HealthResponse {
  status: string;
}

export interface BulkOperationResponse {
  message: string;
  deleted?: number;
  count?: number;
}

export interface ErrorResponse {
  error: string;
}