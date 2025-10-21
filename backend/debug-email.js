require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 DEBUG EMAIL COMPLET');
console.log('MAIL_PASS défini:', !!process.env.MAIL_PASS);

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

console.log('🔄 Test de connexion SMTP...');

transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ ERREUR CONNEXION SMTP:');
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Command:', error.command);
    return;
  }

  console.log('✅ Connexion SMTP réussie!');
  
  console.log('📧 Test envoi email...');
  transporter.sendMail({
    from: '"Bibliothèque" <sousouawadane@gmail.com>',
    to: 'sousouawadane@gmail.com',
    subject: 'Test SendGrid - ' + new Date().toISOString(),
    text: 'Ceci est un test de SendGrid'
  }, (err, info) => {
    if (err) {
      console.log('❌ ERREUR ENVOI:');
      console.log('Message:', err.message);
      console.log('Code:', err.code);
      console.log('Response:', err.response);
    } else {
      console.log('✅ EMAIL ENVOYÉ AVEC SUCCÈS!');
      console.log('Message ID:', info.messageId);
      console.log('Response:', info.response);
    }
  });
});