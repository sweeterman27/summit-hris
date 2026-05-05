'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Network, Search, User, Briefcase, ChevronRight, Activity, Zap, Layers, Sparkles, MousePointer2, Move, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface Employee {
  employeeNo: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  reportsTo: string;
  photo?: string;
  status: string;
}

interface Node extends Employee {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDragging?: boolean;
}

export default function NeuroGraph() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Physics Simulation State
  const [nodes, setNodes] = useState<Node[]>([]);
  const requestRef = useRef<number>(null);

  // Pan and Zoom State (Start with a wider view for large networks)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 900 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Dragging State
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes((session?.user as any)?.role?.toUpperCase());

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmployees(data.employees);
          // Initialize nodes in a more controlled central cluster
          const initialNodes = data.employees.map((emp: Employee) => ({
            ...emp,
            x: 600 + (Math.random() - 0.5) * 400,
            y: 450 + (Math.random() - 0.5) * 400,
            vx: 0,
            vy: 0
          }));
          setNodes(initialNodes);
        }
        setLoading(false);
      });
  }, []);

  // Performance-Harden Simulation for 300+ Nodes
  useEffect(() => {
    if (nodes.length === 0) return;

    const animate = () => {
      setNodes(prevNodes => {
        const nextNodes = prevNodes.map(n => ({ ...n }));
        const k = 0.1; // Stronger attraction for tighter clusters
        const d0 = 80;  // Closer ideal distance
        const repulsion = 3000;
        const center = { x: 600, y: 450 };

        for (let i = 0; i < nextNodes.length; i++) {
          const n1 = nextNodes[i];
          if (n1.employeeNo === draggedNodeId) continue;
          
          // Spatial Hash would be better, but limiting range is a good proxy
          for (let j = 0; j < nextNodes.length; j++) {
            if (i === j) continue;
            const n2 = nextNodes[j];
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const distSq = dx * dx + dy * dy + 0.1;
            
            // Repel strongly only when close to prevent 'starry night' sprawl
            if (distSq < 250000) { 
               const f = repulsion / distSq;
               n1.vx += (dx / Math.sqrt(distSq)) * f;
               n1.vy += (dy / Math.sqrt(distSq)) * f;
            }
          }

          // Hierarchical Structural Pull
          if (n1.reportsTo) {
            const manager = nextNodes.find(m => m.employeeNo === n1.reportsTo);
            if (manager) {
              const dx = manager.x - n1.x;
              const dy = manager.y - n1.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 0) {
                const f = (dist - d0) * k;
                n1.vx += (dx / dist) * f;
                n1.vy += (dy / dist) * f;
                
                if (manager.employeeNo !== draggedNodeId) {
                  manager.vx -= (dx / dist) * f;
                  manager.vy -= (dy / dist) * f;
                }
              }
            }
          }

          // Central Force (The 'Gravity' of the organization)
          const dx = center.x - n1.x;
          const dy = center.y - n1.y;
          n1.vx += dx * 0.005;
          n1.vy += dy * 0.005;

          // High Damping for stability
          n1.vx *= 0.7;
          n1.vy *= 0.7;
        }

        nextNodes.forEach(n => {
          if (n.employeeNo !== draggedNodeId) {
            n.x += n.vx;
            n.y += n.vy;
          }
        });

        return nextNodes;
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [nodes.length > 0, draggedNodeId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as any).tagName === 'svg' || (e.target as any).tagName === 'rect') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = (e.clientX - panStart.x) * (viewBox.w / 800);
      const dy = (e.clientY - panStart.y) * (viewBox.h / 600);
      setViewBox(prev => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (draggedNodeId && svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const x = (e.clientX - CTM.e) / CTM.a;
        const y = (e.clientY - CTM.f) / CTM.d;
        setNodes(prev => prev.map(n => 
          n.employeeNo === draggedNodeId ? { ...n, x, y, vx: 0, vy: 0 } : n
        ));
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  const handleZoom = (delta: number) => {
    setViewBox(prev => {
      const dw = prev.w * delta;
      const dh = prev.h * delta;
      return {
        x: prev.x - (dw - prev.w) / 2,
        y: prev.y - (dh - prev.h) / 2,
        w: dw,
        h: dh
      };
    });
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter flex items-center gap-4">
              <Network className="text-brand-gold animate-pulse" size={36} />
              Neuro-Graph
            </h1>
            <p className="text-brand-gold/60 font-semibold tracking-wide mt-1 uppercase text-[10px] tracking-[0.3em]">Enterprise Architecture Visualizer</p>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Scan Network..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:border-brand-gold/50 outline-none transition-all w-64 font-bold placeholder:text-white/10"
                />
             </div>
             <div className="h-12 px-6 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl flex items-center gap-3">
                <Activity size={16} className="text-brand-gold" />
                <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">{nodes.length} Neurons Active</span>
             </div>
          </div>
        </div>

        <div className="flex-1 relative bg-brand-obsidian border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl group">
           <div 
             className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,162,54,0.15) 1px, transparent 0)', 
               backgroundSize: '40px 40px',
               backgroundPosition: `${-viewBox.x}px ${-viewBox.y}px`
             }} 
           />
           
           <svg 
             ref={svgRef}
             className={`w-full h-full select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
             viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
           >
             <defs>
               <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="rgba(201,162,54,0.1)" />
                 <stop offset="50%" stopColor="rgba(201,162,54,0.4)" />
                 <stop offset="100%" stopColor="rgba(201,162,54,0.1)" />
               </linearGradient>

               <clipPath id="nodeClip">
                  <circle cx="0" cy="0" r="24" />
               </clipPath>
             </defs>

             {/* Connection Lines (Vibrant Gold) */}
             {nodes.length < 500 && nodes.map(n => {
               if (!n.reportsTo) return null;
               const manager = nodes.find(m => m.employeeNo === n.reportsTo);
               if (!manager) return null;
               return (
                 <line
                   key={`${n.employeeNo}-link`}
                   x1={n.x} y1={n.y}
                   x2={manager.x} y2={manager.y}
                   stroke="url(#linkGradient)"
                   strokeWidth="1.5"
                   strokeOpacity="0.6"
                 />
               );
             })}

             {/* Nodes */}
             {nodes.map(n => {
               const isHighlighted = selectedNode?.employeeNo === n.employeeNo;
               const isMatch = searchQuery && `${n.firstName} ${n.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
               const isDragging = draggedNodeId === n.employeeNo;
               const isSelf = (session?.user as any)?.employeeNo === n.employeeNo;
               
               // Uniform large radius for high visibility
               const radius = (isHighlighted || isDragging) ? 40 : (isMatch || isSelf) ? 32 : 24;
               
               return (
                 <g 
                   key={n.employeeNo} 
                   transform={`translate(${n.x},${n.y})`}
                   className="cursor-pointer"
                   onMouseDown={(e) => { e.stopPropagation(); setDraggedNodeId(n.employeeNo); }}
                   onClick={(e) => {
                     e.stopPropagation();
                     setSelectedNode(n);
                   }}
                 >
                    {/* Glow and Aura */}
                    {(isHighlighted || isMatch || isDragging || isSelf) && (
                      <circle r={radius + 15} fill={isSelf ? 'rgba(201,162,54,0.2)' : 'rgba(255,255,255,0.05)'} className="animate-pulse" />
                    )}
                    
                    <circle 
                      r={radius} 
                      fill="#0c0b05" 
                      stroke={isSelf ? '#c9a236' : isHighlighted ? '#fff' : 'rgba(255,255,255,0.2)'} 
                      strokeWidth={isSelf || isHighlighted ? 3 : 1.5}
                    />

                    {/* High-Fidelity Photo Layer */}
                    <g clipPath="url(#nodeClip)" transform={`scale(${radius/24})`}>
                      {n.photo ? (
                        <image href={n.photo} x="-24" y="-24" width="48" height="48" preserveAspectRatio="xMidYMid slice" />
                      ) : (
                        <rect x="-24" y="-24" width="48" height="48" fill="rgba(255,255,255,0.05)" />
                      )}
                    </g>

                    {/* Initials Fallback */}
                    {(!n.photo) && (
                      <text textAnchor="middle" dy=".3em" className="text-[10px] font-black fill-white/60 pointer-events-none uppercase">
                        {n.firstName.charAt(0)}
                      </text>
                    )}

                    {/* High-Fidelity Labeling */}
                    {(isHighlighted || isMatch || isSelf || nodes.length < 100) && (
                      <text 
                        y={radius + 20} 
                        textAnchor="middle" 
                        className={`text-[10px] font-black uppercase tracking-[0.2em] pointer-events-none transition-all ${isSelf || isHighlighted ? 'fill-brand-gold' : 'fill-white/60'}`}
                      >
                        {n.firstName}
                      </text>
                    )}
                 </g>
               );
             })}
           </svg>

           {/* Pro Zoom HUD */}
           <div className="absolute top-10 right-10 flex flex-col gap-3">
              <button onClick={() => handleZoom(0.8)} className="w-14 h-14 bg-brand-obsidian/80 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-brand-gold transition-all shadow-xl group">
                 <ZoomIn size={24} className="group-hover:scale-110 transition-transform" />
              </button>
              <button onClick={() => handleZoom(1.2)} className="w-14 h-14 bg-brand-obsidian/80 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-brand-gold transition-all shadow-xl group">
                 <ZoomOut size={24} className="group-hover:scale-110 transition-transform" />
              </button>
              <button onClick={() => setViewBox({ x: 0, y: 0, w: 1200, h: 900 })} className="w-14 h-14 bg-brand-obsidian/80 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-brand-gold transition-all shadow-xl group">
                 <Maximize size={24} className="group-hover:scale-110 transition-transform" />
              </button>
           </div>

           {/* Interactive Briefing Panel */}
           <AnimatePresence>
             {selectedNode && (
               <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="absolute bottom-8 right-8 w-80 bg-brand-obsidian/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl z-50">
                  <div className="flex items-center justify-between mb-8">
                     <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 overflow-hidden">
                        {selectedNode.photo ? <img src={selectedNode.photo} className="w-full h-full object-cover" /> : <User size={32} className="text-brand-gold" />}
                     </div>
                     <button onClick={() => setSelectedNode(null)} className="text-white/20 hover:text-white transition-colors"><ChevronRight size={24} /></button>
                  </div>
                  <div className="space-y-6">
                     <div>
                        <h3 className="text-2xl font-bold text-white tracking-tighter">{selectedNode.firstName} {selectedNode.lastName}</h3>
                        <p className="text-brand-gold/60 font-black uppercase text-[10px] tracking-widest mt-1">{selectedNode.position}</p>
                     </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">Department</p>
                        <div className="flex items-center gap-3"><Layers size={14} className="text-brand-gold" /><span className="text-xs font-bold text-white uppercase">{selectedNode.department}</span></div>
                     </div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>

           <div className="absolute bottom-10 left-10 flex flex-col gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
                 <Move size={12} className="text-brand-gold" />
                 <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">LMB: Pan Graph</span>
              </div>
           </div>

           {session?.user && (session.user as any).employeeNo !== 'SA-001' && (
             <div className="absolute top-10 left-10">
                <button 
                  onClick={() => {
                    const self = nodes.find(n => n.employeeNo === (session.user as any).employeeNo);
                    if (self) {
                      setViewBox(prev => ({ ...prev, x: self.x - prev.w/2, y: self.y - prev.h/2 }));
                      setSelectedNode(self);
                    }
                  }}
                  className="px-6 h-12 bg-brand-gold text-brand-obsidian rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <User size={16} />
                  Locate My Node
                </button>
             </div>
           )}
        </div>
      </div>
    </DashboardLayout>
  );
}
