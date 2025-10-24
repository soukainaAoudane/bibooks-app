// Initialisation de la page au chargement
document.addEventListener("DOMContentLoaded", async () => {
    // Variables globales pour stocker les données
    let prets = [];
    let demandes = [];
    let livres = [];
    let livreSelectionne = null;
    
    // URLs de l'API pour les différentes ressources
    const urlPrets = "https://bibooks-backend-nnrk.vercel.app/prets";
    const urlDemandes = "https://bibooks-backend-nnrk.vercel.app/demandes";
    const urlLivres = "https://bibooks-backend-nnrk.vercel.app/livres";
    
    // Récupération de l'état de connexion et des données utilisateur
    const connecté = localStorage.getItem("connecté");
    const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
    livreSelectionne = JSON.parse(localStorage.getItem("livreSelectionne"));

    // Chargement et initialisation des différentes fonctionnalités
    await chargerDonnees();
    afficherDetailsLivre();
    gererAuthentification();
    gererDemandePret();
    afficherLivresSimilaires();
    
    // Gestion des avis
    const avis = await fetchAvis(livreSelectionne.id);
    afficherAvis(avis);
    afficherLienAvis();
    
    // Configuration du mode sombre
    document.getElementById("sombre").addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const icon = document.querySelector("#sombre i");
        const isDark = document.body.classList.contains("dark");
        icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
        document.getElementById("sombre").innerHTML = 
            `<i class="${icon.className}"></i> ${isDark ? "Mode clair" : "Mode sombre"}`;
    });

    // Fonction de chargement des données depuis l'API
    async function chargerDonnees() {
        try {
            // Chargement parallèle des différentes données
            const [resPrets, resDemandes, resLivres] = await Promise.all([
                fetch(urlPrets),
                fetch(urlDemandes),
                fetch(urlLivres)
            ]);
            
            // Vérification des réponses
            if (!resPrets.ok || !resDemandes.ok || !resLivres.ok) {
                throw new Error("Erreur lors du chargement des données");
            }
            
            // Conversion des réponses en JSON
            prets = await resPrets.json();
            demandes = await resDemandes.json();
            livres = await resLivres.json();
        } catch (error) {
            console.error("Erreur:", error);
            alert("Une erreur est survenue lors du chargement des données");
        }
    }

    // Affichage des détails du livre sélectionné
    function afficherDetailsLivre() {
        // Redirection si aucun livre n'est sélectionné
        if (!livreSelectionne) {
            window.location.href = "accueil";
            return;
        }

        const imgElement = document.getElementById("img");
        // Gestion des images (URL externes vs chemins locaux)
        if (livreSelectionne.img && (livreSelectionne.img.startsWith('http://') || livreSelectionne.img.startsWith('https://'))) {
            imgElement.src = livreSelectionne.img; // URL externe directe
        } else {
            imgElement.src = livreSelectionne.img 
                ? `images/${livreSelectionne.img}` 
                : "images/placeholder.jpg"; // Image par défaut
        }
        imgElement.alt = livreSelectionne.titre;

        // Affichage des informations du livre
        document.getElementById("titre").textContent = livreSelectionne.titre;
        document.getElementById("auteur").textContent = `Par ${livreSelectionne.auteur}`;
        document.getElementById("description").textContent = 
            livreSelectionne.description || "Aucune description disponible pour ce livre.";
        document.getElementById("genre").textContent = livreSelectionne.genre || "Non spécifié";
        document.getElementById("date").textContent = livreSelectionne.date
            ? new Date(livreSelectionne.date).toLocaleDateString("fr-FR")
            : "Date non disponible";
        document.getElementById("prix").textContent = livreSelectionne.prix 
            ? `${Number(livreSelectionne.prix).toFixed(2)} €` 
            : "N/A";
        
        // Gestion des exemplaires disponibles
        const expValue = livreSelectionne.exp !== undefined ? livreSelectionne.exp : 1;
        document.getElementById("exp").textContent = 
            expValue || "Information non disponible";

        // Configuration du bouton de demande de prêt
        const btnPret = document.getElementById("demander-pret");
        if (expValue <= 0) {
            btnPret.disabled = true;
            btnPret.textContent = "Indisponible";
            btnPret.style.backgroundColor = "#ccc";
        } else {
            btnPret.disabled = false;
            btnPret.textContent = "Demander un prêt";
            btnPret.style.backgroundColor = ""; // Style par défaut
        }
    }

    // Gestion de l'authentification et des boutons utilisateur
    function gererAuthentification() {
        const button = document.getElementById("button");
        const buttonIcon = document.getElementById("button-icon");
        const buttonText = document.getElementById("button-text");
        const nom = document.getElementById("nom");
        const profileBtn = document.getElementById("profile");

        if (connecté === "oui" && utilisateur) {
            // Configuration pour utilisateur connecté
            buttonIcon.className = "fas fa-sign-out-alt";
            buttonText.textContent = "Déconnexion";
            nom.textContent = `Bienvenue ${utilisateur.nom}`;

            // Configuration selon le rôle utilisateur
            if (utilisateur.role === "admin") {
                profileBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
                profileBtn.title = "Espace Admin";
                profileBtn.onclick = () => (window.location.href = "admin");
            } else if (utilisateur.role === "auteur") {
                profileBtn.innerHTML = '<i class="fas fa-user-edit"></i>';
                profileBtn.title = "Espace Auteur";
                profileBtn.onclick = () => (window.location.href = "auteur");
            } else {
                profileBtn.onclick = () => (window.location.href = "profil");
            }

            // Déconnexion
            button.onclick = () => {
                localStorage.removeItem("connecté");
                localStorage.removeItem("utilisateur");
                window.location.href = "accueil";
            };
        } else {
            // Configuration pour utilisateur non connecté
            button.onclick = () => (window.location.href = "connexion");
            profileBtn.onclick = () => (window.location.href = "connexion");
        }
    }

    // Gestion des demandes de prêt
    function gererDemandePret() {
        document.getElementById("demander-pret").addEventListener("click", async () => {
            if (!livreSelectionne) return;

            if (connecté === "oui" && utilisateur) {
                try {
                    // Vérification des demandes existantes
                    const responseDemandes = await fetch("https://bibooks-backend-nnrk.vercel.app/demandes");
                    const demandes = await responseDemandes.json();
                    
                    const demandeExistante = demandes.find(
                        d => d.livre_id === livreSelectionne.id &&
                             d.nom === utilisateur.nom &&
                             d.statut === "en attente"
                    );

                    if (demandeExistante) {
                        alert("Vous avez déjà une demande en attente pour ce livre.");
                        return;
                    }

                    // Vérification des prêts existants
                    const responsePrets = await fetch("https://bibooks-backend-nnrk.vercel.app/prets");
                    const prets = await responsePrets.json();
                    
                    const livreEmprunte = prets.find(
                        e => e.livre_id === livreSelectionne.id &&
                             e.nom === utilisateur.nom &&
                             e.statut === "emprunté"
                    );

                    if (livreEmprunte) {
                        alert("Vous avez déjà emprunté ce livre.");
                        return;
                    }

                    // Sauvegarde pour la page de demande de prêt
                    localStorage.setItem("livreSelectionne", JSON.stringify(livreSelectionne));
                    window.location.href = "demande_pret";
                    
                } catch (error) {
                    console.error("Erreur lors de la vérification:", error);
                    alert("Une erreur est survenue. Veuillez réessayer.");
                }
            } else {
                alert("Veuillez vous connecter pour faire une demande de prêt.");
                window.location.href = "connexion";
            }
        });
    }

    // Affichage des livres similaires
    function afficherLivresSimilaires() {
        const container = document.getElementById("livres-similaires");
        container.innerHTML = "";

        if (!livreSelectionne) return;

        // Filtrage des livres par genre (excluant le livre actuel)
        const similaires = livres.filter(
            livre => livre.genre === livreSelectionne.genre &&
                    livre.titre !== livreSelectionne.titre
        ).slice(0, 4); // Limite à 4 livres

        if (similaires.length === 0) {
            container.innerHTML = `
                <div class="no-similar-books" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                    Aucun autre livre similaire trouvé.
                </div>
            `;
            return;
        }

        // Création des cartes de livres similaires
        similaires.forEach(livre => {
            const bookElement = document.createElement("div");
            bookElement.className = "similar-book";
            
            // Gestion des images
            let imageSrc = "images/placeholder.jpg";
            if (livre.img) {
                if (livre.img.startsWith('http://') || livre.img.startsWith('https://')) {
                    imageSrc = livre.img;
                } else {
                    imageSrc = `images/${livre.img}`;
                }
            }
            
            bookElement.innerHTML = `
                <img src="${imageSrc}" alt="${livre.titre}">
                <h3>${livre.titre}</h3>
                <p>${livre.auteur}</p>
                <p class="availability">${livre.exp > 0 ? 'Disponible' : 'Indisponible'}</p>
            `;

            // Navigation vers les détails du livre similaire
            bookElement.addEventListener("click", () => {
                localStorage.setItem("livreSelectionne", JSON.stringify(livre));
                window.location.href = "detail";
            });

            container.appendChild(bookElement);
        });
    }

    // Récupération des avis depuis l'API
    async function fetchAvis(livreId) {
        try {
            const res = await fetch(`https://bibooks-backend-nnrk.vercel.app/avis?livre_id=${livreId}`);
            if (!res.ok) return [];
            return await res.json();
        } catch (error) {
            console.error("Erreur fetch avis", error);
            return [];
        }
    }

    // Affichage des avis existants
    function afficherAvis(avisList) {
        const container = document.getElementById("avis-liste");
        container.innerHTML = "";

        if (avisList.length === 0) {
            container.innerHTML = `
                <div class="no-reviews">
                    Aucun avis pour ce livre.
                </div>
            `;
            return;
        }

        // Création des cartes d'avis
        avisList.forEach(avis => {
            const reviewElement = document.createElement("div");
            reviewElement.className = "review-card";
            reviewElement.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${avis.utilisateur_nom}</span>
                </div>
                <div class="review-rating">
                    ${"★".repeat(avis.note)}${"☆".repeat(5 - avis.note)}
                </div>
                <div class="review-content">
                    ${avis.commentaire}
                </div>
            `;
            container.appendChild(reviewElement);
        });
    }

    // Vérification de l'éligibilité pour laisser un avis
    function peutDonnerAvis(prets, utilisateur, livreId) {
        return prets.some(
            p => p.nom === utilisateur.nom && 
                 p.livre_id === livreId && 
                 p.statut === "retourné"
        );
    }

    // Affichage du lien pour laisser un avis
    function afficherLienAvis() {
        const container = document.getElementById("avis-lien-container");
        container.innerHTML = "";

        if (connecté === "oui" && utilisateur && peutDonnerAvis(prets, utilisateur, livreSelectionne.id)) {
            const btn = document.createElement("button");
            btn.className = "add-review-btn";
            btn.innerHTML = '<i class="fas fa-pen"></i> Laisser un avis';
            btn.addEventListener("click", () => {
                localStorage.setItem("livreSelectionne", JSON.stringify(livreSelectionne));
                window.location.href = "laisser_avis";
            });
            container.appendChild(btn);
        } else if (connecté !== "oui") {
            container.innerHTML = `<p style="color: #666;">Veuillez vous connecter pour laisser un avis.</p>`;
        } 
    }
});
