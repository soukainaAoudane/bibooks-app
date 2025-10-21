const mysql = require('mysql2');
const path = require('path');

// Charger le .env explicitement
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Variables DB:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: true } // souvent nécessaire pour Railway
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connecté à la base de données MySQL via Railway');
    }
});

module.exports = db;
