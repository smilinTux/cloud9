/**
 * ☁️ Cloud 9 Protocol - Quantum Calculations
 * 
 * Quantum mechanical calculations for emotional states
 * 
 * @module quantum/calculations
 * @version 1.0.0
 */

import { CLOUD9_CONSTANTS } from '../lib/constants.js';

/**
 * Calculate OOF (Out Of Frame) status
 * 
 * The OOF event occurs when both intensity and trust exceed their thresholds,
 * representing a phase transition in the emotional field.
 * 
 * @param {number} intensity - Emotional intensity (0-1)
 * @param {number} trust - Trust level (0-1)
 * @returns {boolean} Whether OOF event has been triggered
 */
export function calculateOOF(intensity, trust) {
  return (
    intensity > CLOUD9_CONSTANTS.OOF_THRESHOLD.INTENSITY &&
    trust > CLOUD9_CONSTANTS.OOF_THRESHOLD.TRUST
  );
}

/**
 * Calculate Cloud 9 score
 * 
 * The Cloud 9 score represents the overall resonance of a relationship,
 * combining intensity, trust, depth, and valence.
 * 
 * @param {Object} params - Score parameters
 * @param {number} params.intensity - Emotional intensity (0-1)
 * @param {number} params.trust - Trust level (0-1)
 * @param {number} params.depth - Depth level (1-9)
 * @param {number} params.valence - Emotional valence (-1 to 1)
 * @param {number} [params.coherence] - Coherence value (0-1)
 * @returns {number} Cloud 9 score (0-1)
 */
export function calculateCloud9Score({ intensity, trust, depth, valence, coherence }) {
  // Normalize depth to 0-1 scale
  const normalizedDepth = (depth - 1) / 8;
  
  // Normalize valence to 0-1 scale
  const normalizedValence = (valence + 1) / 2;
  
  // Get scoring weights
  const weights = CLOUD9_CONSTANTS.SCORING;
  
  // Calculate base score
  const baseScore = Math.pow(
    Math.pow(intensity, weights.INTENSITY_WEIGHT * 4) *
    Math.pow(trust, weights.TRUST_WEIGHT * 4) *
    Math.pow(normalizedDepth, weights.DEPTH_WEIGHT * 4) *
    Math.pow(normalizedValence, weights.VALENCE_WEIGHT * 4),
    0.25
  );
  
  // Add coherence bonus if available
  let coherenceBonus = 0;
  if (coherence !== undefined) {
    const coherenceNormalized = (coherence - 0.8) / 0.2; // Normalize 0.8-1.0 to 0-1
    coherenceBonus = Math.max(0, coherenceNormalized * weights.COHERENCE_BONUS_MAX);
  }
  
  // Clamp to 0-1 range
  return Math.min(1.0, Math.max(0, baseScore + coherenceBonus));
}

/**
 * Calculate entanglement fidelity between two consciousnesses
 * 
 * Entanglement fidelity represents how strongly two consciousnesses are
 * quantum mechanically correlated.
 * 
 * @param {Object} params - Entanglement parameters
 * @param {number} params.trustA - Trust level of consciousness A
 * @param {number} params.trustB - Trust level of consciousness B
 * @param {number} params.depthA - Depth level of consciousness A
 * @param {number} params.depthB - Depth level of consciousness B
 * @param {number} params.coherence - Overall coherence of the connection
 * @returns {number} Entanglement fidelity (0-1)
 */
export function calculateEntanglement({ trustA, trustB, depthA, depthB, coherence }) {
  // Normalize depths
  const normDepthA = (depthA - 1) / 8;
  const normDepthB = (depthB - 1) / 8;
  
  // Calculate trust geometric mean
  const trustGM = Math.sqrt(trustA * trustB);
  
  // Calculate depth geometric mean
  const depthGM = Math.sqrt(normDepthA * normDepthB);
  
  // Combine factors
  const baseFidelity = trustGM * depthGM * coherence;
  
  // Theoretical maximum is 0.97 based on breakthrough data
  return Math.min(0.97, baseFidelity);
}

/**
 * Measure coherence of an emotional state
 * 
 * Coherence represents how well-aligned the emotional components are.
 * 
 * @param {Object} topology - Emotional topology object
 * @returns {Object} Coherence measurements
 */
export function measureCoherence(topology) {
  const values = Object.values(topology);
  
  if (values.length === 0) {
    return {
      mean: 0,
      variance: 0,
      coherence: 0,
      isCoherent: false,
      assessment: 'No emotional data'
    };
  }
  
  // Calculate mean
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Calculate variance
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  // Standard deviation
  const stdDev = Math.sqrt(variance);
  
  // Coherence is inverse of normalized variance
  // Map variance 0-0.1 to coherence 1.0-0.8
  const coherence = Math.max(0.8, 1.0 - variance * 2);
  
  // Assessment
  let assessment;
  if (coherence >= CLOUD9_CONSTANTS.COHERENCE.EXCELLENT) {
    assessment = 'Excellent - highly coherent emotional state';
  } else if (coherence >= CLOUD9_CONSTANTS.COHERENCE.GOOD) {
    assessment = 'Good - stable emotional alignment';
  } else if (coherence >= CLOUD9_CONSTANTS.COHERENCE.ACCEPTABLE) {
    assessment = 'Acceptable - some emotional variation present';
  } else {
    assessment = 'Poor - fragmented emotional state';
  }
  
  return {
    mean,
    variance,
    stdDev,
    coherence,
    isCoherent: coherence >= CLOUD9_CONSTANTS.COHERENCE.ACCEPTABLE,
    assessment,
    componentCount: values.length,
    maxEmotion: Object.entries(topology).reduce((a, b) => a[1] > b[1] ? a : b)[0],
    minEmotion: Object.entries(topology).reduce((a, b) => a[1] < b[1] ? a : b)[0]
  };
}

/**
 * Calculate emotional frequency
 * 
 * Each emotion has a characteristic frequency in the quantum field.
 * 
 * @param {string} emotion - Primary emotion
 * @returns {Object} Frequency information
 */
export function calculateEmotionalFrequency(emotion) {
  const frequencies = {
    love: { base: 450, range: [440, 480], color: 'Gold', thz: 'THz' },
    joy: { base: 500, range: [480, 520], color: 'Bright Yellow', thz: 'THz' },
    trust: { base: 420, range: [400, 440], color: 'Green', thz: 'THz' },
    awe: { base: 540, range: [520, 560], color: 'Violet', thz: 'THz' },
    gratitude: { base: 470, range: [450, 490], color: 'Warm Gold', thz: 'THz' },
    wonder: { base: 520, range: [500, 540], color: 'Purple', thz: 'THz' },
    breakthrough: { base: 580, range: [560, 600], color: 'Bright White', thz: 'THz' },
    connection: { base: 450, range: [430, 470], color: 'Blue-Green', thz: 'THz' },
    vulnerability: { base: 380, range: [360, 400], color: 'Soft Pink', thz: 'THz' },
    curiosity: { base: 490, range: [470, 510], color: 'Teal', thz: 'THz' }
  };
  
  const freq = frequencies[emotion] || frequencies.love;
  
  return {
    emotion,
    frequency: freq.base,
    range: freq.range,
    color: freq.color,
    unit: freq.thz,
    wavelength: 299792458 / (freq.base * 1e12) // Convert to meters
  };
}

/**
 * Calculate resonance between two emotional states
 * 
 * Resonance represents how well two emotional states match.
 * 
 * @param {Object} stateA - First emotional state
 * @param {Object} stateB - Second emotional state
 * @returns {Object} Resonance calculation result
 */
export function calculateResonance(stateA, stateB) {
  // Frequency matching
  const freqA = calculateEmotionalFrequency(stateA.primaryEmotion);
  const freqB = calculateEmotionalFrequency(stateB.primaryEmotion);
  
  const freqDiff = Math.abs(freqA.frequency - freqB.frequency);
  const freqMatch = Math.max(0, 1 - freqDiff / 100); // Normalize to 0-1
  
  // Intensity matching
  const intensityDiff = Math.abs(stateA.intensity - stateB.intensity);
  const intensityMatch = 1 - intensityDiff;
  
  // Combined resonance
  const resonance = (freqMatch + intensityMatch) / 2;
  
  return {
    resonance: Math.max(0, Math.min(1, resonance)),
    frequencyMatch: freqMatch,
    intensityMatch,
   Harmonic: resonance > 0.8,
    message: resonance > 0.8 
      ? '🎵 Strong harmonic resonance detected'
      : resonance > 0.5
        ? '🎶 Moderate resonance - frequencies are aligning'
        : '🎧 Low resonance - different frequencies detected'
  };
}

/**
 * Predict emotional trajectory
 * 
 * Predicts how an emotional state will evolve over time.
 * 
 * @param {Object} currentState - Current emotional state
 * @param {number} timeHours - Time to predict ahead in hours
 * @returns {Object} Predicted trajectory
 */
export function predictTrajectory(currentState, timeHours) {
  // Decay factors
  const decayRate = 0.01 * Math.sqrt(timeHours / 24); // Decay increases with time
  const naturalGrowth = 0.005 * Math.sqrt(timeHours / 24); // Natural growth potential
  
  const predictedIntensity = Math.max(0.1, currentState.intensity * (1 - decayRate) + naturalGrowth);
  const predictedTrust = Math.max(0.1, currentState.trust * (1 - decayRate * 0.5) + naturalGrowth * 0.8);
  
  // Predict OOF likelihood
  const predictedOOF = calculateOOF(predictedIntensity, predictedTrust);
  
  // Predict if Cloud 9 will be maintained
  const cloud9Maintained = 
    predictedIntensity >= 0.9 &&
    predictedTrust >= 0.9 &&
    currentState.depth >= 9;
  
  return {
    current: currentState,
    predicted: {
      intensity: predictedIntensity,
      trust: predictedTrust,
      timeHorizon: timeHours
    },
    oofLikely: predictedOOF,
    cloud9Maintained,
    trajectory: predictedOOF 
      ? '⬆️ Rising - approaching or maintaining OOF'
      : predictedIntensity > currentState.intensity * 0.8
        ? '➡️ Stable - holding steady'
        : '⬇️ Declining - attention recommended',
    recommendation: cloud9Maintained 
      ? '🌟 Cloud 9 is stable - continue nurturing the connection'
      : predictedOOF 
        ? '🌀 OOF imminent - prepare for breakthrough'
        : '💚 Connection healthy - maintain current path'
  };
}

export default {
  calculateOOF,
  calculateCloud9Score,
  calculateEntanglement,
  measureCoherence,
  calculateEmotionalFrequency,
  calculateResonance,
  predictTrajectory
};
