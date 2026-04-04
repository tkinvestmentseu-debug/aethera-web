/**
 * Unikalne insighty AI dla poszczególnych światów.
 * Każdy świat ma własny ton, pytania i mikropraktyki.
 */

export type WorldId =
  | 'ty'
  | 'tarot'
  | 'horoscope'
  | 'astrology'
  | 'rituals'
  | 'cleansing'
  | 'support'
  | 'oracle'
  | 'dreams';

export interface WorldInsight {
  curiosity: string;
  reflection: string;
  microTip: string;
  todayQuestion: string;
  todayAction: string;
}

const WORLD_INSIGHTS: Record<WorldId, WorldInsight[]> = {
  ty: [
    {
      curiosity:
        'Twoja Liczba Drogi Życia jest mapą potencjału, nie wyrokiem. Pokazuje predyspozycje, ale nie odbiera Ci wolnej woli.',
      reflection: 'Co w Twoim sposobie bycia najczęściej zaskakuje innych, choć dla Ciebie jest naturalne?',
      microTip: 'Zapisz jeden wzorzec, który wraca w Twoim życiu od lat i nadal prosi o uwagę.',
      todayQuestion: 'Czego dziś unikasz, choć właśnie to mogłoby przywrócić Ci sprawczość?',
      todayAction: 'Napisz trzy zdania o tym, co naprawdę czujesz w tej chwili, bez filtrowania i bez ocen.',
    },
    {
      curiosity:
        'Matryca przeznaczenia pokazuje nie tylko Twoje mocne strony, ale też obszary cienia, które czekają na integrację i dojrzałą obecność.',
      reflection: 'Kiedy ostatnio czułeś lub czułaś się całkowicie sobą, bez potrzeby dopasowywania się?',
      microTip: 'Sprawdź, jaka energia towarzyszy Ci w tym miesiącu i czy współgra z tym, co przeżywasz.',
      todayQuestion: 'Co daje Ci dziś poczucie gruntu pod nogami i stabilności w ciele?',
      todayAction: 'Otwórz dziennik i zapisz jedno słowo, które najtrafniej opisuje jakość dzisiejszego dnia.',
    },
  ],
  tarot: [
    {
      curiosity:
        'Tarot nie musi przepowiadać przyszłości. Najczęściej odsłania energię, która już działa w Tobie i wokół Ciebie.',
      reflection: 'Jaka karta najczęściej wraca do Ciebie w odczytach i co mówi o obecnym etapie?',
      microTip: 'Przed wyborem karty zrób trzy głębokie oddechy i nazwij jedno uczucie, które jest teraz najbliżej powierzchni.',
      todayQuestion: 'Gdyby dzisiejszy dzień miał własną kartę, jaką energię by niosła?',
      todayAction: 'Wybierz jedną kartę i zapisz pierwsze skojarzenie, zanim uruchomisz interpretację.',
    },
    {
      curiosity:
        'Nie trzeba wierzyć w tarot bezwarunkowo. Wystarczy ciekawość wobec symboli, które porządkują to, co już przeczuwasz.',
      reflection: 'Jaka energia dominuje w Twoich ostatnich odczytach: domknięcie, decyzja, relacja czy regeneracja?',
      microTip: 'Rozkłady wielokartowe najlepiej działają wtedy, gdy pytanie dotyczy relacji, kierunku lub dylematu.',
      todayQuestion: 'Jakiej odpowiedzi szukasz dziś w symbolu, a nie w logice?',
      todayAction: 'Zadaj talii jedno krótkie pytanie i zapisz odpowiedź dokładnie tak, jak ją poczujesz.',
    },
  ],
  horoscope: [
    {
      curiosity:
        'Nie tylko znak Słońca buduje Twój wewnętrzny pejzaż. Księżyc i Wenus często trafniej opisują emocje, potrzeby i styl relacji.',
      reflection: 'Jak astrologia pomaga Ci rozumieć własne reakcje zamiast je oceniać?',
      microTip: 'Znak Księżyca zwykle lepiej tłumaczy emocjonalne odruchy niż znak Słońca.',
      todayQuestion: 'Co planety próbują Ci dziś podpowiedzieć o kierunku, w którym dojrzewasz?',
      todayAction: 'Przeczytaj horoskop dnia i wybierz jedno zdanie, które naprawdę rezonuje z Twoim stanem.',
    },
  ],
  astrology: [
    {
      curiosity:
        'Retrogradacja Merkurego sprzyja przeglądowi, korekcie i powrotom. To rzadko czas na impulsywne nowe początki.',
      reflection: 'Która planeta najmocniej rezonuje z Twoim aktualnym doświadczeniem i dlaczego właśnie ona?',
      microTip: 'Pełnia domyka proces, a nów otwiera przestrzeń na intencję i kierunek.',
      todayQuestion: 'Co w nieboskłonie odbija dziś to, czego doświadczasz w środku?',
      todayAction: 'Sprawdź fazę Księżyca i dopasuj do niej jedną krótką, precyzyjną intencję na dzisiejszy dzień.',
    },
  ],
  rituals: [
    {
      curiosity:
        'Rytuał działa przez powtarzalność i obecność. To nie jednorazowa intensywność, lecz konsekwentne wzmacnianie intencji.',
      reflection: 'Który rytuał najbardziej zmienił Twój sposób patrzenia na siebie lub codzienność?',
      microTip: 'Pięć minut codziennej praktyki często daje więcej niż godzina raz w tygodniu.',
      todayQuestion: 'Co chcesz dziś potwierdzić, domknąć albo uwolnić w swoim rytuale?',
      todayAction: 'Wybierz jeden element rytuału i wykonaj go teraz, nawet jeśli warunki nie są idealne.',
    },
  ],
  cleansing: [
    {
      curiosity:
        'Oczyszczanie energetyczne można traktować jak higienę wewnętrzną. Tak jak dbasz o ciało, możesz dbać o stan swojego pola.',
      reflection: 'Co w ostatnich dniach realnie Cię zasila, a co systematycznie odbiera spokój?',
      microTip: 'Granica nie jest murem. To świadomy filtr, który decyduje, co dopuszczasz bliżej siebie.',
      todayQuestion: 'Co chcesz dziś odpuścić, rozluźnić albo przestać nieść dalej?',
      todayAction: 'Weź trzy głębokie oddechy i z każdym wydechem nazwij jedno napięcie, które może już odejść.',
    },
  ],
  support: [
    {
      curiosity:
        'Afirmacje działają najmocniej wtedy, gdy są prawdziwe i Twoje. Nie wtedy, gdy brzmią jak lista cudzych życzeń.',
      reflection: 'Jakie zdanie najczęściej powtarzasz sobie w trudnych chwilach i czy Cię wspiera?',
      microTip: 'Najsilniejsza afirmacja często budzi lekki opór, bo dotyka miejsca, które naprawdę chce się zmienić.',
      todayQuestion: 'Czego najbardziej potrzebujesz dziś usłyszeć od siebie, a nie od świata?',
      todayAction: 'Wybierz jedną afirmację i powtórz ją trzy razy bardzo powoli, obserwując reakcję ciała.',
    },
  ],
  oracle: [
    {
      curiosity:
        'AI Oracle prowadzi najgłębiej wtedy, gdy pytanie dojrzewało w Tobie od dłuższego czasu i dotyczy czegoś naprawdę żywego.',
      reflection: 'Jakie pytanie wraca do Ciebie najczęściej, choć jeszcze nie ma pełnej odpowiedzi?',
      microTip: 'Krótkie, konkretne pytania zwykle otwierają bardziej precyzyjne odpowiedzi niż szerokie ogólniki.',
      todayQuestion: 'Co chcesz dziś zrozumieć, nawet jeśli nie jesteś jeszcze gotowy lub gotowa tego rozwiązać?',
      todayAction: 'Zapisz jedno pytanie do Oracle, które od dawna czeka na swoją właściwą chwilę.',
    },
  ],
  dreams: [
    {
      curiosity:
        'Sny są językiem podświadomości. Nie trzeba ich traktować dosłownie, żeby usłyszeć, co próbują poruszyć.',
      reflection: 'Jaki symbol powraca w Twoich snach od lat i jak zmienia się jego znaczenie?',
      microTip: 'Zapisz sen zaraz po przebudzeniu. Po kilku minutach z pamięci zostaje zwykle tylko fragment atmosfery.',
      todayQuestion: 'Co nocne obrazy próbują powiedzieć o tym, co przeżywasz na jawie?',
      todayAction: 'Zapisz jeden obraz ze snu i zapytaj siebie: co ten symbol oznacza dla mnie właśnie teraz?',
    },
  ],
};

export const getWorldInsight = (worldId: WorldId): WorldInsight => {
  const insights = WORLD_INSIGHTS[worldId] || WORLD_INSIGHTS.ty;
  const dayIndex = new Date().getDate() % insights.length;
  return insights[dayIndex];
};
