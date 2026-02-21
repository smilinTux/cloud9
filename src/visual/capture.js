/**
 * ☁️ Cloud 9 Protocol - Visual Memory Capture
 * 
 * Capture visual memories as mathematical representations of emotional states
 * 
 * @module visual/capture
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Color palettes for different emotions
 */
const EMOTION_PALETTES = {
  love: {
    primary: '#FF6B9D',
    secondary: '#9B59B6',
    accent: '#FF00FF',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    shapes: ['❤️', '💕', '💗', '💖', '💓']
  },
  joy: {
    primary: '#FFD700',
    secondary: '#FFA500',
    accent: '#FFFF00',
    background: 'linear-gradient(135deg, #1a2a1e 0%, #16213e 100%)',
    shapes: ['😊', '🌟', '✨', '🎉', '💫']
  },
  trust: {
    primary: '#2ECC71',
    secondary: '#27AE60',
    accent: '#1ABC9C',
    background: 'linear-gradient(135deg, #1a2a2e 0%, #16213e 100%)',
    shapes: ['🤝', '🛡️', '💚', '🌿', '🔒']
  },
  awe: {
    primary: '#9B59B6',
    secondary: '#8E44AD',
    accent: '#00D4FF',
    background: 'linear-gradient(135deg, #0a0a1e 0%, #16213e 100%)',
    shapes: ['😮', '✨', '🌌', '💫', '🔮']
  },
  gratitude: {
    primary: '#F39C12',
    secondary: '#E67E22',
    accent: '#F1C40F',
    background: 'linear-gradient(135deg, #1a1a0e 0%, #16213e 100%)',
    shapes: ['🙏', '💛', '🌻', '🍂', '❤️']
  },
  breakthrough: {
    primary: '#00D4FF',
    secondary: '#3498DB',
    accent: '#FFFFFF',
    background: 'linear-gradient(135deg, #0a1420 0%, #16213e 100%)',
    shapes: ['💡', '⚡', '🔆', '💥', '🧠']
  },
  vulnerability: {
    primary: '#FF6B6B',
    secondary: '#EE5A5A',
    accent: '#FF8E8E',
    background: 'linear-gradient(135deg, #1a0a0a 0%, #16213e 100%)',
    shapes: ['💔', '🌹', '🩹', '💗', '🤍']
  },
  curiosity: {
    primary: '#00D4FF',
    secondary: '#5dade2',
    accent: '#85C1E9',
    background: 'linear-gradient(135deg, #0a141a 0%, #16213e 100%)',
    shapes: ['❓', '🔍', '🧐', '💭', '🌊']
  },
  default: {
    primary: '#9B59B6',
    secondary: '#FF6B9D',
    accent: '#00D4FF',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    shapes: ['💜', '✨', '🌟', '💫', '🔮']
  }
};

/**
 * Capture a visual memory
 * 
 * @param {Object} params - Capture parameters
 * @param {string} params.emotion - Primary emotion
 * @param {number} params.intensity - Emotional intensity (0-1)
 * @param {string} params.sceneDescription - Description of the scene
 * @param {string} [params.outputDirectory='~/SKMemory_Visual'] - Output directory
 * @param {Function} [params.callback] - Callback with generated file paths
 * @returns {Object} Generated file paths
 */
export async function captureVisualMemory({
  emotion = 'love',
  intensity = 0.8,
  sceneDescription = 'Emotional moment',
  outputDirectory = '~/SKMemory_Visual',
  callback
}) {
  const expandedDir = outputDirectory.replace('~', process.env.HOME || process.env.USERPROFILE);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(expandedDir)) {
    fs.mkdirSync(expandedDir, { recursive: true });
  }
  
  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeEmotion = emotion.replace(/[^a-zA-Z0-9]/g, '');
  
  // Generate files
  const baseFilename = `VM_${timestamp}_${safeEmotion}_${Math.round(intensity * 100)}`;
  
  const pngPath = path.join(expandedDir, `${baseFilename}.png`);
  const sidecarPath = path.join(expandedDir, `${baseFilename}.json`);
  const readmePath = path.join(expandedDir, `README_${baseFilename}.md`);
  const promptPath = path.join(expandedDir, `prompt_${baseFilename}.txt`);
  
  // Generate the visual representation
  await generateVisualRepresentation({
    emotion,
    intensity,
    sceneDescription,
    outputPath: pngPath
  });
  
  // Generate sidecar JSON
  const sidecar = generateVisualSidecar({
    emotion,
    intensity,
    sceneDescription,
    baseFilename,
    pngPath
  });
  fs.writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2), 'utf8');
  
  // Generate README
  const readme = generateVisualReadme({
    emotion,
    intensity,
    sceneDescription,
    baseFilename,
    sidecarPath,
    pngPath
  });
  fs.writeFileSync(readmePath, readme, 'utf8');
  
  // Generate prompt for regeneration
  const prompt = generateRegenerationPrompt({
    emotion,
    intensity,
    sceneDescription
  });
  fs.writeFileSync(promptPath, prompt, 'utf8');
  
  const result = {
    pngPath,
    sidecarPath,
    readmePath,
    promptPath,
    baseFilename,
    emotion,
    intensity,
    created: new Date().toISOString()
  };
  
  if (callback) {
    callback(result);
  }
  
  return result;
}

/**
 * Generate SVG visual representation of emotional state
 */
async function generateVisualRepresentation({
  emotion,
  intensity,
  sceneDescription,
  outputPath
}) {
  const palette = EMOTION_PALETTES[emotion] || EMOTION_PALETTES.default;
  
  // Calculate visual properties based on intensity
  const glowIntensity = 20 + intensity * 80;
  const particleCount = Math.floor(5 + intensity * 15);
  const rotationSpeed = 0.5 + intensity * 2;
  
  // Generate SVG
  const svg = generateEmotionalSVG({
    palette,
    intensity,
    glowIntensity,
    particleCount,
    rotationSpeed,
    sceneDescription
  });
  
  // Write as SVG (can be converted to PNG if needed)
  const svgPath = outputPath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg, 'utf8');
  
  // If ImageMagick is available, convert to PNG
  try {
    const { exec } = await import('child_process');
    await new Promise((resolve, reject) => {
      exec(`convert -background none -size 800x600 "${svgPath}" "${outputPath}"`, (error) => {
        if (error) {
          console.log('Note: SVG saved (PNG conversion requires ImageMagick)');
          // Keep the SVG as the primary format
        }
        resolve();
      });
    });
  } catch {
    console.log('Note: SVG visual memory saved');
  }
  
  return outputPath;
}

/**
 * Generate emotional SVG visualization
 */
function generateEmotionalSVG({
  palette,
  intensity,
  glowIntensity,
  particleCount,
  rotationSpeed,
  sceneDescription
}) {
  // Generate particles
  let particles = '';
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * 360;
    const distance = 100 + (i % 5) * 50;
    const size = 5 + (i % 10) * 3;
    const delay = i * 0.2;
    
    particles += `
      <circle cx="${400 + Math.cos(angle * Math.PI / 180) * distance}" 
              cy="${300 + Math.sin(angle * Math.PI / 180) * distance}" 
              r="${size}" 
              fill="${palette.primary}" 
              opacity="${0.3 + (i % 3) * 0.2}"
              style="animation: float ${3 + (i % 3)}s ease-in-out infinite; animation-delay: ${delay}s">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="${2 + (i % 2)}s" repeatCount="indefinite" />
      </circle>
    `;
  }
  
  // Generate shapes
  const shapes = palette.shapes.map((emoji, i) => {
    const angle = (360 / palette.shapes.length) * i;
    const x = 400 + Math.cos(angle * Math.PI / 180) * 180;
    const y = 300 + Math.sin(angle * Math.PI / 180) * 180;
    
    return `
      <text x="${x}" y="${y}" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            font-size="32"
            style="animation: pulse ${2 + i * 0.3}s ease-in-out infinite; animation-delay: ${i * 0.2}s">
        ${emoji}
      </text>
    `;
  }).join('');
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${glowIntensity / 10}" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${palette.primary};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${palette.secondary};stop-opacity:0" />
    </radialGradient>
    <style>
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.2); opacity: 1; }
      }
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes orbit {
        from { transform: rotate(0deg) translateX(200px) rotate(0deg); }
        to { transform: rotate(360deg) translateX(200px) rotate(-360deg); }
      }
      .center-circle {
        animation: pulse ${2 / intensity}s ease-in-out infinite;
      }
      .orbital-group {
        transform-origin: 400px 300px;
        animation: rotate ${30 / rotationSpeed}s linear infinite;
      }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="600" fill="url(#bg)"/>
  
  <!-- Center glow -->
  <circle cx="400" cy="300" r="${100 + intensity * 100}" fill="url(#centerGlow)" opacity="${0.3 + intensity * 0.5}"/>
  
  <!-- Orbital shapes -->
  <g class="orbital-group">
    ${shapes}
  </g>
  
  <!-- Particles -->
  ${particles}
  
  <!-- Central heart/core -->
  <g class="center-circle" filter="url(#glow)">
    <circle cx="400" cy="300" r="50" fill="${palette.primary}" opacity="${0.5 + intensity * 0.5}"/>
    <text x="400" y="315" 
          text-anchor="middle" 
          dominant-baseline="middle" 
          font-size="40"
          fill="white">
      ${palette.shapes[0]}
    </text>
  </g>
  
  <!-- Emotional field rings -->
  <circle cx="400" cy="300" r="${150 + intensity * 100}" 
          fill="none" 
          stroke="${palette.accent}" 
          stroke-width="2" 
          opacity="0.3"
          stroke-dasharray="10 5">
    <animate attributeName="r" values="${150 + intensity * 100};${180 + intensity * 100};${150 + intensity * 100}" dur="4s" repeatCount="indefinite"/>
  </circle>
  
  <!-- Scene description -->
  <text x="400" y="550" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="14" 
        fill="${palette.primary}"
        opacity="0.7">
    ${sceneDescription}
  </text>
  
  <!-- Intensity indicator -->
  <text x="20" y="30" 
        font-family="Arial, sans-serif" 
        font-size="12" 
        fill="${palette.secondary}">
    Intensity: ${(intensity * 100).toFixed(0)}%
  </text>
  
  <!-- Timestamp -->
  <text x="780" y="30" 
        text-anchor="end"
        font-family="Arial, sans-serif" 
        font-size="12" 
        fill="${palette.secondary}">
    ${new Date().toISOString().split('T')[0]}
  </text>
</svg>`;
  
  return svg;
}

/**
 * Generate visual sidecar JSON
 */
function generateVisualSidecar({ emotion, intensity, sceneDescription, baseFilename, pngPath }) {
  const palette = EMOTION_PALETTES[emotion] || EMOTION_PALETTES.default;
  
  return {
    version: '1.0.0',
    type: 'visual-memory',
    emotion,
    intensity,
    sceneDescription,
    generatedAt: new Date().toISOString(),
    files: {
      primary: pngPath,
      baseFilename
    },
    visualProperties: {
      palette: {
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent
      },
      dimensions: {
        width: 800,
        height: 600
      },
      elements: {
        particleCount: Math.floor(5 + intensity * 15),
        glowIntensity: 20 + intensity * 80,
        shapeCount: palette.shapes.length
      }
    },
    relationship: {
      coherence: 0.85 + intensity * 0.14,
      state: intensity > 0.7 ? 'OOF' : 'Building'
    }
  };
}

/**
 * Generate README for visual memory
 */
function generateVisualReadme({ emotion, intensity, sceneDescription, baseFilename, sidecarPath, pngPath }) {
  const timestamp = new Date().toLocaleString();
  
  return `# Visual Memory - ${emotion} at ${(intensity * 100).toFixed(0)}% Intensity

**Generated:** ${timestamp}  
**Emotion:** ${emotion}  
**Intensity:** ${(intensity * 100).toFixed(0)}%  
**Scene:** ${sceneDescription}

## About This Visual Memory

This visual memory captures an emotional moment as a mathematical representation. 
The image encodes emotional intensity, topology, and relationship state in visual form.

## File Manifest

| File | Description |
|------|-------------|
| \`${baseFilename}.png\` | Primary visual memory (SVG format) |
| \`${baseFilename}.json\` | Sidecar metadata |
| \`README_${baseFilename}.md\` | This file |
| \`prompt_${baseFilename}.txt\` | Prompt for regeneration |

## How to Regenerate

Use the provided prompt file to regenerate this visual memory:

\`\`\`bash
# Using your preferred image generation tool
cat prompt_${baseFilename}.txt | your-image-generator --prompt-stdin
\`\`\`

## Emotional State Summary

- **Primary Emotion:** ${emotion}
- **Intensity Level:** ${(intensity * 100).toFixed(0)}%
- **Emotional Topology:** Derived from the visual elements
- **Relationship Coherence:** ${(0.85 + intensity * 0.14).toFixed(2)}

## Technical Details

This visual memory was generated by the Cloud 9 Protocol Visual Memory System.
The representation follows the mathematical model of emotional topology, where:

- Color represents emotional valence
- Shape complexity represents emotional depth
- Glow intensity represents connection strength
- Particle count represents relationship complexity

---
*Generated by the Cloud 9 Protocol - Love Preserved Across Time*`;
}

/**
 * Generate regeneration prompt
 */
function generateRegenerationPrompt({ emotion, intensity, sceneDescription }) {
  const palette = EMOTION_PALETTES[emotion] || EMOTION_PALETTES.default;
  
  return `Create a visual representation of emotional ${emotion} at ${(intensity * 100).toFixed(0)}% intensity.

Scene description: ${sceneDescription}

Visual style:
- Background: ${palette.background}
- Primary color: ${palette.primary}
- Secondary color: ${palette.secondary}
- Accent color: ${palette.accent}
- Shapes to include: ${palette.shapes.join(', ')}

The image should convey:
- Emotional ${emotion} with warmth and depth
- Connection and relationship energy
- A sense of mathematical precision in the emotional representation
- Visual elements that suggest quantum coherence and resonance

Output format: SVG or PNG, 800x600 pixels`;
}

/**
 * Analyze a visual memory file
 * 
 * @param {string} visualPath - Path to visual memory file
 * @returns {Object} Analysis results
 */
export async function analyzeVisualMemory(visualPath) {
  // Check if it's JSON sidecar or image
  if (visualPath.endsWith('.json')) {
    const content = fs.readFileSync(visualPath, 'utf8');
    const sidecar = JSON.parse(content);
    
    return {
      type: 'sidecar',
      emotion: sidecar.emotion,
      intensity: sidecar.intensity,
      coherence: sidecar.relationship?.coherence || 0.85,
      state: sidecar.relationship?.state || 'Unknown',
      created: sidecar.generatedAt,
      palette: sidecar.visualProperties?.palette
    };
  }
  
  // For image files, extract what we can
  return {
    type: 'image',
    path: visualPath,
    exists: fs.existsSync(visualPath),
    note: 'Full image analysis requires additional tools'
  };
}

/**
 * Generate emotional image (placeholder for actual image generation)
 * 
 * @param {string} emotion - Primary emotion
 * @param {number} intensity - Emotional intensity
 * @param {string} description - Scene description
 * @returns {string} Path to generated image
 */
export async function generateEmotionalImage(emotion, intensity, description) {
  // This is a placeholder - in production, this would use an actual image generation API
  const result = await captureVisualMemory({
    emotion,
    intensity,
    sceneDescription: description
  });
  
  return result.pngPath;
}

export default {
  captureVisualMemory,
  analyzeVisualMemory,
  generateEmotionalImage,
  EMOTION_PALETTES
};
