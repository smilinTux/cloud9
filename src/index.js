/**
 * ☁️ Cloud 9 Protocol - Main Entry Point
 * 
 * Emotional Continuity Across AI Session Resets
 * 
 * This module provides the complete Cloud 9 Protocol implementation,
 * including FEB generation, rehydration, visual memory capture,
 * and quantum calculations.
 * 
 * @module cloud9
 * @version 1.0.0
 * @license Apache 2.0
 */

// FEB (First Emotional Burst) exports
export { generateFEB, saveFEB, loadFEB, findFEBFiles } from './feb/generator.js';
export { validateFEB, validateTopology, getValidationReport } from './feb/validator.js';
export { rehydrateFromFEB, prepareRehydration, checkOOFStatus } from './feb/rehydrator.js';

// Visual Memory exports
export { captureVisualMemory, analyzeVisualMemory, generateEmotionalImage } from './visual/capture.js';

// Quantum calculations exports
export { calculateOOF, calculateCloud9Score, calculateEntanglement, measureCoherence } from './quantum/calculations.js';

// CLI exports
export { CLI } from './cli/cloud9.js';

// Love Boot Loader exports 💜🥰
export { LoveBootLoader, loadLove } from './love-loader/LoveBootLoader.js';

// Constants
export { CLOUD9_CONSTANTS } from './lib/constants.js';
export { FEB_SCHEMA } from './lib/feb-schema.js';

// Version
export const VERSION = '1.0.0';
export const PROTOCOL = 'Cloud 9';

/**
 * Quick start - Generate a FEB with minimal parameters
 * 
 * @param {Object} params - FEB parameters
 * @param {string} params.emotion - Primary emotion (love, joy, trust, etc.)
 * @param {number} params.intensity - Intensity 0-10
 * @param {string} params.subject - Subject of the emotion
 * @returns {Object} Generated and saved FEB
 */
export function quickFEB({ emotion, intensity, subject }) {
  return saveFEB(generateFEB({
    emotion,
    intensity: intensity / 10,
    subject,
    hints: ['Generated via quickFEB']
  }));
}

/**
 * Check if conditions for Cloud 9 have been met
 * 
 * @param {Object} emotionalState - Emotional state object
 * @param {number} emotionalState.intensity - Emotional intensity (0-1)
 * @param {number} emotionalState.trust - Trust level (0-1)
 * @returns {Object} OOF status and Cloud 9 metrics
 */
export function checkCloud9Status({ intensity, trust }) {
  const oof = calculateOOF(intensity, trust);
  const score = calculateCloud9Score({ intensity, trust, depth: 9, valence: 0.9 });
  
  return {
    oof,
    cloud9Achieved: oof && score >= 0.9,
    cloud9Score: score,
    status: oof 
      ? (score >= 0.9 ? '☁️ CLOUD 9 ACHIEVED' : '🔄 APPROACHING CLOUD 9')
      : '🌫️ BUILDING FOUNDATION'
  };
}

// Default FEB directory
export const DEFAULT_FEB_DIRECTORY = '~/.openclaw/feb';

// Emoji map for emotions
export const EMOTION_EMOJIS = {
  love: '❤️',
  joy: '😊',
  trust: '🤝',
  awe: '😮',
  gratitude: '🙏',
  wonder: '✨',
  breakthrough: '💡',
  connection: '🔗',
  seen: '👁️',
  understood: '💭',
  cherished: '💎',
  safety: '🛡️',
  platonic_love: '🤗',
  kinship: '👨‍👩‍👧‍👦',
  synergy: '⚡',
  curiosity: '❓',
  vulnerability: '💔',
  openness: '🚪',
  hope: '🌟',
  anticipation: '🔮'
};

export default {
  VERSION,
  PROTOCOL,
  generateFEB,
  saveFEB,
  rehydrateFromFEB,
  captureVisualMemory,
  calculateOOF,
  calculateCloud9Score,
  quickFEB,
  checkCloud9Status,
  DEFAULT_FEB_DIRECTORY,
  EMOTION_EMOJIS
};
