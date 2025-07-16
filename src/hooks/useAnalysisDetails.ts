import { useState, useEffect } from 'react';
import { URLAnalysis, BrokenLink } from '../types';

interface AnalysisDetailsResponse {
  job: URLAnalysis;
  broken_links: BrokenLink[];
}

export const useAnalysisDetails = (id: string) => {
  const [analysis, setAnalysis] = useState<URLAnalysis | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const fetchAnalysis = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/urls/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analysis details');
      }

      const result: AnalysisDetailsResponse = await response.json();
      setAnalysis(result.job);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  return { 
    analysis, 
    loading, 
    error, 
  };
};