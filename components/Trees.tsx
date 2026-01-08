import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { inputState } from './InputState';

const TREE_COUNT = 250; 
const BRANCHES_PER_TREE = 6; 
const ROOTS_PER_TREE = 2;

export default function Trees() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const branchRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const rootRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();

  const { trunkGeo, trunkMat, branchGeo, leafGeo, leafMat, rootGeo, treeTransforms } = useMemo(() => {
    const tGeo = new THREE.CylinderGeometry(0.3, 1.2, 8, 6, 2);
    tGeo.translate(0, 4, 0);
    const bGeo = new THREE.CylinderGeometry(0.05, 0.25, 4, 4);
    bGeo.translate(0, 2, 0);
    const rGeo = new THREE.CylinderGeometry(0.1, 0.4, 2.0, 4);
    rGeo.rotateZ(Math.PI * 0.4);
    rGeo.translate(0.8, 0, 0);

    const tMat = new THREE.ShaderMaterial({
      uniforms: { 
        uCameraPos: { value: new THREE.Vector3() },
        uWoodDark: { value: new THREE.Color("#2a1d15") },
        uWoodLight: { value: new THREE.Color("#5c4b37") },
        uFogColor: { value: new THREE.Color("#dce6d9") }
      },
      vertexShader: `
        uniform vec3 uCameraPos;
        varying float vDist;
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPos = instanceMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vDist = distance(worldPos.xyz, uCameraPos);
          gl_Position = projectionMatrix * viewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uWoodDark;
        uniform vec3 uWoodLight;
        uniform vec3 uFogColor;
        varying float vDist;
        varying vec3 vWorldPos;
        void main() {
          if (vDist > 1200.0) discard;
          vec3 color = mix(uWoodDark, uWoodLight, 0.5);
          float distFog = smoothstep(150.0, 1000.0, vDist);
          color = mix(color, uFogColor, distFog * 0.85);
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const lGeo = new THREE.IcosahedronGeometry(2.2, 0); 
    const lMat = new THREE.ShaderMaterial({
      uniforms: { 
        uCameraPos: { value: new THREE.Vector3() },
        uTime: { value: 0 },
        uFogColor: { value: new THREE.Color("#dce6d9") }
      },
      vertexShader: `
        uniform vec3 uCameraPos;
        uniform float uTime;
        varying float vDist;
        void main() {
          vec4 worldPos = instanceMatrix * vec4(position, 1.0);
          vDist = distance(worldPos.xyz, uCameraPos);
          float wind = sin(uTime * 0.4 + worldPos.x * 0.2) * 0.2;
          vec3 pos = position + vec3(wind, wind * 0.3, 0.0);
          gl_Position = projectionMatrix * viewMatrix * instanceMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying float vDist;
        uniform vec3 uFogColor;
        void main() {
          if (vDist > 1200.0) discard;
          vec3 color = mix(vec3(0.05, 0.2, 0.05), vec3(0.2, 0.4, 0.15), 0.5);
          float distFog = smoothstep(150.0, 1000.0, vDist);
          color = mix(color, uFogColor, distFog * 0.8);
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const transforms = [];
    const collisionSolids = [];
    const radiusMax = 980; 
    for (let i = 0; i < TREE_COUNT; i++) {
      const radius = 10 + Math.sqrt(Math.random()) * radiusMax;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 1.6 + Math.random() * 2.5;
      transforms.push({ x, z, scale, rot: Math.random() * Math.PI, gnarl: Math.random() });
      collisionSolids.push({ x, z, r: 1.0 * scale });
    }
    inputState.worldData.solids = collisionSolids;
    return { trunkGeo: tGeo, trunkMat: tMat, branchGeo: bGeo, leafGeo: lGeo, leafMat: lMat, rootGeo: rGeo, treeTransforms: transforms };
  }, []);

  useEffect(() => {
    if (!trunkRef.current || !branchRef.current || !leafRef.current || !rootRef.current) return;
    const dummy = new THREE.Object3D();
    const branchDummy = new THREE.Object3D();
    const leafDummy = new THREE.Object3D();
    const rootDummy = new THREE.Object3D();
    let branchIdx = 0, leafIdx = 0, rootIdx = 0;

    treeTransforms.forEach((tree, i) => {
      dummy.position.set(tree.x, 0, tree.z);
      dummy.scale.setScalar(tree.scale);
      dummy.rotation.y = tree.rot;
      dummy.updateMatrix();
      trunkRef.current!.setMatrixAt(i, dummy.matrix);

      for (let r = 0; r < ROOTS_PER_TREE; r++) {
        const rootAngle = (r / ROOTS_PER_TREE) * Math.PI * 2 + tree.gnarl;
        rootDummy.position.set(tree.x, 0.1, tree.z);
        rootDummy.scale.set(tree.scale * 0.8, tree.scale * 0.4, tree.scale * 0.8);
        rootDummy.rotation.set(0, rootAngle, 0);
        rootDummy.updateMatrix();
        rootRef.current!.setMatrixAt(rootIdx++, rootDummy.matrix);
      }

      for (let b = 0; b < BRANCHES_PER_TREE; b++) {
        const hPercent = b / BRANCHES_PER_TREE;
        const h = (3.0 + hPercent * 5) * tree.scale;
        const bAngle = (b * 2.4) + (tree.gnarl * Math.PI);
        const tilt = 0.5 + (1.0 - hPercent) * 1.0;
        const len = (0.8 - hPercent * 0.4) * tree.scale;
        branchDummy.position.set(tree.x, h, tree.z);
        branchDummy.scale.set(0.5 * tree.scale, len, 0.5 * tree.scale);
        branchDummy.rotation.set(tilt, bAngle, 0);
        branchDummy.updateMatrix();
        branchRef.current!.setMatrixAt(branchIdx++, branchDummy.matrix);
        
        if (b > 1) {
          const lR = 3.0 * len;
          leafDummy.position.set(tree.x + Math.sin(bAngle)*lR, h + 1.0, tree.z + Math.cos(bAngle)*lR);
          leafDummy.scale.setScalar((1.5 + Math.random()) * tree.scale);
          leafDummy.updateMatrix();
          leafRef.current!.setMatrixAt(leafIdx++, leafDummy.matrix);
        }
      }
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    branchRef.current.instanceMatrix.needsUpdate = true;
    leafRef.current.instanceMatrix.needsUpdate = true;
    rootRef.current.instanceMatrix.needsUpdate = true;

    [trunkRef, branchRef, leafRef, rootRef].forEach(ref => ref.current?.computeBoundingSphere());
  }, [treeTransforms]);

  useFrame((state) => {
    if (trunkMat) trunkMat.uniforms.uCameraPos.value.copy(camera.position);
    if (leafMat) {
      leafMat.uniforms.uCameraPos.value.copy(camera.position);
      leafMat.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, TREE_COUNT]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={rootRef} args={[rootGeo, trunkMat, TREE_COUNT * ROOTS_PER_TREE]} receiveShadow frustumCulled={false} />
      <instancedMesh ref={branchRef} args={[branchGeo, trunkMat, TREE_COUNT * BRANCHES_PER_TREE]} castShadow frustumCulled={false} />
      <instancedMesh ref={leafRef} args={[leafGeo, leafMat, TREE_COUNT * BRANCHES_PER_TREE]} castShadow frustumCulled={false} />
    </group>
  );
}