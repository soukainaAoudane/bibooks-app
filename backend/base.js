const mysql = require('mysql2');
const path = require('path');

// Charger le .env explicitement
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Variables DB:', {
    host: process.env.HOST,
    user: process.env.USER,
    database: process.env.DATABASE,
    port: process.env.PORT
});

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connecté à la base de données MySQL');
    }
});

module.exports = db;