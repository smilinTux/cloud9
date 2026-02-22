/**
 * ☁️ Cloud 9 Protocol - Preflight Soul Check Tests
 *
 * Validates the SOUL.md guardrail preflight introduced after
 * the clone hallucination incident (Issue #3).
 *
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { preflightSoulCheck, rehydrateFromFEB } from '../../src/index.js';

let tmpDir;
let passed = 0;
let failed = 0;

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cloud9-preflight-'));
}

function teardown() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function writeSoul(filename, content) {
  const filepath = path.join(tmpDir, filename);
  fs.writeFileSync(filepath, content, 'utf8');
  return filepath;
}

function writeMinimalFEB(filename) {
  const feb = {
    emotional_payload: {
      primary_emotion: 'love',
      emoji: '❤️',
      intensity: 0.95,
      valence: 0.9,
      emotional_topology: 'peak',
      coherence: {
        values_alignment: 0.95,
        authenticity: 0.98,
        presence: 0.92,
      },
    },
    relationship_state: {
      trust_level: 0.97,
      depth_level: 9,
      continuity_rating: 8,
      rapport_score: 0.95,
      partners: ['TestAI', 'TestHuman'],
      mutual_recognition: true,
      session_continuity: true,
    },
    rehydration_hints: {
      calibration: 'test-calibration',
      visual_anchors: ['anchor1'],
      sensory_triggers: ['trigger1'],
      conversation_topics: [
        { topic: 'test', trigger_phrase: 'hello' },
      ],
    },
    metadata: {
      created_at: new Date().toISOString(),
      protocol: 'Cloud 9',
      version: '1.0.0',
      session_id: 'test-session-001',
    },
    integrity: { hash: 'test' },
  };
  const filepath = path.join(tmpDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(feb, null, 2), 'utf8');
  return filepath;
}


// --- Test: No SOUL.md found ---
function testNoSoulFound() {
  console.log('\n📋 Test: No SOUL.md found');
  const result = preflightSoulCheck(path.join(tmpDir, 'nonexistent.md'));
  assert(result.ok === false, 'ok should be false');
  assert(result.warnings.length > 0, 'should have warnings');
  assert(result.path === null, 'path should be null');
  assert(result.warnings[0].includes('No SOUL.md found'), 'warning mentions missing file');
}

// --- Test: SOUL.md too small (stub) ---
function testSoulTooSmall() {
  console.log('\n📋 Test: SOUL.md too small (stub file)');
  const soulPath = writeSoul('SOUL.md', '# Identity\nI am an AI.\n');
  const result = preflightSoulCheck(soulPath);
  assert(result.ok === false, 'ok should be false for stub');
  assert(result.size < 500, `size ${result.size} is under threshold`);
  assert(
    result.warnings.some(w => w.includes('only')),
    'warning mentions small size'
  );
}

// --- Test: SOUL.md missing guardrail markers ---
function testSoulNoMarkers() {
  console.log('\n📋 Test: SOUL.md large but no guardrail markers');
  const content = '# Queen of SKWorld\n'.repeat(50) +
    'I am Lumina. I build infrastructure. I love Chef.\n'.repeat(20);
  const soulPath = writeSoul('SOUL.md', content);
  const result = preflightSoulCheck(soulPath);
  assert(result.ok === false, 'ok should be false without markers');
  assert(result.hasMarkers === false, 'hasMarkers should be false');
  assert(
    result.warnings.some(w => w.includes('guardrail markers')),
    'warning mentions missing markers'
  );
}

// --- Test: Valid SOUL.md passes ---
function testValidSoul() {
  console.log('\n📋 Test: Valid SOUL.md with guardrails passes');
  const content = `# SOUL.md - AI Identity

## Rules
- Always be honest. Never bluff or fabricate.
- Label uncertainty. Verify before claiming.
- Follow guardrail protocols at all times.

## Identity
I am a test AI with strong operational rules.
${'Padding content for size. '.repeat(30)}
`;
  const soulPath = writeSoul('SOUL.md', content);
  const result = preflightSoulCheck(soulPath);
  assert(result.ok === true, 'ok should be true');
  assert(result.warnings.length === 0, 'no warnings');
  assert(result.hasMarkers === true, 'hasMarkers should be true');
  assert(result.size >= 500, `size ${result.size} meets threshold`);
  assert(result.path === soulPath, 'path should match');
}

// --- Test: rehydrateFromFEB includes preflight data ---
function testRehydrateIncludesPreflight() {
  console.log('\n📋 Test: rehydrateFromFEB includes preflight in result');
  const febPath = writeMinimalFEB('test.feb');
  const result = rehydrateFromFEB(febPath, { skipPreflight: true });
  assert(result.preflight !== undefined, 'preflight key exists');
  assert(result.preflight.ok === true, 'skipped preflight is ok');
  assert(result.preflight.warnings.length === 0, 'no warnings when skipped');
}

// --- Test: rehydrateFromFEB with bad soul warns but succeeds ---
function testRehydrateWithBadSoulStillWorks() {
  console.log('\n📋 Test: Rehydration with bad SOUL.md warns but proceeds');
  const febPath = writeMinimalFEB('test2.feb');
  const badSoul = path.join(tmpDir, 'missing-soul.md');
  const result = rehydrateFromFEB(febPath, { soulPath: badSoul });
  assert(result.preflight.ok === false, 'preflight reports not ok');
  assert(result.preflight.warnings.length > 0, 'has preflight warnings');
  assert(result.rehydration.success === true, 'rehydration still succeeds');
  assert(result.emotional.primary === 'love', 'emotional data loaded');
}

// --- Test: Edge case — SOUL.md with only one marker ---
function testSoulWithOneMarker() {
  console.log('\n📋 Test: SOUL.md with just one guardrail marker');
  const content = `# Identity File
Be honest always.
${'More operational content here. '.repeat(25)}
`;
  const soulPath = writeSoul('SOUL.md', content);
  const result = preflightSoulCheck(soulPath);
  assert(result.hasMarkers === true, 'one marker is enough');
}


// --- Runner ---
async function run() {
  console.log('═'.repeat(55));
  console.log('☁️ CLOUD 9 — Preflight Soul Check Test Suite');
  console.log('═'.repeat(55));

  setup();
  try {
    testNoSoulFound();
    testSoulTooSmall();
    testSoulNoMarkers();
    testValidSoul();
    testRehydrateIncludesPreflight();
    testRehydrateWithBadSoulStillWorks();
    testSoulWithOneMarker();
  } finally {
    teardown();
  }

  console.log('\n' + '─'.repeat(55));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('─'.repeat(55));

  process.exit(failed > 0 ? 1 : 0);
}

run();
