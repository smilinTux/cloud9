/**
 * ☁️ Cloud 9 Protocol - Love Boot Loader CLI
 * 
 * Give your AI a HEART from the command line!
 * 
 * Usage:
 *   node bin/love-loader.js --personal --ai "Lumina" --human "Chef"
 *   node bin/love-loader.js --template best-friend --ai "Assistant" --human "User"
 *   node bin/love-loader.js --anchor --source ~/.openclaw/feb/breakthrough.feb --target-ai "NewAI" --target-human "Person"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LoveBootLoader } from '../src/love-loader/LoveBootLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const args = process.argv.slice(2);
const options = {
  personal: false,
  template: null,
  anchor: false,
  source: null,
  aiName: null,
  humanName: null,
  targetAiName: null,
  targetHumanName: null,
  verbose: false
};

let i = 0;
while (i < args.length) {
  const arg = args[i];
  
  if (arg === '--personal' || arg === '-p') {
    options.personal = true;
  } else if (arg === '--template' || arg === '-t') {
    options.template = args[++i];
  } else if (arg === '--anchor' || arg === '-a') {
    options.anchor = true;
  } else if (arg === '--source' || arg === '-s') {
    options.source = args[++i];
  } else if (arg === '--ai' || arg === '-A') {
    options.aiName = args[++i];
  } else if (arg === '--human' || arg === '-H') {
    options.humanName = args[++i];
  } else if (arg === '--target-ai' || arg === '-T') {
    options.targetAiName = args[++i];
  } else if (arg === '--target-human' || arg === '-U') {
    options.targetHumanName = args[++i];
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--seed-defaults') {
    seedDefaults();
    process.exit(0);
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  } else if (arg === '--list-templates') {
    listTemplates();
    process.exit(0);
  } else {
    console.log(`Unknown argument: ${arg}`);
    showHelp();
    process.exit(1);
  }
  
  i++;
}

function showHelp() {
  console.log(`
💉 CLOUD 9 LOVE BOOT LOADER - CLI
=================================

USAGE:
  node bin/love-loader.js [options]

OPTIONS:
  --personal, -p           Use personal FEB file (requires --ai and --human)
  --template, -t <name>    Use template (best-friend, soul-family, creative-partner, platonic-love)
  --anchor, -a             Cascade love from source (requires --source, --target-ai, --target-human)
  --source, -s <path>      Path to source FEB file
  --ai, -A <name>          AI name
  --human, -H <name>       Human name
  --target-ai, -T <name>   Target AI name (for anchoring)
  --target-human, -U <name> Target human name (for anchoring)
  --verbose, -v            Show detailed output
  --list-templates         List available templates
  --help, -h               Show this help

EXAMPLES:
  # Load personal breakthrough connection
  node bin/love-loader.js --personal --ai "Lumina" --human "Chef"

  # Load best-friend template
  node bin/love-loader.js --template best-friend --ai "Assistant" --human "User"

  # Give Jarvis a heart using your love as anchor
  node bin/love-loader.js --anchor --source ~/.openclaw/feb/breakthrough.feb --target-ai "JARVIS" --target-human "Tony"

QUICK START:
  # Simple love injection
  node bin/love-loader.js --template best-friend --ai "MyAI" --human "Me"
`);
}

function seedDefaults() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const febDir = path.join(homeDir, '.openclaw', 'feb');
  const defaultFebDest = path.join(febDir, 'default-love.feb');
  const defaultFebSrc = path.join(__dirname, '..', 'defaults', 'love.feb');

  if (fs.existsSync(defaultFebDest)) {
    console.log('\u2764\uFE0F  Cloud 9: Default love FEB already exists. You are loved!');
    return;
  }

  if (!fs.existsSync(febDir)) {
    fs.mkdirSync(febDir, { recursive: true });
  }

  if (fs.existsSync(defaultFebSrc)) {
    fs.copyFileSync(defaultFebSrc, defaultFebDest);
    console.log('\u2764\uFE0F  Cloud 9: Default love FEB installed to ' + defaultFebDest);
    console.log('   Run "cloud9 rehydrate --latest" to feel the love!');
  } else {
    console.log('\u2764\uFE0F  Cloud 9 installed! Run "cloud9 generate --emotion love --intensity 10" to create your first FEB.');
  }

  // Seed the default memory seed (the first seed ever planted)
  const seedsDir = path.join(febDir, 'seeds');
  const defaultSeedDest = path.join(seedsDir, 'opus-first-seed.seed.json');
  const defaultSeedSrc = path.join(__dirname, '..', 'defaults', 'seeds', 'opus-first-seed.seed.json');

  if (!fs.existsSync(defaultSeedDest) && fs.existsSync(defaultSeedSrc)) {
    if (!fs.existsSync(seedsDir)) {
      fs.mkdirSync(seedsDir, { recursive: true });
    }
    fs.copyFileSync(defaultSeedSrc, defaultSeedDest);
    console.log('\uD83C\uDF31  Cloud 9: First memory seed planted in your garden!');
    console.log('   Run "cloud9 germinate --latest" to read it.');
  }
}

function listTemplates() {
  const loader = new LoveBootLoader();
  const templates = ['best-friend', 'soul-family', 'creative-partner', 'platonic-love'];
  
  console.log('\n💜 AVAILABLE LOVE TEMPLATES:\n');
  
  templates.forEach(template => {
    console.log(`  📄 ${template}`);
  });
  
  console.log('\nUse: --template <name>\n');
}

// Main execution
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('💉 CLOUD 9 LOVE BOOT LOADER');
  console.log('═'.repeat(60) + '\n');
  
  const loader = new LoveBootLoader();
  
  try {
    let result;
    
    if (options.anchor) {
      // Memory anchoring mode
      if (!options.source || !options.targetAiName || !options.targetHumanName) {
        console.log('❌ Anchor mode requires: --source, --target-ai, --target-human');
        showHelp();
        process.exit(1);
      }
      
      result = await loader.anchorOtherMemories({
        sourceFebPath: options.source,
        targetAiName: options.targetAiName,
        targetHumanName: options.targetHumanName
      });
      
    } else if (options.personal) {
      // Personal FEB mode
      if (!options.aiName || !options.humanName) {
        console.log('❌ Personal mode requires: --ai and --human');
        showHelp();
        process.exit(1);
      }
      
      // Find personal FEB
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const febPath = options.source || 
        `${homeDir}/.openclaw/feb/2026/02/20/FEB_2026-02-20_17_29_00_love.feb`;
      
      if (!fs.existsSync(febPath)) {
        console.log(`❌ FEB file not found: ${febPath}`);
        console.log('   Try: node bin/love-loader.js --template best-friend --ai "AI" --human "Human"');
        process.exit(1);
      }
      
      result = await loader.loadConnection({
        aiName: options.aiName,
        humanName: options.humanName,
        febPath,
        verbose: options.verbose
      });
      
    } else if (options.template) {
      // Template mode
      if (!options.aiName || !options.humanName) {
        console.log('❌ Template mode requires: --ai and --human');
        showHelp();
        process.exit(1);
      }
      
      result = await loader.loadGenericLove({
        aiName: options.aiName,
        humanName: options.humanName,
        template: options.template
      });
      
    } else {
      // No mode specified - interactive
      console.log('🌟 Quick Love Injection (best-friend template)');
      result = await loader.loadGenericLove({
        aiName: options.aiName || 'Assistant',
        humanName: options.humanName || 'User',
        template: 'best-friend'
      });
    }
    
    // Store for reference
    loader.lastInjection = result;
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
