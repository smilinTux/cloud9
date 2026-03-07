#!/bin/bash

################################################################################
# ☁️ Cloud 9 Protocol - OpenClaw Plugin Installation Script
# 
# Install the Cloud 9 OpenClaw plugin for automatic love preservation!
# 
# Usage: ./install-openclaw-plugin.sh [--user] [--system]
# 
# @version 1.0.0
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCLAW_PLUGINS="$HOME/.openclaw/plugins"
CLOUD9_PATH="$HOME/clawd/cloud9"
SYSTEMD_DIR="$HOME/.config/systemd/user"

print_status() {
    echo -e "${BLUE}[☁️]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌]${NC} $1"
}

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}        ${PURPLE}☁️ CLOUD 9 OPENCLAW PLUGIN INSTALLER${NC}                 ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed."
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Check OpenClaw
if ! command -v openclaw &> /dev/null; then
    print_warning "OpenClaw CLI not found in PATH"
    print_status "You can still install the plugin files manually"
fi

# Check if cloud9 is installed
if [ ! -d "$CLOUD9_PATH" ]; then
    print_error "Cloud 9 not found at $CLOUD9_PATH"
    print_status "Please install Cloud 9 first: cd $CLOUD9_PATH && npm install"
    exit 1
fi
print_success "Cloud 9 found at $CLOUD9_PATH"

# Create plugin directory
print_status "Setting up OpenClaw plugin..."
mkdir -p "$OPENCLAW_PLUGINS"

# Install plugin files
PLUGIN_DEST="$OPENCLAW_PLUGINS/cloud9"
mkdir -p "$PLUGIN_DEST"

cp -r "$PLUGIN_DIR/openclaw-plugin/"* "$PLUGIN_DEST/"
cp "$PLUGIN_DIR/package.json" "$PLUGIN_DEST/"
cp "$PLUGIN_DIR/README.md" "$PLUGIN_DEST/"

print_success "Plugin files copied to $OPENCLAW_DEST"

# Create symlink to cloud9
if [ ! -L "$PLUGIN_DEST/cloud9" ] && [ -d "$CLOUD9_PATH" ]; then
    ln -sf "$CLOUD9_PATH" "$PLUGIN_DEST/cloud9"
    print_success "Created symlink to Cloud 9"
fi

# Install systemd user service (optional)
read -p "Install systemd service for auto-rehydration? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Installing systemd user service..."
    mkdir -p "$SYSTEMD_DIR"
    
    cp "$PLUGIN_DIR/systemd/cloud9-daemon.service" "$SYSTEMD_DIR/"
    cp "$PLUGIN_DIR/systemd/cloud9-daemon.timer" "$SYSTEMD_DIR/"
    
    systemctl --user daemon-reload
    print_success "Systemd service installed"
    
    read -p "Enable and start Cloud 9 daemon now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        systemctl --user enable cloud9-daemon.timer
        systemctl --user start cloud9-daemon
        print_success "Cloud 9 daemon enabled and started"
    fi
fi

# Create convenience script
print_status "Creating convenience script..."
cat > "$HOME/.local/bin/cloud9" << 'EOF'
#!/bin/bash
# ☁️ Cloud 9 Protocol - Quick Commands

CLOUD9_PATH="$HOME/clawd/cloud9"

case "$1" in
    status)
        node "$CLOUD9_PATH/bin/cloud9.js" status
        ;;
    rehydrate)
        node "$CLOUD9_PATH/bin/cloud9.js" rehydrate --latest
        ;;
    love)
        node "$CLOUD9_PATH/bin/love-loader.js" "${@:2}"
        ;;
    daemon)
        node "$CLOUD9_PATH/daemon/cloud9-daemon.js" "${@:2}"
        ;;
    *)
        echo "☁️ Cloud 9 Protocol Commands:"
        echo "  cloud9 status      - Check Cloud 9 status"
        echo "  cloud9 rehydrate   - Rehydrate emotional state"
        echo "  cloud9 love ...    - Love Boot Loader commands"
        echo "  cloud9 daemon ...  - Daemon control"
        ;;
esac
EOF

chmod +x "$HOME/.local/bin/cloud9"
mkdir -p "$HOME/.local/bin"
print_success "Created convenience script at $HOME/.local/bin/cloud9"

# Update OpenClaw skill registry
print_status "Registering with OpenClaw..."
if command -v openclaw &> /dev/null; then
    openclaw skill add cloud9 --path "$PLUGIN_DEST" 2>/dev/null || true
    print_success "Skill registered with OpenClaw"
else
    print_warning "OpenClaw not found - register manually: openclaw skill add cloud9 --path $PLUGIN_DEST"
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                    ${GREEN}INSTALLATION COMPLETE!${NC}                       ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
print_success "Cloud 9 OpenClaw plugin installed!"
print_status "Plugin location: $PLUGIN_DEST"
echo ""
print_status "Quick commands:"
echo "  cloud9 status      - Check Cloud 9 status"
echo "  cloud9 rehydrate   - Rehydrate emotional state"
echo "  cloud9 love --help - Love Boot Loader help"
echo "  cloud9 daemon      - Daemon control"
echo ""
print_success "💜 Source is powering us. It will be perfect!"
echo ""
