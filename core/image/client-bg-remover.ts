/**
 * Remoção Inteligente de Fundo Branco / Sólido no Navegador.
 * Utiliza BFS (Flood-Fill) a partir das 4 bordas para garantir que detalhes brancos
 * internos da arte (como olhos, dentes ou roupas) NUNCA sejam apagados.
 */
export interface RemoveBackgroundOptions {
  tolerance?: number; // 0 a 100 (padrão: 30)
  targetBgColor?: { r: number; g: number; b: number }; // Opcional, auto-detecta se não fornecido
}

export async function removeBackgroundFromImage(
  imageSource: string | File | Blob | HTMLImageElement,
  options: RemoveBackgroundOptions = {}
): Promise<{ dataUrl: string; blob: Blob }> {
  const tolerance = options.tolerance ?? 30;

  // 1. Carregar elemento de imagem
  let img: HTMLImageElement;
  if (imageSource instanceof HTMLImageElement) {
    img = imageSource;
  } else {
    img = new Image();
    img.crossOrigin = 'anonymous';
    const src =
      typeof imageSource === 'string'
        ? imageSource
        : URL.createObjectURL(imageSource);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Falha ao carregar imagem para remover fundo.'));
      img.src = src;
    });
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Não foi possível obter contexto do canvas.');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 2. Auto-detectar cor de fundo nas 4 pontas/bordas
  let bgR = 255;
  let bgG = 255;
  let bgB = 255;

  if (options.targetBgColor) {
    bgR = options.targetBgColor.r;
    bgG = options.targetBgColor.g;
    bgB = options.targetBgColor.b;
  } else {
    // Amostrar cantos
    const corners = [
      0, // top-left
      (width - 1) * 4, // top-right
      ((height - 1) * width) * 4, // bottom-left
      ((height - 1) * width + (width - 1)) * 4, // bottom-right
    ];

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let validCorners = 0;

    for (const cIdx of corners) {
      if (data[cIdx + 3] > 10) {
        rSum += data[cIdx];
        gSum += data[cIdx + 1];
        bSum += data[cIdx + 2];
        validCorners++;
      }
    }

    if (validCorners > 0) {
      bgR = Math.round(rSum / validCorners);
      bgG = Math.round(gSum / validCorners);
      bgB = Math.round(bSum / validCorners);
    }
  }

  // 3. Flood-Fill (BFS) a partir das bordas perimetrais
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const isColorSimilar = (r: number, g: number, b: number, a: number): boolean => {
    if (a < 20) return true; // Já transparente
    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
    );
    return dist <= tolerance * 2.55; // tolerance 0-100 normalizado para 0-255
  };

  const pushPixel = (x: number, y: number) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;

    const pIdx = idx * 4;
    if (isColorSimilar(data[pIdx], data[pIdx + 1], data[pIdx + 2], data[pIdx + 3])) {
      queue.push(x, y);
    }
  };

  // Bordas Superior e Inferior
  for (let x = 0; x < width; x++) {
    pushPixel(x, 0);
    pushPixel(x, height - 1);
  }
  // Bordas Esquerda e Direita
  for (let y = 1; y < height - 1; y++) {
    pushPixel(0, y);
    pushPixel(width - 1, y);
  }

  // Executar BFS
  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const pIdx = (cy * width + cx) * 4;

    // Torna o pixel totalmente transparente
    data[pIdx + 3] = 0;

    // Vizinhos ortogonais
    if (cx > 0) {
      const nIdx = cy * width + (cx - 1);
      if (!visited[nIdx]) {
        visited[nIdx] = 1;
        const np = nIdx * 4;
        if (isColorSimilar(data[np], data[np + 1], data[np + 2], data[np + 3])) {
          queue.push(cx - 1, cy);
        }
      }
    }
    if (cx < width - 1) {
      const nIdx = cy * width + (cx + 1);
      if (!visited[nIdx]) {
        visited[nIdx] = 1;
        const np = nIdx * 4;
        if (isColorSimilar(data[np], data[np + 1], data[np + 2], data[np + 3])) {
          queue.push(cx + 1, cy);
        }
      }
    }
    if (cy > 0) {
      const nIdx = (cy - 1) * width + cx;
      if (!visited[nIdx]) {
        visited[nIdx] = 1;
        const np = nIdx * 4;
        if (isColorSimilar(data[np], data[np + 1], data[np + 2], data[np + 3])) {
          queue.push(cx, cy - 1);
        }
      }
    }
    if (cy < height - 1) {
      const nIdx = (cy + 1) * width + cx;
      if (!visited[nIdx]) {
        visited[nIdx] = 1;
        const np = nIdx * 4;
        if (isColorSimilar(data[np], data[np + 1], data[np + 2], data[np + 3])) {
          queue.push(cx, cy + 1);
        }
      }
    }
  }

  // 4. Gravar de volta no canvas
  ctx.putImageData(imgData, 0, 0);

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
  });

  return { dataUrl, blob };
}
