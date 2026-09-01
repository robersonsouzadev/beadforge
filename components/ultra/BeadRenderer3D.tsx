'use client';

import React, { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useEditorStore } from '@/store/editor-store';
import type { VoxelGrid3D } from '@/core/voxel/voxel-types';

interface BeadInstanceData {
  x: number;
  y: number;
  z: number;
  hex: string;
  code: string;
  layerIndex: number;
}

export function BeadRenderer3D({ grid3D }: { grid3D: VoxelGrid3D }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const {
    activeLayerZ,
    showAllLayers3D,
    explodedSpacing,
    onionSkinEnabled,
    highlightBeadCode,
    active3DTool,
    paintVoxel3D,
    eraseVoxel3D,
  } = useEditorStore();

  const { camera } = useThree();

  // Filtrar e preparar lista de beads a renderizar
  const beadInstances = useMemo(() => {
    const list: BeadInstanceData[] = [];
    if (!grid3D) return list;

    const pitch = grid3D.pitchMm || 2.6;
    const halfW = grid3D.width / 2;
    const halfH = grid3D.height / 2;

    grid3D.layers.forEach((layer, zIdx) => {
      if (!layer.isVisible) return;
      if (!showAllLayers3D && zIdx !== activeLayerZ) return;

      for (let r = 0; r < layer.grid.height; r++) {
        for (let c = 0; c < layer.grid.width; c++) {
          const cell = layer.grid.cells[r][c];
          if (cell.isEmpty || !cell.beadCode) continue;

          list.push({
            x: (c - halfW + 0.5) * pitch,
            y: (halfH - r - 0.5) * pitch,
            z: zIdx * (pitch + explodedSpacing),
            hex: cell.hex,
            code: cell.beadCode,
            layerIndex: zIdx,
          });
        }
      }
    });

    return list;
  }, [grid3D, showAllLayers3D, activeLayerZ, explodedSpacing]);

  // Geometria autêntica do Bead (Tubo vazado com furo central e chanfro suave realista)
  const beadGeometry = useMemo(() => {
    const pitch = grid3D?.pitchMm || 2.6;
    const outerR = pitch * 0.46;
    const innerR = pitch * 0.22;
    const height = pitch * 0.92;

    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);

    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerR, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: pitch * 0.025,
      bevelThickness: pitch * 0.025,
      curveSegments: 16,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center(); // Centraliza o pivô do bead
    return geom;
  }, [grid3D?.pitchMm]);

  // Atualização direta de matrizes e cores na GPU
  useLayoutEffect(() => {
    if (!meshRef.current || beadInstances.length === 0) return;
    const mesh = meshRef.current;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    const rot = new THREE.Euler(Math.PI / 2, 0, 0); // Alinha com o eixo Z de empilhamento

    beadInstances.forEach((bead, i) => {
      matrix.makeRotationFromEuler(rot);
      matrix.setPosition(bead.x, bead.y, bead.z);
      mesh.setMatrixAt(i, matrix);

      // Efeito de destaque ou onion skinning
      if (highlightBeadCode && bead.code !== highlightBeadCode) {
        color.set(bead.hex).multiplyScalar(0.25); // Escurece cores não destacadas
      } else if (onionSkinEnabled && bead.layerIndex !== activeLayerZ) {
        if (bead.layerIndex === activeLayerZ - 1) {
          color.set('#38BDF8').multiplyScalar(0.7); // Camada anterior em azul
        } else if (bead.layerIndex === activeLayerZ + 1) {
          color.set('#4ADE80').multiplyScalar(0.7); // Próxima camada em verde
        } else {
          color.set(bead.hex).multiplyScalar(0.35);
        }
      } else {
        color.set(bead.hex);
      }

      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [beadInstances, highlightBeadCode, onionSkinEnabled, activeLayerZ]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const clickedBead = beadInstances[e.instanceId];
    if (!clickedBead) return;

    const pitch = grid3D.pitchMm || 2.6;
    const halfW = grid3D.width / 2;
    const halfH = grid3D.height / 2;

    const col = Math.round(clickedBead.x / pitch + halfW - 0.5);
    const row = Math.round(halfH - clickedBead.y / pitch - 0.5);

    if (active3DTool === 'paint') {
      paintVoxel3D(col, row, clickedBead.layerIndex);
    } else if (active3DTool === 'remove') {
      eraseVoxel3D(col, row, clickedBead.layerIndex);
    }
  };

  if (beadInstances.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[beadGeometry, undefined, beadInstances.length]}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        roughness={0.28}
        metalness={0.08}
        envMapIntensity={0.8}
      />
    </instancedMesh>
  );
}
