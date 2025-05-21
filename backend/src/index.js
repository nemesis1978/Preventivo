const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Importa le rotte per i consigli
const tipsRoutes = require('./routes/tipsRoutes');

// Utilizza le rotte per i consigli sotto il prefisso /api/tips
app.use('/api/tips', tipsRoutes);

app.get('/', (req, res) => {
  res.send('Backend del Preventivo Attivo!');
});

// TODO: Aggiungere altre rotte se necessario

app.listen(port, () => {
  console.log(`Server backend in ascolto sulla porta ${port}`);
});