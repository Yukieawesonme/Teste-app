import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';

const SceneSky: React.FC = () => {
  const skyRef = useRef<any>(null);
  const cycleDuration = 300;

  useFrame(({ clock }) => {
    const time = (clock.getElapsedTime() % cycleDuration) / cycleDuration;
    const angle = time * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    if (skyRef.current && skyRef.current.material) {
      skyRef.current.material.uniforms.sunPosition.value.set(x, y, 0.3);
    }
  });

  return <Sky ref={skyRef} distance={450000} turbidity={8} rayleigh={3} mieCoefficient={0.005} mieDirectionalG={0.8} />;
};

export default function EnvironmentController() {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const { scene } = useThree();
  const cycleDuration = 300; 

  useMemo(() => {
    scene.fog = new THREE.FogExp2('#c8d6c4', 0.008); 
  }, [scene]);
  
  useFrame(({ clock }) => {
    const time = (clock.getElapsedTime() % cycleDuration) / cycleDuration;
    const angle = time * Math.PI * 2;
    const x = Math.cos(angle) * 200;
    const y = Math.sin(angle) * 200;
    const z = 100; 

    if (sunRef.current) {
      sunRef.current.position.set(x, y, z);
      const isDay = y > 0;
      
      if (isDay) {
        const t = y / 200;
        sunRef.current.intensity = THREE.MathUtils.lerp(0.5, 1.2, t);
        const noonColor = new THREE.Color('#fff9e6');
        const sunsetColor = new THREE.Color('#ff9944');
        sunRef.current.color.lerpColors(sunsetColor, noonColor, t);
        if (ambientRef.current) ambientRef.current.intensity = THREE.MathUtils.lerp(0.4, 0.6, t);
        if (scene.fog) (scene.fog as THREE.FogExp2).color.set('#c8d6c4').lerp(new THREE.Color('#87CEEB'), t * 0.2);
      } else {
        sunRef.current.intensity = 0.1;
        sunRef.current.color.set('#223344');
        if (ambientRef.current) ambientRef.current.intensity = 0.2;
        if (scene.fog) (scene.fog as THREE.FogExp2).color.set('#0a0f0a');
      }
    }
  });

  return (
    <>
      <SceneSky />
      <Stars radius={200} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      <ambientLight ref={ambientRef} intensity={0.5} />
      <directionalLight 
        ref={sunRef}
        position={[100, 150, 100]} 
        intensity={1.0} 
        castShadow 
        shadow-mapSize={[512, 512]} 
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={1}
        shadow-camera-far={300}
      />
    </>
  );
}