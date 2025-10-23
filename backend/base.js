const mysql = require('mysql2');
const path = require('path');

// Charger le .env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Variables DB:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// REMPLACER createConnection par createPool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
});

// Test de connexion
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erreur de connexion à la base de données:', err);
    } else {
        console.log('✅ Connecté à la base de données MySQL avec POOL');
        connection.release(); // Important : libérer la connexion
    }
});

// Exporter le POOL au lieu de la connexion
module.exports = pool;