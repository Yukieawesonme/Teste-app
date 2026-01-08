
import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { inputState } from './InputState';

const CHUNKS_PER_SIDE = 4; // Reduzido de 5 para 4 (16 chunks)
const CHUNK_SIZE = 120; 
const GRASS_PER_CHUNK = 1200; // Reduzido de 2500 para 1200
const WORLD_RADIUS = 600; 

// Material e Geometria compartilhados para evitar excesso de compilação de shaders
const sharedGrassGeo = new THREE.PlaneGeometry(0.12, 0.22, 1, 2);
sharedGrassGeo.translate(0, 0.11, 0);

const sharedGrassMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3() },
    uPlayerPos: { value: new THREE.Vector3() },
    uColorLush: { value: new THREE.Color("#88c45d") },
    uColorDry: { value: new THREE.Color("#b5c46e") },
    uColorBase: { value: new THREE.Color("#3d5a2d") },
    uFogColor: { value: new THREE.Color("#dce6d9") }
  },
  vertexShader: `
    uniform float uTime;
    uniform vec3 uCameraPos;
    uniform vec3 uPlayerPos;
    varying float vElevation;
    varying float vFade;
    varying float vNoise;
    varying float vDistToCamera;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec4 worldBasePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      vDistToCamera = distance(worldBasePos.xyz, uCameraPos);
      
      // Descarte baseado em distância otimizado
      vFade = 1.0 - smoothstep(120.0, 180.0, vDistToCamera);
      
      if (vFade < 0.01) {
        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      float rnd = hash(worldBasePos.xz);
      vNoise = rnd;

      float windTime = uTime * (0.8 + rnd * 0.4);
      float wind = sin(windTime + worldBasePos.x * 1.5 + worldBasePos.z * 1.5) * 0.06;
      
      vec3 dirToPlayer = worldBasePos.xyz - uPlayerPos;
      float distToPlayer = length(dirToPlayer.xz);
      float pushForce = smoothstep(2.0, 0.0, distToPlayer);
      vec2 pushDir = normalize(dirToPlayer.xz + 0.001) * pushForce * 1.0;
      
      vec3 pos = position;
      float heightVar = 0.8 + rnd * 0.4;
      pos.y *= heightVar;

      float bendFactor = pow(uv.y, 1.5);
      pos.x += (wind + pushDir.x) * bendFactor;
      pos.z += pushDir.y * bendFactor;

      vElevation = uv.y;
      vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    varying float vElevation;
    varying float vFade;
    varying float vNoise;
    varying float vDistToCamera;
    uniform vec3 uColorLush;
    uniform vec3 uColorDry;
    uniform vec3 uColorBase;
    uniform vec3 uFogColor;

    void main() {
      if (vFade < 0.05) discard;
      
      vec3 topColor = mix(uColorLush, uColorDry, vNoise * 0.4);
      float grad = pow(vElevation, 0.7);
      vec3 color = mix(uColorBase, topColor, grad);
      
      color *= (0.9 + vNoise * 0.2);

      float distFog = smoothstep(30.0, 160.0, vDistToCamera);
      color = mix(color, uFogColor, distFog * 0.8);
      
      gl_FragColor = vec4(color, vFade);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false // Melhor performance em shaders de transparência (folhagens)
});

const GrassChunk: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < GRASS_PER_CHUNK; i++) {
      const x = (Math.random() - 0.5) * CHUNK_SIZE + position[0];
      const z = (Math.random() - 0.5) * CHUNK_SIZE + position[2];
      if (x*x + z*z > WORLD_RADIUS * WORLD_RADIUS) {
        dummy.position.set(0, -10, 0); 
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(x, 0, z);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.scale.set(1.0, 0.8 + Math.random() * 0.4, 1.0);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [position]);

  useFrame((state) => {
    if (sharedGrassMat) {
      sharedGrassMat.uniforms.uTime.value = state.clock.elapsedTime;
      sharedGrassMat.uniforms.uCameraPos.value.copy(camera.position);
      sharedGrassMat.uniforms.uPlayerPos.value.set(inputState.characterData.x, 0, inputState.characterData.z);
    }
  });

  return <instancedMesh ref={meshRef} args={[sharedGrassGeo, sharedGrassMat, GRASS_PER_CHUNK]} frustumCulled={true} />;
};

const Ground: React.FC = () => {
  const groundMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMossColor: { value: new THREE.Color("#5a7a3e") }, 
        uDirtColor: { value: new THREE.Color("#8d7a5e") }, 
        uPatchColor: { value: new THREE.Color("#4d3d2a") },
        uPlayerPos: { value: new THREE.Vector3() },
        uCameraPos: { value: new THREE.Vector3() },
        uFogColor: { value: new THREE.Color("#dce6d9") }
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uMossColor;
        uniform vec3 uDirtColor;
        uniform vec3 uPatchColor;
        uniform vec3 uPlayerPos;
        uniform vec3 uCameraPos;
        uniform vec3 uFogColor;
        varying vec3 vWorldPos;
        
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
          float n1 = fract(sin(dot(vWorldPos.xz * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
          vec3 baseColor = mix(uMossColor, uDirtColor, n1 * 0.5);
          
          float distToPlayer = distance(vWorldPos.xz, uPlayerPos.xz);
          float distToCam = distance(vWorldPos.xyz, uCameraPos);
          float distFog = smoothstep(80.0, 250.0, distToCam);
          
          baseColor = mix(baseColor, uFogColor, distFog * 0.6);
          gl_FragColor = vec4(baseColor, 1.0);
        }
      `
    });
  }, []);

  useFrame(() => {
    if (groundMat) {
      groundMat.uniforms.uPlayerPos.value.set(inputState.characterData.x, 0, inputState.characterData.z);
      groundMat.uniforms.uCameraPos.value.copy(inputState.characterData.x, 0, inputState.characterData.z);
    }
  });

  const chunks = useMemo(() => {
    const list = [];
    const offset = (CHUNKS_PER_SIDE - 1) * CHUNK_SIZE * 0.5;
    for (let x = 0; x < CHUNKS_PER_SIDE; x++) {
      for (let z = 0; z < CHUNKS_PER_SIDE; z++) {
        list.push([x * CHUNK_SIZE - offset, 0, z * CHUNK_SIZE - offset]);
      }
    }
    return list;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={groundMat}>
        <circleGeometry args={[WORLD_RADIUS + 100, 32]} />
      </mesh>
      {chunks.map((pos, i) => <GrassChunk key={i} position={pos as [number, number, number]} />)}
    </group>
  );
};

export default Ground;
