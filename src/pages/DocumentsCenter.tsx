import React, { useState, useEffect } from 'react';
import { FolderKanban, Upload, Search, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { AppDocument } from '../types';

export const DocumentsCenter: React.FC = () => {
  const [docs, setDocs] = useState<AppDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDocuments().then(res => setDocs(res)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Document Management Center</h1>
          <p className="text-xs text-slate-500 mt-1">Central repository for Tender NITs, Contracts, BOQ Schedules, Work Orders and Invoices</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center text-slate-400 py-8">Loading documents...</div>
          ) : (
            docs.map((d) => (
              <div key={d.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {d.category}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-2">{d.fileName}</h3>
                  <div className="text-xs text-slate-500 mt-1">Linked to: {d.relatedName}</div>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs">
                  <span className="text-slate-400">{d.fileSize}</span>
                  <a 
                    href={d.fileUrl !== '#' ? d.fileUrl : '#'} 
                    download={d.fileName}
                    target={d.fileUrl !== '#' ? "_blank" : undefined}
                    rel="noreferrer" 
                    className="font-bold text-blue-600 hover:underline cursor-pointer"
                    onClick={(e) => {
                      if (d.fileUrl === '#') {
                        e.preventDefault();
                        const blob = new Blob([`Dummy content for ${d.fileName}`], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = d.fileName;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                  >
                    Download Document
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
