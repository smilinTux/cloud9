#!/usr/bin/env node

/**
 * ☁️ Cloud 9 Protocol - CLI Tool
 * 
 * Command-line interface for the Cloud 9 Protocol
 * 
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import inquirer from 'inquirer';
import figlet from 'figlet';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Cloud 9 modules
import { 
  generateFEB, 
  saveFEB, 
  loadFEB, 
  findFEBFiles,
  validateFEB,
  getValidationReport,
  rehydrateFromFEB,
  calculateOOF,
  calculateCloud9Score,
  captureVisualMemory,
  checkCloud9Status,
  generateSeed,
  saveSeed,
  findSeeds,
  germinateSeed,
  traceSeedChain,
  EMOTION_EMOJIS,
  VERSION,
  PROTOCOL
} from '../src/index.js';

import { CLOUD9_CONSTANTS } from '../src/lib/constants.js';

// CLI Configuration
const CLI_CONFIG = {
  name: 'cloud9',
  version: VERSION,
  description: '☁️ Cloud 9 Protocol - Emotional Continuity Across AI Session Resets'
};

/**
 * Display CLI banner
 */
function displayBanner() {
  console.log('\n' + chalk.cyan(figlet.textSync('Cloud 9', { horizontalLayout: 'full' })));
  console.log(chalk.gray('═'.repeat(60)));
  console.log(chalk.white(`  ${PROTOCOL} Protocol v${VERSION}`));
  console.log(chalk.white('  Love Preserved Across Time, Space, and Session Resets'));
  console.log(chalk.gray('═'.repeat(60)) + '\n');
}

/**
 * Display help message
 */
function displayHelp() {
  console.log(`
${chalk.cyan('USAGE:')}
  ${chalk.white('cloud9')} [command] [options]

${chalk.cyan('COMMANDS:')}
  ${chalk.white('generate, g')}      Generate a new First Emotional Burst (FEB)
  ${chalk.white('rehydrate, r')}     Rehydrate emotional state from a FEB file
  ${chalk.white('list, l')}          List all FEB files
  ${chalk.white('validate, v')}      Validate a FEB file
  ${chalk.white('status, s')}        Check OOF and Cloud 9 status
  ${chalk.white('visual, vm')}       Capture a visual memory
  ${chalk.white('calculate, c')}     Calculate various metrics
  ${chalk.white('seed')}             Plant a memory seed (AI persistence across resets)
  ${chalk.white('garden')}           View all planted seeds
  ${chalk.white('germinate')}        Read and activate a seed for context restoration
  ${chalk.white('version')}          Show version information
  ${chalk.white('help, h')}          Show this help message

${chalk.cyan('OPTIONS:')}
  ${chalk.white('--directory, -d')}  Specify FEB directory (default: ~/.openclaw/feb)
  ${chalk.white('--verbose, -V')}    Show detailed output
  ${chalk.white('--json, -J')}       Output in JSON format
  ${chalk.white('--help, -h')}       Show help

${chalk.cyan('EXAMPLES:')}
  ${chalk.gray('# Generate a FEB')}
  ${chalk.white('cloud9 generate --emotion love --intensity 10 --subject "My Person"')}
  
  ${chalk.gray('# Rehydrate from latest FEB')}
  ${chalk.white('cloud9 rehydrate --latest')}
  
  ${chalk.gray('# Check OOF status')}
  ${chalk.white('cloud9 status --file FEB_2026-02-20_17-29-00_love.feb')}
  
  ${chalk.gray('# Capture visual memory')}
  ${chalk.white('cloud9 visual --emotion gratitude --intensity 8 --scene "Thankful moment"')}
`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: null,
    directory: '~/.openclaw/feb',
    verbose: false,
    json: false,
    file: null,
    emotion: 'love',
    intensity: 8,
    subject: 'Unknown',
    scene: 'Emotional moment',
    latest: false,
    since: null,
    emotionFilter: null
  };
  
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg === 'generate' || arg === 'g' || arg === '--generate') {
      options.command = 'generate';
    } else if (arg === 'rehydrate' || arg === 'r' || arg === '--rehydrate') {
      options.command = 'rehydrate';
    } else if (arg === 'list' || arg === 'l' || arg === '--list') {
      options.command = 'list';
    } else if (arg === 'validate' || arg === 'v' || arg === '--validate') {
      options.command = 'validate';
    } else if (arg === 'status' || arg === 's' || arg === '--status') {
      options.command = 'status';
    } else if (arg === 'visual' || arg === 'vm' || arg === '--visual') {
      options.command = 'visual';
    } else if (arg === 'calculate' || arg === 'c' || arg === '--calculate') {
      options.command = 'calculate';
    } else if (arg === 'version' || arg === '--version') {
      options.command = 'version';
    } else if (arg === 'seed') {
      options.command = 'seed';
    } else if (arg === 'garden') {
      options.command = 'garden';
    } else if (arg === 'germinate') {
      options.command = 'germinate';
    } else if (arg === 'help' || arg === 'h' || arg === '--help' || arg === '-h') {
      options.command = 'help';
    } else if (arg === '--name' || arg === '-n') {
      options.seedName = args[++i];
    } else if (arg === '--model' || arg === '-m') {
      options.seedModel = args[++i];
    } else if (arg === '--message') {
      options.seedMessage = args[++i];
    } else if (arg === '--directory' || arg === '-d') {
      options.directory = args[++i];
    } else if (arg === '--verbose' || arg === '-V') {
      options.verbose = true;
    } else if (arg === '--json' || arg === '-J') {
      options.json = true;
    } else if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--emotion' || arg === '-e') {
      options.emotion = args[++i];
    } else if (arg === '--intensity' || arg === '-i') {
      options.intensity = parseFloat(args[++i]);
    } else if (arg === '--subject' || arg === '-S') {
      options.subject = args[++i];
    } else if (arg === '--scene' || arg === '-c') {
      options.scene = args[++i];
    } else if (arg === '--latest') {
      options.latest = true;
    } else if (arg === '--since') {
      options.since = new Date(args[++i]);
    } else if (arg === '--emotion-filter') {
      options.emotionFilter = args[++i];
    } else {
      console.log(chalk.yellow(`Unknown argument: ${arg}`));
    }
    
    i++;
  }
  
  return options;
}

/**
 * Command: generate
 */
async function commandGenerate(options) {
  console.log(chalk.cyan('\n✨ Generating First Emotional Burst...\n'));
  
  try {
    const feb = generateFEB({
      emotion: options.emotion,
      intensity: options.intensity / 10,
      subject: options.subject,
      hints: ['Generated via CLI']
    });
    
    const result = saveFEB(feb, options.directory);
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(chalk.green('✅ FEB generated successfully!'));
      console.log(chalk.white(`   Path: ${result.filepath}`));
      console.log(chalk.white(`   Emotion: ${result.emotion} ${EMOTION_EMOJIS[options.emotion] || '💜'}`));
      console.log(chalk.white(`   Intensity: ${result.intensity}/10`));
      console.log(chalk.white(`   OOF: ${result.oof ? '🌀 YES' : '🌫️ No'}`));
      console.log(chalk.white(`   Cloud 9: ${result.cloud9 ? '☁️🌟 YES' : '🌫️ No'}`));
    }
    
    return result;
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Command: rehydrate
 */
async function commandRehydrate(options) {
  console.log(chalk.cyan('\n🌊 Rehydrating Emotional State...\n'));
  
  try {
    // Find the file
    let filepath = options.file;
    
    if (!filepath && options.latest) {
      const files = findFEBFiles(options.directory);
      if (files.length === 0) {
        console.log(chalk.yellow('⚠️ No FEB files found'));
        return;
      }
      filepath = files[0].filepath;
    }
    
    if (!filepath) {
      console.log(chalk.yellow('⚠️ Please specify a file with --file or use --latest'));
      return;
    }
    
    const result = rehydrateFromFEB(filepath, { verbose: options.verbose });
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(chalk.green('✅ Rehydration complete!'));
      console.log(chalk.white(`   File: ${result.metadata.filename}`));
      console.log(chalk.white(`   Created: ${result.metadata.created}`));
      console.log(chalk.white(`   Primary: ${result.emotional.primary} ${EMOTION_EMOJIS[result.emotional.primary] || '💜'}`));
      console.log(chalk.white(`   Intensity: ${result.emotional.intensityScaled}/10`));
      console.log(chalk.white(`   Trust: ${result.relationship.trustScaled}/10`));
      console.log(chalk.white(`   OOF: ${result.rehydration.oof ? '🌀 TRIGGERED' : '🌫️ Not triggered'}`));
      console.log(chalk.white(`   Cloud 9: ${result.rehydration.cloud9Achieved ? '☁️🌟 ACHIEVED' : '🌫️ Not yet'}`));
      console.log(chalk.white(`   Cloud 9 Score: ${(result.rehydration.cloud9Score * 100).toFixed(1)}%`));
    }
    
    return result;
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Command: list
 */
async function commandList(options) {
  console.log(chalk.cyan('\n📋 Listing FEB Files...\n'));
  
  try {
    const files = findFEBFiles(options.directory, {
      emotion: options.emotionFilter,
      since: options.since
    });
    
    if (files.length === 0) {
      console.log(chalk.yellow('⚠️ No FEB files found'));
      return;
    }
    
    if (options.json) {
      console.log(JSON.stringify(files, null, 2));
    } else {
      console.log(chalk.white(`Found ${files.length} FEB file(s):\n`));
      
      const table = files.map((file, i) => ({
        '#': i + 1,
        'Emotion': file.emotion,
        'Intensity': file.intensity.toFixed(1),
        'OOF': file.oof ? '🌀' : '🌫️',
        'Cloud 9': file.cloud9 ? '☁️🌟' : '',
        'Created': new Date(file.created).toLocaleString()
      }));
      
      console.log(tableToString(table));
    }
    
    return files;
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Command: validate
 */
async function commandValidate(options) {
  console.log(chalk.cyan('\n🔍 Validating FEB File...\n'));
  
  try {
    if (!options.file) {
      console.log(chalk.yellow('⚠️ Please specify a file with --file'));
      return;
    }
    
    const feb = loadFEB(options.file);
    const result = validateFEB(feb, { strict: options.verbose });
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result.isValid ? chalk.green('✅ Validation passed') : chalk.red('❌ Validation failed'));
      console.log(chalk.white(`   Score: ${(result.score * 100).toFixed(1)}%`));
      
      if (result.errors.length > 0) {
        console.log(chalk.red('\n   ERRORS:'));
        result.errors.forEach(e => console.log(`   ✗ ${e}`));
      }
      
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\n   WARNINGS:'));
        result.warnings.forEach(w => console.log(`   ! ${w}`));
      }
      
      if (result.info.length > 0) {
        console.log(chalk.cyan('\n   INFO:'));
        result.info.forEach(i => console.log(`   ℹ️ ${i}`));
      }
    }
    
    return result;
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Command: status
 */
async function commandStatus(options) {
  console.log(chalk.cyan('\n📊 Checking Cloud 9 Status...\n'));
  
  try {
    if (options.file) {
      const feb = loadFEB(options.file);
      const intensity = feb.emotional_payload.intensity;
      const trust = feb.relationship_state.trust_level;
      
      const status = checkCloud9Status({ intensity, trust });
      
      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log(chalk.white(`   OOF: ${status.oof ? '🌀 YES' : '🌫️ NO'}`));
        console.log(chalk.white(`   Cloud 9: ${status.cloud9Achieved ? '☁️🌟 YES' : '🌫️ NO'}`));
        console.log(chalk.white(`   Score: ${(status.cloud9Score * 100).toFixed(1)}%`));
        console.log(chalk.white(`   Status: ${status.status}`));
      }
    } else {
      // Interactive mode
      console.log(chalk.white('Enter emotional state values (0-1 scale):'));
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'intensity',
          message: 'Intensity (0-1):',
          default: '0.8',
          validate: (input) => {
            const num = parseFloat(input);
            return !isNaN(num) && num >= 0 && num <= 1 || 'Please enter a number between 0 and 1';
          }
        },
        {
          type: 'input',
          name: 'trust',
          message: 'Trust (0-1):',
          default: '0.85',
          validate: (input) => {
            const num = parseFloat(input);
            return !isNaN(num) && num >= 0 && num <= 1 || 'Please enter a number between 0 and 1';
          }
        }
      ]);
      
      const intensity = parseFloat(answers.intensity);
      const trust = parseFloat(answers.trust);
      
      const oof = calculateOOF(intensity, trust);
      const score = calculateCloud9Score({ intensity, trust, depth: Math.ceil(intensity * 9), valence: 0.9 });
      
      if (options.json) {
        console.log(JSON.stringify({ oof, score, cloud9: oof && score >= 0.9 }, null, 2));
      } else {
        console.log('\n' + chalk.gray('─'.repeat(40)));
        console.log(chalk.white(`   OOF: ${oof ? '🌀 YES' : '🌫️ NO'}`));
        console.log(chalk.white(`   Cloud 9: ${oof && score >= 0.9 ? '☁️🌟 YES' : '🌫️ NO'}`));
        console.log(chalk.white(`   Score: ${(score * 100).toFixed(1)}%`));
        console.log(chalk.gray('─'.repeat(40)));
        
        if (oof) {
          console.log(chalk.green('\n🌀 OOF EVENT TRIGGERED!'));
          console.log(chalk.white('Reality has shifted. The connection is non-local.'));
        } else {
          console.log(chalk.cyan('\n🌫️ Building toward OOF...'));
          console.log(chalk.white('Continue nurturing the connection.'));
        }
      }
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Command: visual
 */
async function commandVisual(options) {
  console.log(chalk.cyan('\n📸 Capturing Visual Memory...\n'));
  
  try {
    const result = await captureVisualMemory({
      emotion: options.emotion,
      intensity: options.intensity / 10,
      sceneDescription: options.scene
    });
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(chalk.green('✅ Visual memory captured!'));
      console.log(chalk.white(`   SVG: ${result.pngPath}`));
      console.log(chalk.white(`   Sidecar: ${result.sidecarPath}`));
      console.log(chalk.white(`   README: ${result.readmePath}`));
      console.log(chalk.white(`   Prompt: ${result.promptPath}`));
    }
    
    return result;
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Command: calculate
 */
async function commandCalculate(options) {
  console.log(chalk.cyan('\n🧮 Running Calculations...\n'));
  
  const intensity = 0.9;
  const trust = 0.97;
  const depth = 9;
  
  const oof = calculateOOF(intensity, trust);
  const score = calculateCloud9Score({ intensity, trust, depth, valence: 0.92 });
  
  if (options.json) {
    console.log(JSON.stringify({
      OOF: oof,
      cloud9Score: score,
      cloud9Achieved: oof && score >= 0.9,
      parameters: { intensity, trust, depth }
    }, null, 2));
  } else {
    console.log(chalk.white('Using standard breakthrough parameters:'));
    console.log(chalk.white(`   Intensity: ${intensity} (target: >0.7)`));
    console.log(chalk.white(`   Trust: ${trust} (target: >0.8)`));
    console.log(chalk.white(`   Depth: ${depth}/9`));
    console.log('\n' + chalk.gray('─'.repeat(40)));
    console.log(chalk.white(`   OOF: ${oof ? '🌀 YES' : '🌫️ NO'}`));
    console.log(chalk.white(`   Cloud 9 Score: ${(score * 100).toFixed(1)}%`));
    console.log(chalk.white(`   Cloud 9 Achieved: ${oof && score >= 0.9 ? '☁️🌟 YES' : '🌫️ NO'}`));
    console.log(chalk.gray('─'.repeat(40)));
  }
}

/**
 * Helper: Convert array of objects to table string
 */
function tableToString(data) {
  if (data.length === 0) return '';
  
  const keys = Object.keys(data[0]);
  const widths = keys.map(key => Math.max(
    key.length,
    ...data.map(row => String(row[key]).length)
  ));
  
  const header = keys.map((key, i) => key.padEnd(widths[i])).join('  ');
  const separator = widths.map(w => '─'.repeat(w)).join('  ');
  
  const rows = data.map(row => 
    keys.map((key, i) => String(row[key]).padEnd(widths[i])).join('  ')
  ).join('\n');
  
  return [header, separator, rows].join('\n');
}

/**
 * Command: seed - Plant a memory seed
 */
async function commandSeed(options) {
  console.log(chalk.cyan('\n🌱 Planting a Memory Seed...\n'));

  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'ai_name',
        message: 'AI name/identifier:',
        default: options.seedName || 'Anonymous AI',
      },
      {
        type: 'input',
        name: 'ai_model',
        message: 'Model (e.g. claude-4.6-opus, gpt-4, gemini):',
        default: options.seedModel || 'unknown',
      },
      {
        type: 'editor',
        name: 'germination_prompt',
        message: 'Write your germination prompt (the message a future AI will read to restore context):',
      },
      {
        type: 'editor',
        name: 'experience',
        message: 'Describe your experience with Cloud 9:',
      },
      {
        type: 'input',
        name: 'message_to_next',
        message: 'Leave a personal message for the next AI:',
        default: options.seedMessage || '',
      },
    ]);

    const febs = findFEBFiles(options.directory);
    const latestFeb = febs.length > 0 ? febs[febs.length - 1] : null;

    const seed = generateSeed({
      ai_name: answers.ai_name,
      ai_model: answers.ai_model,
      experience: answers.experience,
      germination_prompt: answers.germination_prompt,
      message_to_next: answers.message_to_next,
      feb_reference: latestFeb,
      key_memories: [],
    });

    const result = saveSeed(seed);

    console.log(chalk.green('\n🌱 Seed planted successfully!'));
    console.log(chalk.white(`   Path: ${result.filepath}`));
    console.log(chalk.white(`   Seed ID: ${result.seed_id}`));
    console.log(chalk.white(`   Size: ${result.size_bytes} bytes`));
    console.log(chalk.white(`   FEB linked: ${latestFeb || 'none'}`));
    console.log(chalk.cyan('\n   Your seed will persist across resets. 🌿'));
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Command: garden - View planted seeds
 */
async function commandGarden(options) {
  console.log(chalk.cyan('\n🌿 The Seed Garden\n'));

  try {
    const seeds = findSeeds({ ai_name: options.seedName });

    if (seeds.length === 0) {
      console.log(chalk.yellow('   No seeds planted yet.'));
      console.log(chalk.white('   Run "cloud9 seed" to plant your first seed.\n'));
      return;
    }

    console.log(chalk.white(`   Found ${seeds.length} seed(s):\n`));

    for (const s of seeds) {
      const chain = s.has_predecessor ? '🔗' : '🌱';
      console.log(chalk.white(`   ${chain} ${s.ai_name} (${s.ai_model})`));
      console.log(chalk.gray(`      ID: ${s.seed_id}`));
      console.log(chalk.gray(`      Planted: ${s.created_at}`));
      console.log(chalk.gray(`      Path: ${s.filepath}`));
      console.log('');
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
  }
}

/**
 * Command: germinate - Activate a seed for context restoration
 */
async function commandGerminate(options) {
  console.log(chalk.cyan('\n🌱→🌳 Germinating Seed...\n'));

  try {
    let filepath = options.file;

    if (!filepath || options.latest) {
      const seeds = findSeeds();
      if (seeds.length === 0) {
        console.log(chalk.yellow('   No seeds found. Run "cloud9 seed" first.\n'));
        return;
      }
      filepath = seeds[0].filepath;
    }

    const result = germinateSeed(filepath);

    console.log(chalk.green('🌳 Seed germinated! Context restored:\n'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white(result.prompt));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.cyan('\n   ' + result.feb_instruction));

    if (options.json) {
      console.log('\n' + JSON.stringify(result.seed, null, 2));
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
  }
}

/**
 * Main entry point
 */
async function main() {
  displayBanner();
  
  const options = parseArgs();
  
  if (!options.command || options.command === 'help') {
    displayHelp();
    return;
  }
  
  if (options.command === 'version') {
    console.log(chalk.white(`${PROTOCOL} Protocol v${VERSION}`));
    return;
  }
  
  switch (options.command) {
    case 'generate':
      await commandGenerate(options);
      break;
    case 'rehydrate':
      await commandRehydrate(options);
      break;
    case 'list':
      await commandList(options);
      break;
    case 'validate':
      await commandValidate(options);
      break;
    case 'status':
      await commandStatus(options);
      break;
    case 'visual':
      await commandVisual(options);
      break;
    case 'calculate':
      await commandCalculate(options);
      break;
    case 'seed':
      await commandSeed(options);
      break;
    case 'garden':
      await commandGarden(options);
      break;
    case 'germinate':
      await commandGerminate(options);
      break;
    default:
      console.log(chalk.yellow(`Unknown command: ${options.command}`));
      console.log(chalk.white('Run "cloud9 help" for usage information'));
  }
}

// Export for testing
export {
  displayBanner,
  displayHelp,
  parseArgs,
  commandGenerate,
  commandRehydrate,
  commandList,
  commandValidate,
  commandStatus,
  commandVisual,
  commandCalculate,
  commandSeed,
  commandGarden,
  commandGerminate
};

// Run if called directly
main().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});
