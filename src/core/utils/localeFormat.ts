import i18n from '../i18n';

export const isEnglishLocale = () => i18n.language?.startsWith('en');

const LOCALE_MAP: Record<string, string> = {
  pl: 'pl-PL', en: 'en-US', de: 'de-DE', es: 'es-ES',
  fr: 'fr-FR', it: 'it-IT', pt: 'pt-PT', ru: 'ru-RU',
  ar: 'ar-SA', ja: 'ja-JP', zh: 'zh-CN',
};

export const getLocaleCode = () => {
  const lang = i18n.language?.slice(0, 2) || 'pl';
  return LOCALE_MAP[lang] || 'pl-PL';
};

export const formatLocaleDate = (value: string | number | Date) =>
  new Date(value).toLocaleDateString(getLocaleCode());

// Hermes-safe number formatter — toLocaleString(locale) crashes on Hermes
export const formatLocaleNumber = (value: number): string => {
  const n = Math.floor(Number(value));
  if (isNaN(n)) return '0';
  const lang = i18n.language?.slice(0, 2) || 'pl';
  const sep = lang === 'en' ? ',' : '\u00A0';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
};

// ─── Hermes-safe date formatters ───────────────────────────────────────────────
// Android Hermes crashes on toLocaleDateString(locale, options) — use these instead.

const _ML: Record<string, string[]> = {
  pl: ['Stycznia','Lutego','Marca','Kwietnia','Maja','Czerwca','Lipca','Sierpnia','Września','Października','Listopada','Grudnia'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  fr: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  it: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  pt: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  ru: ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'],
  ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  ja: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  zh: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
};
const _MS: Record<string, string[]> = {
  pl: ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'],
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  de: ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],
  es: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  fr: ['Jan','Fév','Mar','Avr','Mai','Juin','Jul','Aoû','Sep','Oct','Nov','Déc'],
  it: ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
  pt: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  ru: ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'],
  ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  ja: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  zh: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
};
const _MN: Record<string, string[]> = {
  pl: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  fr: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  it: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  pt: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  ru: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  ja: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  zh: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
};
const _DL: Record<string, string[]> = {
  pl: ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'],
  en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  de: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
  es: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  fr: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  it: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'],
  pt: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  ru: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
  ar: ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],
  ja: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
  zh: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
};

const _lang = () => i18n.language?.slice(0, 2) || 'pl';
const _dt = (d: Date | string | number): Date => d instanceof Date ? d : new Date(d);
const _p2 = (n: number) => String(n).padStart(2, '0');

/** DD.MM.YYYY */
export const fmtDateNumeric = (d: Date | string | number): string => {
  const dt = _dt(d); return `${_p2(dt.getDate())}.${_p2(dt.getMonth()+1)}.${dt.getFullYear()}`;
};
/** "15 Kwietnia" */
export const fmtDateMedium = (d: Date | string | number): string => {
  const dt = _dt(d); const l = _lang(); return `${dt.getDate()} ${(_ML[l] ?? _ML.pl)[dt.getMonth()]}`;
};
/** "15 Kwi" */
export const fmtDateShort = (d: Date | string | number): string => {
  const dt = _dt(d); const l = _lang(); return `${dt.getDate()} ${(_MS[l] ?? _MS.pl)[dt.getMonth()]}`;
};
/** "15 Kwietnia 2026" */
export const fmtDateFull = (d: Date | string | number): string => {
  const dt = _dt(d); const l = _lang(); return `${dt.getDate()} ${(_ML[l] ?? _ML.pl)[dt.getMonth()]} ${dt.getFullYear()}`;
};
/** "Środa, 15 Kwietnia" */
export const fmtDateWeekday = (d: Date | string | number): string => {
  const dt = _dt(d); const l = _lang();
  return `${(_DL[l] ?? _DL.pl)[dt.getDay()]}, ${dt.getDate()} ${(_ML[l] ?? _ML.pl)[dt.getMonth()]}`;
};
/** "Śr 15 Kwi" */
export const fmtDateWeekdayShort = (d: Date | string | number): string => {
  const dt = _dt(d); const l = _lang();
  const ds = (_DL[l] ?? _DL.pl)[dt.getDay()].slice(0, 2);
  return `${ds} ${dt.getDate()} ${(_MS[l] ?? _MS.pl)[dt.getMonth()]}`;
};
/** "Środa" */
export const fmtWeekday = (d: Date | string | number): string => {
  const dt = _dt(d); const l = _lang(); return (_DL[l] ?? _DL.pl)[dt.getDay()];
};
/** "Kwiecień 2026" */
export const fmtMonthYear = (d: Date | string | number): string => {
  const dt = _dt(d); const l = _lang(); return `${(_MN[l] ?? _MN.pl)[dt.getMonth()]} ${dt.getFullYear()}`;
};
/** "Kwiecień" */
export const fmtMonthName = (d: Date | string | number): string => {
  const dt = _dt(d); const l = _lang(); return (_MN[l] ?? _MN.pl)[dt.getMonth()];
};
/** "14:35" */
export const fmtTime = (d: Date | string | number): string => {
  const dt = _dt(d); return `${_p2(dt.getHours())}:${_p2(dt.getMinutes())}`;
};
