// __mocks__/nextScript.js

// Mock per il componente next/script
// Restituisce un componente React fittizio che non fa nulla
// per evitare errori durante i test.

const React = require('react');

const NextScriptMock = React.forwardRef((props, ref) => {
  // Puoi aggiungere logica qui se necessario per test specifici
  // ad esempio, per verificare gli props passati a Script
  // console.log('NextScriptMock props:', props);
  return React.createElement('script', { ...props, ref });
});

NextScriptMock.displayName = 'NextScriptMock';

module.exports = NextScriptMock;