const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database(path.join(__dirname, 'historico.db'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Criar tabela 'consultas' se não existir
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS consultas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    catetoOposto REAL,
    catetoAdjacente REAL,
    hipotenusa REAL,
    timestamp TEXT
  )
`;
db.run(createTableQuery, (err) => {
  if (err) {
    console.error('Erro ao criar tabela:', err.message);
  } else {
    console.log('Tabela "consultas" criada com sucesso.');
  }
});

// Rota para calcular a hipotenusa e salvar no banco de dados
app.post('/calcular', (req, res) => {
  const { catetoOposto, catetoAdjacente } = req.body;

  if (catetoOposto && catetoAdjacente) {
    const hipotenusa = Math.sqrt(Math.pow(catetoOposto, 2) + Math.pow(catetoAdjacente, 2));
    const timestamp = new Date().toISOString();

    const sql = 'INSERT INTO consultas (catetoOposto, catetoAdjacente, hipotenusa, timestamp) VALUES (?, ?, ?, ?)';
    db.run(sql, [catetoOposto, catetoAdjacente, hipotenusa, timestamp], (err) => {
      if (err) {
        console.error('Erro ao inserir consulta no banco de dados:', err.message);
        res.status(500).json({ message: 'Erro ao inserir consulta no banco de dados.' });
      } else {
        res.json({ hipotenusa });
      }
    });
  } else {
    res.status(400).json({ message: 'Parâmetros inválidos.' });
  }
});

// Rota para obter o histórico de consultas
app.get('/historico.db', (req, res) => {
  const sql = 'SELECT * FROM consultas ORDER BY timestamp DESC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Erro ao obter o histórico de consultas:', err.message);
      res.status(500).json({ message: 'Erro ao obter o histórico de consultas.' });
    } else {
      res.json(rows);
    }
  });
});
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
