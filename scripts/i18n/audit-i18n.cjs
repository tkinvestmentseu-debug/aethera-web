const path = require('path');
const {
  REPORTS_DIR,
  getSourceFiles,
  extractStringLiterals,
  loadLanguageBase,
  loadGlossary,
  loadTranslationMemory,
  normalizeText,
  writeJson,
  hasPolishResidue,
} = require('./shared.cjs');

const languageBase = loadLanguageBase();
const glossary = loadGlossary();
const translationMemory = loadTranslationMemory();

const glossaryTerms = Object.values(glossary.terms || {}).flatMap((term) => Object.values(term.translations || {}));
const memoryStrings = new Set(
  Object.values(translationMemory.entries || {})
    .flatMap((entry) => Object.values(entry || {}))
    .filter((value) => typeof value === 'string')
    .map((value) => normalizeText(value))
);

const report = {
  generatedAt: new Date().toISOString(),
  filesScanned: 0,
  suspiciousFiles: [],
  untranslatedLiteralCount: 0,
  polishResidueCount: 0,
  summary: [],
};

getSourceFiles().forEach((filePath) => {
  const source = require('fs').readFileSync(filePath, 'utf8');
  const literals = extractStringLiterals(source);
  const suspicious = [];
  literals.forEach((literal) => {
    const normalized = normalizeText(literal);
    if (!normalized || normalized.length < 3) return;
    if (memoryStrings.has(normalized)) return;
    if (glossaryTerms.includes(normalized)) return;
    if (hasPolishResidue(normalized, languageBase)) {
      suspicious.push(normalized);
      report.polishResidueCount += 1;
    }
  });

  report.filesScanned += 1;
  if (suspicious.length) {
    report.untranslatedLiteralCount += suspicious.length;
    report.suspiciousFiles.push({
      file: path.relative(process.cwd(), filePath),
      count: suspicious.length,
      samples: suspicious.slice(0, 25),
    });
  }
});

report.summary = [
  `files_scanned=${report.filesScanned}`,
  `suspicious_files=${report.suspiciousFiles.length}`,
  `untranslated_literals=${report.untranslatedLiteralCount}`,
  `polish_residue=${report.polishResidueCount}`,
];

const outputPath = path.join(REPORTS_DIR, 'i18n-audit.json');
writeJson(outputPath, report);
console.log(report.summary.join('\n'));
console.log(`report=${outputPath}`);
