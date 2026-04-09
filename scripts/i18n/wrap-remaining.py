#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Second pass: wrap remaining hardcoded strings that the first pass missed.
Handles: emoji-prefixed strings, ALL-CAPS Polish, strings in non-Text tags.

Usage: python -X utf8 scripts/i18n/wrap-remaining.py
"""

import re
import json
from pathlib import Path

SCREENS_DIR = Path("D:/Soulverse/src/screens")
TEMP_DIR = Path("D:/Soulverse/temp_i18n")

POLISH_CHARS = set('ąćęłńóśźżĄĆĘŁŃÓŚŹŻ')

# Load existing catalog
catalog_file = TEMP_DIR / "extraction_catalog.json"
if catalog_file.exists():
    catalog = json.loads(catalog_file.read_text(encoding='utf-8'))
else:
    catalog = {}

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
    """Broader check — any user-visible text string."""
    t = text.strip()
    if not t or len(t) < 2:
        return False
    # Skip color codes
    if re.match(r'^#[0-9a-fA-F]{3,8}$', t):
        return False
    # Skip pure numbers/punctuation
    if re.match(r'^[\d\s.,;:!?\-+*/=<>|\\()\[\]{}@#%^&~`]+$', t):
        return False
    # Skip obvious code: rgba(...), url, path
    if t.startswith(('rgba', 'rgb(', 'http', 'aethera://')):
        return False
    if re.match(r'^[a-z][a-zA-Z0-9]{2,}$', t) and '_' not in t:
        return False  # camelCase identifier (short)
    # Accept strings with any letter content
    if re.search(r'[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]{2,}', t):
        return True
    return False

# Key counter per namespace to avoid dupes
key_counters: dict = {}

def make_key(text: str, ns: str) -> str:
    """Generate a translation key."""
    t = text.lower()
    # Remove emoji and symbols
    t = re.sub(r'[^\w\s]', '', t)
    # Transliterate Polish
    for a, b in [('ą','a'),('ć','c'),('ę','e'),('ł','l'),('ń','n'),('ó','o'),('ś','s'),('ź','z'),('ż','z')]:
        t = t.replace(a, b)
    words = re.sub(r'\s+', '_', t.strip()).split('_')[:5]
    base = '_'.join(w[:10] for w in words if w)[:40] or 'text'

    ns_counter = key_counters.setdefault(ns, {})
    if base in ns_counter:
        ns_counter[base] += 1
        return f"{base}_{ns_counter[base]}"
    ns_counter[base] = 0
    return base


def wrap_jsx_text(content: str, ns: str) -> tuple:
    """Find >TEXT</tag> and wrap TEXT with t()."""
    count = 0

    def replacer(m):
        nonlocal count
        prefix = m.group(1)  # '>'
        text = m.group(2)    # the text
        suffix = m.group(3)  # </Tag>

        stripped = text.strip()
        if not is_user_visible(stripped):
            return m.group(0)
        if "t('" in stripped or 't("' in stripped:
            return m.group(0)

        key = make_key(stripped, ns)
        safe = stripped.replace("'", "\\'")
        full_key = f"{ns}.{key}"

        catalog.setdefault(ns, {})[key] = stripped
        count += 1

        return f"{prefix}{{{f't(chr(39){full_key}chr(39), chr(39){safe}chr(39))'}}}{suffix}".replace(
            'chr(39)', "'"
        )

    # Match >text</AnyTag>  (text has no { or < or > or newline)
    new_content = re.sub(
        r'(>)\s*([^{}<>\n]{2,200}?)\s*(</[A-Za-z][A-Za-z0-9]*>)',
        replacer,
        content
    )
    return new_content, count


def main():
    total = 0
    TEMP_DIR.mkdir(exist_ok=True)

    for path in sorted(SCREENS_DIR.glob("*.tsx")):
        name = path.stem
        ns = SCREEN_NAMESPACE.get(name)
        if not ns:
            raw = re.sub(r'Screen$', '', name)
            ns = raw[0].lower() + raw[1:]

        try:
            original = path.read_text(encoding='utf-8')
            new_content, count = wrap_jsx_text(original, ns)

            if count > 0:
                path.write_text(new_content, encoding='utf-8')
                print(f"  + {name:45s} +{count:3d}")
                total += count

        except Exception as e:
            print(f"  ERROR {name}: {e}")

    # Save updated catalog
    catalog_file.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f"\nTotal new wraps: {total}")
    total_strings = sum(len(v) for v in catalog.values())
    print(f"Catalog: {len(catalog)} namespaces, {total_strings} strings total")

    # Also count remaining
    remaining = 0
    for path in SCREENS_DIR.glob("*.tsx"):
        content = path.read_text(encoding='utf-8')
        matches = re.findall(r'>([^{<>\n]{3,80})</', content)
        for m in matches:
            if is_user_visible(m.strip()) and "t('" not in m:
                remaining += 1
    print(f"Still remaining hardcoded JSX text: {remaining}")


if __name__ == '__main__':
    main()
