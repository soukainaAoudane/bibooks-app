const path = require('path');

// Charger .env avec le bon chemin
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('🔍 VÉRIFICATION .env:');
console.log('Fichier .env chargé depuis:', path.resolve(__dirname, '.env'));
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NON DÉFINI');

// Liste toutes les variables
console.log('\n📋 TOUTES LES VARIABLES:');
Object.keys(process.env).forEach(key => {
    if (key.includes('DB') || key.includes('MYSQL')) {
        console.log(`${key}: ${key.includes('PASSWORD') ? '***' : process.env[key]}`);
    }
});