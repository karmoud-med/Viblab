import React, { useState, useRef } from 'react';
import { 
  Layers, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ExternalLink, 
  HelpCircle,
  Activity,
  Zap,
  Info
} from 'lucide-react';

interface LoosenessMisalignmentResonanceProps {
  theme?: 'dark' | 'light' | 'mono';
}

export default function LoosenessMisalignmentResonance({ theme = 'light' }: LoosenessMisalignmentResonanceProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Exit fullscreen error:', err);
      });
    }
  };

  const reloadSimulation = () => {
    setIframeKey(prev => prev + 1);
  };

  const openInNewTab = () => {
    window.open('/structure-jeu-3d/index.html', '_blank');
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col flex-1 w-full transition-colors ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#F8FAFC]' : ''
      }`}
    >
      {/* Top Banner Toolbar */}
      <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-[#E3E1DA]' : 'bg-[#0F172A] border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-base font-bold tracking-tight ${isLight ? 'text-[#0F1B2D]' : 'text-slate-100'}`}>
                Structure &amp; Jeu 3D — Résonance, Jeu mécanique &amp; Désalignement
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Module Interactif 3D
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-[#5B6675]' : 'text-slate-400'}`}>
              Banc didactique virtuel : Vitesse critique (Bode), desserrage de patte (harmoniques) et défauts d'alignement d'arbres.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={reloadSimulation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isLight 
                ? 'bg-[#F8F7F4] border-[#D6D3CA] text-[#0F1B2D] hover:bg-slate-200' 
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Réinitialiser la simulation 3D"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>

          <button
            onClick={openInNewTab}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isLight 
                ? 'bg-[#F8F7F4] border-[#D6D3CA] text-[#0F1B2D] hover:bg-slate-200' 
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Ouvrir dans une nouvelle fenêtre dédiée"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Plein écran externe</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer`}
            title="Basculer en mode immersif plein écran"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Quitter plein écran' : 'Plein écran'}</span>
          </button>
        </div>
      </div>

      {/* Embed Frame */}
      <div className="flex-1 w-full bg-[#f8fafc] relative overflow-hidden min-h-[calc(100vh-140px)]">
        <iframe
          key={iframeKey}
          src="/structure-jeu-3d/index.html"
          title="Structure et Jeu 3D — VibLab"
          className="w-full h-full min-h-[calc(100vh-140px)] border-0"
          style={{ minHeight: isFullscreen ? '100vh' : 'calc(100vh - 120px)' }}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        />
      </div>
    </div>
  );
}
