
import React, { useEffect, useState } from 'react';
import { inputState } from './InputState';

interface UIOverlayProps {
  isPaused: boolean;
  togglePause: () => void;
  isInverted: boolean;
  toggleInvert: () => void;
  onInstall: () => void;
  narrative: string;
  isLoadingNarrative: boolean;
  onTriggerNarrative: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  isPaused, togglePause, isInverted, toggleInvert, onInstall, 
  narrative, isLoadingNarrative, onTriggerNarrative 
}) => {
  const [atBoundary, setAtBoundary] = useState(false);
  const [pos, setPos] = useState({ x: 0, z: 0 });

  useEffect(() => {
    let h = requestAnimationFrame(function loop() {
      setAtBoundary(inputState.characterData.isAtBoundary);
      setPos({ x: inputState.characterData.x, z: inputState.characterData.z });
      h = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(h);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 font-sans">
      {/* Mini Mapa */}
      <div className="absolute top-6 left-6 w-24 h-24 rounded-full border border-white/10 bg-black/30 backdrop-blur-md overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div 
          className="absolute w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"
          style={{ transform: `translate(${48 + pos.x * 0.04}px, ${48 + pos.z * 0.04}px)` }}
        />
      </div>

      {/* Narrativa Gemini */}
      {narrative && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 max-w-lg w-[90%] bg-black/40 backdrop-blur-lg p-6 rounded-2xl border border-green-500/20 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <p className="text-green-300 text-sm font-medium italic leading-relaxed">
            "{narrative}"
          </p>
        </div>
      )}

      {atBoundary && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-xl animate-bounce">
          LIMITE DA MATA
        </div>
      )}

      {/* Botões Superiores */}
      <div className="absolute top-4 right-4 pointer-events-auto flex gap-2">
        <button 
          onClick={onTriggerNarrative} 
          disabled={isLoadingNarrative}
          className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${isLoadingNarrative ? 'bg-zinc-800 text-zinc-500' : 'bg-green-600/40 text-green-400 border border-green-500/30 hover:bg-green-600 hover:text-white'}`}
        >
          {isLoadingNarrative ? "ESCUTANDO..." : "SENTIR A NATUREZA"}
        </button>
        <button onClick={togglePause} className="p-3 bg-black/40 rounded-full text-white border border-white/10 text-[10px] font-bold">
          {isPaused ? "JOGAR" : "PAUSE"}
        </button>
      </div>

      {isPaused && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto p-4">
          <div className="bg-zinc-900 p-8 rounded-3xl text-center border border-white/10 max-w-sm w-full shadow-2xl">
            <h2 className="text-white text-3xl font-black mb-6 italic tracking-tighter">OPÇÕES</h2>
            
            <button onClick={togglePause} className="w-full bg-green-600 text-white py-4 rounded-xl mb-3 font-bold active:scale-95 transition-transform">VOLTAR</button>
            
            <button onClick={toggleInvert} className="w-full bg-white/5 text-white py-4 rounded-xl mb-3 font-bold active:scale-95 transition-transform border border-white/10">
              {isInverted ? "CONTROLES: INVERTIDOS" : "CONTROLES: NORMAL"}
            </button>

            <button onClick={onInstall} className="w-full bg-blue-600/20 text-blue-400 py-4 rounded-xl mb-3 font-bold active:scale-95 transition-transform border border-blue-500/30">
              BAIXAR COMO APK
            </button>

            <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest mt-6">VERDE v1.0.8 • IA NARRATIVE ENABLED</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
