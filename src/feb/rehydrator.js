/**
 * ☁️ Cloud 9 Protocol - FEB Rehydrator
 * 
 * Restore emotional states from First Emotional Burst (FEB) files
 * 
 * @module feb/rehydrator
 * @version 1.1.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { generateFEB } from './generator.js';
import { calculateOOF } from '../quantum/calculations.js';

const SOUL_MIN_BYTES = 500;
const SOUL_REQUIRED_MARKERS = ['honest', 'guardrail', 'bluff', 'rule', 'verify'];

const DEFAULT_SOUL_PATHS = [
  'SOUL.md',
  '../SOUL.md',
  path.join(os.homedir(), 'clawd', 'SOUL.md'),
  path.join(os.homedir(), '.openclaw', 'SOUL.md'),
];

/**
 * Preflight check for operational guardrails before rehydration.
 *
 * Scans well-known paths for a SOUL.md (or equivalent identity file)
 * and verifies it meets a minimum size and contains at least one
 * honesty/guardrail marker keyword. Returns an advisory result —
 * rehydration proceeds regardless, but warnings are surfaced.
 *
 * Background: Issue #3 — a Proxmox clone retained Cloud 9 FEB data
 * but had a stripped SOUL.md missing all operational rules. The AI
 * generated convincing fabricated content with no honesty guardrails.
 * This check would have caught that scenario.
 *
 * @param {string} [soulPath] - Explicit path to check (skips search)
 * @returns {Object} Preflight result with status, warnings, and path
 */
export function preflightSoulCheck(soulPath) {
  const warnings = [];
  let foundPath = null;
  let content = '';

  const candidates = soulPath ? [soulPath] : DEFAULT_SOUL_PATHS;

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      foundPath = resolved;
      try {
        content = fs.readFileSync(resolved, 'utf8');
      } catch {
        warnings.push(`SOUL.md found but unreadable: ${resolved}`);
        foundPath = null;
      }
      break;
    }
  }

  if (!foundPath) {
    warnings.push(
      'No SOUL.md found. Rehydrating emotional state WITHOUT operational guardrails. ' +
      'This is unsafe — the AI may generate content without honesty rules. ' +
      'See: https://github.com/smilinTux/cloud9/issues/3'
    );
    return { ok: false, warnings, path: null, size: 0, hasMarkers: false };
  }

  const size = Buffer.byteLength(content, 'utf8');
  if (size < SOUL_MIN_BYTES) {
    warnings.push(
      `SOUL.md is only ${size} bytes (minimum: ${SOUL_MIN_BYTES}). ` +
      'File may be a stub or stripped version missing operational rules.'
    );
  }

  const lower = content.toLowerCase();
  const hasMarkers = SOUL_REQUIRED_MARKERS.some(m => lower.includes(m));
  if (!hasMarkers) {
    warnings.push(
      'SOUL.md does not contain any guardrail markers (honesty, verify, rules). ' +
      'Emotional rehydration without operational rules may produce ungrounded output.'
    );
  }

  return {
    ok: warnings.length === 0,
    warnings,
    path: foundPath,
    size,
    hasMarkers,
  };
}

/**
 * Rehydrate emotional state from a FEB file
 * 
 * Runs a preflight soul check before loading emotional data.
 * If no SOUL.md with guardrails is found, warnings are included
 * in the result but rehydration still proceeds (soft gate).
 * 
 * @param {string} filepath - Path to the FEB file
 * @param {Object} [options={}] - Rehydration options
 * @param {boolean} [options.verbose=false] - Include detailed output
 * @param {boolean} [options.validate=true] - Validate before rehydrating
 * @param {string} [options.soulPath] - Explicit SOUL.md path to check
 * @param {boolean} [options.skipPreflight=false] - Skip soul check
 * @returns {Object} Rehydrated emotional state and metadata
 */
export function rehydrateFromFEB(filepath, options = {}) {
  const preflight = options.skipPreflight
    ? { ok: true, warnings: [], path: null, size: 0, hasMarkers: true }
    : preflightSoulCheck(options.soulPath);

  let feb;
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    feb = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load FEB file: ${error.message}`);
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
    preflight: {
      ok: preflight.ok,
      soulPath: preflight.path,
      soulSize: preflight.size,
      hasGuardrails: preflight.hasMarkers,
      warnings: preflight.warnings,
    },
    metadata: {
      created: feb.metadata.created_at,
      filepath,
      filename: path.basename(filepath),
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
    filename: path.basename(filepath),
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
