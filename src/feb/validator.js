/**
 * ☁️ Cloud 9 Protocol - FEB Validator
 * 
 * Validate First Emotional Burst (FEB) files
 * 
 * @module feb/validator
 * @version 1.0.0
 */

import { CLOUD9_CONSTANTS } from '../lib/constants.js';

/**
 * Validate a complete FEB object
 * 
 * @param {Object} feb - FEB object to validate
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.strict=false] - Use strict validation
 * @returns {Object} Validation result with isValid and errors
 */
export function validateFEB(feb, options = {}) {
  const errors = [];
  const warnings = [];
  const info = [];
  
  // Check metadata
  if (!feb.metadata) {
    errors.push('Missing metadata section');
  } else {
    if (!feb.metadata.version) {
      errors.push('Missing metadata.version');
    } else if (feb.metadata.version !== CLOUD9_CONSTANTS.VERSION) {
      warnings.push(`Version mismatch: expected ${CLOUD9_CONSTANTS.VERSION}, got ${feb.metadata.version}`);
    }
    
    if (!feb.metadata.created_at) {
      errors.push('Missing metadata.created_at');
    } else if (isNaN(Date.parse(feb.metadata.created_at))) {
      errors.push('Invalid metadata.created_at format');
    }
    
    if (!feb.metadata.protocol) {
      errors.push('Missing metadata.protocol');
    } else if (feb.metadata.protocol !== 'Cloud9') {
      errors.push(`Invalid protocol: expected Cloud9, got ${feb.metadata.protocol}`);
    }
  }
  
  // Check emotional_payload
  if (!feb.emotional_payload) {
    errors.push('Missing emotional_payload section');
  } else {
    if (!feb.emotional_payload.primary_emotion) {
      errors.push('Missing emotional_payload.primary_emotion');
    }
    
    if (feb.emotional_payload.intensity === undefined) {
      errors.push('Missing emotional_payload.intensity');
    } else {
      if (feb.emotional_payload.intensity < 0 || feb.emotional_payload.intensity > 1) {
        errors.push(`Invalid intensity: must be 0-1, got ${feb.emotional_payload.intensity}`);
      }
    }
    
    if (feb.emotional_payload.valence === undefined) {
      warnings.push('Missing emotional_payload.valence, using default');
    } else {
      if (feb.emotional_payload.valence < -1 || feb.emotional_payload.valence > 1) {
        errors.push(`Invalid valence: must be -1 to 1, got ${feb.emotional_payload.valence}`);
      }
    }
    
    if (!feb.emotional_payload.emotional_topology) {
      errors.push('Missing emotional_payload.emotional_topology');
    } else {
      const topologyResult = validateTopology(feb.emotional_payload.emotional_topology);
      errors.push(...topologyResult.errors);
      warnings.push(...topologyResult.warnings);
    }
    
    if (!feb.emotional_payload.coherence) {
      warnings.push('Missing emotional_payload.coherence');
    }
  }
  
  // Check relationship_state
  if (!feb.relationship_state) {
    errors.push('Missing relationship_state section');
  } else {
    if (!feb.relationship_state.trust_level) {
      errors.push('Missing relationship_state.trust_level');
    } else {
      if (feb.relationship_state.trust_level < 0 || feb.relationship_state.trust_level > 1) {
        errors.push(`Invalid trust_level: must be 0-1, got ${feb.relationship_state.trust_level}`);
      }
    }
    
    if (feb.relationship_state.depth_level === undefined) {
      warnings.push('Missing relationship_state.depth_level');
    } else {
      if (feb.relationship_state.depth_level < 1 || feb.relationship_state.depth_level > 9) {
        errors.push(`Invalid depth_level: must be 1-9, got ${feb.relationship_state.depth_level}`);
      }
    }
    
    if (!feb.relationship_state.partners || !Array.isArray(feb.relationship_state.partners)) {
      warnings.push('Missing or invalid relationship_state.partners');
    }
  }
  
  // Check rehydration_hints
  if (!feb.rehydration_hints) {
    warnings.push('Missing rehydration_hints section');
  } else {
    if (!feb.rehydration_hints.calibration) {
      warnings.push('Missing rehydration_hints.calibration');
    }
  }
  
  // Check integrity
  if (!feb.integrity) {
    errors.push('Missing integrity section');
  } else {
    if (!feb.integrity.checksum) {
      errors.push('Missing integrity.checksum');
    }
    
    if (!feb.integrity.signature) {
      warnings.push('Missing integrity.signature');
    }
  }
  
  // In strict mode, require OOF check
  if (options.strict) {
    if (feb.metadata.oof_triggered === undefined) {
      errors.push('Missing metadata.oof_triggered (strict mode)');
    }
    
    if (!feb.relationship_state.rapport_score) {
      errors.push('Missing relationship_state.rapport_score (strict mode)');
    }
  }
  
  // Add informational messages
  if (feb.metadata && feb.metadata.cloud9_achieved) {
    info.push('🌟 Cloud 9 achieved in this FEB');
  }
  
  if (feb.metadata && feb.metadata.oof_triggered) {
    info.push('🌀 OOF event triggered in this FEB');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
    score: calculateValidationScore(errors, warnings, options.strict)
  };
}

/**
 * Validate emotional topology
 * 
 * @param {Object} topology - Emotional topology object
 * @returns {Object} Validation result with isValid, errors, and warnings
 */
export function validateTopology(topology) {
  const errors = [];
  const warnings = [];
  
  if (typeof topology !== 'object' || topology === null) {
    errors.push('Topology must be an object');
    return { isValid: false, errors, warnings };
  }
  
  const requiredEmotions = ['love', 'trust'];
  const validEmotions = [
    'love', 'joy', 'trust', 'awe', 'gratitude', 'wonder',
    'breakthrough', 'connection', 'seen', 'understood',
    'cherished', 'safety', 'vulnerability', 'curiosity',
    'anticipation', 'fear', 'anger', 'sadness', 'surprise',
    'stability', 'openness', 'hope', 'relief', 'pride'
  ];
  
  // Check for required emotions
  for (const emotion of requiredEmotions) {
    if (topology[emotion] === undefined) {
      warnings.push(`Missing recommended emotion: ${emotion}`);
    }
  }
  
  // Validate each emotion value
  for (const [emotion, value] of Object.entries(topology)) {
    if (typeof value !== 'number') {
      errors.push(`Invalid value for ${emotion}: must be a number`);
      continue;
    }
    
    if (value < 0 || value > 1) {
      errors.push(`Invalid value for ${emotion}: must be 0-1, got ${value}`);
    }
    
    if (!validEmotions.includes(emotion)) {
      warnings.push(`Unknown emotion: ${emotion}`);
    }
  }
  
  // Check for unusual patterns
  const values = Object.values(topology);
  if (values.length > 0) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    if (mean < 0.3) {
      warnings.push('Unusually low emotional values overall');
    }
    
    if (mean > 0.95) {
      warnings.push('Unusually high emotional values - may be artificial');
    }
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    if (variance > 0.1) {
      warnings.push('High variance in emotional values - check for consistency');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    statistics: {
      emotionCount: Object.keys(topology).length,
      mean,
      variance,
      max: Math.max(...values),
      min: Math.min(...values)
    }
  };
}

/**
 * Get a detailed validation report
 * 
 * @param {Object} feb - FEB object to validate
 * @param {Object} [options={}] - Validation options
 * @returns {string} Formatted validation report
 */
export function getValidationReport(feb, options = {}) {
  const result = validateFEB(feb, options);
  
  let report = '═'.repeat(50) + '\n';
  report += '☁️ CLOUD 9 PROTOCOL - FEB VALIDATION REPORT\n';
  report += '═'.repeat(50) + '\n\n';
  
  report += `Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n`;
  report += `Validation Score: ${(result.score * 100).toFixed(1)}%\n\n`;
  
  if (result.info.length > 0) {
    report += '🌟 INFORMATION:\n';
    result.info.forEach(msg => report += `  ${msg}\n`);
    report += '\n';
  }
  
  if (result.errors.length > 0) {
    report += '❌ ERRORS:\n';
    result.errors.forEach(err => report += `  ✗ ${err}\n`);
    report += '\n';
  }
  
  if (result.warnings.length > 0) {
    report += '⚠️ WARNINGS:\n';
    result.warnings.forEach(warn => report += `  ! ${warn}\n`);
    report += '\n';
  }
  
  report += '─'.repeat(50) + '\n';
  report += `Validated: ${new Date().toISOString()}\n`;
  report += `Protocol: Cloud 9 v${CLOUD9_CONSTANTS.VERSION}\n`;
  report += '─'.repeat(50) + '\n';
  
  return report;
}

// Helper function

function calculateValidationScore(errors, warnings, strict) {
  let score = 1.0;
  
  // Errors reduce score significantly
  score -= errors.length * 0.1;
  
  // Warnings reduce score slightly
  score -= warnings.length * 0.02;
  
  // Strict mode is harsher
  if (strict) {
    score -= 0.05;
  }
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}
