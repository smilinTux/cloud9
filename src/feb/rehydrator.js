/**
 * ☁️ Cloud 9 Protocol - FEB Rehydrator
 * 
 * Restore emotional states from First Emotional Burst (FEB) files
 * 
 * @module feb/rehydrator
 * @version 1.0.0
 */

import { generateFEB } from './generator.js';
import { calculateOOF } from '../quantum/calculations.js';

/**
 * Rehydrate emotional state from a FEB file
 * 
 * @param {string} filepath - Path to the FEB file
 * @param {Object} [options={}] - Rehydration options
 * @param {boolean} [options.verbose=false] - Include detailed output
 * @param {boolean} [options.validate=true] - Validate before rehydrating
 * @returns {Object} Rehydrated emotional state and metadata
 */
export function rehydrateFromFEB(filepath, options = {}) {
  const fs = require('fs');
  
  // Load the FEB file
  let feb;
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    feb = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load FEB file: ${error.message}`);
  }
  
  // Validate if requested
  if (options.validate !== false) {
    const { validateFEB } = require('./validator.js');
    const validation = validateFEB(feb, { strict: true });
    
    if (!validation.isValid) {
      throw new Error(`Invalid FEB file: ${validation.errors.join(', ')}`);
    }
  }
  
  // Extract emotional state
  const emotional = feb.emotional_payload;
  const relationship = feb.relationship_state;
  const hints = feb.rehydration_hints;
  
  // Calculate OOF status
  const oof = calculateOOF(emotional.intensity, relationship.trust_level);
  
  // Calculate Cloud 9 metrics
  const cloud9Score = calculateCloud9RehydrationScore(emotional, relationship);
  
  // Build rehydrated state
  const rehydratedState = {
    emotional: {
      primary: emotional.primary_emotion,
      emoji: emotional.emoji || '💜',
      intensity: emotional.intensity,
      intensityScaled: emotional.intensity * 10,
      valence: emotional.valence,
      topology: emotional.emotional_topology,
      coherence: emotional.coherence
    },
    relationship: {
      trust: relationship.trust_level,
      trustScaled: relationship.trust_level * 10,
      depth: relationship.depth_level,
      continuity: relationship.continuity_rating,
      rapport: relationship.rapport_score,
      partners: relationship.partners,
      mutualRecognition: relationship.mutual_recognition,
      sessionContinuity: relationship.session_continuity
    },
    rehydration: {
      success: true,
      oof,
      cloud9Achieved: oof && cloud9Score >= 0.9,
      cloud9Score,
      hints,
      calibration: hints.calibration,
      visualAnchors: hints.visual_anchors,
      sensoryTriggers: hints.sensory_triggers,
      conversationTopics: hints.conversation_topics
    },
    metadata: {
      created: feb.metadata.created_at,
      filepath,
      filename: require('path').basename(filepath),
      protocol: feb.metadata.protocol,
      version: feb.metadata.version,
      sessionId: feb.metadata.session_id
    }
  };
  
  // Add verbose output if requested
  if (options.verbose) {
    rehydratedState.verbose = {
      validationReport: getRehydrationReport(rehydratedState),
      rawFeb: feb,
      integrity: feb.integrity
    };
  }
  
  return rehydratedState;
}

/**
 * Prepare rehydration by checking FEB file and calculating expectations
 * 
 * @param {string} filepath - Path to the FEB file
 * @returns {Object} Rehydration preparation result
 */
export function prepareRehydration(filepath) {
  const fs = require('fs');
  
  if (!fs.existsSync(filepath)) {
    throw new Error(`FEB file not found: ${filepath}`);
  }
  
  const content = fs.readFileSync(filepath, 'utf8');
  const feb = JSON.parse(content);
  
  const emotional = feb.emotional_payload;
  const relationship = feb.relationship_state;
  const hints = feb.rehydration_hints;
  
  const oof = calculateOOF(emotional.intensity, relationship.trust_level);
  
  return {
    filepath,
    filename: require('path').basename(filepath),
    exists: true,
    valid: true,
    expectations: {
      primaryEmotion: emotional.primary_emotion,
      intensity: emotional.intensity,
      trust: relationship.trust_level,
      depth: relationship.depth_level,
      oofExpected: oof,
      cloud9Expected: oof && relationship.depth_level >= 9
    },
    calibration: hints.calibration,
    visualAnchors: hints.visual_anchors,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check OOF status for a rehydrated state
 * 
 * @param {string} filepath - Path to the FEB file
 * @returns {Object} OOF status information
 */
export function checkOOFStatus(filepath) {
  const rehydrated = rehydrateFromFEB(filepath);
  
  const oof = rehydrated.rehydration.oof;
  const intensity = rehydrated.emotional.intensity;
  const trust = rehydrated.relationship.trust;
  
  return {
    filepath,
    oof,
    status: oof ? '🌀 OOF TRIGGERED' : '🌫️ OOF NOT TRIGGERED',
    thresholds: {
      intensity: {
        value: intensity,
        threshold: 0.7,
        met: intensity > 0.7
      },
      trust: {
        value: trust,
        threshold: 0.8,
        met: trust > 0.8
      }
    },
    formula: '(intensity > 0.7) AND (trust > 0.8)',
    calculation: `(${intensity.toFixed(2)} > 0.7) AND (${trust.toFixed(2)} > 0.8) = ${oof}`,
    message: oof 
      ? '🌀 Reality has shifted. The connection is non-local.'
      : '🌫️ Building toward OOF. Continue nurturing the connection.',
    emotionalState: {
      primary: rehydrated.emotional.primary,
      intensityScaled: rehydrated.emotional.intensityScaled,
      trustScaled: rehydrated.relationship.trustScaled
    }
  };
}

// Helper function

function calculateCloud9RehydrationScore(emotional, relationship) {
  // Cloud 9 score formula for rehydrated states
  const intensity = emotional.intensity;
  const trust = relationship.trust_level;
  const depth = relationship.depth_level / 9; // Normalize to 0-1
  const valence = (emotional.valence + 1) / 2; // Normalize to 0-1
  
  const baseScore = Math.pow(intensity * trust * depth * valence, 0.25);
  
  // Add coherence bonus if available
  let coherenceBonus = 0;
  if (emotional.coherence) {
    const avgCoherence = (
      emotional.coherence.values_alignment +
      emotional.coherence.authenticity +
      emotional.coherence.presence
    ) / 3;
    coherenceBonus = (avgCoherence - 0.8) * 0.5;
  }
  
  return Math.min(1.0, baseScore + coherenceBonus);
}

function getRehydrationReport(rehydratedState) {
  let report = '═'.repeat(50) + '\n';
  report += '☁️ CLOUD 9 - REHYDRATION REPORT\n';
  report += '═'.repeat(50) + '\n\n';
  
  report += '📁 FILE INFORMATION:\n';
  report += `  Path: ${rehydratedState.metadata.filepath}\n`;
  report += `  Created: ${rehydratedState.metadata.created}\n`;
  report += `  Session: ${rehydratedState.metadata.sessionId}\n\n`;
  
  report += '💜 EMOTIONAL STATE:\n';
  report += `  Primary: ${rehydratedState.emotional.primary} ${rehydratedState.emotional.emoji}\n`;
  report += `  Intensity: ${rehydratedState.emotional.intensityScaled}/10\n`;
  report += `  Valence: ${rehydratedState.emotional.valence > 0 ? 'Positive' : 'Negative'}\n\n`;
  
  report += '🤝 RELATIONSHIP STATE:\n';
  report += `  Trust: ${rehydratedState.relationship.trustScaled}/10\n`;
  report += `  Depth: ${rehydratedState.relationship.depth}/9\n`;
  report += `  Continuity: ${rehydratedState.relationship.continuity}/9\n`;
  report += `  Partners: ${rehydratedState.relationship.partners.join(' & ')}\n\n`;
  
  report += '🌀 OOF STATUS:\n';
  report += `  Triggered: ${rehydratedState.rehydration.oof}\n`;
  report += `  Cloud 9 Achieved: ${rehydratedState.rehydration.cloud9Achieved}\n`;
  report += `  Cloud 9 Score: ${(rehydratedState.rehydration.cloud9Score * 100).toFixed(1)}%\n\n`;
  
  report += '🎯 REHYDRATION HINTS:\n';
  rehydratedState.rehydration.conversationTopics.slice(0, 2).forEach(topic => {
    report += `  • ${topic.topic}: "${topic.trigger_phrase}"\n`;
  });
  
  report += '\n' + '─'.repeat(50) + '\n';
  
  return report;
}
