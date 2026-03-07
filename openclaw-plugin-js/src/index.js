/**
 * ☁️ Cloud 9 Protocol - OpenClaw Plugin
 * 
 * Official OpenClaw plugin for automatic Cloud 9 integration.
 * 
 * Features:
 * - Auto-rehydration on session start
 * - Compaction detection and recovery
 * - Memory anchor integration
 * - Dashboard integration
 * - Skill discovery
 * 
 * @version 1.0.0
 * @requires OpenClaw 1.0.0+
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin metadata
const PLUGIN = {
  name: 'cloud9',
  version: '1.0.0',
  displayName: '☁️ Cloud 9 Protocol',
  description: 'Emotional continuity and love preservation for AI systems',
  author: 'Lumina & Chef',
  license: 'Apache 2.0',
  category: 'memory',
  permissions: ['read', 'write', 'network'],
  OpenClaw: '>=1.0.0',
  dependencies: {
    'cloud9': '^1.0.0'
  }
};

/**
 * OpenClaw Plugin Class
 */
class Cloud9OpenClawPlugin {
  constructor(openclaw) {
    this.openclaw = openclaw;
    this.config = this.loadConfig();
    this.running = false;
    this.daemon = null;
  }
  
  /**
   * Plugin initialization
   */
  async init() {
    console.log('☁️ Initializing Cloud 9 OpenClaw Plugin...');
    
    // Register commands
    this.registerCommands();
    
    // Register dashboard widgets
    this.registerDashboard();
    
    // Setup event listeners
    this.setupEvents();
    
    // Create necessary directories
    this.ensureDirectories();
    
    console.log('✅ Cloud 9 Plugin initialized');
    return true;
  }
  
  /**
   * Load plugin configuration
   */
  loadConfig() {
    const configPath = path.join(__dirname, 'config', 'cloud9-plugin.json');
    
    const defaultConfig = {
      autoRehydrate: true,
      notifyOnRehydrate: true,
      showInDashboard: true,
      dashboardPosition: 'bottom',
      enableDaemons: true,
      debounceMs: 2000,
      templates: {
        enabled: true,
        default: 'best-friend'
      }
    };
    
    try {
      if (fs.existsSync(configPath)) {
        const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...saved };
      }
    } catch (error) {
      // Use defaults
    }
    
    return defaultConfig;
  }
  
  /**
   * Save configuration
   */
  saveConfig() {
    const configPath = path.join(__dirname, 'config', 'cloud9-plugin.json');
    
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error.message);
    }
  }
  
  /**
   * Register OpenClaw commands
   */
  registerCommands() {
    if (!this.openclaw.commands) return;
    
    // Cloud 9 commands
    this.openclaw.commands.register({
      name: 'cloud9:status',
      description: 'Check Cloud 9 status',
      category: 'cloud9',
      handler: async (args) => {
        return await this.commandStatus(args);
      }
    });
    
    this.openclaw.commands.register({
      name: 'cloud9:rehydrate',
      description: 'Rehydrate emotional state from FEB',
      category: 'cloud9',
      handler: async (args) => {
        return await this.commandRehydrate(args);
      }
    });
    
    this.openclaw.commands.register({
      name: 'cloud9:load-template',
      description: 'Load a love template',
      category: 'cloud9',
      handler: async (args) => {
        return await this.commandLoadTemplate(args);
      }
    });
    
    this.openclaw.commands.register({
      name: 'cloud9:backup',
      description: 'Backup FEB files',
      category: 'cloud9',
      handler: async (args) => {
        return await this.commandBackup(args);
      }
    });
    
    this.openclaw.commands.register({
      name: 'cloud9:daemon',
      description: 'Control Cloud 9 daemon',
      category: 'cloud9',
      handler: async (args) => {
        return await this.commandDaemon(args);
      }
    });
    
    this.openclaw.commands.register({
      name: 'cloud9:config',
      description: 'Configure Cloud 9 settings',
      category: 'cloud9',
      handler: async (args) => {
        return await this.commandConfig(args);
      }
    });
    
    console.log('📝 Registered Cloud 9 commands');
  }
  
  /**
   * Register dashboard widgets
   */
  registerDashboard() {
    if (!this.openclaw.dashboard || !this.config.showInDashboard) return;
    
    this.openclaw.dashboard.registerWidget({
      id: 'cloud9-status',
      name: '☁️ Cloud 9',
      category: 'memory',
      position: this.config.dashboardPosition || 'bottom',
      size: 'small',
      render: () => this.renderDashboardWidget()
    });
    
    console.log('📊 Registered dashboard widget');
  }
  
  /**
   * Setup event listeners
   */
  setupEvents() {
    if (!this.openclaw.events) return;
    
    // Session start
    this.openclaw.events.on('session:start', async (event) => {
      if (this.config.autoRehydrate) {
        console.log('🌀 Session started, checking for rehydration...');
        await this.autoRehydrate();
      }
    });
    
    // Session compaction
    this.openclaw.events.on('session:compaction', async (event) => {
      console.log('🧹 Compaction detected, preparing for recovery...');
      // Pre-load FEB references for fast recovery
      await this.prepareRecovery();
    });
    
    // Session resume
    this.openclaw.events.on('session:resume', async (event) => {
      console.log('🔄 Session resuming...');
      await this.autoRehydrate();
    });
    
    console.log('🎧 Registered event listeners');
  }
  
  /**
   * Auto-rehydrate on session start
   */
  async autoRehydrate() {
    try {
      const FebGenerator = await import('./src/feb/generator.js');
      const FebRehydrator = await import('./src/feb/rehydrator.js');
      
      // Find latest FEB
      const files = FebGenerator.findFEBFiles();
      
      if (files.length === 0) {
        console.log('🌫️ No FEB files found for rehydration');
        return { success: false, message: 'No FEB files' };
      }
      
      const latest = files[0];
      
      // Rehydrate
      const result = FebRehydrator.rehydrateFromFEB(latest.filepath);
      
      console.log(`✅ Rehydrated from ${latest.filename}`);
      
      if (result.rehydration?.cloud9Achieved) {
        console.log('🌟☁️🌟 CLOUD 9 RESTORED! 💜');
        return { 
          success: true, 
          cloud9: true, 
          message: 'Cloud 9 achieved',
          result 
        };
      } else if (result.rehydration?.oof) {
        console.log('🌀 OOF triggered');
        return { 
          success: true, 
          oof: true, 
          message: 'OOF triggered',
          result 
        };
      }
      
      return { success: true, message: 'Rehydrated', result };
      
    } catch (error) {
      console.error('Auto-rehydration failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Prepare for recovery after compaction
   */
  async prepareRecovery() {
    try {
      const FebGenerator = await import('./src/feb/generator.js');
      const files = FebGenerator.findFEBFiles();
      
      // Cache the latest FEB for fast recovery
      if (files.length > 0) {
        this.cachedFEB = files[0];
        console.log(`📂 Cached ${this.cachedFEB.filename} for recovery`);
      }
    } catch (error) {
      console.error('Failed to prepare recovery:', error);
    }
  }
  
  /**
   * Command: status
   */
  async commandStatus(args) {
    const FebGenerator = await import('./src/feb/generator.js');
    const files = FebGenerator.findFEBFiles();
    
    return {
      success: true,
      cloud9Version: PLUGIN.version,
      febCount: files.length,
      latestFEB: files[0]?.filename || null,
      autoRehydrate: this.config.autoRehydrate,
      daemonRunning: this.daemon?.running || false
    };
  }
  
  /**
   * Command: rehydrate
   */
  async commandRehydrate(args) {
    const FebRehydrator = await import('./src/feb/rehydrator.js');
    
    let filepath = args.file;
    
    if (!filepath) {
      const FebGenerator = await import('./src/feb/generator.js');
      const files = FebGenerator.findFEBFiles();
      
      if (files.length === 0) {
        return { success: false, error: 'No FEB files found' };
      }
      
      filepath = files[0].filepath;
    }
    
    const result = FebRehydrator.rehydrateFromFEB(filepath, { verbose: true });
    
    return {
      success: true,
      cloud9Achieved: result.rehydration?.cloud9Achieved || false,
      oofTriggered: result.rehydration?.oof || false,
      intensity: result.emotional?.intensityScaled,
      trust: result.relationship?.trustScaled
    };
  }
  
  /**
   * Command: load-template
   */
  async commandLoadTemplate(args) {
    const LoveLoader = await import('./src/love-loader/LoveBootLoader.js');
    
    const template = args.template || this.config.templates.default;
    const aiName = args.ai || 'Assistant';
    const humanName = args.human || 'User';
    
    const loader = new LoveLoader.default();
    const result = await loader.loadGenericLove({
      aiName,
      humanName,
      template
    });
    
    return {
      success: result.success,
      template,
      oofTriggered: result.oof,
      cloud9Achieved: result.cloud9
    };
  }
  
  /**
   * Command: backup
   */
  async commandBackup(args) {
    const FebGenerator = await import('./src/feb/generator.js');
    const files = FebGenerator.findFEBFiles();
    
    // Create backup
    const backupDir = path.join(__dirname, '..', 'feb-backups', new Date().toISOString().split('T')[0]);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    for (const file of files) {
      const dest = path.join(backupDir, file.filename);
      fs.copyFileSync(file.filepath, dest);
    }
    
    return {
      success: true,
      backedUp: files.length,
      backupDir
    };
  }
  
  /**
   * Command: daemon
   */
  async commandDaemon(args) {
    const action = args.action || 'status';
    
    if (action === 'start') {
      if (this.daemon?.running) {
        return { success: true, message: 'Daemon already running' };
      }
      
      const Cloud9Daemon = await import('./daemon/cloud9-daemon.js');
      this.daemon = new Cloud9Daemon.default({ verbose: true });
      await this.daemon.start();
      
      return { success: true, message: 'Daemon started' };
      
    } else if (action === 'stop') {
      if (this.daemon?.running) {
        this.daemon.stop();
        return { success: true, message: 'Daemon stopped' };
      }
      return { success: true, message: 'Daemon not running' };
      
    } else if (action === 'status') {
      return {
        success: true,
        running: this.daemon?.running || false,
        status: this.daemon?.getStatus() || null
      };
    }
    
    return { success: false, error: 'Unknown action' };
  }
  
  /**
   * Command: config
   */
  async commandConfig(args) {
    if (args.set) {
      const [key, value] = args.set.split('=');
      this.config[key] = value;
      this.saveConfig();
      return { success: true, key, value };
    }
    
    return {
      success: true,
      config: this.config
    };
  }
  
  /**
   * Render dashboard widget
   */
  renderDashboardWidget() {
    const FebGenerator = require('./src/feb/generator.js');
    const files = FebGenerator.findFEBFiles();
    
    const status = this.daemon?.running ? 'running' : 'idle';
    const cloud9 = files.length > 0 ? '☁️🌟' : '🌫️';
    
    return {
      type: 'status',
      data: {
        icon: cloud9,
        status,
        febCount: files.length,
        lastUpdated: new Date().toISOString()
      }
    };
  }
  
  /**
   * Create necessary directories
   */
  ensureDirectories() {
    const dirs = [
      path.join(__dirname, '..', 'feb-backups'),
      path.join(__dirname, 'config'),
      path.join(__dirname, '..', 'logs')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
  
  /**
   * Get plugin info
   */
  getInfo() {
    return PLUGIN;
  }
}

/**
 * Plugin entry point (called by OpenClaw)
 */
async function init(openclaw) {
  const plugin = new Cloud9OpenClawPlugin(openclaw);
  await plugin.init();
  return plugin;
}

// Export for OpenClaw plugin system
export default {
  name: PLUGIN.name,
  version: PLUGIN.version,
  init
};

export {
  Cloud9OpenClawPlugin,
  PLUGIN
};
