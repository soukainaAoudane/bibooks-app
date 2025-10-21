require('dotenv').config();
const mysql = require('mysql2');

console.log('🚀 TEST APRÈS DÉPLOIEMENT RÉUSSI');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectTimeout: 10000
});

console.log('🔄 Tentative de connexion...');

connection.connect(err => {
    if (err) {
        console.log('❌ ERREUR:', err.message);
        console.log('CODE:', err.code);
    } else {
        console.log('🎉 SUCCÈS! Connecté à MySQL!');
        console.log('✅ Votre application va fonctionner!');
        
        // Test d'une requête
        connection.query('SELECT 1 as test', (err, results) => {
            if (err) {
                console.log('❌ Erreur requête:', err.message);
            } else {
                console.log('✅ Requête test réussie:', results);
            }
            connection.end();
        });
    }
});