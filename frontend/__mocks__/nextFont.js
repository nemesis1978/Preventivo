// __mocks__/nextFont.js

// Mock per next/font/google e altri loader di font
// Restituisce una funzione che a sua volta restituisce un oggetto con className e style
// per simulare il comportamento dei font di Next.js

module.exports = {
  // Esempio per Google Fonts, puoi adattarlo per altri loader se necessario
  Inter: () => ({
    className: 'mock-inter-font',
    style: { fontFamily: 'mock-inter' },
  }),
  Roboto: () => ({
    className: 'mock-roboto-font',
    style: { fontFamily: 'mock-roboto' },
  }),
  // Aggiungi qui altri font che usi nel progetto
  // Se usi un loader generico, potresti dover mockare quello specifico
  // Ad esempio, se usi localFont:
  // localFont: () => (src) => ({
  //   className: `mock-local-font-${src.map(s => s.path).join('-')}`,
  //   style: { fontFamily: `mock-local-${src.map(s => s.path).join('-')}` },
  // }),
  // Fornire un mock generico se non si conoscono i nomi specifici dei font
  default: () => ({
    className: 'mock-default-font',
    style: { fontFamily: 'mock-default' },
  }),
};