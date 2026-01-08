
import React, { useMemo } from 'react';
import { TreeData } from '../types';
import * as THREE from 'three';

const Tree: React.FC<TreeData> = ({ position, scale }) => {
  // Gera uma nuvem densa de folhagem (Estilo High-Detail Stylized)
  const canopy = useMemo(() => {
    const clusters = [];
    const clusterCount = 35 + Math.floor(Math.random() * 15); // Muita densidade
    
    for (let i = 0; i < clusterCount; i++) {
      // Distribuição esférica para formar a copa
      const phi = Math.acos(-1 + (2 * i) / clusterCount);
      const theta = Math.sqrt(clusterCount * Math.PI) * phi;
      
      const r = 1.2 + Math.random() * 0.8;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) + 3.5; // Elevação da copa
      const z = r * Math.sin(phi) * Math.sin(theta);

      clusters.push({
        pos: [x * (1 + Math.random() * 0.5), y + (Math.random() - 0.5), z * (1 + Math.random() * 0.5)],
        scale: 0.6 + Math.random() * 1.2,
        color: i % 3 === 0 ? "#1b4332" : (i % 2 === 0 ? "#2d6a4f" : "#40916c")
      });
    }
    return clusters;
  }, []);

  return (
    <group position={position} scale={scale}>
      {/* Tronco Robusto */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.5, 3.5, 8]} />
        <meshStandardMaterial color="#3d2b1f" roughness={1} />
      </mesh>

      {/* Galhos de Conexão (Invisíveis ou simples para preencher) */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[0.5, 4, 4]} />
        <meshStandardMaterial color="#3d2b1f" />
      </mesh>

      {/* Copa Ultra-Detalhada */}
      {canopy.map((leaf, i) => (
        <mesh 
          key={i} 
          position={leaf.pos as [number, number, number]} 
          scale={[leaf.scale, leaf.scale, leaf.scale]}
          castShadow 
          receiveShadow
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color={leaf.color} 
            flatShading 
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

export default Tree;
