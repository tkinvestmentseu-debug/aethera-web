export const buildElegantShareMessage = (title: string, body: string, footer?: string) => {
  return [
    'Aethera DuniAI & Oracle',
    '',
    title,
    '',
    body.trim(),
    footer ? `\n${footer.trim()}` : '',
  ].join('\n');
};

export const buildAffirmationShareMessage = (affirmation: string, rationale?: string) => {
  return buildElegantShareMessage(
    'Dzisiejsza afirmacja',
    `„${affirmation.trim()}”`,
    rationale ? `${rationale}\n\nZatrzymaj to zdanie na dziś jako jedno spokojne zakotwiczenie.` : 'Zatrzymaj to zdanie na dziś jako jedno spokojne zakotwiczenie.'
  );
};

export const buildCompatibilityShareMessage = (partnerName: string, summary: string, details: string[]) => {
  return buildElegantShareMessage(
    `Zgodność energetyczna: ${partnerName}`,
    [summary, ...details].join('\n\n'),
    'To nie jest wyrok o relacji, tylko mapa tego, jak rozmawiać, kochać i pracować z napięciem bardziej świadomie.'
  );
};

export const buildTarotShareMessage = (spreadName: string, question: string | undefined, interpretation: string) => {
  return buildElegantShareMessage(
    `Odczyt tarota • ${spreadName}`,
    `${question ? `Pytanie:\n„${question.trim()}”\n\n` : ''}${interpretation.trim()}`,
    'Udostępnione z prywatnego rytuału Aethera DuniAI & Oracle.'
  );
};

export const buildNumerologyShareMessage = (title: string, summary: string, details: string[]) => {
  return buildElegantShareMessage(
    `Numerologia • ${title}`,
    [summary, ...details].join('\n\n'),
    'To jest mapa wzorców i kierunku, nie sztywny werdykt o Twoim życiu.'
  );
};

export const buildMatrixShareMessage = (summary: string, details: string[]) => {
  return buildElegantShareMessage(
    'Matryca przeznaczenia',
    [summary, ...details].join('\n\n'),
    'Udostępnione z osobistej mapy Aethera DuniAI & Oracle.'
  );
};

export const buildCleansingShareMessage = (focus: string, ritualTitle: string, guidance: string) => {
  return buildElegantShareMessage(
    `Oczyszczanie • ${focus}`,
    `${ritualTitle}\n\n${guidance}`,
    'Nie chodzi o dramat. Chodzi o odzyskanie granic, oddechu i przejrzystości.'
  );
};
