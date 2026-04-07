// @ts-nocheck
/**
 * EmailService — wysyła emaile transakcyjne przez Resend API.
 * Klucz API: EXPO_PUBLIC_RESEND_API_KEY w .env
 * Rejestracja i dokumentacja: https://resend.com
 */

const RESEND_API_KEY = process?.env?.EXPO_PUBLIC_RESEND_API_KEY ?? '';
const FROM_ADDRESS = 'Aethera ✦ <noreply@aethera.pl>';

async function post(payload: object): Promise<void> {
  const key = RESEND_API_KEY;
  if (!key) {
    console.warn('[EmailService] Brak EXPO_PUBLIC_RESEND_API_KEY — email nie zostanie wysłany');
    return;
  }
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.warn('[EmailService] Błąd API:', resp.status, txt);
    }
  } catch (err) {
    console.warn('[EmailService] Błąd sieci:', err);
  }
}

// ─── Teksty w 10 językach ────────────────────────────────────────────────────

interface LangStrings {
  subject: (name: string) => string;
  tagline: string;
  newSoulJoined: string;
  welcome: (name: string) => string;
  yourZodiac: string;
  desc1: string;
  desc2: string;
  whatAwaits: string;
  ctaLabel: string;
  footer: string;
  features: { emoji: string; title: string; desc: string }[];
}

const LANG_STRINGS: Record<string, LangStrings> = {
  pl: {
    subject: (n) => `✦ Witaj w Aetherze, ${n}! Twoja duchowa podróż się zaczyna`,
    tagline: 'TWÓJ DUCHOWY KOMPAS',
    newSoulJoined: 'Nowa dusza dołączyła',
    welcome: (n) => `Witaj, ${n}! ✨`,
    yourZodiac: 'Twój znak zodiaku',
    desc1: 'Jesteś teraz częścią <strong style="color:#A78BFA;">Aethery</strong> — przestrzeni, gdzie starożytna mądrość spotyka się z nowoczesną technologią. Odkryj horoskopy, rytuały, medytacje i wróżby skrojone specjalnie pod Ciebie.',
    desc2: 'Twoja podróż dopiero się zaczyna. Gwiazdy już na Ciebie czekają. 🌙',
    whatAwaits: 'Co cię czeka',
    ctaLabel: 'Otwórz Aetherę ✦',
    footer: 'Ten email został wygenerowany automatycznie.<br/>© 2026 Aethera — Twój duchowy kompas',
    features: [
      { emoji: '🔮', title: 'Wyrocznia AI', desc: 'Zadaj pytanie, otrzymaj mistyczną odpowiedź' },
      { emoji: '⭐', title: 'Horoskop dzienny', desc: 'Personalizowane przepowiednie oparte na Twoim znaku' },
      { emoji: '🕯️', title: 'Rytuały i medytacje', desc: '15+ rytuałów prowadzonych przez AI' },
      { emoji: '🌐', title: 'Wspólnota dusz', desc: 'Połącz się z ludźmi na tej samej ścieżce' },
    ],
  },
  en: {
    subject: (n) => `✦ Welcome to Aethera, ${n}! Your spiritual journey begins`,
    tagline: 'YOUR SPIRITUAL COMPASS',
    newSoulJoined: 'A new soul has joined',
    welcome: (n) => `Welcome, ${n}! ✨`,
    yourZodiac: 'Your zodiac sign',
    desc1: 'You are now part of <strong style="color:#A78BFA;">Aethera</strong> — a space where ancient wisdom meets modern technology. Discover horoscopes, rituals, meditations and divinations tailored just for you.',
    desc2: 'Your journey is just beginning. The stars are already waiting for you. 🌙',
    whatAwaits: 'What awaits you',
    ctaLabel: 'Open Aethera ✦',
    footer: 'This email was generated automatically.<br/>© 2026 Aethera — Your Spiritual Compass',
    features: [
      { emoji: '🔮', title: 'AI Oracle', desc: 'Ask a question, receive a mystical answer' },
      { emoji: '⭐', title: 'Daily Horoscope', desc: 'Personalised predictions based on your sign' },
      { emoji: '🕯️', title: 'Rituals & Meditations', desc: '15+ AI-guided rituals' },
      { emoji: '🌐', title: 'Community of Souls', desc: 'Connect with people on the same path' },
    ],
  },
  de: {
    subject: (n) => `✦ Willkommen bei Aethera, ${n}! Deine spirituelle Reise beginnt`,
    tagline: 'DEIN SPIRITUELLER KOMPASS',
    newSoulJoined: 'Eine neue Seele ist beigetreten',
    welcome: (n) => `Willkommen, ${n}! ✨`,
    yourZodiac: 'Dein Sternzeichen',
    desc1: 'Du bist jetzt Teil von <strong style="color:#A78BFA;">Aethera</strong> — einem Raum, wo uralte Weisheit auf moderne Technologie trifft. Entdecke Horoskope, Rituale, Meditationen und Weissagungen, die speziell auf dich zugeschnitten sind.',
    desc2: 'Deine Reise fängt gerade erst an. Die Sterne warten schon auf dich. 🌙',
    whatAwaits: 'Was dich erwartet',
    ctaLabel: 'Öffne Aethera ✦',
    footer: 'Diese E-Mail wurde automatisch generiert.<br/>© 2026 Aethera — Dein Spiritueller Kompass',
    features: [
      { emoji: '🔮', title: 'KI-Orakel', desc: 'Stelle eine Frage, erhalte eine mystische Antwort' },
      { emoji: '⭐', title: 'Tageshoroskop', desc: 'Personalisierte Vorhersagen basierend auf deinem Zeichen' },
      { emoji: '🕯️', title: 'Rituale & Meditationen', desc: '15+ KI-geführte Rituale' },
      { emoji: '🌐', title: 'Gemeinschaft der Seelen', desc: 'Verbinde dich mit Menschen auf demselben Weg' },
    ],
  },
  fr: {
    subject: (n) => `✦ Bienvenue sur Aethera, ${n} ! Ton voyage spirituel commence`,
    tagline: 'TON BOUSSOLE SPIRITUELLE',
    newSoulJoined: 'Une nouvelle âme a rejoint',
    welcome: (n) => `Bienvenue, ${n} ! ✨`,
    yourZodiac: 'Ton signe du zodiaque',
    desc1: 'Tu fais maintenant partie d\'<strong style="color:#A78BFA;">Aethera</strong> — un espace où la sagesse ancestrale rencontre la technologie moderne. Découvre des horoscopes, rituels, méditations et divinations taillés sur mesure pour toi.',
    desc2: 'Ton voyage ne fait que commencer. Les étoiles t\'attendent déjà. 🌙',
    whatAwaits: 'Ce qui t\'attend',
    ctaLabel: 'Ouvrir Aethera ✦',
    footer: 'Cet email a été généré automatiquement.<br/>© 2026 Aethera — Ton Boussole Spirituelle',
    features: [
      { emoji: '🔮', title: 'Oracle IA', desc: 'Pose une question, reçois une réponse mystique' },
      { emoji: '⭐', title: 'Horoscope quotidien', desc: 'Prédictions personnalisées selon ton signe' },
      { emoji: '🕯️', title: 'Rituels & Méditations', desc: '15+ rituels guidés par IA' },
      { emoji: '🌐', title: 'Communauté des âmes', desc: 'Connecte-toi avec des gens sur le même chemin' },
    ],
  },
  es: {
    subject: (n) => `✦ Bienvenido/a a Aethera, ${n}! Tu viaje espiritual comienza`,
    tagline: 'TU BRÚJULA ESPIRITUAL',
    newSoulJoined: 'Una nueva alma se ha unido',
    welcome: (n) => `¡Bienvenido/a, ${n}! ✨`,
    yourZodiac: 'Tu signo del zodiaco',
    desc1: 'Ahora eres parte de <strong style="color:#A78BFA;">Aethera</strong> — un espacio donde la sabiduría ancestral se une con la tecnología moderna. Descubre horóscopos, rituales, meditaciones y adivinanzas diseñados especialmente para ti.',
    desc2: 'Tu viaje apenas comienza. Las estrellas ya te esperan. 🌙',
    whatAwaits: 'Lo que te espera',
    ctaLabel: 'Abrir Aethera ✦',
    footer: 'Este correo fue generado automáticamente.<br/>© 2026 Aethera — Tu Brújula Espiritual',
    features: [
      { emoji: '🔮', title: 'Oráculo IA', desc: 'Haz una pregunta, recibe una respuesta mística' },
      { emoji: '⭐', title: 'Horóscopo diario', desc: 'Predicciones personalizadas según tu signo' },
      { emoji: '🕯️', title: 'Rituales y Meditaciones', desc: '15+ rituales guiados por IA' },
      { emoji: '🌐', title: 'Comunidad de almas', desc: 'Conéctate con personas en el mismo camino' },
    ],
  },
  pt: {
    subject: (n) => `✦ Bem-vindo/a à Aethera, ${n}! A tua jornada espiritual começa`,
    tagline: 'A TUA BÚSSOLA ESPIRITUAL',
    newSoulJoined: 'Uma nova alma entrou',
    welcome: (n) => `Bem-vindo/a, ${n}! ✨`,
    yourZodiac: 'O teu signo do zodíaco',
    desc1: 'Fazes agora parte da <strong style="color:#A78BFA;">Aethera</strong> — um espaço onde a sabedoria ancestral encontra a tecnologia moderna. Descobre horóscopos, rituais, meditações e profecias criadas especialmente para ti.',
    desc2: 'A tua jornada está apenas a começar. As estrelas já te esperam. 🌙',
    whatAwaits: 'O que te espera',
    ctaLabel: 'Abrir Aethera ✦',
    footer: 'Este email foi gerado automaticamente.<br/>© 2026 Aethera — A Tua Bússola Espiritual',
    features: [
      { emoji: '🔮', title: 'Oráculo IA', desc: 'Faz uma pergunta, recebe uma resposta mística' },
      { emoji: '⭐', title: 'Horóscopo diário', desc: 'Previsões personalizadas com base no teu signo' },
      { emoji: '🕯️', title: 'Rituais e Meditações', desc: '15+ rituais guiados por IA' },
      { emoji: '🌐', title: 'Comunidade de almas', desc: 'Liga-te a pessoas no mesmo caminho' },
    ],
  },
  it: {
    subject: (n) => `✦ Benvenuto/a su Aethera, ${n}! Il tuo viaggio spirituale inizia`,
    tagline: 'LA TUA BUSSOLA SPIRITUALE',
    newSoulJoined: 'Una nuova anima si è unita',
    welcome: (n) => `Benvenuto/a, ${n}! ✨`,
    yourZodiac: 'Il tuo segno zodiacale',
    desc1: 'Ora fai parte di <strong style="color:#A78BFA;">Aethera</strong> — uno spazio dove l\'antica saggezza incontra la tecnologia moderna. Scopri oroscopi, rituali, meditazioni e divinazioni create appositamente per te.',
    desc2: 'Il tuo viaggio è appena iniziato. Le stelle ti stanno già aspettando. 🌙',
    whatAwaits: 'Cosa ti aspetta',
    ctaLabel: 'Apri Aethera ✦',
    footer: 'Questa email è stata generata automaticamente.<br/>© 2026 Aethera — La Tua Bussola Spirituale',
    features: [
      { emoji: '🔮', title: 'Oracolo IA', desc: 'Fai una domanda, ricevi una risposta mistica' },
      { emoji: '⭐', title: 'Oroscopo quotidiano', desc: 'Previsioni personalizzate in base al tuo segno' },
      { emoji: '🕯️', title: 'Rituali e Meditazioni', desc: '15+ rituali guidati dall\'IA' },
      { emoji: '🌐', title: 'Comunità delle anime', desc: 'Connettiti con persone sullo stesso cammino' },
    ],
  },
  ru: {
    subject: (n) => `✦ Добро пожаловать в Aethera, ${n}! Твоё духовное путешествие начинается`,
    tagline: 'ТВОЙ ДУХОВНЫЙ КОМПАС',
    newSoulJoined: 'Новая душа присоединилась',
    welcome: (n) => `Добро пожаловать, ${n}! ✨`,
    yourZodiac: 'Твой знак зодиака',
    desc1: 'Теперь ты часть <strong style="color:#A78BFA;">Aethera</strong> — пространства, где древняя мудрость встречается с современными технологиями. Открой гороскопы, ритуалы, медитации и предсказания, созданные специально для тебя.',
    desc2: 'Твоё путешествие только начинается. Звёзды уже ждут тебя. 🌙',
    whatAwaits: 'Что тебя ждёт',
    ctaLabel: 'Открыть Aethera ✦',
    footer: 'Это письмо было создано автоматически.<br/>© 2026 Aethera — Твой Духовный Компас',
    features: [
      { emoji: '🔮', title: 'ИИ-Оракул', desc: 'Задай вопрос, получи мистический ответ' },
      { emoji: '⭐', title: 'Ежедневный гороскоп', desc: 'Персонализированные предсказания по твоему знаку' },
      { emoji: '🕯️', title: 'Ритуалы и медитации', desc: '15+ ритуалов под руководством ИИ' },
      { emoji: '🌐', title: 'Сообщество душ', desc: 'Соединись с людьми на том же пути' },
    ],
  },
  ar: {
    subject: (n) => `✦ مرحباً بك في Aethera، ${n}! رحلتك الروحية تبدأ الآن`,
    tagline: 'بوصلتك الروحية',
    newSoulJoined: 'روح جديدة انضمت',
    welcome: (n) => `مرحباً، ${n}! ✨`,
    yourZodiac: 'برجك الفلكي',
    desc1: 'أنت الآن جزء من <strong style="color:#A78BFA;">Aethera</strong> — مساحة تلتقي فيها الحكمة القديمة مع التكنولوجيا الحديثة. اكتشف الأبراج والطقوس والتأملات والتنبؤات المصممة خصيصاً لك.',
    desc2: 'رحلتك بدأت للتو. النجوم تنتظرك بالفعل. 🌙',
    whatAwaits: 'ما ينتظرك',
    ctaLabel: 'افتح Aethera ✦',
    footer: 'تم إنشاء هذا البريد الإلكتروني تلقائياً.<br/>© 2026 Aethera — بوصلتك الروحية',
    features: [
      { emoji: '🔮', title: 'أوراكل الذكاء الاصطناعي', desc: 'اطرح سؤالاً، احصل على إجابة غامضة' },
      { emoji: '⭐', title: 'الأبراج اليومية', desc: 'تنبؤات مخصصة بناءً على برجك' },
      { emoji: '🕯️', title: 'الطقوس والتأملات', desc: 'أكثر من 15 طقساً بتوجيه الذكاء الاصطناعي' },
      { emoji: '🌐', title: 'مجتمع الأرواح', desc: 'تواصل مع أشخاص على نفس الطريق' },
    ],
  },
  ja: {
    subject: (n) => `✦ Aethera へようこそ、${n}！あなたのスピリチュアルな旅が始まります`,
    tagline: 'あなたのスピリチュアルコンパス',
    newSoulJoined: '新しい魂が加わりました',
    welcome: (n) => `ようこそ、${n}！✨`,
    yourZodiac: 'あなたの星座',
    desc1: 'あなたは今、<strong style="color:#A78BFA;">Aethera</strong> の一部です — 古代の知恵と現代技術が出会う空間。あなただけのために作られた星占い、儀式、瞑想、占いを発見してください。',
    desc2: 'あなたの旅はまだ始まったばかりです。星々がすでにあなたを待っています。🌙',
    whatAwaits: 'あなたを待つもの',
    ctaLabel: 'Aethera を開く ✦',
    footer: 'このメールは自動的に生成されました。<br/>© 2026 Aethera — あなたのスピリチュアルコンパス',
    features: [
      { emoji: '🔮', title: 'AIオラクル', desc: '質問して、神秘的な答えを受け取る' },
      { emoji: '⭐', title: '毎日の星占い', desc: 'あなたの星座に基づくパーソナライズされた予言' },
      { emoji: '🕯️', title: '儀式と瞑想', desc: 'AI誘導の15以上の儀式' },
      { emoji: '🌐', title: '魂のコミュニティ', desc: '同じ道を歩む人々とつながる' },
    ],
  },
};

// Fallback: angielski gdy brak tłumaczenia
function getStrings(lang: string): LangStrings {
  const code = lang?.split('-')[0]?.toLowerCase() ?? 'pl';
  return LANG_STRINGS[code] ?? LANG_STRINGS['en'];
}

// ─── Budowanie HTML emaila ────────────────────────────────────────────────────

function buildFeatureRow(emoji: string, title: string, desc: string): string {
  return `
  <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
    <tr>
      <td style="background:rgba(255,255,255,0.03);border:1px solid rgba(167,139,250,0.08);border-radius:12px;padding:12px 16px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:22px;padding-right:14px;vertical-align:middle;">${emoji}</td>
            <td style="vertical-align:middle;">
              <div style="color:#E2D9F3;font-size:14px;font-weight:600;">${title}</div>
              <div style="color:rgba(255,255,255,0.45);font-size:12px;margin-top:2px;">${desc}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function buildHtml(params: {
  displayName: string;
  zodiacSign: string;
  zodiacEmoji: string;
  lang: string;
}): string {
  const s = getStrings(params.lang);
  const isRTL = params.lang?.startsWith('ar');
  const dir = isRTL ? 'rtl' : 'ltr';

  return `<!DOCTYPE html>
<html lang="${params.lang}" dir="${dir}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${s.welcome(params.displayName)}</title>
</head>
<body style="margin:0;padding:0;background:#07071A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;direction:${dir};">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#07071A;min-height:100vh;">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding:0 0 32px;">
            <div style="display:inline-block;width:72px;height:72px;border-radius:36px;background:rgba(124,58,237,0.2);border:1.5px solid rgba(167,139,250,0.5);text-align:center;line-height:72px;font-size:32px;margin-bottom:16px;">✦</div>
            <div style="color:#fff;font-size:36px;font-weight:800;letter-spacing:4px;margin-top:8px;">AETHERA</div>
            <div style="color:rgba(196,181,253,0.6);font-size:12px;letter-spacing:1.5px;margin-top:6px;">${s.tagline}</div>
          </td>
        </tr>

        <!-- KARTA GŁÓWNA -->
        <tr>
          <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(167,139,250,0.15);border-radius:24px;padding:40px 36px;">

            <p style="margin:0 0 8px;color:rgba(196,181,253,0.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;">${s.newSoulJoined}</p>
            <h1 style="margin:0 0 24px;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;line-height:1.3;">${s.welcome(params.displayName)}</h1>

            <!-- Separator -->
            <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(167,139,250,0.4),transparent);margin:0 0 28px;"></div>

            <!-- ZODIAK -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
              <tr>
                <td style="background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.4);border-radius:14px;padding:16px 20px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:36px;padding-${isRTL ? 'left' : 'right'}:16px;vertical-align:middle;">${params.zodiacEmoji}</td>
                      <td style="vertical-align:middle;">
                        <div style="color:#C4B5FD;font-size:18px;font-weight:700;">${params.zodiacSign}</div>
                        <div style="color:rgba(196,181,253,0.55);font-size:12px;margin-top:3px;">${s.yourZodiac}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- OPIS -->
            <p style="color:rgba(255,255,255,0.75);font-size:15px;line-height:1.8;margin:0 0 20px;">${s.desc1}</p>
            <p style="color:rgba(255,255,255,0.75);font-size:15px;line-height:1.8;margin:0 0 32px;">${s.desc2}</p>

            <!-- FUNKCJE -->
            <p style="margin:0 0 14px;color:rgba(196,181,253,0.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;">${s.whatAwaits}</p>
            ${s.features.map(f => buildFeatureRow(f.emoji, f.title, f.desc)).join('')}

            <!-- CTA -->
            <div style="text-align:center;margin-top:36px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#6D28D9);border-radius:16px;padding:16px 40px;">
                <span style="color:#fff;font-size:15px;font-weight:700;letter-spacing:0.5px;">${s.ctaLabel}</span>
              </div>
            </div>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" style="padding:28px 0 0;">
            <p style="color:rgba(255,255,255,0.2);font-size:12px;line-height:1.7;margin:0;">${s.footer}</p>
            <p style="margin:12px 0 0;"><span style="color:rgba(196,181,253,0.4);font-size:18px;">✦ ✦ ✦</span></p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─── Publiczne API ────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'contact@aethera.pl';

function buildAdminHtml(params: {
  displayName: string;
  email: string;
  zodiacSign: string;
  zodiacEmoji: string;
  lang: string;
  source: 'app' | 'web';
  timestamp: string;
}): string {
  const sourceLabel = params.source === 'app' ? '📱 Aplikacja mobilna' : '🌐 Strona www';
  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><title>Nowe konto — Aethera</title></head>
<body style="margin:0;padding:0;background:#07071A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07071A;min-height:100vh;">
  <tr><td align="center" style="padding:40px 20px;">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <tr><td align="center" style="padding:0 0 24px;">
        <div style="font-size:32px;font-weight:800;letter-spacing:4px;color:#CEAE72;">AETHERA</div>
        <div style="color:rgba(196,181,253,0.6);font-size:11px;letter-spacing:2px;margin-top:6px;">RAPORT ADMINA — NOWE KONTO</div>
      </td></tr>
      <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(206,174,114,0.20);border-radius:20px;padding:32px 28px;">
        <p style="margin:0 0 6px;color:rgba(196,181,253,0.55);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Nowa dusza dołączyła do Aethery</p>
        <h2 style="margin:0 0 24px;color:#F5F1EA;font-size:22px;font-weight:700;">✦ ${esc(params.displayName)}</h2>
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;">
          ${row('📧', 'Email', esc(params.email))}
          ${row('👤', 'Imię', esc(params.displayName))}
          ${row(params.zodiacEmoji, 'Znak zodiaku', esc(params.zodiacSign))}
          ${row('🌍', 'Język', esc(params.lang.toUpperCase()))}
          ${row('📌', 'Źródło', sourceLabel)}
          ${row('🕐', 'Czas rejestracji', esc(params.timestamp))}
        </table>
      </td></tr>
      <tr><td align="center" style="padding:20px 0 0;">
        <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">Automatyczny raport Aethera · contact@aethera.pl</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function row(emoji: string, label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="width:28px;font-size:16px;vertical-align:middle;">${emoji}</td>
        <td style="padding-left:10px;vertical-align:middle;">
          <span style="color:rgba(196,181,253,0.55);font-size:12px;">${label}: </span>
          <span style="color:#F5F1EA;font-size:13px;font-weight:600;">${value}</span>
        </td>
      </tr></table>
    </td>
  </tr>`;
}

export const EmailService = {
  /**
   * Wysyła piękny, zlokalizowany email powitalny po rejestracji.
   * Nie rzuca wyjątku — ewentualne błędy są tylko logowane.
   *
   * @param lang - kod języka z useAppStore().language (np. 'pl', 'en', 'de')
   */
  async sendWelcome(params: {
    to: string;
    displayName: string;
    zodiacSign: string;
    zodiacEmoji: string;
    lang: string;
  }): Promise<void> {
    const s = getStrings(params.lang);
    const html = buildHtml(params);
    await post({
      from: FROM_ADDRESS,
      to: params.to,
      subject: s.subject(params.displayName),
      html,
    });
  },

  /**
   * Wysyła powiadomienie do admina o nowym koncie.
   * Wysyłane zarówno z aplikacji mobilnej jak i ze strony www.
   */
  async sendAdminNotification(params: {
    displayName: string;
    email: string;
    zodiacSign: string;
    zodiacEmoji: string;
    lang: string;
    source: 'app' | 'web';
  }): Promise<void> {
    const d = new Date();
    const timestamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} UTC`;
    const html = buildAdminHtml({ ...params, timestamp });
    await post({
      from: FROM_ADDRESS,
      to: ADMIN_EMAIL,
      subject: `✦ Nowe konto: ${params.displayName} (${params.zodiacSign}) — ${params.source === 'app' ? 'App' : 'Web'}`,
      html,
    });
  },
};
