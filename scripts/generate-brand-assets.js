import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artifactDir = 'C:\\Users\\rober\\.gemini\\antigravity\\brain\\09255b4f-86fc-4f16-a673-a718b0b54054';
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// ── SVG Definitions ──

// 1. Horizontal Full Logo (Transparent)
const logoHorizontalSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 280" width="1000" height="280">
  <defs>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <linearGradient id="amberTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FBBF24" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#F59E0B" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Icon Rounded Box -->
  <g filter="url(#subtleGlow)">
    <rect x="40" y="40" width="200" height="200" rx="52" fill="url(#amberGrad)" />
  </g>

  <!-- Icon Sparkle Symbol (Four-point star + mini beads) -->
  <g fill="#09090B">
    <!-- Center 4-point star -->
    <path d="M 140 78 
             C 140 115 145 135 182 140 
             C 145 145 140 165 140 202 
             C 140 165 135 145 98 140 
             C 135 135 140 115 140 78 Z" />
    
    <!-- Mini star top-right -->
    <path d="M 180 92 
             C 180 104 182 110 194 112 
             C 182 114 180 120 180 132 
             C 180 120 178 114 166 112 
             C 178 110 180 104 180 92 Z" transform="scale(0.85) translate(25, 0)" />
    
    <!-- Mini bead dot bottom-left -->
    <circle cx="96" cy="184" r="8" />
  </g>

  <!-- Typography: BeadForge -->
  <g transform="translate(280, 185)">
    <text font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
          font-size="124" 
          font-weight="900" 
          letter-spacing="-3">
      <tspan fill="#FFFFFF">Bead</tspan>
      <tspan fill="url(#amberTextGrad)">Forge</tspan>
    </text>
  </g>
</svg>
`;

// 2. Horizontal Full Logo (Dark Background)
const logoDarkBgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 280" width="1000" height="280">
  <rect width="1000" height="280" rx="24" fill="#09090B" />
  <defs>
    <linearGradient id="amberGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <linearGradient id="amberTextGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FBBF24" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="subtleGlow2" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#F59E0B" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Icon Rounded Box -->
  <g filter="url(#subtleGlow2)">
    <rect x="40" y="40" width="200" height="200" rx="52" fill="url(#amberGrad2)" />
  </g>

  <!-- Icon Sparkle Symbol -->
  <g fill="#09090B">
    <path d="M 140 78 
             C 140 115 145 135 182 140 
             C 145 145 140 165 140 202 
             C 140 165 135 145 98 140 
             C 135 135 140 115 140 78 Z" />
    <path d="M 180 92 
             C 180 104 182 110 194 112 
             C 182 114 180 120 180 132 
             C 180 120 178 114 166 112 
             C 178 110 180 104 180 92 Z" transform="scale(0.85) translate(25, 0)" />
    <circle cx="96" cy="184" r="8" />
  </g>

  <!-- Typography: BeadForge -->
  <g transform="translate(280, 185)">
    <text font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
          font-size="124" 
          font-weight="900" 
          letter-spacing="-3">
      <tspan fill="#FFFFFF">Bead</tspan>
      <tspan fill="url(#amberTextGrad2)">Forge</tspan>
    </text>
  </g>
</svg>
`;

// 3. Icon Only (512x512)
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="iconGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#F59E0B" flood-opacity="0.4" />
    </filter>
  </defs>

  <g filter="url(#iconGlow)">
    <rect x="32" y="32" width="448" height="448" rx="120" fill="url(#iconGrad)" />
  </g>

  <!-- Icon Sparkle Symbol -->
  <g fill="#09090B">
    <!-- Big Center Star -->
    <path d="M 256 120 
             C 256 200 268 244 348 256 
             C 268 268 256 312 256 392 
             C 256 312 244 268 164 256 
             C 244 244 256 200 256 120 Z" />
    
    <!-- Mini Star Top-Right -->
    <path d="M 360 150 
             C 360 178 365 192 393 196 
             C 365 200 360 214 360 242 
             C 360 214 355 200 327 196 
             C 355 192 360 178 360 150 Z" />

    <!-- Mini Bead Dot Bottom-Left -->
    <circle cx="160" cy="352" r="18" />
  </g>
</svg>
`;

async function generateAssets() {
  console.log('Gerando arquivos de Logo e Ícone...');

  const targets = [
    // 1. Logo Horizontal Transparente (PNG 2000x560)
    {
      svg: logoHorizontalSvg,
      pngName: 'beadforge-logo.png',
      width: 2000,
      height: 560,
    },
    // 2. Logo Horizontal Dark Background (PNG 2000x560)
    {
      svg: logoDarkBgSvg,
      pngName: 'beadforge-logo-dark.png',
      width: 2000,
      height: 560,
    },
    // 3. Icon Only Transparente (PNG 1024x1024)
    {
      svg: iconSvg,
      pngName: 'beadforge-icon.png',
      width: 1024,
      height: 1024,
    },
    // 4. Icon Only 512x512
    {
      svg: iconSvg,
      pngName: 'beadforge-icon-512.png',
      width: 512,
      height: 512,
    },
  ];

  // Salva SVGs nos diretórios
  fs.writeFileSync(path.join(publicDir, 'beadforge-logo.svg'), logoHorizontalSvg);
  fs.writeFileSync(path.join(publicDir, 'beadforge-icon.svg'), iconSvg);
  fs.writeFileSync(path.join(artifactDir, 'beadforge-logo.svg'), logoHorizontalSvg);
  fs.writeFileSync(path.join(artifactDir, 'beadforge-icon.svg'), iconSvg);

  for (const item of targets) {
    const pngBuffer = await sharp(Buffer.from(item.svg))
      .resize(item.width, item.height)
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();

    // Salva em public/
    fs.writeFileSync(path.join(publicDir, item.pngName), pngBuffer);

    // Salva também no diretório de artefatos da conversa para visualização imediata
    fs.writeFileSync(path.join(artifactDir, item.pngName), pngBuffer);

    console.log(`✅ Gerado: ${item.pngName} (${item.width}x${item.height})`);
  }

  console.log('🎉 Todos os arquivos PNG e SVG foram gerados com sucesso!');
}

generateAssets().catch(console.error);
