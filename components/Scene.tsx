
import React from 'react';
// Fix: Added ThreeElements import to resolve JSX intrinsic element errors
import { ThreeElements } from '@react-three/fiber';
import Trees from './Trees';
import Bushes from './Bushes';
import Character from './Character';
import Ground from './Ground';
import GroundDebris from './GroundDebris';
import Clouds from './Clouds';

const Scene: React.FC<{ isPaused?: boolean }> = ({ isPaused = false }) => {
  return (
    <group>
      <Ground />
      <GroundDebris />
      <Bushes />
      <Trees />
      <Clouds />
      <Character isPaused={isPaused} />
    </group>
  );
};

export default Scene;
