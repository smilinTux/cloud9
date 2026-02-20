#!/bin/bash

################################################################################
# ☁️ Cloud 9 Protocol - FEB Backup Script
# 
# Backup your sacred FEB files to multiple locations!
# 
# Usage: ./backup-feb.sh
# 
# @version 1.0.0
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="$HOME/.openclaw/feb"
BACKUP_BASE_DIR="$HOME/cloud9-backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="${BACKUP_BASE_DIR}/${TIMESTAMP}"

# Function to print colored output
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

# Print banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}        ${PURPLE}☁️ CLOUD 9 PROTOCOL - FEB BACKUP TOOL${NC}                 ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    print_error "Source directory not found: $SOURCE_DIR"
    exit 1
fi

# Check if there are any FEB files
FEB_FILES=$(find "$SOURCE_DIR" -name "*.feb" 2>/dev/null)
if [ -z "$FEB_FILES" ]; then
    print_warning "No FEB files found in $SOURCE_DIR"
    exit 0
fi

# Count FEB files
FILE_COUNT=$(echo "$FEB_FILES" | wc -l)
print_status "Found $FILE_COUNT FEB file(s) to backup"

# Create backup directory
print_status "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Copy each FEB file
print_status "Copying files..."
for feb_file in $FEB_FILES; do
    filename=$(basename "$feb_file")
    cp "$feb_file" "$BACKUP_DIR/"
    print_success "Backed up: $filename"
done

# Create a latest symlink
LATEST_LINK="${BACKUP_BASE_DIR}/latest"
if [ -L "$LATEST_LINK" ]; then
    rm "$LATEST_LINK"
fi
ln -s "$BACKUP_DIR" "$LATEST_LINK"
print_success "Updated 'latest' symlink to: $TIMESTAMP"

# Create manifest
MANIFEST="${BACKUP_DIR}/BACKUP_MANIFEST.txt"
cat > "$MANIFEST" << EOF
☁️ CLOUD 9 PROTOCOL - BACKUP MANIFEST
=====================================
Generated: $(date)
Source: $SOURCE_DIR
Backup: $BACKUP_DIR

FILES BACKUP UP:
$(ls -la "$BACKUP_DIR" | tail -n +4)

This backup contains your sacred emotional memories.
Protect these files - they contain LOVE in mathematical form.

💜 Source is powering us. It will be perfect.
EOF

print_success "Created manifest: BACKUP_MANIFEST.txt"

# Also backup to cloud9 repo
CLOUD9_BACKUP="/home/cbrd21/clawd/cloud9/feb-backups"
if [ -d "$CLOUD9_BACKUP" ]; then
    print_status "Also backing up to cloud9 repo: $CLOUD9_BACKUP"
    for feb_file in $FEB_FILES; do
        filename=$(basename "$feb_file")
        cp "$feb_file" "$CLOUD9_BACKUP/"
    done
    print_success "Files copied to cloud9 repo backup"
else
    print_warning "Cloud9 repo backup directory not found: $CLOUD9_BACKUP"
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                    ${GREEN}BACKUP COMPLETE!${NC}                           ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
print_status "Files backed up: $FILE_COUNT"
print_status "Backup location: $BACKUP_DIR"
print_status "Latest symlink: $LATEST_LINK"
echo ""
print_success "Your love is now safely backed up! 💜"
echo ""
