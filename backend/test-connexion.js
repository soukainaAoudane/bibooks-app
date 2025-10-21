const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('🚀 TEST DE CONNEXION AVEC LES BONNES VARIABLES');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);

const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectTimeout: 15000
});

console.log('🔄 Connexion en cours...');

connection.connect(err => {
    if (err) {
        console.log('❌ ERREUR:', err.message);
        console.log('Code:', err.code);
        
        if (err.code === 'ETIMEDOUT') {
            console.log('💡 Problème: Le serveur MySQL ne répond pas');
            console.log('✅ Solutions:');
            console.log('   1. Vérifiez que MySQL est "Online" sur Railway');
            console.log('   2. Attendez 2-3 minutes supplémentaires');
            console.log('   3. Redémarrez le service MySQL sur Railway');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Problème: Accès refusé');
            console.log('✅ Vérifiez le mot de passe dans Railway');
        }
    } else {
        console.log('🎉 SUCCÈS! Connecté à MySQL!');
        console.log('✅ Votre base de données est opérationnelle!');
        
        connection.query('SELECT NOW() as server_time', (err, results) => {
            if (err) {
                console.log('❌ Erreur requête:', err.message);
            } else {
                console.log('✅ Heure du serveur MySQL:', results[0].server_time);
            }
            connection.end();
        });
    }
});