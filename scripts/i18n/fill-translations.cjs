// fill-translations.cjs
// Adds missing screenErrorTitle/screenErrorBody + auth section to all language files
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../../src/core/i18n');

const AUTH = {
  pl: {
    loginTitle: 'Zaloguj się', subtitle: 'Zaloguj się do swojej duszy',
    email: 'Email', password: 'Hasło', loginButton: 'Wejdź ✦',
    noAccount: 'Nie masz konta?', register: 'Zarejestruj się',
    hasAccount: 'Masz konto?', login: 'Zaloguj się',
    step1: 'Krok 1/2 — Dane konta', step2: 'Krok 2/2 — Twój profil',
    displayName: 'Twoje imię', zodiacSign: 'Znak zodiaku',
    archetype: 'Archetyp duszy', symbol: 'Twój symbol',
    registerButton: 'Stwórz konto ✦', nextStep: 'Dalej →', backStep: '← Wróć',
    errorInvalidCredential: 'Nieprawidłowy email lub hasło.',
    errorEmailInUse: 'Ten email jest już zajęty.',
    errorWeakPassword: 'Hasło musi mieć co najmniej 6 znaków.',
    errorConnection: 'Nie udało się zalogować. Sprawdź połączenie.',
  },
  en: {
    loginTitle: 'Sign In', subtitle: 'Sign in to your soul',
    email: 'Email', password: 'Password', loginButton: 'Enter ✦',
    noAccount: "Don't have an account?", register: 'Sign Up',
    hasAccount: 'Already have an account?', login: 'Sign In',
    step1: 'Step 1/2 — Account Details', step2: 'Step 2/2 — Your Profile',
    displayName: 'Your name', zodiacSign: 'Zodiac sign',
    archetype: 'Soul archetype', symbol: 'Your symbol',
    registerButton: 'Create account ✦', nextStep: 'Next →', backStep: '← Back',
    errorInvalidCredential: 'Invalid email or password.',
    errorEmailInUse: 'This email is already in use.',
    errorWeakPassword: 'Password must be at least 6 characters.',
    errorConnection: 'Could not sign in. Check your connection.',
  },
  de: {
    loginTitle: 'Anmelden', subtitle: 'Melde dich bei deiner Seele an',
    email: 'E-Mail', password: 'Passwort', loginButton: 'Eintreten ✦',
    noAccount: 'Kein Konto?', register: 'Registrieren',
    hasAccount: 'Bereits ein Konto?', login: 'Anmelden',
    step1: 'Schritt 1/2 — Kontodaten', step2: 'Schritt 2/2 — Dein Profil',
    displayName: 'Dein Name', zodiacSign: 'Sternzeichen',
    archetype: 'Seelen-Archetyp', symbol: 'Dein Symbol',
    registerButton: 'Konto erstellen ✦', nextStep: 'Weiter →', backStep: '← Zurück',
    errorInvalidCredential: 'Ungültige E-Mail oder Passwort.',
    errorEmailInUse: 'Diese E-Mail-Adresse wird bereits verwendet.',
    errorWeakPassword: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    errorConnection: 'Anmeldung fehlgeschlagen. Überprüfe deine Verbindung.',
    screenErrorTitle: 'BILDSCHIRMFEHLER',
    screenErrorBody: 'Dieser Bildschirm hatte ein Problem.\nGeh zurück und versuche es erneut.',
  },
  es: {
    loginTitle: 'Iniciar sesión', subtitle: 'Entra en tu alma',
    email: 'Correo electrónico', password: 'Contraseña', loginButton: 'Entrar ✦',
    noAccount: '¿No tienes cuenta?', register: 'Regístrate',
    hasAccount: '¿Ya tienes cuenta?', login: 'Iniciar sesión',
    step1: 'Paso 1/2 — Datos de la cuenta', step2: 'Paso 2/2 — Tu perfil',
    displayName: 'Tu nombre', zodiacSign: 'Signo del zodiaco',
    archetype: 'Arquetipo del alma', symbol: 'Tu símbolo',
    registerButton: 'Crear cuenta ✦', nextStep: 'Siguiente →', backStep: '← Volver',
    errorInvalidCredential: 'Email o contraseña incorrectos.',
    errorEmailInUse: 'Este email ya está en uso.',
    errorWeakPassword: 'La contraseña debe tener al menos 6 caracteres.',
    errorConnection: 'No se pudo iniciar sesión. Verifica tu conexión.',
    screenErrorTitle: 'ERROR DE PANTALLA',
    screenErrorBody: 'Esta pantalla encontró un problema.\nVuelve e inténtalo de nuevo.',
  },
  fr: {
    loginTitle: 'Connexion', subtitle: 'Connecte-toi à ton âme',
    email: 'Email', password: 'Mot de passe', loginButton: 'Entrer ✦',
    noAccount: 'Pas de compte ?', register: "S'inscrire",
    hasAccount: 'Déjà un compte ?', login: 'Connexion',
    step1: 'Étape 1/2 — Données du compte', step2: 'Étape 2/2 — Ton profil',
    displayName: 'Ton prénom', zodiacSign: 'Signe du zodiaque',
    archetype: "Archétype de l'âme", symbol: 'Ton symbole',
    registerButton: 'Créer un compte ✦', nextStep: 'Suivant →', backStep: '← Retour',
    errorInvalidCredential: 'Email ou mot de passe incorrect.',
    errorEmailInUse: 'Cet email est déjà utilisé.',
    errorWeakPassword: 'Le mot de passe doit comporter au moins 6 caractères.',
    errorConnection: 'Connexion impossible. Vérifie ta connexion.',
    screenErrorTitle: "ERREUR D'ÉCRAN",
    screenErrorBody: 'Cet écran a rencontré un problème.\nReviens en arrière et réessaie.',
  },
  it: {
    loginTitle: 'Accedi', subtitle: 'Accedi alla tua anima',
    email: 'Email', password: 'Password', loginButton: 'Entra ✦',
    noAccount: 'Non hai un account?', register: 'Registrati',
    hasAccount: 'Hai già un account?', login: 'Accedi',
    step1: 'Passo 1/2 — Dati dell\'account', step2: 'Passo 2/2 — Il tuo profilo',
    displayName: 'Il tuo nome', zodiacSign: 'Segno zodiacale',
    archetype: "Archetipo dell'anima", symbol: 'Il tuo simbolo',
    registerButton: 'Crea account ✦', nextStep: 'Avanti →', backStep: '← Indietro',
    errorInvalidCredential: 'Email o password non validi.',
    errorEmailInUse: 'Questa email è già in uso.',
    errorWeakPassword: 'La password deve contenere almeno 6 caratteri.',
    errorConnection: 'Accesso non riuscito. Controlla la tua connessione.',
    screenErrorTitle: 'ERRORE SCHERMATA',
    screenErrorBody: 'Questa schermata ha riscontrato un problema.\nTorna indietro e riprova.',
  },
  pt: {
    loginTitle: 'Entrar', subtitle: 'Entre na sua alma',
    email: 'Email', password: 'Senha', loginButton: 'Entrar ✦',
    noAccount: 'Não tem conta?', register: 'Cadastre-se',
    hasAccount: 'Já tem uma conta?', login: 'Entrar',
    step1: 'Passo 1/2 — Dados da conta', step2: 'Passo 2/2 — Seu perfil',
    displayName: 'Seu nome', zodiacSign: 'Signo do zodíaco',
    archetype: 'Arquétipo da alma', symbol: 'Seu símbolo',
    registerButton: 'Criar conta ✦', nextStep: 'Próximo →', backStep: '← Voltar',
    errorInvalidCredential: 'Email ou senha inválidos.',
    errorEmailInUse: 'Este email já está em uso.',
    errorWeakPassword: 'A senha deve ter pelo menos 6 caracteres.',
    errorConnection: 'Não foi possível entrar. Verifique sua conexão.',
    screenErrorTitle: 'ERRO DE TELA',
    screenErrorBody: 'Esta tela encontrou um problema.\nVolte e tente novamente.',
  },
  ru: {
    loginTitle: 'Войти', subtitle: 'Войдите в свою душу',
    email: 'Email', password: 'Пароль', loginButton: 'Войти ✦',
    noAccount: 'Нет аккаунта?', register: 'Зарегистрироваться',
    hasAccount: 'Уже есть аккаунт?', login: 'Войти',
    step1: 'Шаг 1/2 — Данные аккаунта', step2: 'Шаг 2/2 — Ваш профиль',
    displayName: 'Ваше имя', zodiacSign: 'Знак зодиака',
    archetype: 'Архетип души', symbol: 'Ваш символ',
    registerButton: 'Создать аккаунт ✦', nextStep: 'Далее →', backStep: '← Назад',
    errorInvalidCredential: 'Неверный email или пароль.',
    errorEmailInUse: 'Этот email уже используется.',
    errorWeakPassword: 'Пароль должен содержать не менее 6 символов.',
    errorConnection: 'Не удалось войти. Проверьте подключение.',
    screenErrorTitle: 'ОШИБКА ЭКРАНА',
    screenErrorBody: 'Этот экран столкнулся с проблемой.\nВернитесь и попробуйте снова.',
  },
  ar: {
    loginTitle: 'تسجيل الدخول', subtitle: 'ادخل إلى روحك',
    email: 'البريد الإلكتروني', password: 'كلمة المرور', loginButton: 'ادخل ✦',
    noAccount: 'ليس لديك حساب؟', register: 'إنشاء حساب',
    hasAccount: 'لديك حساب بالفعل؟', login: 'تسجيل الدخول',
    step1: 'الخطوة 1/2 — بيانات الحساب', step2: 'الخطوة 2/2 — ملفك الشخصي',
    displayName: 'اسمك', zodiacSign: 'برج الزودياك',
    archetype: 'نمط الروح', symbol: 'رمزك',
    registerButton: 'إنشاء حساب ✦', nextStep: 'التالي →', backStep: '← رجوع',
    errorInvalidCredential: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    errorEmailInUse: 'هذا البريد الإلكتروني مستخدم بالفعل.',
    errorWeakPassword: 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.',
    errorConnection: 'تعذر تسجيل الدخول. تحقق من اتصالك.',
    screenErrorTitle: 'خطأ في الشاشة',
    screenErrorBody: 'واجهت هذه الشاشة مشكلة.\nارجع وحاول مرة أخرى.',
  },
  ja: {
    loginTitle: 'ログイン', subtitle: 'あなたの魂へログイン',
    email: 'メールアドレス', password: 'パスワード', loginButton: '入る ✦',
    noAccount: 'アカウントをお持ちでない方', register: '登録',
    hasAccount: 'すでにアカウントをお持ちですか？', login: 'ログイン',
    step1: 'ステップ 1/2 — アカウント情報', step2: 'ステップ 2/2 — プロフィール',
    displayName: 'あなたの名前', zodiacSign: '星座',
    archetype: '魂のアーキタイプ', symbol: 'あなたのシンボル',
    registerButton: 'アカウントを作成 ✦', nextStep: '次へ →', backStep: '← 戻る',
    errorInvalidCredential: 'メールアドレスまたはパスワードが無効です。',
    errorEmailInUse: 'このメールアドレスはすでに使用されています。',
    errorWeakPassword: 'パスワードは6文字以上である必要があります。',
    errorConnection: 'ログインできませんでした。接続を確認してください。',
    screenErrorTitle: '画面エラー',
    screenErrorBody: 'この画面で問題が発生しました。\n戻って再試行してください。',
  },
};

const LANGS = ['pl','en','de','es','fr','it','pt','ru','ar','ja'];

for (const lang of LANGS) {
  const filePath = path.join(DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const extra = AUTH[lang];

  // 1. Add screenErrorTitle / screenErrorBody to common if missing
  if (!data.common.screenErrorTitle && extra.screenErrorTitle) {
    data.common.screenErrorTitle = extra.screenErrorTitle;
  }
  if (!data.common.screenErrorBody && extra.screenErrorBody) {
    data.common.screenErrorBody = extra.screenErrorBody;
  }

  // 2. Add localeCode to common if missing
  if (!data.common.localeCode) {
    const locales = { pl:'pl-PL', en:'en-US', de:'de-DE', es:'es-ES', fr:'fr-FR', it:'it-IT', pt:'pt-BR', ru:'ru-RU', ar:'ar-SA', ja:'ja-JP' };
    data.common.localeCode = locales[lang];
  }

  // 3. Add auth section
  if (!data.auth) {
    const { screenErrorTitle, screenErrorBody, ...authData } = extra;
    data.auth = authData;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ ${lang}.json updated`);
}

console.log('\nDone. All language files updated.');
