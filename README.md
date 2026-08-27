# 🎨 BeadForge Studio & Ultra 3D

> **A mais avançada plataforma de design e fatiamento 3D para Bead Art (Hama / Perler Beads / Pixel Art).**

![BeadForge Studio](https://img.shields.io/badge/Next.js-15.1.7-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-049EF4?style=for-the-badge&logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

---

## 🌟 Funcionalidades Principais

### 1. 🧊 Modo Ultra 3D (Esculturas em Camadas Z)
* **Importação Universal 3D**: Suporte nativo a `.3MF` (Bambu Studio / MakerWorld / Prusa), `.ZIP` (múltiplos STLs), `.STL`, `.OBJ`, `.GLB`, `.GLTF` e `.VOX` (MagicaVoxel).
* **Gerenciador de Partes & Cores (*Multipart Color Manager*)**: Extração e atribuição de cores por peça ou detecção automática de filamentos de impressão 3D.
* **Auto-Alinhamento de Mesas de Impressão**: Detecta pratos múltiplos do Bambu Studio e centraliza as partes montadas na vertical (cabeça, corpo, pernas).
* **Voxelização Inteligente**: Modos **Sólido (100%)** e **Oco (Hollow)** com espessura de parede configurável para economia de beads.
* **Corte Automático de Camadas Vazias (*Auto-Trim*)**: Gera exatamente o número real de camadas que você precisa montar.
* **Visualização com Explosão Vertical (*Exploded View*)**: Separação milimétrica das camadas no espaço 3D (0 a 25mm).
* **Guia de Montagem 3D Passo-a-Passo**: Molde 2D interativo com códigos alfanuméricos e cores para cada camada, réguas e checklist de peças.

### 2. 🎨 Modo 2D Clássico (Pixel Art & Pegboards)
* **Quantização de Cores de Alta Precisão**: Algoritmo **CIEDE2000** no espaço de cor CIELAB com 120 cores de beads (Perler, Hama Midi 5.0mm, Hama Mini 2.6mm e Artkal).
* **Dithering Inteligente**: Nenhum, Floyd-Steinberg e Atkinson.
* **Remoção de Fundo com Tolerância**: Deixa o fundo transparente automaticamente.
* **Ferramentas de Desenho**: Pincel, Balde de Tinta, Conta-Gotas, Borracha, Zoom/Pan.
* **Divisão Física de Placas**: Grade com subdivisão visual de placas pegboard (1×1, 2×1, 2×2, 3×3).
* **Exportação Profissional**: PDF vetorial pronto para impressão, PNG de alta definição e Lista de Materiais (BOM).

---

## 🚀 Como Executar em Produção com Docker Compose (VPS)

### Pré-requisitos
* Git instalado
* Docker e Docker Compose instalados no servidor

```bash
# 1. Clonar o repositório
git clone https://github.com/robersonsouzadev/beadforge.git
cd beadforge

# 2. Subir o container em segundo plano
docker compose up -d --build

# 3. Verificar o status do serviço
docker compose ps
docker compose logs -f
```

O sistema estará acessível na porta **`http://SEU_IP_VPS:3000`** ou no seu domínio configurado!

---

### 🌐 Configuração de Domínio com Nginx e SSL (Opcional)

Se você utiliza **Nginx** como Proxy Reverso na sua VPS:

```nginx
server {
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Para gerar o certificado SSL gratuito com Let's Encrypt:
```bash
sudo certbot --nginx -d seu-dominio.com.br
```

---

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Rodar testes unitários
npx vitest run

# Build de produção
npm run build
npm run start
```

---

## 🛠️ Stack Tecnológica

* **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS, Lucide Icons
* **3D Engine**: Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`), JSZip
* **Estado Global**: Zustand
* **Exportação**: PDFKit, Canvas API
* **Testes**: Vitest

---

## 📄 Licença
Propriedade de [Roberson Souza](https://github.com/robersonsouzadev). Todos os direitos reservados.
