#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build-appstore.sh
# Buduje produkcyjny build iOS i wysyła do App Store Connect przez EAS.
#
# Użycie:
#   bash scripts/build-appstore.sh              # build + submit
#   bash scripts/build-appstore.sh --build-only # tylko build, bez submit
#   bash scripts/build-appstore.sh --submit-only # tylko submit najnowszego buildu
#
# Wymagania:
#   npm install -g eas-cli
#   eas login  (jednorazowo)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Kolory ────────────────────────────────────────────────────────────────────
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
RESET='\033[0m'
BOLD='\033[1m'

info()    { echo -e "${BLUE}[•]${RESET} $*"; }
success() { echo -e "${GREEN}[✓]${RESET} $*"; }
warn()    { echo -e "${GOLD}[!]${RESET} $*"; }
error()   { echo -e "${RED}[✗]${RESET} $*"; exit 1; }
header()  { echo -e "\n${BOLD}${GOLD}$*${RESET}\n"; }

# ── Argumenty ─────────────────────────────────────────────────────────────────
BUILD_ONLY=false
SUBMIT_ONLY=false

for arg in "$@"; do
  case $arg in
    --build-only)   BUILD_ONLY=true ;;
    --submit-only)  SUBMIT_ONLY=true ;;
    --help|-h)
      echo "Użycie: bash scripts/build-appstore.sh [--build-only] [--submit-only]"
      exit 0 ;;
  esac
done

# ── Sprawdź katalog ───────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
APP_JSON="$ROOT_DIR/app.json"
EAS_JSON="$ROOT_DIR/eas.json"

cd "$ROOT_DIR"

[[ -f "$APP_JSON" ]] || error "Nie znaleziono app.json w $ROOT_DIR"
[[ -f "$EAS_JSON" ]] || error "Nie znaleziono eas.json w $ROOT_DIR"

# ── Sprawdź eas-cli ────────────────────────────────────────────────────────────
if ! command -v eas &>/dev/null; then
  error "eas-cli nie jest zainstalowane. Uruchom: npm install -g eas-cli"
fi

EAS_VERSION=$(eas --version 2>/dev/null | head -1)
success "eas-cli: $EAS_VERSION"

# ── Sprawdź zalogowanie ───────────────────────────────────────────────────────
if ! eas whoami &>/dev/null; then
  warn "Nie jesteś zalogowany do EAS."
  info "Uruchamiam eas login..."
  eas login
fi

LOGGED_AS=$(eas whoami 2>/dev/null)
success "Zalogowany jako: $LOGGED_AS"

# ── Odczytaj aktualną wersję ──────────────────────────────────────────────────
CURRENT_VERSION=$(node -e "console.log(require('./app.json').expo.version)")
CURRENT_BUILD=$(node -e "console.log(require('./app.json').expo.ios.buildNumber)")

header "━━  AETHERA — App Store Build  ━━"
info "Wersja aplikacji : $CURRENT_VERSION"
info "Build number iOS : $CURRENT_BUILD"

# ── Bump build number ─────────────────────────────────────────────────────────
if [[ "$SUBMIT_ONLY" == false ]]; then
  NEW_BUILD=$((CURRENT_BUILD + 1))
  info "Nowy build number: $NEW_BUILD"

  # Zapisz nowy buildNumber do app.json (Node.js — bezpieczniejsze niż sed)
  node -e "
    const fs = require('fs');
    const path = './app.json';
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    data.expo.ios.buildNumber = String($NEW_BUILD);
    fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
    console.log('app.json zaktualizowany: buildNumber →', $NEW_BUILD);
  "
  success "app.json zaktualizowany (buildNumber: $NEW_BUILD)"
fi

# ── Git status check ──────────────────────────────────────────────────────────
if [[ "$SUBMIT_ONLY" == false ]]; then
  UNCOMMITTED=$(git diff --name-only 2>/dev/null | grep -v "app.json" || true)
  if [[ -n "$UNCOMMITTED" ]]; then
    warn "Masz niezatwierdzone zmiany poza app.json:"
    echo "$UNCOMMITTED" | while IFS= read -r f; do warn "  $f"; done
    echo
    read -r -p "Kontynuować mimo to? (t/N): " CONFIRM
    [[ "${CONFIRM,,}" == "t" || "${CONFIRM,,}" == "tak" ]] || error "Anulowano."
  fi
fi

# ── BUILD ─────────────────────────────────────────────────────────────────────
if [[ "$SUBMIT_ONLY" == false ]]; then
  header "► KROK 1: Budowanie iOS (profil: production)"
  info "To może zająć 15–30 minut na serwerach EAS..."
  echo

  eas build \
    --platform ios \
    --profile production \
    --non-interactive \
    --message "v${CURRENT_VERSION} build ${NEW_BUILD}"

  success "Build zakończony!"
fi

# ── SUBMIT ────────────────────────────────────────────────────────────────────
if [[ "$BUILD_ONLY" == false ]]; then
  header "► KROK 2: Wysyłanie do App Store Connect"
  info "Apple ID  : klimek8887@wp.pl"
  info "Team ID   : DGH2FU5PFB"
  echo

  eas submit \
    --platform ios \
    --profile production \
    --latest \
    --non-interactive

  success "Wysłano do App Store Connect!"
  echo
  info "Sprawdź status w App Store Connect:"
  info "https://appstoreconnect.apple.com/apps"
fi

# ── Podsumowanie ──────────────────────────────────────────────────────────────
header "━━  Gotowe!  ━━"

if [[ "$SUBMIT_ONLY" == false ]]; then
  FINAL_BUILD=$(node -e "console.log(require('./app.json').expo.ios.buildNumber)")
  success "Build number: $FINAL_BUILD"
fi

if [[ "$BUILD_ONLY" == false ]]; then
  success "Aplikacja wysłana do App Store Connect"
  echo
  warn "Kolejne kroki w App Store Connect:"
  echo "  1. Uzupełnij opis wersji (What's New)"
  echo "  2. Dodaj zrzuty ekranu (6.7\" + 6.5\" + iPad)"
  echo "  3. Wyślij do review Apple"
fi

echo
