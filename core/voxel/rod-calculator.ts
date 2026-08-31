import type { VoxelGrid3D, SupportRod } from './voxel-types';

export interface RodCalculationOptions {
  minOverlapLayers?: number; // Mínimo de camadas que uma haste deve atravessar (padrão: 4)
  minSpacing?: number; // Distância mínima entre duas hastes em pinos (padrão: 5)
  maxRods?: number; // Número máximo de hastes para não perfurar demais a peça (padrão: 12)
  rodDiameterMm?: number; // 2mm para mini / 3mm para midi (padrão: 2.0)
}

/**
 * Calcula automaticamente a posição e o comprimento ideal de hastes acrílicas (Support Rods)
 * para reforço estrutural de esculturas 3D em camadas de beads.
 * Marca `isRodHole: true` nas células correspondentes.
 */
export function calculateSupportRods(
  grid3D: VoxelGrid3D,
  options: RodCalculationOptions = {}
): { grid3D: VoxelGrid3D; rods: SupportRod[] } {
  const minOverlap = options.minOverlapLayers ?? 4;
  const minSpacing = options.minSpacing ?? 5;
  const maxRods = options.maxRods ?? 12;
  const rodDiameterMm = options.rodDiameterMm ?? (grid3D.pitchMm >= 4.5 ? 3.0 : 2.0);

  const { width, height, layers, pitchMm } = grid3D;
  const numLayers = layers.length;

  if (numLayers < minOverlap) {
    return { grid3D, rods: [] };
  }

  // 1. Rastreia todas as colunas verticais sólidas contínuas
  interface CandidateColumn {
    x: number;
    y: number;
    startZ: number;
    endZ: number;
    length: number;
    score: number; // Prioriza hastes mais longas e centradas na massa
  }

  const candidates: CandidateColumn[] = [];

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let currentStart: number | null = null;

      for (let z = 0; z < numLayers; z++) {
        const cell = layers[z]?.grid?.cells?.[y]?.[x];
        const isSolid = cell && !cell.isEmpty && Boolean(cell.beadCode);

        if (isSolid) {
          if (currentStart === null) currentStart = z;
        } else {
          if (currentStart !== null) {
            const length = z - currentStart;
            if (length >= minOverlap) {
              // Calcula score de centralidade
              const distX = Math.abs(x - width / 2);
              const distY = Math.abs(y - height / 2);
              const centrality = 1 / (1 + distX + distY);
              candidates.push({
                x,
                y,
                startZ: currentStart,
                endZ: z - 1,
                length,
                score: length * 10 + centrality * 5,
              });
            }
            currentStart = null;
          }
        }
      }

      if (currentStart !== null) {
        const length = numLayers - currentStart;
        if (length >= minOverlap) {
          const distX = Math.abs(x - width / 2);
          const distY = Math.abs(y - height / 2);
          const centrality = 1 / (1 + distX + distY);
          candidates.push({
            x,
            y,
            startZ: currentStart,
            endZ: numLayers - 1,
            length,
            score: length * 10 + centrality * 5,
          });
        }
      }
    }
  }

  // 2. Ordena candidatos pelo score (mais longos e centrais primeiro)
  candidates.sort((a, b) => b.score - a.score);

  // 3. Seleciona hastes respeitando o espaçamento mínimo
  const selectedRods: SupportRod[] = [];

  for (const cand of candidates) {
    if (selectedRods.length >= maxRods) break;

    // Verifica se está muito perto de outra haste já selecionada
    const tooClose = selectedRods.some((r) => {
      const dx = r.x - cand.x;
      const dy = r.y - cand.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < minSpacing;
    });

    if (!tooClose) {
      const rodId = `ROD-${selectedRods.length + 1}`;
      selectedRods.push({
        id: rodId,
        x: cand.x,
        y: cand.y,
        startZ: cand.startZ,
        endZ: cand.endZ,
        lengthLayers: cand.length,
        lengthMm: Number((cand.length * (pitchMm || 2.6)).toFixed(1)),
        diameterMm: rodDiameterMm,
      });
    }
  }

  // 4. Clona e atualiza o grid3D marcando `isRodHole: true`
  const updatedLayers = layers.map((layer) => {
    const updatedGrid = {
      ...layer.grid,
      cells: layer.grid.cells.map((rowCells, r) =>
        rowCells.map((cell, c) => {
          const hasRod = selectedRods.some(
            (rod) => rod.x === c && rod.y === r && layer.z >= rod.startZ && layer.z <= rod.endZ
          );
          if (hasRod) {
            return {
              ...cell,
              isRodHole: true,
            };
          }
          return cell;
        })
      ),
    };

    return {
      ...layer,
      grid: updatedGrid,
    };
  });

  const updatedGrid3D: VoxelGrid3D = {
    ...grid3D,
    layers: updatedLayers,
    rods: selectedRods,
  };

  return {
    grid3D: updatedGrid3D,
    rods: selectedRods,
  };
}
