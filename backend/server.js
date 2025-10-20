// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
    console.error('💥 ERREUR CRITIQUE:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ PROMESSE REJETÉE:', reason);
});

console.log('🚀 Démarrage optimisé de server.js...');

// Importations essentielles uniquement
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./base.js");

const app = express();
const port = process.env.PORT || 3001;

// Middleware minimal
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use("/images", express.static(path.join(__dirname, "images")));

// 🔥 ROUTE D'INITIALISATION RAPIDE
app.get('/init-rapide', async (req, res) => {
    console.log('⚡ INITIALISATION RAPIDE DES TABLES');
    
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
        )`
    ];

    try {
        // Création parallèle des tables
        const creationPromises = tables.map((sql, index) => 
            new Promise((resolve, reject) => {
                db.query(sql, (err, result) => {
                    if (err) {
                        console.error(`❌ Table ${index + 1} échouée:`, err.message);
                        reject(err);
                    } else {
                        console.log(`✅ Table ${index + 1} créée`);
                        resolve(result);
                    }
                });
            })
        );

        await Promise.all(creationPromises);
        
        // Insérer l'admin rapidement
        const sqlAdmin = `INSERT IGNORE INTO utilisateurs (nom, email, mot_de_passe, role) 
                         VALUES ('Admin', 'admin@gmail.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin')`;
        
        db.query(sqlAdmin, (err) => {
            if (err) console.error('❌ Admin non inséré:', err.message);
            else console.log('✅ Admin inséré');
            
            res.json({ 
                message: '⚡ BASE INITIALISÉE EN 3 SECONDES!',
                tables: tables.length,
                status: 'ready',
                test: '/livres'
            });
        });

    } catch (error) {
        res.status(500).json({ 
            error: 'Erreur initialisation', 
            details: error.message 
        });
    }
});

// ✅ ROUTES CRITIQUES UNIQUEMENT

// Route santé
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        uptime: process.uptime()
    });
});

// Route principale des livres (optimisée)
app.get("/livres", (req, res) => {
    const sql = "SELECT id, titre, auteur, genre, img, prix FROM livres LIMIT 50";
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erreur livres:", err);
            return res.status(500).json({ error: "Base de données indisponible" });
        }
        res.json(result);
    });
});

// Détail livre
app.get("/livres/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });
    
    const sql = "SELECT * FROM livres WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erreur détail livre:", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(result[0] || null);
    });
});

// Connexion utilisateur
app.post("/connexion", (req, res) => {
    const { email, mot_de_passe } = req.body;
    
    if (!email || !mot_de_passe) {
        return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const sql = "SELECT id, nom, email, role FROM utilisateurs WHERE email = ? AND mot_de_passe = ?";
    db.query(sql, [email, mot_de_passe], (err, result) => {
        if (err) {
            console.error("Erreur connexion:", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        if (result.length === 0) {
            return res.status(401).json({ error: "Identifiants incorrects" });
        }
        
        res.json({ 
            message: "Connexion réussie", 
            user: result[0] 
        });
    });
});

// Inscription utilisateur
app.post("/inscription", (req, res) => {
    const { nom, email, mot_de_passe } = req.body;
    
    if (!nom || !email || !mot_de_passe) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const sql = "INSERT INTO utilisateurs (nom, email, mot_de_passe) VALUES (?, ?, ?)";
    db.query(sql, [nom, email, mot_de_passe], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: "Email déjà utilisé" });
            }
            console.error("Erreur inscription:", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        res.json({ 
            message: "Inscription réussie", 
            userId: result.insertId 
        });
    });
});

// Demande de prêt
app.post("/demandes", (req, res) => {
    const { nom, livre_id, date_pret, date_retour } = req.body;
    
    if (!nom || !livre_id || !date_pret || !date_retour) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const sql = "INSERT INTO demandes (nom, livre_id, date_pret, date_retour) VALUES (?, ?, ?, ?)";
    db.query(sql, [nom, livre_id, date_pret, date_retour], (err, result) => {
        if (err) {
            console.error("Erreur demande:", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        res.json({ 
            message: "Demande envoyée", 
            demandeId: result.insertId 
        });
    });
});

// Ajouter un avis
app.post("/avis", (req, res) => {
    const { livre_id, utilisateur_nom, note, commentaire } = req.body;
    
    if (!livre_id || !utilisateur_nom || !note || !commentaire) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const sql = "INSERT INTO avis (livre_id, utilisateur_nom, note, commentaire) VALUES (?, ?, ?, ?)";
    db.query(sql, [livre_id, utilisateur_nom, note, commentaire], (err, result) => {
        if (err) {
            console.error("Erreur avis:", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        
        res.json({ 
            message: "Avis publié", 
            avisId: result.insertId 
        });
    });
});

// 🎯 ROUTES DES PAGES HTML (SINGLE PAGE APPLICATION)
const servePage = (page) => (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", `${page}.html`));
};

app.get("/", servePage("index"));
app.get("/accueil", servePage("index"));
app.get("/liste_livres", servePage("liste_livres"));
app.get("/detail", servePage("detail"));
app.get("/connexion", servePage("connexion"));
app.get("/inscription", servePage("inscription"));
app.get("/ajouter", servePage("ajouter"));
app.get("/demande_pret", servePage("demande_pret"));
app.get("/admin", servePage("admin"));
app.get("/auteur", servePage("auteur"));
app.get("/profil", servePage("profil"));
app.get("/laisser_avis", servePage("laisser_avis"));

// Route 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "..", "frontend", "404.html"));
});

// 🚀 DÉMARRAGE DU SERVEUR
app.listen(port, '0.0.0.0', () => {
    console.log(`⚡ Server ultra-rapide sur le port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔄 Initialisation: http://localhost:${port}/init-rapide`);
    console.log(`📚 Livres: http://localhost:${port}/livres`);
});

// Optimisations pour la production
if (process.env.NODE_ENV === 'production') {
    // Compression (à installer: npm install compression)
    const compression = require('compression');
    app.use(compression());
    
    // Cache headers
    app.use((req, res, next) => {
        if (req.method === 'GET') {
            res.set('Cache-Control', 'public, max-age=300');
        }
        next();
    });
}
