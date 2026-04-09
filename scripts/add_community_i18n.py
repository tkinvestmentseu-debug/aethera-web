#!/usr/bin/env python3
"""Add gratitudeWall, groupMeditation, synchronicities + common.timeAgo to all 11 language files."""
import json, os

BASE = r"D:\Soulverse\src\core\i18n"

# Translations per language
TRANSLATIONS = {
    "en": {
        "common_timeAgo": {
            "justNow": "just now",
            "minAgo": "min ago",
            "hrAgo": "hr ago",
            "daysAgo": "days ago"
        },
        "gratitudeWall": {
            "title": "Gratitude Wall",
            "subtitle": "Share gratitude with the community",
            "cat_milosc": "Love",
            "cat_natura": "Nature",
            "cat_ludzie": "People",
            "cat_moment": "Moment",
            "cat_zmiana": "Change",
            "placeholder": "What are you grateful for today?",
            "anonLabel": "Anonymous",
            "sendBtn": "Send",
            "anonSoul": "Anonymous soul",
            "emptyState": "Be the first to share your gratitude"
        },
        "groupMeditation": {
            "title": "Group Meditation",
            "subtitle": "Every day at 9 PM",
            "nextSession": "Next session in",
            "peopleMeditating": "people meditating now",
            "meditatingWith": "✦ You are meditating with the community",
            "dailyIntention": "Daily intention",
            "activeMeditators": "Active meditators",
            "joinBtn": "Join the circle",
            "leaveBtn": "End meditation"
        },
        "synchronicities": {
            "title": "Synchronicities",
            "subtitle": "Meaningful coincidences and signs",
            "tag_liczby": "Numbers",
            "tag_widzenie": "Vision",
            "tag_sen": "Dream",
            "tag_znak": "Sign",
            "tag_przypadek": "Coincidence",
            "placeholder": "Describe the synchronicity you experienced...",
            "shareBtn": "Share",
            "fulfilled": "Fulfilled",
            "fulfillBtn": "✦ It came true",
            "unknownSoul": "Unknown soul",
            "emptyState": "Share a synchronicity you recently experienced"
        }
    },
    "pl": {
        "common_timeAgo": {
            "justNow": "przed chwilą",
            "minAgo": "min temu",
            "hrAgo": "godz. temu",
            "daysAgo": "dni temu"
        },
        "gratitudeWall": {
            "title": "Tablica Wdzięczności",
            "subtitle": "Podziel się wdzięcznością ze wspólnotą",
            "cat_milosc": "Miłość",
            "cat_natura": "Natura",
            "cat_ludzie": "Ludzie",
            "cat_moment": "Chwila",
            "cat_zmiana": "Zmiana",
            "placeholder": "Za co jesteś dziś wdzięczny?",
            "anonLabel": "Anonimowo",
            "sendBtn": "Wyślij",
            "anonSoul": "Anonimowa dusza",
            "emptyState": "Bądź pierwszą osobą która podzieli się wdzięcznością"
        },
        "groupMeditation": {
            "title": "Grupowa Medytacja",
            "subtitle": "Każdego dnia o 21:00",
            "nextSession": "Następna sesja za",
            "peopleMeditating": "osób medytuje teraz",
            "meditatingWith": "✦ Medytujesz razem ze wspólnotą",
            "dailyIntention": "Intencja dnia",
            "activeMeditators": "Aktywni medytujący",
            "joinBtn": "Dołącz do kręgu",
            "leaveBtn": "Zakończ medytację"
        },
        "synchronicities": {
            "title": "Synchroniczności",
            "subtitle": "Znaczące zbieżności i znaki",
            "tag_liczby": "Liczby",
            "tag_widzenie": "Widzenie",
            "tag_sen": "Sen",
            "tag_znak": "Znak",
            "tag_przypadek": "Przypadek",
            "placeholder": "Opisz synchroniczność którą doświadczyłeś...",
            "shareBtn": "Podziel się",
            "fulfilled": "Spełniło się",
            "fulfillBtn": "✦ Spełniło się",
            "unknownSoul": "Nieznana dusza",
            "emptyState": "Podziel się synchronicznością którą ostatnio doświadczyłeś"
        }
    },
    "de": {
        "common_timeAgo": {
            "justNow": "gerade eben",
            "minAgo": "Min. zuvor",
            "hrAgo": "Std. zuvor",
            "daysAgo": "Tage zuvor"
        },
        "gratitudeWall": {
            "title": "Dankbarkeitswand",
            "subtitle": "Teile Dankbarkeit mit der Gemeinschaft",
            "cat_milosc": "Liebe",
            "cat_natura": "Natur",
            "cat_ludzie": "Menschen",
            "cat_moment": "Moment",
            "cat_zmiana": "Wandel",
            "placeholder": "Wofür bist du heute dankbar?",
            "anonLabel": "Anonym",
            "sendBtn": "Senden",
            "anonSoul": "Anonyme Seele",
            "emptyState": "Sei der Erste, der seine Dankbarkeit teilt"
        },
        "groupMeditation": {
            "title": "Gruppenmeditation",
            "subtitle": "Jeden Tag um 21:00 Uhr",
            "nextSession": "Nächste Sitzung in",
            "peopleMeditating": "Personen meditieren gerade",
            "meditatingWith": "✦ Du meditierst mit der Gemeinschaft",
            "dailyIntention": "Tagesintention",
            "activeMeditators": "Aktive Meditierende",
            "joinBtn": "Dem Kreis beitreten",
            "leaveBtn": "Meditation beenden"
        },
        "synchronicities": {
            "title": "Synchronizitäten",
            "subtitle": "Bedeutungsvolle Zufälle und Zeichen",
            "tag_liczby": "Zahlen",
            "tag_widzenie": "Vision",
            "tag_sen": "Traum",
            "tag_znak": "Zeichen",
            "tag_przypadek": "Zufall",
            "placeholder": "Beschreibe die Synchronizität, die du erlebt hast...",
            "shareBtn": "Teilen",
            "fulfilled": "Erfüllt",
            "fulfillBtn": "✦ Es ist eingetreten",
            "unknownSoul": "Unbekannte Seele",
            "emptyState": "Teile eine Synchronizität, die du kürzlich erlebt hast"
        }
    },
    "es": {
        "common_timeAgo": {
            "justNow": "ahora mismo",
            "minAgo": "min atrás",
            "hrAgo": "h atrás",
            "daysAgo": "días atrás"
        },
        "gratitudeWall": {
            "title": "Muro de Gratitud",
            "subtitle": "Comparte gratitud con la comunidad",
            "cat_milosc": "Amor",
            "cat_natura": "Naturaleza",
            "cat_ludzie": "Personas",
            "cat_moment": "Momento",
            "cat_zmiana": "Cambio",
            "placeholder": "¿Por qué estás agradecido hoy?",
            "anonLabel": "Anónimo",
            "sendBtn": "Enviar",
            "anonSoul": "Alma anónima",
            "emptyState": "Sé el primero en compartir tu gratitud"
        },
        "groupMeditation": {
            "title": "Meditación Grupal",
            "subtitle": "Todos los días a las 21:00",
            "nextSession": "Próxima sesión en",
            "peopleMeditating": "personas meditando ahora",
            "meditatingWith": "✦ Estás meditando con la comunidad",
            "dailyIntention": "Intención del día",
            "activeMeditators": "Meditadores activos",
            "joinBtn": "Unirse al círculo",
            "leaveBtn": "Terminar meditación"
        },
        "synchronicities": {
            "title": "Sincronicidades",
            "subtitle": "Coincidencias significativas y señales",
            "tag_liczby": "Números",
            "tag_widzenie": "Visión",
            "tag_sen": "Sueño",
            "tag_znak": "Señal",
            "tag_przypadek": "Coincidencia",
            "placeholder": "Describe la sincronicidad que experimentaste...",
            "shareBtn": "Compartir",
            "fulfilled": "Cumplido",
            "fulfillBtn": "✦ Se cumplió",
            "unknownSoul": "Alma desconocida",
            "emptyState": "Comparte una sincronicidad que hayas experimentado recientemente"
        }
    },
    "fr": {
        "common_timeAgo": {
            "justNow": "à l'instant",
            "minAgo": "min",
            "hrAgo": "h",
            "daysAgo": "j"
        },
        "gratitudeWall": {
            "title": "Mur de Gratitude",
            "subtitle": "Partagez votre gratitude avec la communauté",
            "cat_milosc": "Amour",
            "cat_natura": "Nature",
            "cat_ludzie": "Personnes",
            "cat_moment": "Moment",
            "cat_zmiana": "Changement",
            "placeholder": "Pour quoi êtes-vous reconnaissant aujourd'hui?",
            "anonLabel": "Anonyme",
            "sendBtn": "Envoyer",
            "anonSoul": "Âme anonyme",
            "emptyState": "Soyez le premier à partager votre gratitude"
        },
        "groupMeditation": {
            "title": "Méditation de Groupe",
            "subtitle": "Chaque jour à 21h00",
            "nextSession": "Prochaine session dans",
            "peopleMeditating": "personnes méditent maintenant",
            "meditatingWith": "✦ Vous méditez avec la communauté",
            "dailyIntention": "Intention du jour",
            "activeMeditators": "Méditants actifs",
            "joinBtn": "Rejoindre le cercle",
            "leaveBtn": "Terminer la méditation"
        },
        "synchronicities": {
            "title": "Synchronicités",
            "subtitle": "Coïncidences significatives et signes",
            "tag_liczby": "Nombres",
            "tag_widzenie": "Vision",
            "tag_sen": "Rêve",
            "tag_znak": "Signe",
            "tag_przypadek": "Coïncidence",
            "placeholder": "Décrivez la synchronicité que vous avez vécue...",
            "shareBtn": "Partager",
            "fulfilled": "Accompli",
            "fulfillBtn": "✦ C'est arrivé",
            "unknownSoul": "Âme inconnue",
            "emptyState": "Partagez une synchronicité que vous avez récemment vécue"
        }
    },
    "it": {
        "common_timeAgo": {
            "justNow": "adesso",
            "minAgo": "min fa",
            "hrAgo": "ore fa",
            "daysAgo": "giorni fa"
        },
        "gratitudeWall": {
            "title": "Muro della Gratitudine",
            "subtitle": "Condividi la gratitudine con la comunità",
            "cat_milosc": "Amore",
            "cat_natura": "Natura",
            "cat_ludzie": "Persone",
            "cat_moment": "Momento",
            "cat_zmiana": "Cambiamento",
            "placeholder": "Per cosa sei grato oggi?",
            "anonLabel": "Anonimo",
            "sendBtn": "Invia",
            "anonSoul": "Anima anonima",
            "emptyState": "Sii il primo a condividere la tua gratitudine"
        },
        "groupMeditation": {
            "title": "Meditazione di Gruppo",
            "subtitle": "Ogni giorno alle 21:00",
            "nextSession": "Prossima sessione tra",
            "peopleMeditating": "persone stanno meditando",
            "meditatingWith": "✦ Stai meditando con la comunità",
            "dailyIntention": "Intenzione del giorno",
            "activeMeditators": "Meditatori attivi",
            "joinBtn": "Unisciti al cerchio",
            "leaveBtn": "Termina meditazione"
        },
        "synchronicities": {
            "title": "Sincronicità",
            "subtitle": "Coincidenze significative e segni",
            "tag_liczby": "Numeri",
            "tag_widzenie": "Visione",
            "tag_sen": "Sogno",
            "tag_znak": "Segno",
            "tag_przypadek": "Coincidenza",
            "placeholder": "Descrivi la sincronicità che hai vissuto...",
            "shareBtn": "Condividi",
            "fulfilled": "Realizzato",
            "fulfillBtn": "✦ Si è avverato",
            "unknownSoul": "Anima sconosciuta",
            "emptyState": "Condividi una sincronicità che hai vissuto di recente"
        }
    },
    "pt": {
        "common_timeAgo": {
            "justNow": "agora mesmo",
            "minAgo": "min atrás",
            "hrAgo": "h atrás",
            "daysAgo": "dias atrás"
        },
        "gratitudeWall": {
            "title": "Mural de Gratidão",
            "subtitle": "Compartilhe gratidão com a comunidade",
            "cat_milosc": "Amor",
            "cat_natura": "Natureza",
            "cat_ludzie": "Pessoas",
            "cat_moment": "Momento",
            "cat_zmiana": "Mudança",
            "placeholder": "Pelo que você é grato hoje?",
            "anonLabel": "Anônimo",
            "sendBtn": "Enviar",
            "anonSoul": "Alma anônima",
            "emptyState": "Seja o primeiro a compartilhar sua gratidão"
        },
        "groupMeditation": {
            "title": "Meditação em Grupo",
            "subtitle": "Todos os dias às 21h",
            "nextSession": "Próxima sessão em",
            "peopleMeditating": "pessoas meditando agora",
            "meditatingWith": "✦ Você está meditando com a comunidade",
            "dailyIntention": "Intenção do dia",
            "activeMeditators": "Meditadores ativos",
            "joinBtn": "Entrar no círculo",
            "leaveBtn": "Encerrar meditação"
        },
        "synchronicities": {
            "title": "Sincronicidades",
            "subtitle": "Coincidências significativas e sinais",
            "tag_liczby": "Números",
            "tag_widzenie": "Visão",
            "tag_sen": "Sonho",
            "tag_znak": "Sinal",
            "tag_przypadek": "Coincidência",
            "placeholder": "Descreva a sincronicidade que você vivenciou...",
            "shareBtn": "Compartilhar",
            "fulfilled": "Realizado",
            "fulfillBtn": "✦ Se realizou",
            "unknownSoul": "Alma desconhecida",
            "emptyState": "Compartilhe uma sincronicidade que você vivenciou recentemente"
        }
    },
    "ru": {
        "common_timeAgo": {
            "justNow": "только что",
            "minAgo": "мин назад",
            "hrAgo": "ч назад",
            "daysAgo": "дн назад"
        },
        "gratitudeWall": {
            "title": "Стена Благодарности",
            "subtitle": "Поделитесь благодарностью с сообществом",
            "cat_milosc": "Любовь",
            "cat_natura": "Природа",
            "cat_ludzie": "Люди",
            "cat_moment": "Момент",
            "cat_zmiana": "Перемена",
            "placeholder": "За что вы благодарны сегодня?",
            "anonLabel": "Анонимно",
            "sendBtn": "Отправить",
            "anonSoul": "Анонимная душа",
            "emptyState": "Станьте первым, кто поделится благодарностью"
        },
        "groupMeditation": {
            "title": "Групповая Медитация",
            "subtitle": "Каждый день в 21:00",
            "nextSession": "Следующая сессия через",
            "peopleMeditating": "человек медитируют сейчас",
            "meditatingWith": "✦ Вы медитируете вместе с сообществом",
            "dailyIntention": "Намерение дня",
            "activeMeditators": "Активные медитирующие",
            "joinBtn": "Присоединиться к кругу",
            "leaveBtn": "Завершить медитацию"
        },
        "synchronicities": {
            "title": "Синхроничности",
            "subtitle": "Значимые совпадения и знаки",
            "tag_liczby": "Числа",
            "tag_widzenie": "Видение",
            "tag_sen": "Сон",
            "tag_znak": "Знак",
            "tag_przypadek": "Совпадение",
            "placeholder": "Опишите синхроничность, которую вы пережили...",
            "shareBtn": "Поделиться",
            "fulfilled": "Исполнилось",
            "fulfillBtn": "✦ Сбылось",
            "unknownSoul": "Неизвестная душа",
            "emptyState": "Поделитесь синхроничностью, которую вы недавно пережили"
        }
    },
    "ar": {
        "common_timeAgo": {
            "justNow": "الآن",
            "minAgo": "د مضت",
            "hrAgo": "س مضت",
            "daysAgo": "أيام مضت"
        },
        "gratitudeWall": {
            "title": "جدار الامتنان",
            "subtitle": "شارك الامتنان مع المجتمع",
            "cat_milosc": "الحب",
            "cat_natura": "الطبيعة",
            "cat_ludzie": "الناس",
            "cat_moment": "اللحظة",
            "cat_zmiana": "التغيير",
            "placeholder": "ما الذي تشعر بالامتنان تجاهه اليوم؟",
            "anonLabel": "مجهول",
            "sendBtn": "إرسال",
            "anonSoul": "روح مجهولة",
            "emptyState": "كن أول من يشارك امتنانه"
        },
        "groupMeditation": {
            "title": "التأمل الجماعي",
            "subtitle": "كل يوم الساعة 21:00",
            "nextSession": "الجلسة التالية خلال",
            "peopleMeditating": "شخص يتأمل الآن",
            "meditatingWith": "✦ أنت تتأمل مع المجتمع",
            "dailyIntention": "نية اليوم",
            "activeMeditators": "المتأملون النشطون",
            "joinBtn": "انضم إلى الدائرة",
            "leaveBtn": "إنهاء التأمل"
        },
        "synchronicities": {
            "title": "التزامنات",
            "subtitle": "تزامنات ذات معنى وعلامات",
            "tag_liczby": "أرقام",
            "tag_widzenie": "رؤية",
            "tag_sen": "حلم",
            "tag_znak": "علامة",
            "tag_przypadek": "تزامن",
            "placeholder": "صف التزامن الذي عشته...",
            "shareBtn": "مشاركة",
            "fulfilled": "تحقق",
            "fulfillBtn": "✦ تحقق",
            "unknownSoul": "روح مجهولة",
            "emptyState": "شارك تزامناً عشته مؤخراً"
        }
    },
    "ja": {
        "common_timeAgo": {
            "justNow": "たった今",
            "minAgo": "分前",
            "hrAgo": "時間前",
            "daysAgo": "日前"
        },
        "gratitudeWall": {
            "title": "感謝の壁",
            "subtitle": "コミュニティと感謝を共有しましょう",
            "cat_milosc": "愛",
            "cat_natura": "自然",
            "cat_ludzie": "人々",
            "cat_moment": "瞬間",
            "cat_zmiana": "変化",
            "placeholder": "今日、何に感謝していますか？",
            "anonLabel": "匿名",
            "sendBtn": "送信",
            "anonSoul": "匿名の魂",
            "emptyState": "最初に感謝を共有する人になりましょう"
        },
        "groupMeditation": {
            "title": "グループ瞑想",
            "subtitle": "毎日21:00",
            "nextSession": "次のセッションまで",
            "peopleMeditating": "人が今瞑想中",
            "meditatingWith": "✦ あなたはコミュニティと一緒に瞑想しています",
            "dailyIntention": "今日の意図",
            "activeMeditators": "アクティブな瞑想者",
            "joinBtn": "サークルに参加する",
            "leaveBtn": "瞑想を終了する"
        },
        "synchronicities": {
            "title": "シンクロニシティ",
            "subtitle": "意味のある偶然とサイン",
            "tag_liczby": "数字",
            "tag_widzenie": "ビジョン",
            "tag_sen": "夢",
            "tag_znak": "サイン",
            "tag_przypadek": "偶然",
            "placeholder": "経験したシンクロニシティを説明してください...",
            "shareBtn": "共有する",
            "fulfilled": "実現した",
            "fulfillBtn": "✦ 実現した",
            "unknownSoul": "未知の魂",
            "emptyState": "最近経験したシンクロニシティを共有してください"
        }
    },
    "zh": {
        "common_timeAgo": {
            "justNow": "刚刚",
            "minAgo": "分钟前",
            "hrAgo": "小时前",
            "daysAgo": "天前"
        },
        "gratitudeWall": {
            "title": "感恩之墙",
            "subtitle": "与社区分享感恩",
            "cat_milosc": "爱",
            "cat_natura": "自然",
            "cat_ludzie": "人们",
            "cat_moment": "时刻",
            "cat_zmiana": "改变",
            "placeholder": "你今天感恩什么？",
            "anonLabel": "匿名",
            "sendBtn": "发送",
            "anonSoul": "匿名灵魂",
            "emptyState": "成为第一个分享感恩的人"
        },
        "groupMeditation": {
            "title": "团体冥想",
            "subtitle": "每天21:00",
            "nextSession": "下一次课程将在",
            "peopleMeditating": "人正在冥想",
            "meditatingWith": "✦ 您正在与社区一起冥想",
            "dailyIntention": "今日意图",
            "activeMeditators": "活跃冥想者",
            "joinBtn": "加入圆圈",
            "leaveBtn": "结束冥想"
        },
        "synchronicities": {
            "title": "共时性",
            "subtitle": "有意义的巧合和迹象",
            "tag_liczby": "数字",
            "tag_widzenie": "视觉",
            "tag_sen": "梦境",
            "tag_znak": "迹象",
            "tag_przypadek": "巧合",
            "placeholder": "描述您所经历的共时性...",
            "shareBtn": "分享",
            "fulfilled": "已实现",
            "fulfillBtn": "✦ 实现了",
            "unknownSoul": "未知灵魂",
            "emptyState": "分享您最近经历的共时性"
        }
    }
}

LANG_FILES = {
    "en": "en.json",
    "pl": "pl.json",
    "de": "de.json",
    "es": "es.json",
    "fr": "fr.json",
    "it": "it.json",
    "pt": "pt.json",
    "ru": "ru.json",
    "ar": "ar.json",
    "ja": "ja.json",
    "zh": "zh.json",
}

for lang, filename in LANG_FILES.items():
    path = os.path.join(BASE, filename)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    tr = TRANSLATIONS.get(lang, TRANSLATIONS["en"])

    # 1. Add common.timeAgo
    if "common" not in data:
        data["common"] = {}
    if "timeAgo" not in data["common"]:
        data["common"]["timeAgo"] = tr["common_timeAgo"]
        print(f"  [{lang}] Added common.timeAgo")

    # 2. Add top-level sections
    for section in ("gratitudeWall", "groupMeditation", "synchronicities"):
        if section not in data:
            data[section] = tr[section]
            print(f"  [{lang}] Added {section}")
        else:
            # Merge missing keys
            for k, v in tr[section].items():
                if k not in data[section]:
                    data[section][k] = v
                    print(f"  [{lang}] Added {section}.{k}")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("\nDone. All 11 language files updated.")
