require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 TEST ULTIME EMAIL');
console.log('=== VARIABLES ENVIRONNEMENT ===');
console.log('MAIL_PASS présent:', !!process.env.MAIL_PASS);
console.log('MAIL_PASS longueur:', process.env.MAIL_PASS ? process.env.MAIL_PASS.length : 0);
console.log('MAIL_PASS commence par SG.:', process.env.MAIL_PASS ? process.env.MAIL_PASS.startsWith('SG.') : false);

console.log('=== CONFIGURATION SMTP ===');
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.MAIL_PASS
  },
  debug: true,
  logger: true
});

console.log('=== TEST CONNEXION ===');
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ ERREUR CONNEXION:');
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('=== SOLUTIONS ===');
    console.log('1. Vérifiez que la clé SendGrid est VALIDE');
    console.log('2. Vérifiez que le sender est VÉRIFIÉ dans SendGrid');
    console.log('3. Vérifiez les permissions de la clé API');
    return;
  }

  console.log('✅ CONNEXION RÉUSSIE!');
  
  console.log('=== TEST ENVOI EMAIL ===');
  const mailOptions = {
    from: '"Bibliothèque Test" <sousouawadane@gmail.com>',
    to: 'sousouawadane@gmail.com',
    subject: 'TEST ULTIME - ' + new Date().toISOString(),
    text: 'Ceci est un test ultime de SendGrid'
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log('❌ ERREUR ENVOI:');
      console.log('Message:', err.message);
      console.log('Code:', err.code);
      console.log('Response:', err.response);
    } else {
      console.log('🎉 EMAIL ENVOYÉ AVEC SUCCÈS!');
      console.log('Message ID:', info.messageId);
      console.log('=== PROCHAINES ÉTAPES ===');
      console.log('1. Allez sur SendGrid → Activity pour voir l\'email');
      console.log('2. Testez votre application normale');
    }
  });
});