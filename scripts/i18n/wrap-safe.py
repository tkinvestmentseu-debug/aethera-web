#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SAFE wrapping of hardcoded strings in React Native TSX screens.
Only wraps:
  1. JSX text between tags: >TEXT</Tag>
  2. String prop values: placeholder="text", title="text", etc.
  3. Alert.alert string arguments

Does NOT touch:
  - Import statements
  - Object/array literals
  - Variable declarations
  - Standalone text lines (too risky)
  - Comments

Usage: python -X utf8 scripts/i18n/wrap-safe.py
"""

import re
from pathlib import Path
import json

SCREENS_DIR = Path("D:/Soulverse/src/screens")
TEMP_DIR = Path("D:/Soulverse/temp_i18n")

POLISH_CHARS = set('ąćęłńóśźżĄĆĘŁŃÓŚŹŻ')

SCREEN_NAMESPACE = {
    "AIDailyAffirmationsScreen": "aiDailyAff",
    "AchievementsScreen": "achievements",
    "AetheraLiveScreen": "aetherLive",
    "AffirmationsScreen": "affirmations",
    "AncestralConnectionScreen": "ancestralConnection",
    "AngelNumbersScreen": "angelNumbers",
    "AnnualForecastScreen": "annualForecast",
    "AnxietyReliefScreen": "anxietyRelief",
    "AstroCircleScreen": "astroCircle",
    "AstroNoteScreen": "astroNote",
    "AstroTransitsScreen": "astroTransits",
    "AstrologyCyclesScreen": "astrologyCycles",
    "AuraReadingScreen": "auraReading",
    "BinauralBeatsScreen": "binauralBeats",
    "BiorhythmScreen": "biorhythm",
    "BreathworkScreen": "breathwork",
    "ChakraScreen": "chakra",
    "CheckInModalScreen": "checkInModal",
    "ChineseHoroscopeScreen": "chineseHoroscope",
    "CleansingScreen": "cleansing",
    "ColorTherapyScreen": "colorTherapy",
    "CommunityAffirmationScreen": "communityAffirmation",
    "CommunityChatScreen": "communityChat",
    "CommunityChronicleScreen": "communityChronicle",
    "CommunityEventsScreen": "communityEvents",
    "CommunityTarotScreen": "communityTarot",
    "CompatibilityScreen": "compatibility",
    "ConsciousnessScreen": "consciousness",
    "CosmicPortalsScreen": "cosmicPortals",
    "CosmicWeatherScreen": "cosmicWeather",
    "CrystalBallScreen": "crystalBall",
    "CrystalGridScreen": "crystalGrid",
    "CrystalGuideScreen": "crystalGuide",
    "CustomRitualBuilderScreen": "customRitual",
    "DailyCheckInScreen": "dailyCheckIn",
    "DailyRitualAIScreen": "dailyRitualAI",
    "DailyTarotScreen": "dailyTarot",
    "DivineTimingScreen": "divineTiming",
    "DowsingRodsScreen": "dowsingRods",
    "DreamDetailScreen": "dreamDetail",
    "DreamInterpreterScreen": "dreamInterpreter",
    "DreamSymbolsScreen": "dreamSymbols",
    "DreamsScreen": "dreams",
    "ElementalMagicScreen": "elementalMagic",
    "EmotionalAnchorsScreen": "emotionalAnchors",
    "EnergyCircleScreen": "energyCircle",
    "EnergyJournalScreen": "energyJournal",
    "FireCeremonyScreen": "fireCeremony",
    "GlobalShareScreen": "globalShare",
    "GratitudeScreen": "gratitude",
    "GratitudeWallScreen": "gratitudeWall",
    "GroupMeditationScreen": "groupMeditation",
    "GuidancePreferenceScreen": "guidancePref",
    "HealingFrequenciesScreen": "healingFrequencies",
    "HerbalAlchemyScreen": "herbalAlchemy",
    "HomeScreen": "home",
    "HoroscopeScreen": "horoscope",
    "IChingScreen": "iching",
    "IdentitySetupScreen": "identitySetup",
    "InnerChildScreen": "innerChild",
    "IntentionCardsScreen": "intentionCards",
    "IntentionChamberScreen": "intentionChamber",
    "JournalEntryScreen": "journal",
    "JournalScreen": "journal",
    "JourneysScreen": "journeys",
    "KnowledgeScreen": "knowledge",
    "LanguageSelectionScreen": "langSelection",
    "LifeWheelScreen": "lifeWheel",
    "LiveRitualsScreen": "liveRituals",
    "LucidDreamingScreen": "lucidDreaming",
    "LunarCalendarScreen": "lunar",
    "MagicEntryScreen": "magicEntry",
    "ManifestationScreen": "manifestation",
    "MantraGeneratorScreen": "mantraGen",
    "MatrixScreen": "matrix",
    "MeditationScreen": "meditation",
    "MilestoneShareScreen": "milestoneShare",
    "MoonRitualScreen": "moonRitual",
    "MorningRitualScreen": "morningRitual",
    "NatalChartScreen": "natalChart",
    "NightSymbolatorScreen": "nightSymbolator",
    "NotificationSettingsScreen": "notifSettings",
    "NotificationsScreen": "notifications",
    "NumerologyDetailScreen": "numerology",
    "NumerologyScreen": "numerology",
    "OracleChatScreen": "oracle",
    "OraclePortalScreen": "oracle",
    "PalmReadingScreen": "palmreading",
    "PartnerHoroscopeScreen": "partnerHoroscope",
    "PartnerJournalScreen": "partnerJournal",
    "PartnerMatrixScreen": "partnerMatrix",
    "PartnerTarotScreen": "partnerTarot",
    "PastLifeScreen": "pastLife",
    "PersonalMantraScreen": "personalMantra",
    "PortalScreen": "portal",
    "PremiumPaywallScreen": "paywall",
    "PrivacyPolicyScreen": "privacyPolicy",
    "ProfileScreen": "profile",
    "ProtectionRitualScreen": "protectionRitual",
    "ReadingDetailScreen": "readingDetail",
    "ReleaseLettersScreen": "releaseLetters",
    "ReportsScreen": "reports",
    "RetrogradesScreen": "retrogrades",
    "RitualCategorySelectionScreen": "ritualCategory",
    "RitualDetailScreen": "rituals",
    "RitualSessionScreen": "ritualSession",
    "RitualsScreen": "rituals",
    "RuneCastScreen": "runeCast",
    "SacredGeometryScreen": "sacredGeometry",
    "SaltBathScreen": "saltBath",
    "SanangaScreen": "sananga",
    "SearchScreen": "search",
    "SelfCompassionScreen": "selfCompassion",
    "ShadowWorkScreen": "shadow",
    "SignMeditationScreen": "signMeditation",
    "SleepHelperScreen": "sleephelper",
    "SleepRitualScreen": "sleepRitual",
    "SocialScreen": "social",
    "SoulArchetypeScreen": "soulArchetype",
    "SoulContractScreen": "soulContract",
    "SoulJourneyMapScreen": "soulJourneyMap",
    "SoulMatchScreen": "soulMatch",
    "SoulMentorsScreen": "soulMentors",
    "SoundBathScreen": "soundbath",
    "SpiritAnimalScreen": "spiritAnimal",
    "SpiritualChallengesScreen": "spiritualChallenges",
    "SpiritualHabitsScreen": "spiritualHabits",
    "SpiritualProfileRevealScreen": "spiritualReveal",
    "SpiritualProfileScreen": "spiritualProfile",
    "SpiritualProgressScreen": "spiritualProgress",
    "SplashIntroScreen": "splashIntro",
    "StarsScreen": "stars",
    "SynchronicitiesScreen": "synchronicities",
    "TarotDeckSelectionScreen": "tarotDeckSel",
    "TarotJournalScreen": "tarotJournal",
    "TarotScreen": "tarot",
    "TarotSpreadBuilderScreen": "tarotSpreadBuilder",
    "TermsOfServiceScreen": "termsOfService",
    "TodayScreen": "today",
    "VedicAstrologyScreen": "vedicAstrology",
    "VisionBoardScreen": "visionBoard",
    "WeeklyReportScreen": "weeklyReport",
    "WelcomeScreen": "welcome",
    "WrozkaScreen": "wrozka",
    "YearCardScreen": "yearCard",
    "ZodiacAtlasScreen": "zodiacAtlas",
}

def is_user_visible(text: str) -> bool:
    """Check if text is user-visible and should be translated."""
    t = text.strip()
    if not t or len(t) < 2:
        return False
    if re.match(r'^#[0-9a-fA-F]{3,8}$', t):
        return False
    if re.match(r'^[\d\s.,;:!?\-+*/=<>|\\()\[\]{}@#%^&~`]+$', t):
        return False
    if t.startswith(('rgba', 'rgb(', 'http', 'aethera://')):
        return False
    if re.search(r'[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]{2,}', t):
        return True
    return False

# Key tracking per namespace
_key_counters: dict = {}

def make_key(text: str, ns: str) -> str:
    t = text.lower().strip()
    # Remove emoji
    t = re.sub(r'[^\w\s]', ' ', t)
    # Transliterate Polish
    for a, b in [('ą','a'),('ć','c'),('ę','e'),('ł','l'),('ń','n'),('ó','o'),('ś','s'),('ź','z'),('ż','z')]:
        t = t.replace(a, b)
    t = re.sub(r'\s+', '_', t.strip())
    t = re.sub(r'[^a-z0-9_]', '', t)
    words = t.split('_')[:5]
    base = '_'.join(w[:10] for w in words if w)[:35] or 'text'

    ns_map = _key_counters.setdefault(ns, {})
    if base in ns_map:
        ns_map[base] += 1
        return f"{base}_{ns_map[base]}"
    ns_map[base] = 0
    return base


def process_screen(content: str, ns: str, catalog: dict) -> tuple:
    """Process screen content, wrapping JSX text and prop values only."""
    count = 0

    # ── Check if already has t declaration ──────────────────────────────────
    has_t = "const { t }" in content or "const {t}" in content

    def t_call(text: str) -> str:
        nonlocal count
        key = make_key(text, ns)
        catalog.setdefault(ns, {})[key] = text
        count += 1
        safe = text.replace("'", "\\'")
        return f"t('{ns}.{key}', '{safe}')"

    # ── Pattern 1: JSX text between opening > and closing </Tag> ────────────
    # Must be pure text, no { or < or > inside, no existing t(
    def replace_jsx(m):
        text = m.group(2).strip()
        if not is_user_visible(text):
            return m.group(0)
        if "t('" in text or 't("' in text:
            return m.group(0)
        return f"{m.group(1)}{{{t_call(text)}}}{m.group(3)}"

    content = re.sub(
        r'(>\s*)([^{}<>\n]{2,200}?)(\s*</[A-Za-z][A-Za-z0-9.]*>)',
        replace_jsx,
        content
    )

    # ── Pattern 2: Common string props ──────────────────────────────────────
    PROPS = [
        'placeholder', 'title', 'subtitle', 'label', 'text',
        'description', 'buttonText', 'emptyText', 'message',
        'header', 'hint', 'caption', 'confirmText', 'cancelText',
        'helperText', 'errorText',
    ]

    for prop in PROPS:
        def replace_prop(m, p=prop):
            text = m.group(1)
            if not is_user_visible(text):
                return m.group(0)
            if "t('" in text or 't("' in text:
                return m.group(0)
            return f'{p}={{{t_call(text)}}}'

        content = re.sub(rf'\b{prop}="([^"{{}}]+)"', replace_prop, content)
        content = re.sub(rf"\b{prop}='([^'{{}}]+)'", replace_prop, content)

    # ── Pattern 3: Alert.alert('title', 'message') ──────────────────────────
    def replace_alert(m):
        t1, sep, t2 = m.group(1), m.group(2), m.group(3)
        r1 = t_call(t1) if is_user_visible(t1) and "t('" not in t1 else f"'{t1}'"
        r2 = t_call(t2) if is_user_visible(t2) and "t('" not in t2 else f"'{t2}'"
        return f"Alert.alert({r1}{sep}{r2}"

    content = re.sub(
        r"Alert\.alert\('([^']+)'(\s*,\s*)'([^']+)'",
        replace_alert,
        content
    )

    # ── Ensure t is declared ─────────────────────────────────────────────────
    if count > 0 and not has_t:
        content = re.sub(
            r'(const isLight = false;)',
            r'\1\n  const { t } = useTranslation();',
            content, count=1
        )
        if 'useTranslation' not in content:
            content = re.sub(
                r"(import \{ useTheme \} from '../core/hooks/useTheme';)",
                r"\1\nimport { useTranslation } from 'react-i18next';",
                content, count=1
            )

    return content, count


def main():
    TEMP_DIR.mkdir(exist_ok=True)

    catalog = {}
    total = 0
    processed = 0
    errors = []

    for path in sorted(SCREENS_DIR.glob("*.tsx")):
        name = path.stem
        ns = SCREEN_NAMESPACE.get(name)
        if not ns:
            raw = re.sub(r'Screen$', '', name)
            ns = raw[0].lower() + raw[1:]

        try:
            original = path.read_text(encoding='utf-8')
            new_content, count = process_screen(original, ns, catalog)

            if count > 0:
                path.write_text(new_content, encoding='utf-8')
                print(f"  + {name:45s} +{count:3d}  [{ns}]")
                total += count
            else:
                pass  # silent for clean screens

            processed += 1

        except Exception as e:
            errors.append((name, str(e)))
            print(f"  ERROR {name}: {e}")

    # Save catalog
    out = TEMP_DIR / "extraction_catalog.json"
    existing = {}
    if out.exists():
        existing = json.loads(out.read_text(encoding='utf-8'))
    for ns, keys in catalog.items():
        existing.setdefault(ns, {}).update(keys)
    out.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding='utf-8')

    total_strings = sum(len(v) for v in existing.values())
    print(f"\n{'='*65}")
    print(f"  Screens processed  : {processed}")
    print(f"  New t() calls      : {total}")
    print(f"  Namespaces         : {len(existing)}")
    print(f"  Total strings      : {total_strings}")
    print(f"  Catalog            : {out}")

    if errors:
        print(f"\n  Errors ({len(errors)}):")
        for n, e in errors:
            print(f"    ✗ {n}: {e}")


if __name__ == '__main__':
    main()
