// test-railway-vars.js
require('dotenv').config();

console.log('🔍 VARIABLES RAILWAY:');
const config = {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME,
    port: process.env.MYSQLPORT || process.env.DB_PORT
};

console.log('Host:', config.host);
console.log('Port:', config.port);
console.log('User:', config.user);
console.log('Database:', config.database);

if (!config.host) {
    console.log('❌ Aucun host défini! Vérifiez votre fichier .env');
}