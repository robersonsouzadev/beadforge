'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { VoxelGrid3D } from '@/core/voxel/voxel-types';

interface SupportRods3DProps {
  grid3D: VoxelGrid3D;
  explodedSpacing?: number;
  showRods?: boolean;
}

export function SupportRods3D({
  grid3D,
  explodedSpacing = 0,
  showRods = true,
}: SupportRods3DProps) {
  const rods = grid3D.rods;
  const pitch = grid3D.pitchMm || 2.6;
  const halfW = grid3D.width / 2;
  const halfH = grid3D.height / 2;
  const halfD = grid3D.layers.length / 2;

  const rodMeshes = useMemo(() => {
    if (!rods || rods.length === 0 || !showRods) return [];

    return rods.map((rod) => {
      const radius = Math.min(pitch * 0.18, (rod.diameterMm || 2.0) / 2);
      const startPosZ = (rod.startZ - halfD + 0.5) * (pitch + explodedSpacing);
      const endPosZ = (rod.endZ - halfD + 0.5) * (pitch + explodedSpacing);
      const height = Math.max(pitch, endPosZ - startPosZ + pitch * 0.95);
      const centerZ = (startPosZ + endPosZ) / 2;

      const posX = (rod.x - halfW + 0.5) * pitch;
      const posY = (halfH - rod.y - 0.5) * pitch;

      return {
        id: rod.id,
        posX,
        posY,
        centerZ,
        radius,
        height,
      };
    });
  }, [rods, showRods, pitch, halfW, halfH, halfD, explodedSpacing]);

  if (!showRods || rodMeshes.length === 0) return null;

  return (
    <group>
      {rodMeshes.map((rod) => (
        <mesh
          key={rod.id}
          position={[rod.posX, rod.posY, rod.centerZ]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[rod.radius, rod.radius, rod.height, 16]} />
          {/* Material Acrílico Translúcido com Brilho Suave */}
          <meshPhysicalMaterial
            color="#D4AF37"
            roughness={0.15}
            metalness={0.1}
            transmission={0.65}
            thickness={1.2}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}
