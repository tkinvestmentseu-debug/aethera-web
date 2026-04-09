#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wraps ALL hardcoded user-visible strings in React Native TSX screens with t() calls.
Outputs extraction_catalog.json for translation generation.

Usage: python scripts/i18n/wrap-all-strings.py
"""

import re
import json
import os
import sys
from pathlib import Path
from typing import Dict, Tuple

SCREENS_DIR = Path("D:/Soulverse/src/screens")
I18N_DIR = Path("D:/Soulverse/src/core/i18n")
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

def is_translatable(text: str) -> bool:
    text = text.strip()
    if len(text) < 2:
        return False
    if re.match(r'^#[0-9a-fA-F]{3,8}$', text):
        return False
    if re.match(r'^[\d\s.,;:!?\-+*/=<>|\\()[\]{}@#%^&~`]+$', text):
        return False
    if text.startswith('rgba') or text.startswith('rgb(') or text.startswith('http'):
        return False
    if '/' in text and not ' ' in text:
        return False
    if text.endswith('.tsx') or text.endswith('.ts') or text.endswith('.js'):
        return False
    if re.match(r'^[a-z][a-zA-Z0-9_]+$', text) and len(text) < 30:
        return False  # camelCase identifier
    if re.match(r'^[A-Z_][A-Z0-9_]{2,}$', text):
        return False  # CONSTANT_CASE
    if any(c in POLISH_CHARS for c in text):
        return True
    words = text.split()
    if len(words) >= 2:
        return True
    if re.match(r'^[A-ZĄŻĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,}$', text):
        return True
    return False

def to_key_name(text: str) -> str:
    """Convert text to a short snake_case key."""
    t = text.lower().strip()
    for a, b in [('ą','a'),('ć','c'),('ę','e'),('ł','l'),('ń','n'),('ó','o'),('ś','s'),('ź','z'),('ż','z')]:
        t = t.replace(a, b)
    t = re.sub(r'[^a-z0-9 ]', '', t)
    words = t.split()[:5]
    return '_'.join(w[:10] for w in words if w) or 'text'

def process_screen(content: str, namespace: str, catalog: Dict) -> Tuple[str, int]:
    """Wrap hardcoded strings with t() calls."""
    key_counts: Dict[str, int] = {}
    added = 0

    def get_key(text: str) -> str:
        base = to_key_name(text)
        if base in key_counts:
            key_counts[base] += 1
            return f"{base}_{key_counts[base]}"
        key_counts[base] = 0
        return base

    def safe_text(text: str) -> str:
        return text.replace("'", "\\'")

    def t_call(text: str) -> str:
        nonlocal added
        key = get_key(text)
        if key not in catalog.get(namespace, {}):
            catalog.setdefault(namespace, {})[key] = text
        added += 1
        return f"t('{namespace}.{key}', '{safe_text(text)}')"

    lines = content.split('\n')
    result = []

    for line in lines:
        # Skip lines that already have t( calls or are imports/comments
        if "t('" in line or 't("' in line:
            result.append(line)
            continue
        if line.strip().startswith('//') or line.strip().startswith('import ') or line.strip().startswith('*'):
            result.append(line)
            continue
        if line.strip().startswith('const ') and '=' in line and not 'return' in line and not '{' in line.split('=')[0]:
            # Likely a variable declaration with a string value - handle carefully
            pass

        new_line = line

        # Pattern 1: JSX text content ─ text between > and </Tag>
        # e.g.: >Tytuł ekranu</Text>  or  >  Kliknij tutaj  </Typography>
        def replace_jsx_text(m):
            text = m.group(2).strip()
            if not is_translatable(text):
                return m.group(0)
            return f"{m.group(1)}{{{t_call(text)}}}{m.group(3)}"

        new_line = re.sub(
            r'(>)\s*([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż][^{}<>\n]{1,200}?)\s*(</(?:Text|Typography|Button|View|Pressable)>)',
            replace_jsx_text,
            new_line
        )

        # Pattern 2: Standalone text line between JSX tags (no tags on same line)
        # e.g.:    Witaj w Aethera
        standalone_match = re.match(r'^(\s+)([A-ZĄŻĆĘŁŃÓŚŹŻ][^{}<>\n/\\]{2,200})\s*$', new_line)
        if standalone_match and is_translatable(standalone_match.group(2).strip()):
            text = standalone_match.group(2).strip()
            # Only wrap if surrounding context suggests JSX text (not in object literals)
            ws = standalone_match.group(1)
            new_line = f"{ws}{{{t_call(text)}}}"

        # Pattern 3: String props
        PROPS = ['placeholder', 'title', 'subtitle', 'label', 'text',
                 'description', 'buttonText', 'emptyText', 'message',
                 'header', 'hint', 'caption', 'confirmText', 'cancelText']

        for prop in PROPS:
            # prop="text" or prop='text'
            def replace_prop(m, p=prop):
                text = m.group(1)
                if not is_translatable(text):
                    return m.group(0)
                return f'{p}={{{t_call(text)}}}'

            new_line = re.sub(rf'\b{prop}="([^"{{}}]+)"', replace_prop, new_line)
            new_line = re.sub(rf"\b{prop}='([^'{{}}]+)'", replace_prop, new_line)

        # Pattern 4: Alert.alert('title', 'message') ─ single quotes only
        def replace_alert(m):
            title = m.group(1)
            sep = m.group(2)
            msg = m.group(3)
            t1 = t_call(title) if is_translatable(title) else f"'{safe_text(title)}'"
            t2 = t_call(msg) if is_translatable(msg) else f"'{safe_text(msg)}'"
            return f"Alert.alert({t1}{sep}{t2}"

        new_line = re.sub(
            r"Alert\.alert\('([^']+)'(\s*,\s*)'([^']+)'",
            replace_alert,
            new_line
        )

        result.append(new_line)

    return '\n'.join(result), added


def ensure_t_declared(content: str) -> str:
    """Ensure useTranslation is imported and t is declared in component."""
    if 'useTranslation' not in content:
        content = re.sub(
            r"(import \{ useTheme \} from '../core/hooks/useTheme';)",
            r"\1\nimport { useTranslation } from 'react-i18next';",
            content,
            count=1
        )
        if 'useTranslation' not in content:
            # Add after first react-i18n related import or at top
            content = re.sub(
                r"(import React.*?from 'react';)",
                r"\1\nimport { useTranslation } from 'react-i18next';",
                content,
                count=1
            )

    if "const { t }" not in content and "const {t}" not in content:
        # Add after const isLight = false;
        content = re.sub(
            r'(const isLight = false;)',
            r'\1\n  const { t } = useTranslation();',
            content,
            count=1
        )

    return content


def main():
    TEMP_DIR.mkdir(exist_ok=True)

    catalog: Dict = {}
    total_added = 0
    processed = 0
    errors = []

    screen_files = sorted(SCREENS_DIR.glob("*.tsx"))
    print(f"Processing {len(screen_files)} screen files...\n")

    for path in screen_files:
        name = path.stem
        ns = SCREEN_NAMESPACE.get(name)
        if not ns:
            raw = re.sub(r'Screen$', '', name)
            ns = raw[0].lower() + raw[1:]

        try:
            original = path.read_text(encoding='utf-8')
            new_content, count = process_screen(original, ns, catalog)

            if count > 0:
                new_content = ensure_t_declared(new_content)
                path.write_text(new_content, encoding='utf-8')
                print(f"  ✓ {name:45s} +{count:3d} keys  [{ns}]")
                total_added += count
            else:
                print(f"  · {name:45s} (no new strings)")

            processed += 1

        except Exception as e:
            import traceback
            errors.append((name, str(e)))
            print(f"  ✗ {name}: ERROR — {e}")

    # Save catalog
    out = TEMP_DIR / "extraction_catalog.json"
    out.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')

    total_strings = sum(len(v) for v in catalog.values())
    print(f"\n{'='*65}")
    print(f"  Screens processed : {processed}/{len(screen_files)}")
    print(f"  New t() calls     : {total_added}")
    print(f"  Unique namespaces : {len(catalog)}")
    print(f"  Strings extracted : {total_strings}")
    print(f"  Catalog saved     : {out}")

    if errors:
        print(f"\n  Errors ({len(errors)}):")
        for n, e in errors:
            print(f"    ✗ {n}: {e}")

    return catalog


if __name__ == '__main__':
    main()
