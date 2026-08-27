import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MultipartLoader } from '../../core/voxel/multipart-loader';
import { PALETTES } from '../../data/palettes/index';

describe('Multipart 3D Loader & Part Color Manager', () => {
  const palette = PALETTES['mini-26mm-120'].colors;
  const loader = new MultipartLoader(palette);

  it('deve formatar nomes de partes de forma limpa e legível', () => {
    const fn = (loader as any).formatPartName.bind(loader);
    expect(fn('obj_7_body.stl')).toContain('Corpo');
    expect(fn('obj_12_leg2.stl')).toContain('Perna');
    expect(fn('obj_2_logo.stl')).toContain('Logo');
    expect(fn('obj_3_eye2-2.stl')).toContain('Olho');
  });

  it('deve sugerir cores apropriadas para partes típicas de 3D print (Homem-Aranha etc)', () => {
    const fn = (loader as any).suggestBeadColor.bind(loader);

    const eyeSuggestion = fn('obj_3_eye2.stl', 0);
    expect(eyeSuggestion.category).toContain('Olhos');

    const logoSuggestion = fn('obj_2_logo.stl', 1);
    expect(logoSuggestion.category).toContain('Logo');

    const legSuggestion = fn('obj_9_leg1.stl', 2);
    expect(legSuggestion.category).toContain('Pernas');

    const bodySuggestion = fn('obj_7_body.stl', 3);
    expect(bodySuggestion.category).toContain('Corpo');
  });

  it('deve mesclar e voxelizar múltiplas partes conservando as cores atribuídas a cada uma', () => {
    // Cria 2 geometrias simples: Parte 1 (Cubo vermelho) e Parte 2 (Cubo azul)
    const geom1 = new THREE.BoxGeometry(5, 5, 5);
    const geom2 = new THREE.BoxGeometry(5, 5, 5);
    geom2.translate(0, 0, 6); // Posiciona acima da parte 1

    const redBead = palette.find((b) => b.name.toLowerCase().includes('vermelho')) || palette[0];
    const blueBead = palette.find((b) => b.name.toLowerCase().includes('azul')) || palette[1];

    const parts = [
      {
        id: 'part_1',
        fileName: 'body.stl',
        name: 'Corpo',
        geometry: geom1,
        assignedBead: redBead,
        suggestedColorCategory: 'Corpo',
        vertexCount: 24,
        triangleCount: 12,
        isVisible: true,
      },
      {
        id: 'part_2',
        fileName: 'legs.stl',
        name: 'Pernas',
        geometry: geom2,
        assignedBead: blueBead,
        suggestedColorCategory: 'Pernas',
        vertexCount: 24,
        triangleCount: 12,
        isVisible: true,
      },
    ];

    const grid3D = loader.mergeAndVoxelize(parts, {
      width: 15,
      height: 15,
      depth: 10,
      fillMode: 'solid',
      pitchMm: 2.6,
    });

    expect(grid3D.totalBeads).toBeGreaterThan(0);
    expect(grid3D.layers.length).toBe(10);

    // Verificar se as cores de ambas as partes estão presentes no grid 3D
    const presentCodes = new Set<string>();
    for (const layer of grid3D.layers) {
      for (const row of layer.grid.cells) {
        for (const cell of row) {
          if (!cell.isEmpty && cell.beadCode) {
            presentCodes.add(cell.beadCode);
          }
        }
      }
    }

    expect(presentCodes.has(redBead.code)).toBe(true);
    expect(presentCodes.has(blueBead.code)).toBe(true);
  });
});
