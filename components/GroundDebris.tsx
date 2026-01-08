
import React, { useMemo, useRef, useEffect } from 'react';
// Fix: Added ThreeElements import to resolve JSX intrinsic element errors
import { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

const TWIG_COUNT = 500; // Reduzido de 2000
const DIRT_MOUND_COUNT = 300; // Reduzido de 1000
const LEAF_DEBRIS_COUNT = 400; // Reduzido de 1200
const FALLEN_LOG_COUNT = 40; // Reduzido de 150
const DEBRIS_RADIUS = 580;

const GroundDebris: React.FC = () => {
  const twigRef = useRef<THREE.InstancedMesh>(null);
  const moundRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const logRef = useRef<THREE.InstancedMesh>(null);

  const { twigGeo, twigMat, moundGeo, moundMat, leafGeo, leafMat, logGeo, logMat } = useMemo(() => {
    const tGeo = new THREE.CylinderGeometry(0.015, 0.025, 1.2, 4);
    tGeo.rotateZ(Math.PI / 2);
    const tMat = new THREE.MeshStandardMaterial({ color: "#2d1e14", roughness: 1 });
    const mGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const mMat = new THREE.MeshStandardMaterial({ color: "#1a110a", roughness: 1 });
    const lGeo = new THREE.PlaneGeometry(0.15, 0.1);
    lGeo.rotateX(-Math.PI / 2);
    const lMat = new THREE.MeshStandardMaterial({ color: "#263d18", side: THREE.DoubleSide, roughness: 1 });
    const lgGeo = new THREE.CylinderGeometry(0.2, 0.25, 2.5, 5);
    lgGeo.rotateZ(Math.PI / 2);
    const lgMat = new THREE.MeshStandardMaterial({ color: "#3a2a1a", roughness: 1 });
    return { twigGeo: tGeo, twigMat: tMat, moundGeo: mGeo, moundMat: mMat, leafGeo: lGeo, leafMat: lMat, logGeo: lgGeo, logMat: lgMat };
  }, []);

  useEffect(() => {
    if (!twigRef.current || !moundRef.current || !leafRef.current || !logRef.current) return;
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < TWIG_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 5 + Math.sqrt(Math.random()) * DEBRIS_RADIUS;
      dummy.position.set(Math.cos(angle) * r, 0.02, Math.sin(angle) * r);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.setScalar(0.8 + Math.random());
      dummy.updateMatrix();
      twigRef.current.setMatrixAt(i, dummy.matrix);
    }

    for (let i = 0; i < DIRT_MOUND_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 4 + Math.sqrt(Math.random()) * DEBRIS_RADIUS;
      dummy.position.set(Math.cos(angle) * r, 0.005, Math.sin(angle) * r);
      dummy.scale.set(1, 0.2, 1);
      dummy.updateMatrix();
      moundRef.current.setMatrixAt(i, dummy.matrix);
    }

    for (let i = 0; i < LEAF_DEBRIS_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 3 + Math.sqrt(Math.random()) * DEBRIS_RADIUS;
      dummy.position.set(Math.cos(angle) * r, 0.01, Math.sin(angle) * r);
      dummy.updateMatrix();
      leafRef.current.setMatrixAt(i, dummy.matrix);
    }

    for (let i = 0; i < FALLEN_LOG_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 10 + Math.sqrt(Math.random()) * DEBRIS_RADIUS;
      dummy.position.set(Math.cos(angle) * r, 0.12, Math.sin(angle) * r);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      logRef.current.setMatrixAt(i, dummy.matrix);
    }

    twigRef.current.instanceMatrix.needsUpdate = true;
    moundRef.current.instanceMatrix.needsUpdate = true;
    leafRef.current.instanceMatrix.needsUpdate = true;
    logRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={twigRef} args={[twigGeo, twigMat, TWIG_COUNT]} frustumCulled={true} />
      <instancedMesh ref={moundRef} args={[moundGeo, moundMat, DIRT_MOUND_COUNT]} frustumCulled={true} />
      <instancedMesh ref={leafRef} args={[leafGeo, leafMat, LEAF_DEBRIS_COUNT]} frustumCulled={true} />
      <instancedMesh ref={logRef} args={[logGeo, logMat, FALLEN_LOG_COUNT]} castShadow frustumCulled={true} />
    </group>
  );
};

export default GroundDebris;
