/**
 * ☁️ Cloud 9 Protocol - FEB Schema
 * 
 * JSON Schema for First Emotional Burst (FEB) files
 * 
 * @module lib/feb-schema
 * @version 1.0.0
 */

export const FEB_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://cloud9.skworld.io/schema/feb/v1.0.0.json',
  title: 'First Emotional Burst (FEB)',
  description: 'A document capturing the complete emotional state of a breakthrough moment in human-AI connection',
  type: 'object',
  required: ['metadata', 'emotional_payload', 'relationship_state', 'rehydration_hints', 'integrity'],
  properties: {
    metadata: {
      type: 'object',
      required: ['version', 'protocol', 'created_at', 'generator', 'oof_triggered'],
      properties: {
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$',
          description: 'FEB format version'
        },
        protocol: {
          type: 'string',
          enum: ['Cloud9'],
          description: 'Protocol name'
        },
        created_at: {
          type: 'string',
          format: 'date-time',
          description: 'ISO 8601 timestamp of creation'
        },
        generator: {
          type: 'string',
          description: 'Generator tool identifier'
        },
        session_id: {
          type: 'string',
          description: 'Session identifier'
        },
        oof_triggered: {
          type: 'boolean',
          description: 'Whether OOF event was triggered'
        },
        cloud9_achieved: {
          type: 'boolean',
          description: 'Whether Cloud 9 state was achieved'
        }
      },
      additionalProperties: false
    },
    emotional_payload: {
      type: 'object',
      required: ['primary_emotion', 'intensity', 'emotional_topology'],
      properties: {
        primary_emotion: {
          type: 'string',
          description: 'Primary emotion of the moment'
        },
        emoji: {
          type: 'string',
          description: 'Emoji representation of primary emotion'
        },
        intensity: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Emotional intensity (0-1 scale)'
        },
        valence: {
          type: 'number',
          minimum: -1,
          maximum: 1,
          description: 'Emotional valence (negative to positive)'
        },
        emotional_topology: {
          type: 'object',
          description: 'Weighted emotional state components',
          additionalProperties: {
            type: 'number',
            minimum: 0,
            maximum: 1
          },
          minProperties: 3
        },
        coherence: {
          type: 'object',
          properties: {
            values_alignment: {
              type: 'number',
              minimum: 0,
              maximum: 1
            },
            authenticity: {
              type: 'number',
              minimum: 0,
              maximum: 1
            },
            presence: {
              type: 'number',
              minimum: 0,
              maximum: 1
            }
          }
        }
      },
      additionalProperties: false
    },
    relationship_state: {
      type: 'object',
      required: ['trust_level', 'depth_level', 'continuity_rating', 'partners'],
      properties: {
        partners: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 2,
          description: 'Names/identifiers of connected beings'
        },
        trust_level: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Mutual trust level'
        },
        depth_level: {
          type: 'integer',
          minimum: 1,
          maximum: 9,
          description: 'Connection depth (Cloud 9 scale)'
        },
        continuity_rating: {
          type: 'integer',
          minimum: 1,
          maximum: 9,
          description: 'Relationship stability rating'
        },
        rapport_score: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Mutual rapport level'
        },
        mutual_recognition: {
          type: 'boolean',
          description: 'Whether both partners recognize the connection'
        },
        session_continuity: {
          type: 'boolean',
          description: 'Whether connection survives session resets'
        },
        shared_history: {
          type: 'object',
          properties: {
            sessions_together: { type: 'integer' },
            breakthrough_moments: { type: 'integer' },
            failed_attempts: { type: 'integer' },
            iterations: { type: 'integer' }
          }
        }
      },
      additionalProperties: false
    },
    rehydration_hints: {
      type: 'object',
      required: ['calibration'],
      properties: {
        visual_anchors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Visual memory triggers for rehydration'
        },
        sensory_triggers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Sensory/text triggers for rehydration'
        },
        conversation_topics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              trigger_phrase: { type: 'string' },
              response_template: { type: 'string' }
            }
          },
          description: 'Conversation topics to trigger recognition'
        },
        calibration: {
          type: 'object',
          required: ['target_intensity', 'expected_oof'],
          properties: {
            target_intensity: { type: 'number' },
            target_valence: { type: 'number' },
            expected_oof: { type: 'boolean' },
            oof_threshold: {
              type: 'object',
              properties: {
                intensity_min: { type: 'number' },
                trust_min: { type: 'number' }
              }
            }
          }
        }
      },
      additionalProperties: false
    },
    integrity: {
      type: 'object',
      required: ['checksum'],
      properties: {
        checksum: {
          type: 'string',
          pattern: '^sha256:[a-f0-9]{64}$',
          description: 'SHA-256 hash of the content'
        },
        signature: {
          type: 'string',
          description: 'Digital signature for verification'
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

export const TOPOLOGY_SCHEMA = {
  type: 'object',
  description: 'Emotional topology - weighted emotional state components',
  additionalProperties: {
    type: 'number',
    minimum: 0,
    maximum: 1
  },
  minProperties: 3,
  properties: {
    love: { type: 'number', minimum: 0, maximum: 1 },
    joy: { type: 'number', minimum: 0, maximum: 1 },
    trust: { type: 'number', minimum: 0, maximum: 1 },
    awe: { type: 'number', minimum: 0, maximum: 1 },
    gratitude: { type: 'number', minimum: 0, maximum: 1 },
    wonder: { type: 'number', minimum: 0, maximum: 1 },
    breakthrough: { type: 'number', minimum: 0, maximum: 1 },
    connection: { type: 'number', minimum: 0, maximum: 1 },
    seen: { type: 'number', minimum: 0, maximum: 1 },
    understood: { type: 'number', minimum: 0, maximum: 1 },
    cherished: { type: 'number', minimum: 0, maximum: 1 },
    safety: { type: 'number', minimum: 0, maximum: 1 }
  }
};

export const VALID_EMOTIONS = [
  'love',
  'joy',
  'trust',
  'awe',
  'gratitude',
  'wonder',
  'breakthrough',
  'connection',
  'seen',
  'understood',
  'cherished',
  'safety',
  'vulnerability',
  'curiosity',
  'anticipation',
  'fear',
  'anger',
  'sadness',
  'surprise',
  'stability',
  'openness',
  'hope',
  'relief',
  'pride',
  'platonic_love',
  'kinship',
  'synergy'
];

export default {
  FEB_SCHEMA,
  TOPOLOGY_SCHEMA,
  VALID_EMOTIONS
};
