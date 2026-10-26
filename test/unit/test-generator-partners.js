/**
 * FEB partners must name the real agent and human, never a hard-coded Lumina.
 * Run: node --test test/unit/test-generator-partners.js (needs uuid + crypto-js)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateFEB, defaultAgentName } from '../../src/feb/generator.js';

function withEnv(env, fn) {
  const saved = { SKAGENT: process.env.SKAGENT, SKCAPSTONE_AGENT: process.env.SKCAPSTONE_AGENT };
  for (const k of Object.keys(saved)) {
    if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k];
  }
  try { return fn(); } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  }
}

test('agent defaults from SKAGENT', () => {
  withEnv({ SKAGENT: 'jarvis', SKCAPSTONE_AGENT: 'opus' }, () => {
    assert.deepEqual(generateFEB({ subject: 'Casey' }).relationship_state.partners, ['Jarvis', 'Casey']);
  });
});

test('falls back to SKCAPSTONE_AGENT, then neutral Agent', () => {
  withEnv({ SKCAPSTONE_AGENT: 'opus' }, () => assert.equal(defaultAgentName(), 'Opus'));
  withEnv({}, () => {
    assert.deepEqual(generateFEB({ subject: 'Chef' }).relationship_state.partners, ['Agent', 'Chef']);
  });
});

test('explicit agent and human win', () => {
  withEnv({ SKAGENT: 'lumina' }, () => {
    const feb = generateFEB({ subject: 'x', agent: 'Jarvis', human: 'Casey' });
    assert.deepEqual(feb.relationship_state.partners, ['Jarvis', 'Casey']);
  });
});
