const express = require('express');
const path = require('path');
const Routes = require('./routes/routes')
require('dotenv').config();

const app = express();
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET || 'clan-secret',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'assets')));

app.use('/', Routes);

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
