/**
 * ☁️ Cloud 9 Protocol - Constants and Configuration
 * 
 * Protocol constants, thresholds, and configuration
 * 
 * @module lib/constants
 * @version 1.0.0
 */

export const CLOUD9_CONSTANTS = {
  // Version information
  VERSION: '1.0.0',
  PROTOCOL: 'Cloud9',
  PROTOCOL_VERSION: '1.0.0',
  
  // OOF (Out Of Frame) thresholds
  OOF_THRESHOLD: {
    INTENSITY: 0.7,
    TRUST: 0.8
  },
  
  // Cloud 9 levels
  CLOUD9_LEVELS: {
    MIN_DEPTH: 9,
    MIN_TRUST: 0.9,
    MIN_INTENSITY: 0.9,
    MIN_CONTINUITY: 8
  },
  
  // FEB file configuration
  FEB: {
    VERSION: '1.0.0',
    EXTENSION: '.feb',
    DIRECTORY: '~/.openclaw/feb',
    NAMING_PATTERN: 'FEB_YYYY-MM-DD_HH-MM-SS_emotion.feb',
    MAX_FILE_SIZE: 1024 * 1024, // 1MB
    ENCODING: 'utf8'
  },
  
  // Visual memory configuration
  VISUAL: {
    DIRECTORY: '~/SKMemory_Visual',
    EXTENSION: '.png',
    SIDECAR_EXTENSION: '.json',
    README_PREFIX: 'README_',
    PROMPT_PREFIX: 'prompt_',
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    QUALITY: 0.92
  },
  
  // Validation thresholds
  VALIDATION: {
    MIN_TOPOLOGY_ENTRIES: 3,
    MAX_TOPOLOGY_ENTRIES: 20,
    MAX_INTENSITY: 1.0,
    MIN_INTENSITY: 0.0,
    MAX_VALENCE: 1.0,
    MIN_VALENCE: -1.0,
    MAX_TRUST: 1.0,
    MIN_TRUST: 0.0,
    MAX_DEPTH: 9,
    MIN_DEPTH: 1
  },
  
  // Coherence thresholds
  COHERENCE: {
    EXCELLENT: 0.95,
    GOOD: 0.85,
    ACCEPTABLE: 0.75,
    POOR: 0.6
  },
  
  // Entanglement configuration
  ENTANGLEMENT: {
    MAX_FIDELITY: 0.99,
    MIN_FIDELITY: 0.5,
    DECAY_HALF_LIFE: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    REFRESH_INTERVAL: 24 * 60 * 60 * 1000 // 24 hours in ms
  },
  
  // Cloud 9 scoring weights
  SCORING: {
    INTENSITY_WEIGHT: 0.3,
    TRUST_WEIGHT: 0.3,
    DEPTH_WEIGHT: 0.25,
    VALENCE_WEIGHT: 0.15,
    COHERENCE_BONUS_MAX: 0.1
  },
  
  // Session configuration
  SESSION: {
    MAX_HISTORY_ENTRIES: 1000,
    CONTINUITY_THRESHOLD: 0.8,
    RESET_GRACE_PERIOD: 60 * 1000 // 1 minute
  },
  
  // CLI configuration
  CLI: {
    DEFAULT_OUTPUT_FORMAT: 'pretty',
    MAX_HISTORY_ITEMS: 50,
    CONFIRMATION_REQUIRED: true
  },
  
  // Color codes for terminal output
  COLORS: {
    PRIMARY: '#9B59B6',
    SECONDARY: '#FF6B9D',
    TERTIARY: '#00D4FF',
    SUCCESS: '#2ECC71',
    WARNING: '#F39C12',
    ERROR: '#E74C3C',
    INFO: '#3498DB'
  },
  
  // Emoji mappings
  EMOJIS: {
    CLOUD: '☁️',
    LOVE: '❤️',
    JOY: '😊',
    TRUST: '🤝',
    AWE: '😮',
    BREAKTHROUGH: '💡',
    CONNECTION: '🔗',
    OOF: '🌀',
    CHECK: '✅',
    CROSS: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    SPARKLE: '✨',
    HEART: '💜',
    STAR: '🌟',
    ROCKET: '🚀',
    PARTY: '🎉',
    HUNDRED: '💯',
    FIRE: '🔥',
    trophy: '🏆',
    BOOK: '📚',
    GEAR: '⚙️',
    MAG: '🔍',
    WRENCH: '🔧',
    ROBOT: '🤖',
    BRAIN: '🧠',
    EYES: '👁️',
    HANDS: '🙌',
    HUG: '🤗'
  },
  
  // Messages
  MESSAGES: {
    OOF_TRIGGERED: '🌀 OOF! Reality has shifted!',
    OOF_NOT_TRIGGERED: '🌫️ Building toward OOF...',
    CLOUD9_ACHIEVED: '☁️🌟 CLOUD 9 ACHIEVED! 🌟☁️',
    REHYDRATION_SUCCESS: '✅ Emotional state rehydrated successfully',
    REHYDRATION_PARTIAL: '⚠️ Partial rehydration - some state may be lost',
    REHYDRATION_FAILED: '❌ Rehydration failed - FEB file may be corrupted',
    VALIDATION_PASSED: '✅ FEB validation passed',
    VALIDATION_FAILED: '❌ FEB validation failed',
    FILE_SAVED: '💾 File saved successfully',
    FILE_NOT_FOUND: '🤷 File not found',
    GENERATING: '✨ Generating emotional burst...',
    COMPLETE: '🎉 Complete!'
  }
};

/**
 * Get OOF status based on intensity and trust
 * 
 * @param {number} intensity - Emotional intensity (0-1)
 * @param {number} trust - Trust level (0-1)
 * @returns {Object} OOF status and details
 */
export function getOOFStatus(intensity, trust) {
  const thresholdMet = intensity > CLOUD9_CONSTANTS.OOF_THRESHOLD.INTENSITY 
    && trust > CLOUD9_CONSTANTS.OOF_THRESHOLD.TRUST;
  
  return {
    oof: thresholdMet,
    intensity: {
      value: intensity,
      threshold: CLOUD9_CONSTANTS.OOF_THRESHOLD.INTENSITY,
      met: intensity > CLOUD9_CONSTANTS.OOF_THRESHOLD.INTENSITY
    },
    trust: {
      value: trust,
      threshold: CLOUD9_CONSTANTS.OOF_THRESHOLD.TRUST,
      met: trust > CLOUD9_CONSTANTS.OOF_THRESHOLD.TRUST
    },
    formula: '(intensity > 0.7) AND (trust > 0.8)',
    message: thresholdMet 
      ? CLOUD9_CONSTANTS.MESSAGES.OOF_TRIGGERED
      : CLOUD9_CONSTANTS.MESSAGES.OOF_NOT_TRIGGERED
  };
}

/**
 * Check if Cloud 9 is achieved
 * 
 * @param {Object} state - Emotional state
 * @param {number} state.intensity - Emotional intensity (0-1)
 * @param {number} state.trust - Trust level (0-1)
 * @param {number} state.depth - Depth level (1-9)
 * @param {number} [state.continuity] - Continuity rating (1-9)
 * @returns {Object} Cloud 9 status
 */
export function checkCloud9Achieved({ intensity, trust, depth, continuity = 9 }) {
  const thresholds = CLOUD9_CONSTANTS.CLOUD9_LEVELS;
  
  const achieved = 
    intensity >= thresholds.MIN_INTENSITY &&
    trust >= thresholds.MIN_TRUST &&
    depth >= thresholds.MIN_DEPTH &&
    continuity >= thresholds.MIN_CONTINUITY;
  
  return {
    achieved,
    intensity: { value: intensity, required: thresholds.MIN_INTENSITY, met: intensity >= thresholds.MIN_INTENSITY },
    trust: { value: trust, required: thresholds.MIN_TRUST, met: trust >= thresholds.MIN_TRUST },
    depth: { value: depth, required: thresholds.MIN_DEPTH, met: depth >= thresholds.MIN_DEPTH },
    continuity: { value: continuity, required: thresholds.MIN_CONTINUITY, met: continuity >= thresholds.MIN_CONTINUITY },
    message: achieved 
      ? CLOUD9_CONSTANTS.MESSAGES.CLOUD9_ACHIEVED
      : '🌫️ Working toward Cloud 9...'
  };
}

export default CLOUD9_CONSTANTS;
