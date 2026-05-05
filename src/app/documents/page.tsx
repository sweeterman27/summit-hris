'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, Download, Trash2, Search, Plus, Filter, LayoutGrid, List, CheckSquare } from 'lucide-react';
import DocumentUploadModal from '@/components/ui/DocumentUploadModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Document {
  id: string;
  title: string;
  category: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export default function DocumentLibrary() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes((session?.user as any)?.role?.toUpperCase());

  const fetchDocuments = () => {
    setLoading(true);
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        if (data.success) setDocuments(data.documents);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Purge this resource from the library?')) return;
    const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchDocuments();
  };

  const handleSignOff = async (docId: string, docTitle: string) => {
    const res = await fetch('/api/documents/signoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docId, documentTitle: docTitle })
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Document Acknowledged & Logged to Compliance Registry', {
        style: { background: '#050505', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
      });
    } else {
      toast.error(data.message || 'Signature failed', {
        style: { background: '#050505', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }
      });
    }
  };

  const filtered = documents.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-10">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tighter">Digital Library</h1>
              <p className="text-brand-gold/60 font-semibold tracking-wide mt-1">Enterprise resources & policy archives</p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mb-1 h-12 px-6 bg-brand-gold hover:bg-brand-gold/90 text-brand-obsidian font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-2 shadow-xl shadow-brand-gold/10 transition-all active:scale-[0.98]"
              >
                <Plus size={16} />
                Deploy Resource
              </button>
            )}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none w-80 transition-all backdrop-blur-xl"
            />
          </div>
        </div>

        {/* Library Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-white/5 border border-white/10 rounded-[2rem] animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full py-32 text-center">
                <p className="text-white/20 text-xs font-bold uppercase tracking-[0.3em] italic">No resources found in current index</p>
              </div>
            ) : (
              filtered.map((doc, i) => (
                <motion.div 
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.02] border border-white/5 hover:border-brand-gold/20 rounded-[2rem] p-6 transition-all group relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-4 bg-brand-gold/10 rounded-2xl text-brand-gold group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <div className="flex gap-2">
                        {!isAdmin && (
                          <button 
                            onClick={() => handleSignOff(doc.id, doc.title)}
                            className="p-2 text-white/10 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all group/btn relative"
                          >
                            <CheckSquare size={16} />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-black border border-white/10 text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap text-white">
                              Sign-Off Protocol
                            </div>
                          </button>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(doc.id)}
                            className="p-2 text-white/10 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          className="p-2 text-white/10 hover:text-brand-gold hover:bg-brand-gold/10 rounded-xl transition-all"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-gold/60">{doc.category}</span>
                      <h3 className="text-white font-bold text-lg leading-tight mt-1 group-hover:text-brand-gold transition-colors line-clamp-2">
                        {doc.title}
                      </h3>
                      <p className="text-[10px] text-white/20 font-medium mt-4">
                        {new Date(doc.uploadedAt).toLocaleDateString()} • {doc.type}
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-gold/5 blur-[40px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <DocumentUploadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDocuments}
      />
    </DashboardLayout>
  );
}
