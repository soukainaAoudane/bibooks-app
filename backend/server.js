// AJOUTEZ CE CODE AU TRÈS DÉBUT DU FICHIER
process.on('uncaughtException', (error) => {
    console.error('💥 ERREUR CRITIQUE:', error.message);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ PROMESSE REJETÉE:', reason);
});

console.log('🚀 Démarrage de server.js...');

// Déclaration des variables utilisées
const axios = require("axios");
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3001;
const db = require("./base.js");
const path = require("path");
const imagesPath = path.join(__dirname, "images");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const multer = require("multer");

// ⭐⭐⭐ MIDDLEWARE GLOBAL - AU DÉBUT ⭐⭐⭐
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(imagesPath));

// Chargement des variables d'environnement
dotenv.config({ path: path.resolve(__dirname, ".env") });

console.log("Configuration SMTP:");
console.log("MAIL_USER:", process.env.MAIL_USER);
console.log("MAIL_PASS:", process.env.MAIL_PASS ? "***" : "non défini");

// Configuration du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Configuration de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "frontend", "images"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// Route de test POST
app.post("/test-post", (req, res) => {
  console.log("✅ Body reçu:", req.body);
  console.log("✅ Headers:", req.headers);
  res.json({ 
    message: "POST fonctionne!",
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// 🚨 ROUTE D'INITIALISATION URGENTE
app.get('/init-urgence', (req, res) => {
    console.log('🚨 INITIALISATION URGENTE DES TABLES');
    
    const tables = [
        `CREATE TABLE IF NOT EXISTS utilisateurs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            mot_de_passe VARCHAR(255) NOT NULL,
            role ENUM('admin', 'auteur', 'user') DEFAULT 'user',
            date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS livres (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titre VARCHAR(255) NOT NULL,
            auteur VARCHAR(150) NOT NULL,
            genre VARCHAR(100),
            img VARCHAR(255),
            date DATE,
            prix DECIMAL(10,2) DEFAULT 0.00,
            exp INT DEFAULT 1,
            description TEXT,
            date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS demandes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            livre_id INT NOT NULL,
            date_pret DATE NOT NULL,
            date_retour DATE NOT NULL,
            statut ENUM('en attente', 'accepté', 'refusé') DEFAULT 'en attente',
            date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS prets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            livre_id INT NOT NULL,
            utilisateur_id INT NOT NULL,
            nom VARCHAR(100) NOT NULL,
            date_pret DATE NOT NULL,
            date_retour DATE NOT NULL,
            statut ENUM('en cours', 'retourné', 'en retard') DEFAULT 'en cours',
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS avis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            livre_id INT NOT NULL,
            utilisateur_nom VARCHAR(100) NOT NULL,
            utilisateur_email VARCHAR(150),
            note INT,
            commentaire TEXT,
            date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS favoris (
            id INT AUTO_INCREMENT PRIMARY KEY,
            utilisateur_id INT NOT NULL,
            livre_id INT NOT NULL,
            date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    let created = 0;
    const errors = [];

    const createNextTable = (index) => {
        if (index >= tables.length) {
            if (errors.length > 0) {
                res.status(500).json({
                    message: `⚠️ ${created} tables créées, ${errors.length} erreurs`,
                    created: created,
                    errors: errors
                });
            } else {
                insertInitialData(res);
            }
            return;
        }

        const sql = tables[index];
        db.query(sql, (err, result) => {
            if (err) {
                console.error(`❌ Table ${index + 1} échouée:`, err.message);
                errors.push(`Table ${index + 1}: ${err.message}`);
            } else {
                console.log(`✅ Table ${index + 1} créée`);
                created++;
            }
            
            createNextTable(index + 1);
        });
    };

    const insertInitialData = (response) => {
        console.log('📝 Insertion des données initiales...');
        
        const sqlAdmin = `INSERT IGNORE INTO utilisateurs (nom, email, mot_de_passe, role) 
                         VALUES ('Admin', 'admin@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin')`;
        
        db.query(sqlAdmin, (err, result) => {
            if (err) {
                console.error('❌ Erreur insertion admin:', err.message);
            } else {
                console.log('✅ Admin inséré avec succès');
            }
            
            const livres = [
                {
                    titre: "Les Misérables",
                    auteur: "Victor Hugo",
                    genre: "Roman",
                    img: "miserables.png",
                    date: "1862-04-03",
                    prix: 15.99,
                    exp: 5,
                    description: "Une fresque sociale bouleversante qui suit la rédemption de Jean Valjean dans une France marquée par l''injustice et la pauvreté."
                },
                {
                    titre: "Le Petit Prince", 
                    auteur: "Saint-Exupéry",
                    genre: "Conte",
                    img: "le_petit_prince.png",
                    date: "1943-04-06",
                    prix: 10.50,
                    exp: 8,
                    description: "Un conte poétique et universel sur l''enfance, l''amour et le sens de la vie à travers les yeux d''un petit prince voyageur."
                },
                {
                    titre: "Harry Potter",
                    auteur: "J.K. Rowling", 
                    genre: "Fantasy",
                    img: "harry_potter.png",
                    date: "1997-06-26",
                    prix: 20.00,
                    exp: 10,
                    description: "Le jeune Harry découvre qu''il est un sorcier et entame une aventure magique à Poudlard pour affronter le redoutable Voldemort."
                },
                {
                    titre: "Dracula",
                    auteur: "Bram Stoker",
                    genre: "Horreur", 
                    img: "dracula.png",
                    date: "1897-05-26",
                    prix: 12.00,
                    exp: 4,
                    description: "L''histoire glaçante du comte Dracula qui terrorise Londres, un classique du roman gothique et du mythe vampirique."
                },
                {
                    titre: "Crime et Châtiment",
                    auteur: "Fiodor Dostoïevski",
                    genre: "Roman",
                    img: "crime_et_chatiment.png", 
                    date: "1867-01-01",
                    prix: 14.99,
                    exp: 6,
                    description: "Un drame psychologique intense où un étudiant pauvre commet un meurtre et se débat avec ses tourments moraux."
                },
                {
                    titre: "L'Étranger",
                    auteur: "Albert Camus",
                    genre: "Roman",
                    img: "letranger.png",
                    date: "1942-05-19", 
                    prix: 13.50,
                    exp: 7,
                    description: "Un récit percutant sur l''absurdité de la vie, raconté à travers l''indifférence de Meursault face à son crime et à son procès."
                }
            ];

            let livresInseres = 0;
            const erreursLivres = [];

            livres.forEach((livre, index) => {
                const sqlLivre = `INSERT IGNORE INTO livres (titre, auteur, genre, img, date, prix, exp, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                
                db.query(sqlLivre, [
                    livre.titre,
                    livre.auteur, 
                    livre.genre,
                    livre.img,
                    livre.date,
                    livre.prix,
                    livre.exp,
                    livre.description
                ], (err, result) => {
                    if (err) {
                        console.error(`❌ Livre ${index + 1} échoué:`, err.message);
                        erreursLivres.push(`Livre ${index + 1} (${livre.titre}): ${err.message}`);
                    } else {
                        console.log(`✅ Livre ${index + 1} inséré: ${livre.titre}`);
                        livresInseres++;
                    }

                    if (livresInseres + erreursLivres.length === livres.length) {
                        response.json({
                            message: '🎉 BASE DE DONNÉES INITIALISÉE AVEC SUCCÈS!',
                            tables_created: created,
                            admin_insere: true,
                            livres_inseres: livresInseres,
                            erreurs_livres: erreursLivres.length > 0 ? erreursLivres : null,
                            test_url: '/livres'
                        });
                    }
                });
            });
        });
    };

    createNextTable(0);
});

// Route de vérification simple
app.get('/check-tables', (req, res) => {
    db.query('SHOW TABLES', (err, results) => {
        if (err) {
            res.json({ error: err.message, tables: [] });
        } else {
            const tableNames = results.map(row => Object.values(row)[0]);
            res.json({
                database: 'railway',
                tables_count: tableNames.length,
                tables: tableNames
            });
        }
    });
});

// ==================== ROUTES EMAIL ====================

app.post("/send-email", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email, nom_ut } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Confirmation d'inscription",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Merci pour votre inscription à notre bibliothèque en ligne.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails de votre compte :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom_ut}</li>
                        <li>Email: ${email}</li>
                        <li>Date d'inscription: ${new Date().toLocaleDateString("fr-FR")}</li>
                    </ul>
                </div>
                <p>Vous pouvez maintenant vous connecter à votre compte.</p>
                <a href="https://bibooks-app.up.railway.app/connexion" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Se connecter
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

app.post("/envoi-avis", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Publication de l'avis",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Merci pour votre publication de l'avis dans notre bibliothèque en ligne.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom}</li>
                        <li>Email: ${email}</li>
                        <li>Date d'envoi: ${new Date().toLocaleDateString("fr-FR")}</li>
                    </ul>
                </div>
                <p>Vous pouvez accéder à votre compte.</p>
                <a href="https://bibooks-app.up.railway.app" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Se connecter
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

app.post("/demande-pret", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email, date_demande } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Envoi de demande de prêt",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Merci pour votre demande de prêt.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails de votre compte :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom}</li>
                        <li>Email: ${email}</li>
                        <li>Date de demande:${new Date(date_demande).toLocaleDateString()}</li>
                    </ul>
                </div>
                <p>Vous pouvez maintenant voir si votre demande a été acceptée.</p>
                <a href="https://bibooks-app.up.railway.app/profil" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Profil
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

app.post("/changement-mot-de-passe", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Changement du mot de passe",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Merci pour votre changement de mot de passe.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails de votre compte :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom}</li>
                        <li>Email: ${email}</li>
                        <li>Date de changement:${new Date().toLocaleDateString()}</li>
                    </ul>
                </div>
                <p>Vous pouvez maintenant voir votre profil.</p>
                <a href="https://bibooks-app.up.railway.app/profil" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Profil
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

app.post("/pret-confirme", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email, datePret, dateRetour } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Confirmation de demande de prêt",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Votre prêt a été confirmé.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails de votre compte :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom}</li>
                        <li>Email: ${email}</li>
                        <li>Date d'acceptation:${new Date().toLocaleDateString()}</li>
                        <li>Date de prêt:${new Date(datePret).toLocaleDateString()}</li>
                        <li>Date de retour:${new Date(dateRetour).toLocaleDateString()}</li>
                    </ul>
                </div>
                <p>Vous pouvez maintenant voir votre profil.</p>
                <a href="https://bibooks-app.up.railway.app/profil" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Profil
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

app.post("/pret-refus", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Refus de demande de prêt",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Malheureusement votre prêt a été refusé.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails de votre compte :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom}</li>
                        <li>Email: ${email}</li>
                        <li>Date de refus:${new Date().toLocaleDateString()}</li>
                    </ul>
                </div>
                <p>Vous pouvez maintenant voir votre profil.</p>
                <a href="https://bibooks-app.up.railway.app/profil" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Profil
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

// ==================== ROUTES LIVRES ====================

app.get("/livres/recherche", (req, res) => {
  const { titre, auteur } = req.query;
  
  if (!titre || !auteur) {
    return res.status(400).json({ error: "Titre et auteur sont requis" });
  }

  const sql = `SELECT * FROM livres WHERE titre = ? AND auteur = ? LIMIT 1`;
  db.query(sql, [titre, auteur], (err, result) => {
    if (err) {
      console.error("Erreur recherche livre:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    res.json(result);
  });
});

app.get("/livres", async (req, res) => {
  try {
    const localBooks = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM livres LIMIT 50", (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (localBooks.length > 0) {
      return res.json(localBooks);
    }

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=20&key=${apiKey}`
    );

    const googleBooks = response.data.items || [];
    const booksToInsert = googleBooks.map((book) => {
      const volumeInfo = book.volumeInfo;
      return {
        titre: volumeInfo.title || "Titre inconnu",
        auteur: volumeInfo.authors ? volumeInfo.authors.join(", ") : "Auteur inconnu",
        genre: volumeInfo.categories ? volumeInfo.categories.join(", ") : "Non classé",
        img: volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail : null,
        date: volumeInfo.publishedDate || null,
        description: volumeInfo.description || "Pas de description disponible.",
        prix: 0,
        exp: "Non spécifié",
      };
    });

    const insertPromises = booksToInsert.map((book) => {
      return new Promise((resolve, reject) => {
        const sql = `INSERT INTO livres (titre, auteur, genre, img, date, prix, exp, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(
          sql,
          [book.titre, book.auteur, book.genre, book.img, book.date, book.prix, book.exp, book.description],
          (err, result) => {
            if (err) reject(err);
            else resolve({ ...book, id: result.insertId });
          }
        );
      });
    });

    const insertedBooks = await Promise.all(insertPromises);
    res.json(insertedBooks);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/livres/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `select * from livres where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur get livre by id", err);
    } else {
      console.log("Get livre by id fonctionne bien");
      res.json(result[0]);
    }
  });
});

app.post("/livres", upload.single("image"), async (req, res) => {
  const { titre, auteur, genre, date, prix, exp, description, googleBooksId } = req.body;

  if (googleBooksId) {
    try {
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes/${googleBooksId}?key=${apiKey}`
      );

      const volumeInfo = response.data.volumeInfo;
      const bookData = {
        titre: volumeInfo.title || titre,
        auteur: volumeInfo.authors ? volumeInfo.authors.join(", ") : auteur,
        genre: volumeInfo.categories ? volumeInfo.categories.join(", ") : genre,
        img: volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail : req.file?.filename,
        date: volumeInfo.publishedDate || date,
        description: volumeInfo.description || description,
        prix: prix || 0,
        exp: exp || "Non spécifié",
      };

      const sql = `INSERT INTO livres (titre, auteur, genre, img, date, prix, exp, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      db.query(
        sql,
        [bookData.titre, bookData.auteur, bookData.genre, bookData.img, bookData.date, bookData.prix, bookData.exp, bookData.description],
        (err, result) => {
          if (err) {
            console.error("Erreur création livre Google:", err);
            return res.status(500).json({ error: "Erreur serveur" });
          }
          res.json({ message: "Livre de Google Books créé avec succès", id: result.insertId });
        }
      );
    } catch (error) {
      console.error("Erreur Google Books:", error);
      res.status(500).json({ error: "Échec de la récupération depuis Google Books" });
    }
  } else {
    if (!titre || !auteur) {
      return res.status(400).json({ error: "Titre et auteur sont obligatoires" });
    }

    const img = req.file?.filename || null;
    const sql = `INSERT INTO livres (titre, auteur, genre, img, date, prix, exp, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      sql,
      [titre, auteur, genre || "Non classé", img, date || null, prix || 0, exp || "Non spécifié", description || ""],
      (err, result) => {
        if (err) {
          console.error("Erreur création livre manuel:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json({ message: "Livre manuel créé avec succès", id: result.insertId });
      }
    );
  }
});

// ==================== ROUTES DEMANDES ====================

app.get("/demandes", (req, res) => {
  const sql = "SELECT * FROM demandes ORDER BY date_pret DESC";
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération des demandes", err);
    } else {
      console.log("Get demandes fonctionne bien");
      res.json(result);
    }
  });
});

app.get("/demandes/:statut", (req, res) => {
  const statut = req.params.statut;
  const sql = `select * from demandes where statut='${statut}'`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération de la demande", err);
    } else {
      console.log("Get demande fonctionne bien");
      res.json(result);
    }
  });
});

app.post("/demandes", (req, res) => {
  const nouvelleDemande = req.body;
  const sql = `insert into demandes (nom,livre_id,date_pret,date_retour,statut) values ('${nouvelleDemande.nom}',${nouvelleDemande.livre_id},'${nouvelleDemande.date_pret}','${nouvelleDemande.date_retour}','${nouvelleDemande.statut}')`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de création de la demande", err);
    } else {
      console.log("Demande créée avec succès");
      res.json({ message: "Demande créée avec succès" });
    }
  });
});

app.patch("/demandes/:id", (req, res) => {
  const id = Number(req.params.id);
  const champs = req.body;
  const modifications = Object.entries(champs)
    .map(([cle, valeur]) => `${cle}='${valeur}'`)
    .join(", ");
  if (!modifications) {
    return res.status(400).json({ message: "Aucun champ à modifier." });
  }
  const sql = `UPDATE demandes SET ${modifications} WHERE id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de modification de la demande", err);
      res.status(500).json({ message: "Erreur de modification de la demande" });
    } else {
      console.log("Demande modifiée avec succès");
      res.json({ message: "Demande modifiée avec succès" });
    }
  });
});

app.delete("/demandes/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `delete from demandes where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de suppression de la demande", err);
    } else {
      console.log("Demande supprimée avec succès");
      res.json({ message: "Demande supprimée avec succès" });
    }
  });
});

// ==================== ROUTES UTILISATEURS ====================

app.get("/utilisateurs", (req, res) => {
  const sql = "select * from utilisateurs";
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération des utilisateurs", err);
    } else {
      console.log("Get utilisateurs fonctionne bien");
      res.json(result);
    }
  });
});

app.get("/utilisateurs/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `select * from utilisateurs where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération de l'utilisateur", err);
    } else {
      console.log("Get utilisateur fonctionne bien");
      res.json(result[0]);
    }
  });
});

app.post("/utilisateurs", (req, res) => {
  const nouveauUtilisateur = req.body;
  const sql = `insert into utilisateurs (nom,email,mot_de_passe,role) values ('${nouveauUtilisateur.nom}','${nouveauUtilisateur.email}','${nouveauUtilisateur.mot_de_passe}','${nouveauUtilisateur.role}')`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de création de l'utilisateur", err);
    } else {
      console.log("Utilisateur créé avec succès");
      res.json({ message: "Utilisateur créé avec succès" });
    }
  });
});

app.patch("/utilisateurs/:id", (req, res) => {
  const id = Number(req.params.id);
  const fields = req.body;
  const updates = Object.entries(fields)
    .map(([key, value]) => `${key}='${value}'`)
    .join(", ");
  const sql = `UPDATE utilisateurs SET ${updates} WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Utilisateur modifié" });
  });
});

app.delete("/utilisateurs/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `DELETE FROM utilisateurs WHERE id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
      res.status(500).json({ message: "Erreur serveur" });
    } else {
      console.log("Utilisateur supprimé avec succès");
      res.json({ message: "Utilisateur supprimé avec succès" });
    }
  });
});

// ==================== ROUTES PRETS ====================

app.get("/prets", (req, res) => {
  const sql = "select * from prets";
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération des prêts", err);
    } else {
      console.log("Get prêts fonctionne bien");
      res.json(result);
    }
  });
});

app.get("/prets/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `select * from prets where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération du prêt", err);
    } else {
      console.log("Get prêt fonctionne bien");
      res.json(result[0]);
    }
  });
});

app.post("/prets", (req, res) => {
  const { livre_id, utilisateur_id, date_pret, date_retour, statut, nom } = req.body;
  
  const datePretCorrigee = date_pret;
  const dateRetourCorrigee = date_retour;

  console.log("📅 Dates utilisées:", { datePretCorrigee, dateRetourCorrigee });

  const sql = `INSERT INTO prets (livre_id, utilisateur_id, date_pret, date_retour, statut, nom) VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [livre_id, utilisateur_id, datePretCorrigee, dateRetourCorrigee, statut, nom], (err, result) => {
    if (err) {
      console.error("Erreur de création du prêt:", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    
    db.query("SELECT * FROM prets WHERE id = ?", [result.insertId], (err, newPret) => {
      console.log("📅 Date insérée en base:", newPret[0]?.date_retour);
      res.json({ 
        message: "Prêt créé avec succès",
        date_retour_inseree: newPret[0]?.date_retour
      });
    });
  });
});

app.patch("/prets/:id", (req, res) => {
  const id = req.params.id;
  const fields = req.body;
  if (!fields || Object.keys(fields).length === 0) {
    return res.status(400).json({ error: "Aucun champ à modifier." });
  }
  const updates = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    updates.push(`${key} = ?`);
    values.push(value);
  }
  const sql = `UPDATE prets SET ${updates.join(", ")} WHERE id = ?`;
  values.push(id);
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erreur lors de la modification du prêt:", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Prêt non trouvé." });
    }
    res.json({ message: "Prêt modifié avec succès" });
  });
});

app.put("/prets/:id", (req, res) => {
  const id = Number(req.params.id);
  const pretModifier = req.body;
  const sql = `update prets set livre_id=${pretModifier.livre_id}, utilisateur_id=${pretModifier.utilisateur_id}, date_pret='${pretModifier.date_pret}', date_retour='${pretModifier.date_retour}', statut='${pretModifier.statut}' where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de modification du prêt", err);
    } else {
      console.log("Prêt modifié avec succès");
      res.json({ message: "Prêt modifié avec succès" });
    }
  });
});

app.delete("/prets/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `delete from prets where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de suppression du prêt", err);
    } else {
      console.log("Prêt supprimé avec succès");
      res.json({ message: "Prêt supprimé avec succès" });
    }
  });
});

// ==================== ROUTES AVIS ====================

app.get("/avis", (req, res) => {
  const sql = "select * from avis";
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération des avis", err);
      res.status(500).json({ error: "Erreur serveur" });
    } else {
      console.log("Get avis fonctionne bien");
      res.json(result);
    }
  });
});

app.get("/avis/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `select * from avis where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération de l'avis", err);
    } else {
      console.log("Get avis fonctionne bien");
      res.json(result[0]);
    }
  });
});

app.post("/avis", (req, res) => {
  const { livreId, nom, email, note, commentaire } = req.body;
  if (!livreId || !nom || !note || !commentaire) {
    return res.status(400).json({ message: "Données manquantes" });
  }
  const sql = `INSERT INTO avis (livre_id, utilisateur_nom, utilisateur_email, note, commentaire) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [livreId, nom, email, note, commentaire], (err, result) => {
    if (err) {
      console.error("Erreur MySQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.status(201).json({ message: "Avis enregistré avec succès" });
  });
});

// ==================== ROUTES PAGES ====================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.get("/accueil", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.get("/liste_livres", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "liste_livres.html"));
});

app.get("/detail", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "detail.html"));
});

app.get("/connexion", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "connexion.html"));
});

app.get("/inscription", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "inscription.html"));
});

app.get("/ajouter", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "ajouter.html"));
});

app.get("/demande_pret", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "demande_pret.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "admin.html"));
});

app.get("/auteur", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "auteur.html"));
});

app.get("/profil", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "profil.html"));
});

app.get("/laisser_avis", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "laisser_avis.html"));
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "404.html"));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server is running on port http://localhost:${port}`);
});// AJOUTEZ CE CODE AU TRÈS DÉBUT DU FICHIER
process.on('uncaughtException', (error) => {
    console.error('💥 ERREUR CRITIQUE:', error.message);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ PROMESSE REJETÉE:', reason);
});

console.log('🚀 Démarrage de server.js...');

// Déclaration des variables utilisées
const axios = require("axios");
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3001;
const db = require("./base.js");
const path = require("path");
const imagesPath = path.join(__dirname, "images");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const multer = require("multer");

// ⭐⭐⭐ MIDDLEWARE GLOBAL - AU DÉBUT ⭐⭐⭐
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(imagesPath));

// Chargement des variables d'environnement
dotenv.config({ path: path.resolve(__dirname, ".env") });

console.log("Configuration SMTP:");
console.log("MAIL_USER:", process.env.MAIL_USER);
console.log("MAIL_PASS:", process.env.MAIL_PASS ? "***" : "non défini");

// Configuration du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Configuration de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "frontend", "images"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// Route de test POST
app.post("/test-post", (req, res) => {
  console.log("✅ Body reçu:", req.body);
  console.log("✅ Headers:", req.headers);
  res.json({ 
    message: "POST fonctionne!",
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// 🚨 ROUTE D'INITIALISATION URGENTE
app.get('/init-urgence', (req, res) => {
    console.log('🚨 INITIALISATION URGENTE DES TABLES');
    
    const tables = [
        `CREATE TABLE IF NOT EXISTS utilisateurs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            mot_de_passe VARCHAR(255) NOT NULL,
            role ENUM('admin', 'auteur', 'user') DEFAULT 'user',
            date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS livres (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titre VARCHAR(255) NOT NULL,
            auteur VARCHAR(150) NOT NULL,
            genre VARCHAR(100),
            img VARCHAR(255),
            date DATE,
            prix DECIMAL(10,2) DEFAULT 0.00,
            exp INT DEFAULT 1,
            description TEXT,
            date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS demandes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            livre_id INT NOT NULL,
            date_pret DATE NOT NULL,
            date_retour DATE NOT NULL,
            statut ENUM('en attente', 'accepté', 'refusé') DEFAULT 'en attente',
            date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS prets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            livre_id INT NOT NULL,
            utilisateur_id INT NOT NULL,
            nom VARCHAR(100) NOT NULL,
            date_pret DATE NOT NULL,
            date_retour DATE NOT NULL,
            statut ENUM('en cours', 'retourné', 'en retard') DEFAULT 'en cours',
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS avis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            livre_id INT NOT NULL,
            utilisateur_nom VARCHAR(100) NOT NULL,
            utilisateur_email VARCHAR(150),
            note INT,
            commentaire TEXT,
            date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS favoris (
            id INT AUTO_INCREMENT PRIMARY KEY,
            utilisateur_id INT NOT NULL,
            livre_id INT NOT NULL,
            date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    let created = 0;
    const errors = [];

    const createNextTable = (index) => {
        if (index >= tables.length) {
            if (errors.length > 0) {
                res.status(500).json({
                    message: `⚠️ ${created} tables créées, ${errors.length} erreurs`,
                    created: created,
                    errors: errors
                });
            } else {
                insertInitialData(res);
            }
            return;
        }

        const sql = tables[index];
        db.query(sql, (err, result) => {
            if (err) {
                console.error(`❌ Table ${index + 1} échouée:`, err.message);
                errors.push(`Table ${index + 1}: ${err.message}`);
            } else {
                console.log(`✅ Table ${index + 1} créée`);
                created++;
            }
            
            createNextTable(index + 1);
        });
    };

    const insertInitialData = (response) => {
        console.log('📝 Insertion des données initiales...');
        
        const sqlAdmin = `INSERT IGNORE INTO utilisateurs (nom, email, mot_de_passe, role) 
                         VALUES ('Admin', 'admin@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin')`;
        
        db.query(sqlAdmin, (err, result) => {
            if (err) {
                console.error('❌ Erreur insertion admin:', err.message);
            } else {
                console.log('✅ Admin inséré avec succès');
            }
            
            const livres = [
                {
                    titre: "Les Misérables",
                    auteur: "Victor Hugo",
                    genre: "Roman",
                    img: "miserables.png",
                    date: "1862-04-03",
                    prix: 15.99,
                    exp: 5,
                    description: "Une fresque sociale bouleversante qui suit la rédemption de Jean Valjean dans une France marquée par l''injustice et la pauvreté."
                },
                {
                    titre: "Le Petit Prince", 
                    auteur: "Saint-Exupéry",
                    genre: "Conte",
                    img: "le_petit_prince.png",
                    date: "1943-04-06",
                    prix: 10.50,
                    exp: 8,
                    description: "Un conte poétique et universel sur l''enfance, l''amour et le sens de la vie à travers les yeux d''un petit prince voyageur."
                },
                {
                    titre: "Harry Potter",
                    auteur: "J.K. Rowling", 
                    genre: "Fantasy",
                    img: "harry_potter.png",
                    date: "1997-06-26",
                    prix: 20.00,
                    exp: 10,
                    description: "Le jeune Harry découvre qu''il est un sorcier et entame une aventure magique à Poudlard pour affronter le redoutable Voldemort."
                },
                {
                    titre: "Dracula",
                    auteur: "Bram Stoker",
                    genre: "Horreur", 
                    img: "dracula.png",
                    date: "1897-05-26",
                    prix: 12.00,
                    exp: 4,
                    description: "L''histoire glaçante du comte Dracula qui terrorise Londres, un classique du roman gothique et du mythe vampirique."
                },
                {
                    titre: "Crime et Châtiment",
                    auteur: "Fiodor Dostoïevski",
                    genre: "Roman",
                    img: "crime_et_chatiment.png", 
                    date: "1867-01-01",
                    prix: 14.99,
                    exp: 6,
                    description: "Un drame psychologique intense où un étudiant pauvre commet un meurtre et se débat avec ses tourments moraux."
                },
                {
                    titre: "L'Étranger",
                    auteur: "Albert Camus",
                    genre: "Roman",
                    img: "letranger.png",
                    date: "1942-05-19", 
                    prix: 13.50,
                    exp: 7,
                    description: "Un récit percutant sur l''absurdité de la vie, raconté à travers l''indifférence de Meursault face à son crime et à son procès."
                }
            ];

            let livresInseres = 0;
            const erreursLivres = [];

            livres.forEach((livre, index) => {
                const sqlLivre = `INSERT IGNORE INTO livres (titre, auteur, genre, img, date, prix, exp, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                
                db.query(sqlLivre, [
                    livre.titre,
                    livre.auteur, 
                    livre.genre,
                    livre.img,
                    livre.date,
                    livre.prix,
                    livre.exp,
                    livre.description
                ], (err, result) => {
                    if (err) {
                        console.error(`❌ Livre ${index + 1} échoué:`, err.message);
                        erreursLivres.push(`Livre ${index + 1} (${livre.titre}): ${err.message}`);
                    } else {
                        console.log(`✅ Livre ${index + 1} inséré: ${livre.titre}`);
                        livresInseres++;
                    }

                    if (livresInseres + erreursLivres.length === livres.length) {
                        response.json({
                            message: '🎉 BASE DE DONNÉES INITIALISÉE AVEC SUCCÈS!',
                            tables_created: created,
                            admin_insere: true,
                            livres_inseres: livresInseres,
                            erreurs_livres: erreursLivres.length > 0 ? erreursLivres : null,
                            test_url: '/livres'
                        });
                    }
                });
            });
        });
    };

    createNextTable(0);
});

// Route de vérification simple
app.get('/check-tables', (req, res) => {
    db.query('SHOW TABLES', (err, results) => {
        if (err) {
            res.json({ error: err.message, tables: [] });
        } else {
            const tableNames = results.map(row => Object.values(row)[0]);
            res.json({
                database: 'railway',
                tables_count: tableNames.length,
                tables: tableNames
            });
        }
    });
});

// ==================== ROUTES EMAIL ====================

app.post("/send-email", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email, nom_ut } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Confirmation d'inscription",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Merci pour votre inscription à notre bibliothèque en ligne.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails de votre compte :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom_ut}</li>
                        <li>Email: ${email}</li>
                        <li>Date d'inscription: ${new Date().toLocaleDateString("fr-FR")}</li>
                    </ul>
                </div>
                <p>Vous pouvez maintenant vous connecter à votre compte.</p>
                <a href="https://bibooks-app.up.railway.app/connexion" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Se connecter
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

app.post("/envoi-avis", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Publication de l'avis",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Merci pour votre publication de l'avis dans notre bibliothèque en ligne.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom}</li>
                        <li>Email: ${email}</li>
                        <li>Date d'envoi: ${new Date().toLocaleDateString("fr-FR")}</li>
                    </ul>
                </div>
                <p>Vous pouvez accéder à votre compte.</p>
                <a href="https://bibooks-app.up.railway.app" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Se connecter
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

app.post("/demande-pret", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email, date_demande } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Envoi de demande de prêt",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Merci pour votre demande de prêt.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails de votre compte :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom}</li>
                        <li>Email: ${email}</li>
                        <li>Date de demande:${new Date(date_demande).toLocaleDateString()}</li>
                    </ul>
                </div>
                <p>Vous pouvez maintenant voir si votre demande a été acceptée.</p>
                <a href="https://bibooks-app.up.railway.app/profil" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Profil
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

app.post("/changement-mot-de-passe", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Changement du mot de passe",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Merci pour votre changement de mot de passe.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails de votre compte :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom}</li>
                        <li>Email: ${email}</li>
                        <li>Date de changement:${new Date().toLocaleDateString()}</li>
                    </ul>
                </div>
                <p>Vous pouvez maintenant voir votre profil.</p>
                <a href="https://bibooks-app.up.railway.app/profil" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Profil
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

app.post("/pret-confirme", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email, datePret, dateRetour } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Confirmation de demande de prêt",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Votre prêt a été confirmé.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails de votre compte :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom}</li>
                        <li>Email: ${email}</li>
                        <li>Date d'acceptation:${new Date().toLocaleDateString()}</li>
                        <li>Date de prêt:${new Date(datePret).toLocaleDateString()}</li>
                        <li>Date de retour:${new Date(dateRetour).toLocaleDateString()}</li>
                    </ul>
                </div>
                <p>Vous pouvez maintenant voir votre profil.</p>
                <a href="https://bibooks-app.up.railway.app/profil" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Profil
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

app.post("/pret-refus", async (req, res) => {
  console.log("📧 Requête reçue:", req.body);
  const { nom, email } = req.body;
  if (!email || !nom) {
    return res.status(400).json({ error: "Données manquantes" });
  }
  const mailOptions = {
    from: `"Bibliothèque" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Refus de demande de prêt",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3366cc;">Bienvenue ${nom} !</h2>
                <p>Malheureusement votre prêt a été refusé.</p>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Détails de votre compte :</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Nom d'utilisateur: ${nom}</li>
                        <li>Email: ${email}</li>
                        <li>Date de refus:${new Date().toLocaleDateString()}</li>
                    </ul>
                </div>
                <p>Vous pouvez maintenant voir votre profil.</p>
                <a href="https://bibooks-app.up.railway.app/profil" 
                   style="display: inline-block; background: #00b4d8; color: white; 
                          padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Profil
                </a>
            </div>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${email}`);
    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ error: "Échec de l'envoi de l'email" });
  }
});

// ==================== ROUTES LIVRES ====================

app.get("/livres/recherche", (req, res) => {
  const { titre, auteur } = req.query;
  
  if (!titre || !auteur) {
    return res.status(400).json({ error: "Titre et auteur sont requis" });
  }

  const sql = `SELECT * FROM livres WHERE titre = ? AND auteur = ? LIMIT 1`;
  db.query(sql, [titre, auteur], (err, result) => {
    if (err) {
      console.error("Erreur recherche livre:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    res.json(result);
  });
});

app.get("/livres", async (req, res) => {
  try {
    const localBooks = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM livres LIMIT 50", (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (localBooks.length > 0) {
      return res.json(localBooks);
    }

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=20&key=${apiKey}`
    );

    const googleBooks = response.data.items || [];
    const booksToInsert = googleBooks.map((book) => {
      const volumeInfo = book.volumeInfo;
      return {
        titre: volumeInfo.title || "Titre inconnu",
        auteur: volumeInfo.authors ? volumeInfo.authors.join(", ") : "Auteur inconnu",
        genre: volumeInfo.categories ? volumeInfo.categories.join(", ") : "Non classé",
        img: volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail : null,
        date: volumeInfo.publishedDate || null,
        description: volumeInfo.description || "Pas de description disponible.",
        prix: 0,
        exp: "Non spécifié",
      };
    });

    const insertPromises = booksToInsert.map((book) => {
      return new Promise((resolve, reject) => {
        const sql = `INSERT INTO livres (titre, auteur, genre, img, date, prix, exp, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(
          sql,
          [book.titre, book.auteur, book.genre, book.img, book.date, book.prix, book.exp, book.description],
          (err, result) => {
            if (err) reject(err);
            else resolve({ ...book, id: result.insertId });
          }
        );
      });
    });

    const insertedBooks = await Promise.all(insertPromises);
    res.json(insertedBooks);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/livres/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `select * from livres where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur get livre by id", err);
    } else {
      console.log("Get livre by id fonctionne bien");
      res.json(result[0]);
    }
  });
});

app.post("/livres", upload.single("image"), async (req, res) => {
  const { titre, auteur, genre, date, prix, exp, description, googleBooksId } = req.body;

  if (googleBooksId) {
    try {
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes/${googleBooksId}?key=${apiKey}`
      );

      const volumeInfo = response.data.volumeInfo;
      const bookData = {
        titre: volumeInfo.title || titre,
        auteur: volumeInfo.authors ? volumeInfo.authors.join(", ") : auteur,
        genre: volumeInfo.categories ? volumeInfo.categories.join(", ") : genre,
        img: volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail : req.file?.filename,
        date: volumeInfo.publishedDate || date,
        description: volumeInfo.description || description,
        prix: prix || 0,
        exp: exp || "Non spécifié",
      };

      const sql = `INSERT INTO livres (titre, auteur, genre, img, date, prix, exp, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      db.query(
        sql,
        [bookData.titre, bookData.auteur, bookData.genre, bookData.img, bookData.date, bookData.prix, bookData.exp, bookData.description],
        (err, result) => {
          if (err) {
            console.error("Erreur création livre Google:", err);
            return res.status(500).json({ error: "Erreur serveur" });
          }
          res.json({ message: "Livre de Google Books créé avec succès", id: result.insertId });
        }
      );
    } catch (error) {
      console.error("Erreur Google Books:", error);
      res.status(500).json({ error: "Échec de la récupération depuis Google Books" });
    }
  } else {
    if (!titre || !auteur) {
      return res.status(400).json({ error: "Titre et auteur sont obligatoires" });
    }

    const img = req.file?.filename || null;
    const sql = `INSERT INTO livres (titre, auteur, genre, img, date, prix, exp, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      sql,
      [titre, auteur, genre || "Non classé", img, date || null, prix || 0, exp || "Non spécifié", description || ""],
      (err, result) => {
        if (err) {
          console.error("Erreur création livre manuel:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json({ message: "Livre manuel créé avec succès", id: result.insertId });
      }
    );
  }
});

// ==================== ROUTES DEMANDES ====================

app.get("/demandes", (req, res) => {
  const sql = "SELECT * FROM demandes ORDER BY date_pret DESC";
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération des demandes", err);
    } else {
      console.log("Get demandes fonctionne bien");
      res.json(result);
    }
  });
});

app.get("/demandes/:statut", (req, res) => {
  const statut = req.params.statut;
  const sql = `select * from demandes where statut='${statut}'`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération de la demande", err);
    } else {
      console.log("Get demande fonctionne bien");
      res.json(result);
    }
  });
});

app.post("/demandes", (req, res) => {
  const nouvelleDemande = req.body;
  const sql = `insert into demandes (nom,livre_id,date_pret,date_retour,statut) values ('${nouvelleDemande.nom}',${nouvelleDemande.livre_id},'${nouvelleDemande.date_pret}','${nouvelleDemande.date_retour}','${nouvelleDemande.statut}')`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de création de la demande", err);
    } else {
      console.log("Demande créée avec succès");
      res.json({ message: "Demande créée avec succès" });
    }
  });
});

app.patch("/demandes/:id", (req, res) => {
  const id = Number(req.params.id);
  const champs = req.body;
  const modifications = Object.entries(champs)
    .map(([cle, valeur]) => `${cle}='${valeur}'`)
    .join(", ");
  if (!modifications) {
    return res.status(400).json({ message: "Aucun champ à modifier." });
  }
  const sql = `UPDATE demandes SET ${modifications} WHERE id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de modification de la demande", err);
      res.status(500).json({ message: "Erreur de modification de la demande" });
    } else {
      console.log("Demande modifiée avec succès");
      res.json({ message: "Demande modifiée avec succès" });
    }
  });
});

app.delete("/demandes/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `delete from demandes where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de suppression de la demande", err);
    } else {
      console.log("Demande supprimée avec succès");
      res.json({ message: "Demande supprimée avec succès" });
    }
  });
});

// ==================== ROUTES UTILISATEURS ====================

app.get("/utilisateurs", (req, res) => {
  const sql = "select * from utilisateurs";
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération des utilisateurs", err);
    } else {
      console.log("Get utilisateurs fonctionne bien");
      res.json(result);
    }
  });
});

app.get("/utilisateurs/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `select * from utilisateurs where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération de l'utilisateur", err);
    } else {
      console.log("Get utilisateur fonctionne bien");
      res.json(result[0]);
    }
  });
});

app.post("/utilisateurs", (req, res) => {
  const nouveauUtilisateur = req.body;
  const sql = `insert into utilisateurs (nom,email,mot_de_passe,role) values ('${nouveauUtilisateur.nom}','${nouveauUtilisateur.email}','${nouveauUtilisateur.mot_de_passe}','${nouveauUtilisateur.role}')`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de création de l'utilisateur", err);
    } else {
      console.log("Utilisateur créé avec succès");
      res.json({ message: "Utilisateur créé avec succès" });
    }
  });
});

app.patch("/utilisateurs/:id", (req, res) => {
  const id = Number(req.params.id);
  const fields = req.body;
  const updates = Object.entries(fields)
    .map(([key, value]) => `${key}='${value}'`)
    .join(", ");
  const sql = `UPDATE utilisateurs SET ${updates} WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Utilisateur modifié" });
  });
});

app.delete("/utilisateurs/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `DELETE FROM utilisateurs WHERE id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
      res.status(500).json({ message: "Erreur serveur" });
    } else {
      console.log("Utilisateur supprimé avec succès");
      res.json({ message: "Utilisateur supprimé avec succès" });
    }
  });
});

// ==================== ROUTES PRETS ====================

app.get("/prets", (req, res) => {
  const sql = "select * from prets";
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération des prêts", err);
    } else {
      console.log("Get prêts fonctionne bien");
      res.json(result);
    }
  });
});

app.get("/prets/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `select * from prets where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération du prêt", err);
    } else {
      console.log("Get prêt fonctionne bien");
      res.json(result[0]);
    }
  });
});

app.post("/prets", (req, res) => {
  const { livre_id, utilisateur_id, date_pret, date_retour, statut, nom } = req.body;
  
  const datePretCorrigee = date_pret;
  const dateRetourCorrigee = date_retour;

  console.log("📅 Dates utilisées:", { datePretCorrigee, dateRetourCorrigee });

  const sql = `INSERT INTO prets (livre_id, utilisateur_id, date_pret, date_retour, statut, nom) VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [livre_id, utilisateur_id, datePretCorrigee, dateRetourCorrigee, statut, nom], (err, result) => {
    if (err) {
      console.error("Erreur de création du prêt:", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    
    db.query("SELECT * FROM prets WHERE id = ?", [result.insertId], (err, newPret) => {
      console.log("📅 Date insérée en base:", newPret[0]?.date_retour);
      res.json({ 
        message: "Prêt créé avec succès",
        date_retour_inseree: newPret[0]?.date_retour
      });
    });
  });
});

app.patch("/prets/:id", (req, res) => {
  const id = req.params.id;
  const fields = req.body;
  if (!fields || Object.keys(fields).length === 0) {
    return res.status(400).json({ error: "Aucun champ à modifier." });
  }
  const updates = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    updates.push(`${key} = ?`);
    values.push(value);
  }
  const sql = `UPDATE prets SET ${updates.join(", ")} WHERE id = ?`;
  values.push(id);
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erreur lors de la modification du prêt:", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Prêt non trouvé." });
    }
    res.json({ message: "Prêt modifié avec succès" });
  });
});

app.put("/prets/:id", (req, res) => {
  const id = Number(req.params.id);
  const pretModifier = req.body;
  const sql = `update prets set livre_id=${pretModifier.livre_id}, utilisateur_id=${pretModifier.utilisateur_id}, date_pret='${pretModifier.date_pret}', date_retour='${pretModifier.date_retour}', statut='${pretModifier.statut}' where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de modification du prêt", err);
    } else {
      console.log("Prêt modifié avec succès");
      res.json({ message: "Prêt modifié avec succès" });
    }
  });
});

app.delete("/prets/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `delete from prets where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de suppression du prêt", err);
    } else {
      console.log("Prêt supprimé avec succès");
      res.json({ message: "Prêt supprimé avec succès" });
    }
  });
});

// ==================== ROUTES AVIS ====================

app.get("/avis", (req, res) => {
  const sql = "select * from avis";
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération des avis", err);
      res.status(500).json({ error: "Erreur serveur" });
    } else {
      console.log("Get avis fonctionne bien");
      res.json(result);
    }
  });
});

app.get("/avis/:id", (req, res) => {
  const id = Number(req.params.id);
  const sql = `select * from avis where id=${id}`;
  db.query(sql, (err, result) => {
    if (err) {
      console.log("Erreur de récupération de l'avis", err);
    } else {
      console.log("Get avis fonctionne bien");
      res.json(result[0]);
    }
  });
});

app.post("/avis", (req, res) => {
  const { livreId, nom, email, note, commentaire } = req.body;
  if (!livreId || !nom || !note || !commentaire) {
    return res.status(400).json({ message: "Données manquantes" });
  }
  const sql = `INSERT INTO avis (livre_id, utilisateur_nom, utilisateur_email, note, commentaire) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [livreId, nom, email, note, commentaire], (err, result) => {
    if (err) {
      console.error("Erreur MySQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.status(201).json({ message: "Avis enregistré avec succès" });
  });
});

// ==================== ROUTES PAGES ====================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.get("/accueil", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.get("/liste_livres", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "liste_livres.html"));
});

app.get("/detail", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "detail.html"));
});

app.get("/connexion", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "connexion.html"));
});

app.get("/inscription", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "inscription.html"));
});

app.get("/ajouter", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "ajouter.html"));
});

app.get("/demande_pret", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "demande_pret.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "admin.html"));
});

app.get("/auteur", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "auteur.html"));
});

app.get("/profil", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "profil.html"));
});

app.get("/laisser_avis", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "laisser_avis.html"));
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "404.html"));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server is running on port http://localhost:${port}`);
});
