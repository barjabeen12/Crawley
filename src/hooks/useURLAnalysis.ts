import { useState, useEffect, useCallback, useRef } from 'react';
import { URLAnalysis, PaginationParams, APIResponse } from '../types';

export const useURLAnalysis = () => {
  const [analyses, setAnalyses] = useState<URLAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Polling state
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(5000); // 5 seconds
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchParamsRef = useRef<PaginationParams | null>(null);

  const API_BASE_URL = 'http://localhost:8081/api';
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('api_key');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    return headers;
  };

  const fetchAnalyses = useCallback(async (params: PaginationParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
        ...(params.sortBy && { sort_by: params.sortBy }),
        ...(params.sortOrder && { sort_order: params.sortOrder }),
        ...(params.search && { search: params.search }),
        ...(params.status && { status: params.status })
      });

      const response = await fetch(`${API_BASE_URL}/urls?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analyses');
      }

      const result = await response.json();
      
      setAnalyses(result.jobs || []);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      });
      
      // Store last fetch params for polling
      lastFetchParamsRef.current = params;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Silent fetch for polling (doesn't show loading state)
  const silentFetchAnalyses = useCallback(async (params: PaginationParams) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
        ...(params.sortBy && { sort_by: params.sortBy }),
        ...(params.sortOrder && { sort_order: params.sortOrder }),
        ...(params.search && { search: params.search }),
        ...(params.status && { status: params.status })
      });

      const response = await fetch(`${API_BASE_URL}/urls?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalyses(result.jobs || []);
        setPagination({
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        });
      }
    } catch (err) {
      // Silently handle errors in polling
      console.warn('Polling fetch failed:', err);
    }
  }, []);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // Already polling
    
    setIsPolling(true);
    pollingRef.current = setInterval(() => {
      if (lastFetchParamsRef.current) {
        silentFetchAnalyses(lastFetchParamsRef.current);
      }
    }, pollingInterval);
  }, [pollingInterval, silentFetchAnalyses]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Auto-start polling when there are running jobs
  useEffect(() => {
    const hasRunningJobs = analyses.some(analysis => 
      analysis.status === 'running' || analysis.status === 'queued'
    );
    
    if (hasRunningJobs && !isPolling) {
      startPolling();
    } else if (!hasRunningJobs && isPolling) {
      stopPolling();
    }
  }, [analyses, isPolling, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const addURL = async (url: string, autoStart = true) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/urls`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add URL');
      }

      const newAnalysis: URLAnalysis = await response.json();
      setAnalyses(prev => [newAnalysis, ...prev]);
      
      // Auto-start crawl if enabled
      if (autoStart) {
        try {
        
          await startCrawl(newAnalysis.id);
        } catch (startError) {
          console.warn('Failed to auto-start crawl:', startError);
        }
      }
      
      return newAnalysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add URL');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startCrawl = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/urls/${id}/start`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start crawl');
      }

      // Update the specific analysis status to running
      setAnalyses(prev => 
        prev.map(analysis => 
          analysis.id === id 
            ? { ...analysis, status: 'running' }
            : analysis
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start crawl');
      throw err;
    }
  };

  const stopCrawl = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/urls/${id}/stop`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop crawl');
      }

      // Update the specific analysis status to stopped
      setAnalyses(prev => 
        prev.map(analysis => 
          analysis.id === id 
            ? { ...analysis, status: 'stopped' }
            : analysis
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop crawl');
      throw err;
    }
  };

  const deleteAnalyses = async (ids: number[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/urls`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete analyses');
      }
 
      setAnalyses(prev => prev.filter(analysis => !ids.includes(analysis.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete analyses');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rerunAnalyses = async (ids: number[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/urls/rerun`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rerun analyses');
      }

      setAnalyses(prev => 
        prev.map(analysis => 
          ids.includes(analysis.id) 
            ? { ...analysis, status: 'queued' }
            : analysis
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rerun analyses');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyses,
    loading,
    error,
    pagination,
    isPolling,
    pollingInterval,
    fetchAnalyses,
    addURL,
    startCrawl,
    stopCrawl,
    deleteAnalyses,
    rerunAnalyses,
    startPolling,
    stopPolling,
    setPollingInterval,
    setError
  };
};