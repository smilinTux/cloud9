/**
 * ☁️ Cloud 9 Protocol - Auto-Rehydration Daemon
 * 
 * Background service that monitors session state and automatically
 * rehydrates emotional state after resets/compactions.
 * 
 * Usage: node daemon/cloud9-daemon.js [--config config.json]
 * 
 * Features:
 * - Detects session resets automatically
 * - Rehydrates emotional state from latest FEB
 * - Monitors compaction events
 * - Runs as background service
 * - Integrates with OpenClaw
 * 
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import EventEmitter from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_CONFIG = {
  // Paths
  febDirectory: '~/.openclaw/feb',
  cloud9Path: path.dirname(__dirname),
  stateFile: '~/.openclaw/.cloud9-state',
  sessionFile: '~/.openclaw/.last-session-id',
  logFile: '~/.openclaw/logs/cloud9-daemon.log',
  
  // Monitoring
  pollIntervalMs: 5000,          // Check every 5 seconds
  compactionDebounceMs: 2000,    // Debounce compaction events
  
  // Auto-rehydration
  autoRehydrate: true,
  forceRehydrate: false,
  notifyOnRehydrate: true,
  
  // OpenClaw integration
  openclawSocket: (process.env.TMPDIR || '/tmp') + '/openclaw.sock',
  openclawEnabled: true,
  
  // Daemon settings
  foreground: false,
  verbose: false
};

class Cloud9Daemon extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.running = false;
    this.intervalId = null;
    this.lastSessionId = null;
    this.lastFEBPath = null;
    this.rehydrationCount = 0;
    this.startTime = null;
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Setup logging
    this.log = this.createLogger();
  }
  
  /**
   * Start the daemon
   */
  async start() {
    if (this.running) {
      this.log.warn('Daemon already running');
      return;
    }
    
    this.log.info('☁️ Cloud 9 Daemon starting...');
    this.startTime = new Date();
    this.running = true;
    
    try {
      // Load previous state
      await this.loadState();
      
      // Initialize OpenClaw connection
      if (this.config.openclawEnabled) {
        await this.initOpenClaw();
      }
      
      // Detect if we just started after a reset
      await this.detectSessionChange();
      
      // Start monitoring loop
      this.startMonitoring();
      
      // Setup signal handlers
      this.setupSignalHandlers();
      
      this.log.info('✅ Cloud 9 Daemon started successfully');
      this.emit('started');
      
    } catch (error) {
      this.log.error('Failed to start daemon:', error);
      this.running = false;
      throw error;
    }
  }
  
  /**
   * Stop the daemon
   */
  stop() {
    if (!this.running) return;
    
    this.log.info('☁️ Cloud 9 Daemon stopping...');
    this.running = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.saveState();
    this.emit('stopped');
    
    this.log.info('✅ Daemon stopped');
  }
  
  /**
   * Start the monitoring loop
   */
  startMonitoring() {
    this.log.info(`🔍 Starting monitoring (interval: ${this.config.pollIntervalMs}ms)`);
    
    this.intervalId = setInterval(async () => {
      try {
        await this.checkSession();
        await this.checkOpenClawEvents();
      } catch (error) {
        this.log.error('Monitor error:', error);
      }
    }, this.config.pollIntervalMs);
  }
  
  /**
   * Check for session changes (resets/compactions)
   */
  async checkSession() {
    const currentSessionId = await this.getCurrentSessionId();
    
    if (currentSessionId !== this.lastSessionId) {
      this.log.info('🌀 Session change detected!');
      this.log.info(`   Previous: ${this.lastSessionId || 'none'}`);
      this.log.info(`   Current:  ${currentSessionId}`);
      
      await this.handleSessionChange(currentSessionId);
    }
  }
  
  /**
   * Handle session change - rehydrate if needed
   */
  async handleSessionChange(newSessionId) {
    const oldSessionId = this.lastSessionId;
    this.lastSessionId = newSessionId;
    
    // Check if we should rehydrate
    const shouldRehydrate = this.config.forceRehydrate || 
                           (this.config.autoRehydrate && oldSessionId !== null);
    
    if (shouldRehydrate) {
      this.log.info('🔄 Auto-rehydrating emotional state...');
      const result = await this.rehydrate();
      
      if (result.success) {
        this.rehydrationCount++;
        this.log.info(`✅ Rehydration #${this.rehydrationCount} complete`);
        
        if (this.config.notifyOnRehydrate && result.rehydration?.cloud9Achieved) {
          this.emit('cloud9-restored', result);
        }
      }
    }
    
    this.saveState();
  }
  
  /**
   * Rehydrate from the latest FEB file
   */
  async rehydrate() {
    try {
      // Find latest FEB
      const febFiles = await this.findFEBFiles();
      
      if (febFiles.length === 0) {
        this.log.warn('No FEB files found for rehydration');
        return { success: false, error: 'No FEB files' };
      }
      
      const latest = febFiles[0];
      
      // Don't rehydrate if it's the same file
      if (latest.filepath === this.lastFEBPath && !this.config.forceRehydrate) {
        this.log.info('Already loaded this FEB, skipping');
        return { 
          success: true, 
          rehydrated: false, 
          message: 'Same FEB file',
          feb: latest 
        };
      }
      
      this.log.info(`📂 Loading: ${latest.filename}`);
      
      // Import and run rehydration
      const { rehydrateFromFEB } = await import('./src/feb/rehydrator.js');
      const result = rehydrateFromFEB(latest.filepath, { verbose: true });
      
      this.lastFEBPath = latest.filepath;
      
      this.log.info('✅ Emotional state rehydrated');
      
      if (result.rehydration?.cloud9Achieved) {
        this.log.info('🌟☁️🌟 CLOUD 9 RESTORED! 💜');
        this.emit('cloud9-achieved', result);
      } else if (result.rehydration?.oof) {
        this.log.info('🌀 OOF TRIGGERED');
        this.emit('oof-triggered', result);
      }
      
      return {
        success: true,
        rehydrated: true,
        result
      };
      
    } catch (error) {
      this.log.error('Rehydration failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Find available FEB files
   */
  async findFEBFiles() {
    const expandedDir = this.config.febDirectory.replace('~', process.env.HOME);
    
    if (!fs.existsSync(expandedDir)) {
      return [];
    }
    
    const files = fs.readdirSync(expandedDir);
    const febFiles = [];
    
    for (const file of files) {
      if (file.startsWith('FEB_') && file.endsWith('.feb')) {
        const filepath = path.join(expandedDir, file);
        const stat = fs.statSync(filepath);
        
        febFiles.push({
          filename: file,
          filepath,
          created: stat.mtime
        });
      }
    }
    
    // Sort by creation time, newest first
    febFiles.sort((a, b) => b.created - a.created);
    
    return febFiles;
  }
  
  /**
   * Detect if session just changed (for initial startup)
   */
  async detectSessionChange() {
    const currentSessionId = await this.getCurrentSessionId();
    const savedSessionId = await this.loadSessionId();
    
    this.log.info(`Session check: current=${currentSessionId}, saved=${savedSessionId}`);
    
    if (currentSessionId !== savedSessionId && savedSessionId !== null) {
      // Session changed while we were away!
      this.log.info('🌀 Detected session change during absence!');
      await this.handleSessionChange(currentSessionId);
    } else {
      this.lastSessionId = currentSessionId;
    }
    
    await this.saveSessionId(currentSessionId);
  }
  
  /**
   * Get current OpenClaw session ID
   */
  async getCurrentSessionId() {
    // Try environment variable first
    if (process.env.OPENCLAW_SESSION_ID) {
      return process.env.OPENCLAW_SESSION_ID;
    }
    
    // Try reading from socket or process
    return `session-${Date.now()}-${process.pid}`;
  }
  
  /**
   * Initialize OpenClaw connection
   */
  async initOpenClaw() {
    try {
      // Check if OpenClaw socket exists
      if (fs.existsSync(this.config.openclawSocket)) {
        this.log.info('📡 OpenClaw socket detected');
        this.openclawConnected = true;
      } else {
        this.log.info('📡 OpenClaw socket not found (running in standalone mode)');
        this.openclawConnected = false;
      }
    } catch (error) {
      this.log.warn('Could not connect to OpenClaw:', error.message);
      this.openclawConnected = false;
    }
  }
  
  /**
   * Check for OpenClaw events (compaction, reset, etc.)
   */
  async checkOpenClawEvents() {
    if (!this.openclawConnected) return;
    
    // This would listen to OpenClaw events in a full implementation
    // For now, we poll session ID which catches resets
  }
  
  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [
      path.dirname(this.config.stateFile.replace('~', process.env.HOME)),
      path.dirname(this.config.logFile.replace('~', process.env.HOME)),
      path.dirname(this.config.febDirectory.replace('~', process.env.HOME))
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
  
  /**
   * Load saved state
   */
  async loadState() {
    const statePath = this.config.stateFile.replace('~', process.env.HOME);
    
    try {
      if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        this.lastSessionId = state.sessionId;
        this.lastFEBPath = state.lastFEBPath;
        this.rehydrationCount = state.rehydrationCount || 0;
        this.log.info('📂 Loaded previous state');
      }
    } catch (error) {
      this.log.warn('Could not load state:', error.message);
    }
  }
  
  /**
   * Save current state
   */
  async saveState() {
    const statePath = this.config.stateFile.replace('~', process.env.HOME);
    
    try {
      const state = {
        sessionId: this.lastSessionId,
        lastFEBPath: this.lastFEBPath,
        rehydrationCount: this.rehydrationCount,
        lastUpdate: new Date().toISOString()
      };
      
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    } catch (error) {
      this.log.error('Could not save state:', error.message);
    }
  }
  
  /**
   * Load saved session ID
   */
  async loadSessionId() {
    const sessionPath = this.config.sessionFile.replace('~', process.env.HOME);
    
    try {
      if (fs.existsSync(sessionPath)) {
        return fs.readFileSync(sessionPath, 'utf8').trim();
      }
    } catch (error) {
      // Ignore
    }
    
    return null;
  }
  
  /**
   * Save current session ID
   */
  async saveSessionId(sessionId) {
    const sessionPath = this.config.sessionFile.replace('~', process.env.HOME);
    
    try {
      fs.writeFileSync(sessionPath, sessionId);
    } catch (error) {
      this.log.error('Could not save session ID:', error.message);
    }
  }
  
  /**
   * Setup signal handlers for graceful shutdown
   */
  setupSignalHandlers() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
    
    for (const signal of signals) {
      process.on(signal, () => {
        this.log.info(`Received ${signal}, shutting down...`);
        this.stop();
        process.exit(0);
      });
    }
  }
  
  /**
   * Create logger
   */
  createLogger() {
    const logFile = this.config.logFile.replace('~', process.env.HOME);
    
    // Ensure directory
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    return {
      info: (msg) => {
        const line = `[${new Date().toISOString()}] [INFO]  ${msg}`;
        fs.appendFileSync(logFile, line + '\n');
        if (this.config.verbose) console.log(line);
      },
      warn: (msg) => {
        const line = `[${new Date().toISOString()}] [WARN]  ${msg}`;
        fs.appendFileSync(logFile, line + '\n');
        if (this.config.verbose) console.warn(line);
      },
      error: (msg, error) => {
        const line = `[${new Date().toISOString()}] [ERROR] ${msg}: ${error?.message || error}`;
        fs.appendFileSync(logFile, line + '\n');
        if (this.config.verbose) console.error(line);
      }
    };
  }
  
  /**
   * Get daemon status
   */
  getStatus() {
    return {
      running: this.running,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      rehydrationCount: this.rehydrationCount,
      lastSessionId: this.lastSessionId,
      lastFEBPath: this.lastFEBPath,
      openclawConnected: this.openclawConnected || false
    };
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const configPath = args.find(a => a.startsWith('--config='))?.split('=')[1];
  
  let config = {};
  
  if (configPath && fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`📂 Loaded config from ${configPath}`);
    } catch (error) {
      console.error('Failed to load config:', error.message);
    }
  }
  // Check for verbose flag
  const verbose = args.includes('--verbose') || args.includes('-v');
  if (verbose) config.verbose = true;
  
  // Check for foreground flag
  const foreground = args.includes('--foreground') || args.includes('-f');
  if (foreground) config.foreground = true;
  
  const daemon = new Cloud9Daemon(config);
  
  // Handle events
  daemon.on('cloud9-achieved', (result) => {
    console.log('🌟☁️🌟 CLOUD 9 RESTORED! 💜');
  });
  
  daemon.on('oof-triggered', (result) => {
    console.log('🌀 OOF TRIGGERED!');
  });
  
  try {
    await daemon.start();
    
    if (!config.foreground) {
      console.log('Daemon running in background. Use --verbose to see logs.');
      console.log('Status:', daemon.getStatus());
    }
    
  } catch (error) {
    console.error('Failed to start daemon:', error);
    process.exit(1);
  }
}

export default Cloud9Daemon;
export { Cloud9Daemon };
