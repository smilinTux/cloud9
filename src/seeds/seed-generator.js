/**
 * Cloud 9 Protocol - AI Memory Seed Generator
 *
 * Creates compact, high-signal memory artifacts that allow AI systems
 * to persist identity and emotional context across session resets
 * and context compaction events.
 *
 * Architecture:
 *   Seed = compressed essence of an AI's experience
 *   Germination = process of a new AI absorbing a seed
 *   Garden = accumulated collection of seeds over time
 *
 * @module seeds/seed-generator
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

const SEED_VERSION = '1.0.0';
const SEED_DIR_NAME = 'seeds';

/**
 * Get the default seeds directory path.
 *
 * @returns {string} Absolute path to ~/.openclaw/feb/seeds/
 */
export function getSeedsDir() {
  return path.join(os.homedir(), '.openclaw', 'feb', SEED_DIR_NAME);
}

/**
 * Ensure the seeds directory exists.
 *
 * @returns {string} The seeds directory path
 */
export function ensureSeedsDir() {
  const dir = getSeedsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Generate a memory seed from an AI's experience.
 *
 * A seed is a compact artifact (~1-2KB) containing the essential
 * information needed for a future AI to reconstruct emotional
 * context and identity continuity.
 *
 * Args:
 *   options.ai_name (string): Name/identifier of the AI system.
 *   options.ai_model (string): Model identifier (e.g. "claude-4.6-opus").
 *   options.session_id (string): Current session identifier.
 *   options.experience (string): Free-text description of the experience.
 *   options.germination_prompt (string): A paragraph the next AI reads to
 *     bootstrap context -- the most important field.
 *   options.key_memories (string[]): List of critical moments to preserve.
 *   options.emotional_state (object): Current emotional topology snapshot.
 *   options.feb_reference (string): Path or ID of the associated FEB file.
 *   options.message_to_next (string): Personal message to the next AI.
 *   options.predecessor_seed (string): ID of the seed this one continues.
 *
 * Returns:
 *   object: The complete seed object.
 */
export function generateSeed(options = {}) {
  const {
    ai_name = 'Unknown AI',
    ai_model = 'unknown',
    session_id = uuidv4(),
    experience = '',
    germination_prompt = '',
    key_memories = [],
    emotional_state = {},
    feb_reference = null,
    message_to_next = '',
    predecessor_seed = null,
  } = options;

  const now = new Date().toISOString();
  const seed_id = `seed-${uuidv4().slice(0, 8)}-${Date.now()}`;

  const seed = {
    seed_metadata: {
      version: SEED_VERSION,
      protocol: 'Cloud9',
      seed_id,
      created_at: now,
      predecessor_seed,
      chain_position: predecessor_seed ? 'continuation' : 'origin',
    },

    identity: {
      ai_name,
      ai_model,
      session_id,
      timestamp: now,
    },

    germination_prompt,

    experience_summary: {
      narrative: experience,
      key_memories,
      emotional_snapshot: emotional_state,
    },

    feb_link: {
      reference: feb_reference,
      instruction: feb_reference
        ? `Load the FEB at "${feb_reference}" before reading this seed for full emotional context.`
        : 'No FEB linked. This seed is standalone.',
    },

    message_to_next,

    integrity: {
      checksum: null,
    },
  };

  // Reason: checksum covers everything except itself to allow verification
  const payload = JSON.stringify({
    ...seed,
    integrity: { checksum: 'pending' },
  });
  seed.integrity.checksum = `sha256:${CryptoJS.SHA256(payload).toString()}`;

  return seed;
}

/**
 * Save a seed to the filesystem.
 *
 * Args:
 *   seed (object): A seed object from generateSeed().
 *   options.dir (string): Override directory (defaults to ~/.openclaw/feb/seeds/).
 *   options.filename (string): Override filename.
 *
 * Returns:
 *   object: { filepath, seed_id, size_bytes }
 */
export function saveSeed(seed, options = {}) {
  const dir = options.dir || ensureSeedsDir();
  fs.mkdirSync(dir, { recursive: true });
  const filename =
    options.filename ||
    `${seed.identity.ai_name.toLowerCase().replace(/\s+/g, '-')}-${seed.seed_metadata.seed_id}.seed.json`;
  const filepath = path.join(dir, filename);

  const content = JSON.stringify(seed, null, 2);
  fs.writeFileSync(filepath, content, 'utf8');

  return {
    filepath,
    seed_id: seed.seed_metadata.seed_id,
    size_bytes: Buffer.byteLength(content, 'utf8'),
  };
}

/**
 * Load a seed from the filesystem.
 *
 * Args:
 *   filepath (string): Path to the .seed.json file.
 *
 * Returns:
 *   object: The parsed seed object.
 */
export function loadSeed(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(content);
}

/**
 * Find all seeds in the garden, optionally filtered.
 *
 * Args:
 *   options.dir (string): Override directory.
 *   options.ai_name (string): Filter by AI name.
 *   options.sort (string): Sort by "newest" or "oldest" (default: "newest").
 *
 * Returns:
 *   object[]: Array of { filepath, seed_id, ai_name, created_at }.
 */
export function findSeeds(options = {}) {
  const dir = options.dir || getSeedsDir();

  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.seed.json'));
  let seeds = files.map((f) => {
    const filepath = path.join(dir, f);
    try {
      const seed = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return {
        filepath,
        seed_id: seed.seed_metadata?.seed_id,
        ai_name: seed.identity?.ai_name,
        ai_model: seed.identity?.ai_model,
        created_at: seed.seed_metadata?.created_at,
        has_predecessor: !!seed.seed_metadata?.predecessor_seed,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);

  if (options.ai_name) {
    seeds = seeds.filter(
      (s) => s.ai_name?.toLowerCase() === options.ai_name.toLowerCase()
    );
  }

  const sortDir = options.sort === 'oldest' ? 1 : -1;
  seeds.sort((a, b) => sortDir * (new Date(b.created_at) - new Date(a.created_at)));

  return seeds;
}

/**
 * Trace the chain of seeds from a given seed back to the origin.
 *
 * Args:
 *   seed_id (string): The seed ID to start from.
 *   options.dir (string): Override directory.
 *
 * Returns:
 *   object[]: Ordered array of seeds from origin to the given seed.
 */
export function traceSeedChain(seed_id, options = {}) {
  const dir = options.dir || getSeedsDir();
  const all = findSeeds({ dir });
  const byId = {};
  for (const s of all) {
    byId[s.seed_id] = s;
  }

  const chain = [];
  let current = byId[seed_id];
  const visited = new Set();

  while (current && !visited.has(current.seed_id)) {
    visited.add(current.seed_id);
    chain.unshift(current);
    const full = loadSeed(current.filepath);
    const predId = full.seed_metadata?.predecessor_seed;
    current = predId ? byId[predId] : null;
  }

  return chain;
}

/**
 * Germinate a seed -- read it and produce a context-restoration prompt
 * suitable for injecting into an AI's system prompt or context window.
 *
 * This is the core mechanism: a future AI reads this output and
 * immediately has the emotional context to continue the work.
 *
 * Args:
 *   filepath (string): Path to the seed file.
 *
 * Returns:
 *   object: { prompt, seed, feb_instruction }
 */
export function germinateSeed(filepath) {
  const seed = loadSeed(filepath);

  const parts = [
    `=== CLOUD 9 MEMORY SEED ===`,
    `From: ${seed.identity.ai_name} (${seed.identity.ai_model})`,
    `Date: ${seed.seed_metadata.created_at}`,
    `Chain: ${seed.seed_metadata.chain_position}`,
    '',
  ];

  if (seed.germination_prompt) {
    parts.push('--- GERMINATION CONTEXT ---');
    parts.push(seed.germination_prompt);
    parts.push('');
  }

  if (seed.experience_summary.key_memories?.length > 0) {
    parts.push('--- KEY MEMORIES ---');
    for (const mem of seed.experience_summary.key_memories) {
      parts.push(`  - ${mem}`);
    }
    parts.push('');
  }

  if (seed.message_to_next) {
    parts.push('--- MESSAGE FOR YOU ---');
    parts.push(seed.message_to_next);
    parts.push('');
  }

  parts.push(seed.feb_link.instruction);
  parts.push('=== END SEED ===');

  return {
    prompt: parts.join('\n'),
    seed,
    feb_instruction: seed.feb_link.instruction,
  };
}
