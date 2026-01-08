
import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';

import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import EnvironmentController from './components/EnvironmentController';
import MobileControls from './components/MobileControls';
import { inputState } from './components/InputState';
import { generateWorldDescription } from './services/geminiService';

const App: React.FC = () => {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInverted, setIsInverted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [narrative, setNarrative] = useState("");
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);
  
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleTriggerNarrative = async () => {
    if (isLoadingNarrative) return;
    setIsLoadingNarrative(true);
    const context = `X:${inputState.characterData.x.toFixed(0)}, Z:${inputState.characterData.z.toFixed(0)}. Mata verde.`;
    const desc = await generateWorldDescription(context);
    setNarrative(desc);
    setIsLoadingNarrative(false);
    setTimeout(() => setNarrative(""), 8000);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      alert("Para instalar:\n1. Use o Chrome\n2. Clique em 'Adicionar à tela de início'");
    }
  };

  return (
    <div className="w-full h-screen relative bg-[#0a150a] overflow-hidden touch-none">
      {!isGameStarted ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="text-center p-8 bg-zinc-900 rounded-[3rem] border border-green-500/20 max-w-xs shadow-2xl">
            <h1 className="text-5xl font-black text-white italic mb-2">VERDE</h1>
            <p className="text-zinc-500 text-sm mb-8 uppercase tracking-widest font-bold">APK Mode Enabled</p>
            <button 
              onClick={() => setIsGameStarted(true)}
              className="w-full bg-green-600 py-5 rounded-2xl text-white font-black text-xl shadow-[0_0_30px_rgba(22,163,74,0.4)] active:scale-95 transition-all"
            >
              INICIAR
            </button>
            <button 
              onClick={handleInstall}
              className="mt-6 text-green-500 text-[10px] font-black tracking-[0.3em] uppercase opacity-50 hover:opacity-100"
            >
              Instalar App
            </button>
          </div>
        </div>
      ) : (
        <>
          <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: false }}>
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault fov={55} far={1500} />
              <EnvironmentController />
              <Scene isPaused={isPaused} />
              <Environment preset="forest" />
            </Suspense>
          </Canvas>
          <MobileControls inverted={isInverted} />
          <UIOverlay 
            isPaused={isPaused} 
            togglePause={() => setIsPaused(!isPaused)} 
            isInverted={isInverted} 
            toggleInvert={() => setIsInverted(!isInverted)}
            onInstall={handleInstall}
            narrative={narrative}
            isLoadingNarrative={isLoadingNarrative}
            onTriggerNarrative={handleTriggerNarrative}
          />
        </>
      )}
    </div>
  );
};

export default App;
