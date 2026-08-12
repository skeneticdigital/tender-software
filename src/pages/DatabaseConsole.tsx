import React, { useState } from 'react';
import { Database, Play, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export const DatabaseConsole: React.FC = () => {
  const [query, setQuery] = useState('SELECT * FROM User LIMIT 10;');
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const data = await api.executeRawQuery(query);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Error executing query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Database className="w-7 h-7 text-blue-600" />
            MySQL Database Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">Execute raw SQL queries directly against the database</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Editor */}
        <div className="p-4 bg-slate-900 border-b border-slate-800">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-32 bg-transparent text-emerald-400 font-mono text-sm focus:outline-none resize-none"
            placeholder="SELECT * FROM User..."
            spellCheck={false}
          />
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">Press Ctrl+Enter to run or use button</span>
            <button
              onClick={executeQuery}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              Run Query
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="p-4 bg-slate-50 min-h-[300px] overflow-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex gap-3 text-sm font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {results && results.length === 0 && !error && (
            <div className="text-center text-slate-500 py-12 text-sm font-medium">
              0 rows returned.
            </div>
          )}

          {results && results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b-2 border-slate-200">
                  <tr>
                    {Object.keys(results[0]).map(key => (
                      <th key={key} className="px-4 py-3 font-bold text-slate-800 uppercase whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {results.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {Object.values(row).map((val: any, colIdx) => (
                        <td key={colIdx} className="px-4 py-3 font-mono text-[11px] text-slate-700 whitespace-nowrap max-w-xs truncate" title={String(val)}>
                          {val === null ? <span className="text-slate-400 italic">null</span> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-xs font-bold text-slate-500 text-right">
                {results.length} row(s) returned
              </div>
            </div>
          )}
          
          {!results && !error && !loading && (
            <div className="text-center text-slate-400 py-12 text-sm">
              Enter a query and click Run to see results here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
