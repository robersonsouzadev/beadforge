import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { STLLoader } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';
import { ThreeMFLoader } from 'three-stdlib';
import { parseVoxBinary } from './vox-parser';
import { VoxelEngine } from './voxelizer';
import { Bambu3MFParser } from './bambu-3mf-parser';
import type { BeadColor } from '@/core/schemas/palette';
import type { VoxelGrid3D, FillMode } from './voxel-types';

export interface ModelLoadOptions {
  width: number;
  height: number;
  depth: number;
  fillMode: FillMode;
  wallThickness?: number;
  pitchMm?: number;
}

export class Model3DLoader {
  private engine: VoxelEngine;

  constructor(palette: BeadColor[]) {
    this.engine = new VoxelEngine(palette);
  }

  /**
   * Carrega e voxeliza qualquer arquivo suportado (.vox, .obj, .stl, .glb, .gltf, .3mf)
   */
  public async loadFromFile(
    file: File,
    options: ModelLoadOptions
  ): Promise<VoxelGrid3D> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    if (ext === 'vox') {
      return this.loadVoxBuffer(arrayBuffer, options);
    } else if (ext === 'stl') {
      return this.loadStlBuffer(arrayBuffer, options);
    } else if (ext === '3mf') {
      return this.load3mfBuffer(arrayBuffer, options);
    } else if (ext === 'obj') {
      const text = new TextDecoder().decode(arrayBuffer);
      return this.loadObjText(text, options);
    } else if (ext === 'glb' || ext === 'gltf') {
      return this.loadGlbBuffer(arrayBuffer, options);
    } else {
      throw new Error(`Formato .${ext} não suportado. Formatos aceitos: .3mf, .vox, .obj, .stl, .glb, .gltf`);
    }
  }

  /**
   * Processa arquivo .VOX do MagicaVoxel
   */
  public loadVoxBuffer(buffer: ArrayBuffer, options: ModelLoadOptions): VoxelGrid3D {
    const parsed = parseVoxBinary(buffer);
    const rawVoxels = parsed.voxels.map((v) => ({
      x: v.x,
      y: v.y,
      z: v.z,
      rgb: { r: v.rgba.r, g: v.rgba.g, b: v.rgba.b },
    }));

    return this.engine.buildFromRawVoxels(
      rawVoxels,
      options.width,
      options.height,
      options.depth,
      {
        fillMode: options.fillMode,
        wallThickness: options.wallThickness || 1,
        pitchMm: options.pitchMm || 2.6,
      }
    );
  }

  /**
   * Processa arquivo .3MF (Bambu Studio, OrcaSlicer, MakerWorld, Prusa e 3D Builder)
   */
  public async load3mfBuffer(buffer: ArrayBuffer, options: ModelLoadOptions): Promise<VoxelGrid3D> {
    try {
      // 1. Tentar parser nativo do Bambu Studio / OrcaSlicer com cores completas de filamento e pintura facial
      const bambuParsed = await Bambu3MFParser.parse(buffer);
      if (bambuParsed && bambuParsed.positions.length > 0) {
        const rawVoxels = this.engine.voxelizeTriangleMesh(
          bambuParsed.positions,
          undefined,
          bambuParsed.colors,
          { width: options.width, height: options.height, depth: options.depth }
        );

        return this.engine.buildFromRawVoxels(
          rawVoxels,
          options.width,
          options.height,
          options.depth,
          {
            fillMode: options.fillMode,
            wallThickness: options.wallThickness || 1,
            pitchMm: options.pitchMm || 2.6,
          }
        );
      }
    } catch (bambuErr) {
      console.warn('Parser Bambu 3MF falhou, usando ThreeMFLoader fallback:', bambuErr);
    }

    // Fallback: ThreeMFLoader padrão
    const loader = new ThreeMFLoader();
    const group = loader.parse(buffer);

    const positionsArr: number[] = [];
    const colorsArr: number[] = [];

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geom = mesh.geometry;
        const pos = geom.attributes.position;
        const col = geom.attributes.color;

        let meshRgb = { r: 0.8, g: 0.3, b: 0.3 };
        if (mesh.material) {
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          if ((mat as any).color) {
            meshRgb = {
              r: (mat as any).color.r,
              g: (mat as any).color.g,
              b: (mat as any).color.b,
            };
          }
        }

        for (let i = 0; i < pos.count; i++) {
          positionsArr.push(pos.getX(i), pos.getY(i), pos.getZ(i));
          if (col) {
            colorsArr.push(col.getX(i), col.getY(i), col.getZ(i));
          } else {
            colorsArr.push(meshRgb.r, meshRgb.g, meshRgb.b);
          }
        }
      }
    });

    const positions = new Float32Array(positionsArr);
    const colors = new Float32Array(colorsArr);

    const rawVoxels = this.engine.voxelizeTriangleMesh(
      positions,
      undefined,
      colors,
      { width: options.width, height: options.height, depth: options.depth }
    );

    return this.engine.buildFromRawVoxels(
      rawVoxels,
      options.width,
      options.height,
      options.depth,
      {
        fillMode: options.fillMode,
        wallThickness: options.wallThickness || 1,
        pitchMm: options.pitchMm || 2.6,
      }
    );
  }

  /**
   * Processa arquivo .STL (Impressão 3D)
   */
  public loadStlBuffer(buffer: ArrayBuffer, options: ModelLoadOptions): VoxelGrid3D {
    const loader = new STLLoader();
    const geometry = loader.parse(buffer);

    const positions = geometry.attributes.position.array as Float32Array;
    const rawVoxels = this.engine.voxelizeTriangleMesh(
      positions,
      undefined,
      undefined,
      { width: options.width, height: options.height, depth: options.depth }
    );

    return this.engine.buildFromRawVoxels(
      rawVoxels,
      options.width,
      options.height,
      options.depth,
      {
        fillMode: options.fillMode,
        wallThickness: options.wallThickness || 1,
        pitchMm: options.pitchMm || 2.6,
      }
    );
  }

  /**
   * Processa arquivo .OBJ (Wavefront)
   */
  public loadObjText(text: string, options: ModelLoadOptions): VoxelGrid3D {
    const loader = new OBJLoader();
    const group = loader.parse(text);

    const positionsArr: number[] = [];
    const colorsArr: number[] = [];

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geom = mesh.geometry;
        const pos = geom.attributes.position;
        const col = geom.attributes.color;

        for (let i = 0; i < pos.count; i++) {
          positionsArr.push(pos.getX(i), pos.getY(i), pos.getZ(i));
          if (col) {
            colorsArr.push(col.getX(i), col.getY(i), col.getZ(i));
          } else {
            colorsArr.push(0.7, 0.7, 0.8);
          }
        }
      }
    });

    const positions = new Float32Array(positionsArr);
    const colors = new Float32Array(colorsArr);

    const rawVoxels = this.engine.voxelizeTriangleMesh(
      positions,
      undefined,
      colors,
      { width: options.width, height: options.height, depth: options.depth }
    );

    return this.engine.buildFromRawVoxels(
      rawVoxels,
      options.width,
      options.height,
      options.depth,
      {
        fillMode: options.fillMode,
        wallThickness: options.wallThickness || 1,
        pitchMm: options.pitchMm || 2.6,
      }
    );
  }

  /**
   * Processa arquivo .GLB / .glTF
   */
  public async loadGlbBuffer(buffer: ArrayBuffer, options: ModelLoadOptions): Promise<VoxelGrid3D> {
    const loader = new GLTFLoader();
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.parse(buffer, '', resolve, reject);
    });

    const positionsArr: number[] = [];
    const colorsArr: number[] = [];

    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        const geom = child.geometry;
        const pos = geom.attributes.position;
        const col = geom.attributes.color;

        for (let i = 0; i < pos.count; i++) {
          positionsArr.push(pos.getX(i), pos.getY(i), pos.getZ(i));
          if (col) {
            colorsArr.push(col.getX(i), col.getY(i), col.getZ(i));
          } else {
            colorsArr.push(0.8, 0.4, 0.4);
          }
        }
      }
    });

    const positions = new Float32Array(positionsArr);
    const colors = new Float32Array(colorsArr);

    const rawVoxels = this.engine.voxelizeTriangleMesh(
      positions,
      undefined,
      colors,
      { width: options.width, height: options.height, depth: options.depth }
    );

    return this.engine.buildFromRawVoxels(
      rawVoxels,
      options.width,
      options.height,
      options.depth,
      {
        fillMode: options.fillMode,
        wallThickness: options.wallThickness || 1,
        pitchMm: options.pitchMm || 2.6,
      }
    );
  }
}
