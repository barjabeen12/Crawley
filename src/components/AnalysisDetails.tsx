import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Globe,
  Link as LinkIcon,
  Heading1,
  Lock,
  Clock,
  Loader,
  XCircle,
  Check,
  Pause
} from 'lucide-react';
import { URLAnalysis } from '../types';

interface AnalysisDetailsProps {
  analysis: URLAnalysis;
  loading: boolean;
}

export const AnalysisDetails = ({ analysis, loading }: AnalysisDetailsProps) => {
  const totalLinks = analysis.internal_links + analysis.external_links;
  const internalPercentage = totalLinks > 0 ? (analysis.internal_links / totalLinks) * 100 : 0;
  const externalPercentage = totalLinks > 0 ? (analysis.external_links / totalLinks) * 100 : 0;

  const formatDateTime = (dt?: string) => dt ? new Date(dt).toLocaleString() : '-';

  const statusColorMap = {
    queued: 'text-gray-500',
    running: 'text-blue-500',
    completed: 'text-green-600',
    error: 'text-red-600',
    stopped: 'text-yellow-500',
  };

  const statusIconMap = {
    queued: <Clock className="w-5 h-5" />,
    running: <Loader className="w-5 h-5 animate-spin" />,
    completed: <Check className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    stopped: <Pause className="w-5 h-5" />,
  };

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto p-6 max-w-6xl">
        
       
        <div className="mb-8">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <div className="font-medium text-gray-800 text-lg">{analysis.page_title || 'N/A'}</div>
                </div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Globe className="w-4 h-4" />
                  <a
                    href={analysis.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-600 transition-colors flex items-center gap-1 break-all"
                  >
                    {analysis.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold mb-1 text-gray-800">{analysis.html_version || 'Unknown'}</div>
                <div className="text-sm text-gray-500">HTML Version</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-gray-500 text-sm mb-1">Status</div>
                <div className={`font-semibold flex items-center gap-2 ${statusColorMap[analysis.status]}`}>
                  {statusIconMap[analysis.status]} {analysis.status.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Started At</div>
                <div className="text-gray-800">{formatDateTime(analysis.started_at)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Completed At</div>
                <div className="text-gray-800">{formatDateTime(analysis.completed_at)}</div>
              </div>
            </div>
          </div>
        </div>

      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-lg font-semibold mb-6 text-gray-800">Page Metadata</h2>
            <div className="mb-2">
              <div className="text-sm text-gray-500 mb-1">Page Title</div>
              <div className="font-medium text-gray-800">{analysis.page_title || 'N/A'}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <div key={level} className="text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Heading1 className="w-4 h-4" /> H{level}
                  </div>
                  <div className="font-semibold mt-1 text-gray-800">
                    {analysis[`h${level}_count` as keyof URLAnalysis] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

         
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-lg font-semibold mb-6 text-gray-800">Page Insights</h2>
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Login Form Detected</div>
              <div className="flex items-center gap-2 font-medium text-gray-800">
                <Lock className="w-4 h-4" />
                {analysis.has_login_form ? 'Yes' : 'No'}
              </div>
            </div>
            {analysis.error_message && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 shadow-sm">
                <div className="font-medium mb-1">Error Message:</div>
                <div>{analysis.error_message}</div>
              </div>
            )}
          </div>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{analysis.internal_links}</div>
                <div className="text-sm text-gray-500">Internal Links</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center shadow-sm">
                <ExternalLink className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{analysis.external_links}</div>
                <div className="text-sm text-gray-500">External Links</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{analysis.broken_links}</div>
                <div className="text-sm text-gray-500">Broken Links</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Link Distribution</h2>
            
            {totalLinks > 0 ? (
              <div className="space-y-6">
                {/* Donut Chart Representation */}
                <div className="relative w-48 h-48 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke="#e5e7eb"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="10"
                      strokeDasharray={`${internalPercentage * 2.199} ${(100 - internalPercentage) * 2.199}`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray={`${externalPercentage * 2.199} ${(100 - externalPercentage) * 2.199}`}
                      strokeDashoffset={`-${internalPercentage * 2.199}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{totalLinks}</div>
                      <div className="text-sm text-gray-500">Total Links</div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                      <span className="text-gray-700">Internal Links</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">{analysis.internal_links}</div>
                      <div className="text-sm text-gray-500">{internalPercentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                      <span className="text-gray-700">External Links</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">{analysis.external_links}</div>
                      <div className="text-sm text-gray-500">{externalPercentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                No links found
              </div>
            )}
          </div>

          {/* Broken Links */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Broken Links</h2>
            
            {analysis.broken_links > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* {analysis.broken_links.map((brokenLink) => (
                  <div 
                    key={brokenLink.id}
                    className="p-4 bg-red-50 border border-red-200 rounded-2xl shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-red-700 break-all">
                          {brokenLink.url}
                        </div>
                        <div className="text-sm text-red-600 mt-1">
                          Status: {brokenLink.statusCode} - {brokenLink.statusText}
                        </div>
                      </div>
                    </div>
                  </div>
                ))} */}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <div className="text-green-600 font-medium">No broken links found!</div>
                <div className="text-sm text-gray-500 mt-1">
                  All links are working properly
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};