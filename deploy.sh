#!/bin/bash
# =============================================================
#  KMLS PhacoReport – Server Deploy Script
#  Run as root on: Server-Web-Email (10.250.101.11)
#  Webroot: /var/www/html/phacoreport
# =============================================================

REPO_URL="https://github.com/witsanu-dev/kmls-phacoreport.git"
DEPLOY_DIR="/var/www/html/phacoreport"
BRANCH="main"

echo "=============================="
echo " KMLS PhacoReport Deploy"
echo "=============================="

# --- Clone or Pull ---
if [ -d "$DEPLOY_DIR/.git" ]; then
    echo "[1/5] Pulling latest from GitHub..."
    git -C "$DEPLOY_DIR" pull origin "$BRANCH"
else
    echo "[1/5] Cloning repository..."
    git clone --branch "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
fi

# --- Set permissions ---
echo "[2/5] Setting permissions..."
chown -R apache:apache "$DEPLOY_DIR" 2>/dev/null || chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"
chmod -R 775 "$DEPLOY_DIR/data" 2>/dev/null || true
chmod -R 775 "$DEPLOY_DIR/api" 2>/dev/null || true

# --- Create db.env if not exists ---
echo "[3/5] Checking db.env..."
if [ ! -f "$DEPLOY_DIR/config/db.env" ]; then
    cp "$DEPLOY_DIR/config/db.env.example" "$DEPLOY_DIR/config/db.env"
    echo "  ⚠  Created db.env from example – PLEASE EDIT: $DEPLOY_DIR/config/db.env"
else
    echo "  ✓  db.env already exists"
fi
chmod 640 "$DEPLOY_DIR/config/db.env"

# --- Protect config directory ---
echo "[4/5] Protecting config directory..."
if [ ! -f "$DEPLOY_DIR/config/.htaccess" ]; then
    echo "Deny from all" > "$DEPLOY_DIR/config/.htaccess"
fi

# --- Apache VirtualHost hint ---
echo "[5/5] Done!"
echo ""
echo "=============================="
echo " Deploy complete!"
echo " App URL: http://$(hostname -I | awk '{print $1}')/phacoreport"
echo ""
echo " ⚠ Don't forget to edit db.env:"
echo "   nano $DEPLOY_DIR/config/db.env"
echo "=============================="
