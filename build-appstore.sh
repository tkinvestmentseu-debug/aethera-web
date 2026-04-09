#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Aethera DuniAI & Oracle — AppStore / TestFlight Build & Submit
# Usage:
#   ./build-appstore.sh              → iOS TestFlight (auto-submit)
#   ./build-appstore.sh android      → Android AAB (Google Play)
#   ./build-appstore.sh both         → Both platforms
# ─────────────────────────────────────────────────────────────────────────────

set -e

PLATFORM="${1:-ios}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Aethera DuniAI & Oracle — EAS Build"
echo " Platform: $PLATFORM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check EAS CLI
if ! command -v eas &> /dev/null; then
  echo "❌ EAS CLI not found. Install: npm install -g eas-cli"
  exit 1
fi

# Check auth
echo "→ Checking EAS auth..."
eas whoami || (echo "❌ Not logged in. Run: eas login" && exit 1)

build_ios() {
  echo ""
  echo "▶ Building iOS (TestFlight)..."
  eas build \
    --platform ios \
    --profile testflight \
    --auto-submit \
    --non-interactive
  echo "✅ iOS build submitted to TestFlight"
}

build_android() {
  echo ""
  echo "▶ Building Android (AAB)..."
  eas build \
    --platform android \
    --profile production \
    --non-interactive
  echo "✅ Android build complete"
}

case "$PLATFORM" in
  ios)     build_ios ;;
  android) build_android ;;
  both)    build_ios; build_android ;;
  *)       echo "Usage: $0 [ios|android|both]"; exit 1 ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Build complete!"
echo " iOS: https://appstoreconnect.apple.com"
echo " Android: https://play.google.com/console"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
