// Variables globales simplifiées
let livresFiltres = [];
let pageCourante = 1;
const livresParPage = 5;

let livres = [];
const urlLivres = "https://bibooks-backend-nnrk.vercel.app/livres";

// Initialisation de la page au chargement
document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM chargé - initialisation...");
    
    // Récupération de l'état de connexion
    const connected = localStorage.getItem("connecté");
    const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));

    // Configuration du menu hamburger pour mobile
    const menuToggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("nav");

    if (menuToggle && nav) {
        menuToggle.addEventListener("click", () => {
            nav.classList.toggle("active");
        });
    }

    // Fermeture du menu lors du clic sur un lien
    document.querySelectorAll("nav a").forEach((link) => {
        link.addEventListener("click", () => {
            if (nav) nav.classList.remove("active");
        });
    });

    // Chargement des livres depuis l'API
    try {
        const response = await fetch(urlLivres);
        if (!response.ok) {
            console.warn("Impossible de charger les livres locaux.");
        } else {
            livres = await response.json();
            afficherNouveautes();
            afficherPopulaires();
        }
    } catch (err) {
        console.error("Erreur lors du chargement des livres:", err);
    }

    // Gestion de l'authentification et des boutons
    const button = document.getElementById("button");
    const buttonIcon = document.getElementById("button-icon");
    const buttonText = document.getElementById("button-text");
    const nom = document.getElementById("nom");
    const profileBtn = document.getElementById("profile");

    if (connected === "oui" && utilisateur) {
        // Configuration pour utilisateur connecté
        buttonIcon.className = "fas fa-sign-out-alt";
        buttonText.textContent = "Déconnexion";
        nom.textContent = "Bienvenue " + utilisateur.nom;

        // Configuration selon le rôle
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

        button.onclick = () => {
            localStorage.removeItem("connecté");
            localStorage.removeItem("utilisateur");
            window.location.reload();
        };
    } else {
        // Configuration pour utilisateur non connecté
        if (button) {
            button.onclick = () => (window.location.href = "connexion");
        }
        if (profileBtn) {
            profileBtn.onclick = () => {
                alert("Vous devez vous connecter d'abord");
                setTimeout(() => {
                    window.location.href = "connexion";
                }, 2000);
            };
        }
    }

    // Configuration des filtres par catégorie
    document.querySelectorAll(".categorie").forEach((btn) => {
        btn.addEventListener("click", () => {
            const filter = btn.getAttribute("data-genre");
            filtrer(filter);
        });
    });

    // Configuration de la recherche
    const searchButton = document.querySelector(".cherches");
    const searchInput = document.getElementById("chercher");
    const suggestions = document.getElementById("suggestions");

    if (searchButton && searchInput) {
        searchButton.addEventListener("click", () => {
            const motCle = searchInput.value.trim();
            if (motCle) {
                chercher(motCle);
            }
        });

        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const motCle = e.target.value.trim();
                if (motCle) {
                    chercher(motCle);
                }
            }
        });

        // Affichage des suggestions de recherche
        searchInput.addEventListener("input", (e) => {
            const value = e.target.value.trim();
            if (value.length > 2) {
                showSuggestions(value);
            } else {
                if (suggestions) suggestions.style.display = "none";
            }
        });
    }

    // Masquage des suggestions lors d'un clic extérieur
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-container") && suggestions) {
            suggestions.style.display = "none";
        }
    });

    // Configuration du mode sombre
    const sombreBtn = document.getElementById("sombre");
    if (sombreBtn) {
        sombreBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark");
            const icon = sombreBtn.querySelector("i");
            const text = sombreBtn.querySelector("span");

            if (document.body.classList.contains("dark")) {
                icon.className = "fas fa-sun";
                text.textContent = "Mode clair";
            } else {
                icon.className = "fas fa-moon";
                text.textContent = "Mode sombre";
            }
        });
    }

    // Configuration du bouton "Voir tous"
    const voirTousBtn = document.getElementById("voir-tous");
    if (voirTousBtn) {
        voirTousBtn.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("livreSelectionne");
            window.location.href = "liste_livres";
        });
    }

    console.log("Initialisation terminée");
});

// Affichage des suggestions de recherche depuis Google Books API
async function showSuggestions(query) {
    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            query
            )}&maxResults=5`
        );
        if (!response.ok) return;

        const data = await response.json();
        const items = data.items || [];

        const suggestions = document.getElementById("suggestions");
        if (!suggestions) return;

        suggestions.innerHTML = "";

        if (items.length > 0) {
            items.forEach((item) => {
                const title = item.volumeInfo.title;
                const div = document.createElement("div");
                div.className = "suggestion-item";
                div.textContent = title;
                div.addEventListener("click", () => {
                    const searchInput = document.getElementById("chercher");
                    if (searchInput) searchInput.value = title;
                    suggestions.style.display = "none";
                    chercher(title);
                });
                suggestions.appendChild(div);
            });
            suggestions.style.display = "block";
        } else {
            suggestions.style.display = "none";
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des suggestions:", error);
    }
}

// Fonction de recherche principale
async function chercher(motCle) {
    const div = document.getElementById("resultats-recherche");
    if (!div) return;
    
    div.innerHTML = `<h3 style="text-align: center; margin-bottom: 30px;">Résultats de la recherche pour : "${motCle}"</h3>`;
    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            motCle
            )}&maxResults=20`
        );
        if (!response.ok) {
            throw new Error("Erreur lors de la recherche sur l'API de Google Books");
        }
        const data = await response.json();
        const resultat = data.items || [];

        if (resultat.length === 0) {
            div.innerHTML += `<p style="text-align: center;">Aucun résultat trouvé.</p>`;
            return;
        }

        const container = document.createElement("div");
        container.className = "livres-container";
        div.innerHTML = "";
        div.appendChild(container);

        resultat.forEach((item) => {
            const livre = {
                titre: item.volumeInfo.title,
                auteur: item.volumeInfo.authors
                    ? item.volumeInfo.authors.join(", ")
                    : "Auteur inconnu",
                img: item.volumeInfo.imageLinks
                    ? item.volumeInfo.imageLinks.thumbnail
                    : "https://via.placeholder.com/150",
                description: item.volumeInfo.description,
                genre: item.volumeInfo.categories 
                    ? item.volumeInfo.categories[0] 
                    : "Non classé",
                date: item.volumeInfo.publishedDate,
                id: item.id,
                exp: 1
            };
            createBookCard(container, livre);
        });
    } catch (error) {
        div.innerHTML += `<p style="text-align: center;">Une erreur est survenue lors de la recherche : ${error.message}</p>`;
        console.error(error);
    }
}

// Filtrage des livres par genre
async function filtrer(genre) {
    const div = document.getElementById("resultat-filtre");
    if (!div) return;
    
    div.innerHTML = `<h3>Chargement des livres ${genre}...</h3>`;

    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=subject:${genre}&maxResults=40`
        );
        if (!response.ok) {
            throw new Error("Erreur lors de la recherche par genre");
        }
        const data = await response.json();
        livresFiltres = data.items || [];
        pageCourante = 1;

        if (livresFiltres.length === 0) {
            div.innerHTML = `<h3>Livres de la catégorie : ${genre}</h3>
                            <p style="text-align: center;">Aucun livre trouvé dans cette catégorie.</p>`;
            return;
        }

        afficherPageFiltree();
    } catch (error) {
        div.innerHTML = `<h3>Livres de la catégorie : ${genre}</h3>
                          <p style="text-align: center;">Une erreur est survenue lors du filtrage : ${error.message}</p>`;
        console.error(error);
    }
}

// Affichage d'une page filtrée avec pagination
function afficherPageFiltree() {
    const div = document.getElementById("resultat-filtre");
    if (!div) return;
    
    const debut = (pageCourante - 1) * livresParPage;
    const fin = debut + livresParPage;
    const livresPage = livresFiltres.slice(debut, fin);
    const totalPages = Math.ceil(livresFiltres.length / livresParPage);

    div.innerHTML = `
        <h3>Livres de la catégorie (Page ${pageCourante}/${totalPages})</h3>
        <div class="livres-container" id="livres-page"></div>
        <div class="pagination-simple">
            <button onclick="changerPage(${pageCourante - 1})" ${
        pageCourante === 1 ? "disabled" : ""
        }>
                <i class="fas fa-chevron-left"></i> Précédent
            </button>
            
            <span class="page-info">Page ${pageCourante} sur ${totalPages}</span>
            
            <button onclick="changerPage(${pageCourante + 1})" ${
        pageCourante === totalPages ? "disabled" : ""
        }>
                Suivant <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;

    const container = document.getElementById("livres-page");
    if (!container) return;
    
    livresPage.forEach((item) => {
        const livre = {
            titre: item.volumeInfo.title,
            auteur: item.volumeInfo.authors
                ? item.volumeInfo.authors.join(", ")
                : "Auteur inconnu",
            img: item.volumeInfo.imageLinks
                ? item.volumeInfo.imageLinks.thumbnail
                : "https://via.placeholder.com/150",
            description: item.volumeInfo.description,
            genre: item.volumeInfo.categories 
                ? item.volumeInfo.categories[0] 
                : "Non classé",
            date: item.volumeInfo.publishedDate,
            id: item.id,
            exp: 1
        };
        createBookCard(container, livre);
    });
}

// Changement de page dans la pagination
function changerPage(nouvellePage) {
    const totalPages = Math.ceil(livresFiltres.length / livresParPage);
    if (nouvellePage >= 1 && nouvellePage <= totalPages) {
        pageCourante = nouvellePage;
        afficherPageFiltree();
        // Scroll vers le haut de la section
        const section = document.getElementById("resultat-filtre");
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }
    }
}

// Sauvegarde d'un livre Google Books dans la base de données
async function sauvegarderLivreGoogle(livreGoogle) {
    try {
        // Pour les livres déjà dans la base locale, retourner l'ID existant
        if (livreGoogle.id && !livreGoogle.id.startsWith('http')) {
            return livreGoogle.id;
        }

        // Vérification de l'existence du livre dans la base
        const response = await fetch(`https://bibooks-backend-nnrk.vercel.app/livres`);
        if (response.ok) {
            const tousLesLivres = await response.json();
            const livreExistant = tousLesLivres.find(
                livre => livre.titre === livreGoogle.titre && livre.auteur === livreGoogle.auteur
            );
            
            if (livreExistant) {
                console.log("Livre déjà existant dans la base:", livreExistant.id);
                return livreExistant.id;
            }
        }

        // Préparation des données pour l'insertion
        const livreData = {
            titre: livreGoogle.titre,
            auteur: livreGoogle.auteur,
            description: livreGoogle.description || "Description non disponible",
            genre: livreGoogle.genre || "Non classé",
            date: livreGoogle.date || new Date().getFullYear().toString(),
            prix: "0.00",
            img: livreGoogle.img || "",
            exp: 1 // Par défaut 1 exemplaire disponible
        };

        console.log("Sauvegarde du livre:", livreData);

        // Création du livre dans la base
        const responseCreation = await fetch("https://bibooks-backend-nnrk.vercel.app/livres", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(livreData),
        });

        if (!responseCreation.ok) {
            throw new Error(`Erreur création livre: ${responseCreation.status}`);
        }

        const resultat = await responseCreation.json();
        console.log("Livre sauvegardé avec ID:", resultat.id);
        return resultat.id;
        
    } catch (error) {
        console.error("Erreur détaillée sauvegarde livre:", error);
        // En cas d'erreur, utilisation d'un ID temporaire
        return 'temp_' + Date.now();
    }
}

// Création d'une carte de livre
function createBookCard(container, livre) {
    const divLivre = document.createElement("div");
    divLivre.className = "livre";
    
    // Gestion sécurisée de l'image
    let imageSrc = "https://via.placeholder.com/150"; // Image par défaut
    if (livre.img && typeof livre.img === 'string') {
        if (livre.img.startsWith("http")) {
            imageSrc = livre.img;
        } else {
            imageSrc = `images/${livre.img}`;
        }
    }
    
    divLivre.innerHTML = `
        <img src="${imageSrc}" alt="${livre.titre || 'Livre sans titre'}" />
        <p class="livre-titre">${livre.titre || 'Titre non disponible'}</p>
        <p class="livre-auteur">${livre.auteur || 'Auteur non spécifié'}</p>
    `;

    // Récupération de l'état de connexion actuel
    const connected = localStorage.getItem("connecté");
    const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));

    // Bouton "Voir détails"
    const details = document.createElement("button");
    details.textContent = "Voir détails";
    details.className = "voir-details";
    details.onclick = async (e) => {
        e.stopPropagation();
        try {
            console.log("Clic sur Voir détails pour:", livre.titre);
            
            // Sauvegarde des livres Google Books
            let livreId = livre.id;
            if (livre.id && livre.id.length > 10) { // Identification des IDs Google Books
                livreId = await sauvegarderLivreGoogle(livre);
            }
            
            // Mise à jour de l'ID du livre
            livre.id = livreId;
            
            // Sauvegarde dans le localStorage
            localStorage.setItem("livreSelectionne", JSON.stringify(livre));
            console.log("Livre sauvegardé dans localStorage, redirection vers detail");
            
            // Redirection
            window.location.href = "detail";
        } catch (error) {
            console.error("Erreur:", error);
            // Redirection même en cas d'erreur
            localStorage.setItem("livreSelectionne", JSON.stringify(livre));
            window.location.href = "detail";
        }
    };
    divLivre.appendChild(details);

    // Bouton "Demander un prêt" (réservé aux utilisateurs connectés non-admin)
    if (connected === "oui" && utilisateur && utilisateur.role !== "admin") {
        const btnPret = document.createElement("button");
        btnPret.className = "demander-pret";
        btnPret.textContent = "Demander un prêt";
        btnPret.style.marginTop = "10px";
        btnPret.onclick = async (e) => {
            e.stopPropagation();
            try {
                console.log("Clic sur Demander un prêt pour:", livre.titre);
                
                // Sauvegarde des livres Google Books
                let livreId = livre.id;
                if (livre.id && livre.id.length > 10) { // Identification des IDs Google Books
                    livreId = await sauvegarderLivreGoogle(livre);
                }
                
                // Mise à jour de l'ID du livre
                livre.id = livreId;
                
                // Sauvegarde dans le localStorage
                localStorage.setItem("livreSelectionne", JSON.stringify(livre));
                console.log("Livre sauvegardé dans localStorage, redirection vers demande_pret");
                
                // Redirection
                window.location.href = "demande_pret";
            } catch (error) {
                console.error("Erreur:", error);
                // Redirection même en cas d'erreur
                localStorage.setItem("livreSelectionne", JSON.stringify(livre));
                window.location.href = "demande_pret";
            }
        };
        divLivre.appendChild(btnPret);
    }

    // Gestion du clic sur la carte du livre
    divLivre.addEventListener("click", async (e) => {
        // Éviter le déclenchement lors du clic sur les boutons
        if (e.target.tagName === 'BUTTON') return;
        
        try {
            console.log("Clic sur la carte livre pour:", livre.titre);
            
            // Sauvegarde des livres Google Books
            let livreId = livre.id;
            if (livre.id && livre.id.length > 10) { // Identification des IDs Google Books
                livreId = await sauvegarderLivreGoogle(livre);
            }
            
            // Mise à jour de l'ID du livre
            livre.id = livreId;
            
            // Sauvegarde dans le localStorage
            localStorage.setItem("livreSelectionne", JSON.stringify(livre));
            console.log("Livre sauvegardé dans localStorage, redirection vers detail");
            
            // Redirection
            window.location.href = "detail";
        } catch (error) {
            console.error("Erreur:", error);
            localStorage.setItem("livreSelectionne", JSON.stringify(livre));
            window.location.href = "detail";
        }
    });

    container.appendChild(divLivre);
}

// Affichage des livres populaires
function afficherPopulaires() {
    const divPopulaires = document.getElementById("populaires");
    if (!divPopulaires) return;
    
    divPopulaires.innerHTML = "";
    const livresPopulaires = livres.slice(0, 6);
    livresPopulaires.forEach((livre) => createBookCard(divPopulaires, livre));
}

// Affichage des nouveautés
function afficherNouveautes() {
    const divNouveautes = document.getElementById("liste-nouveautes");
    if (!divNouveautes) return;
    
    divNouveautes.innerHTML = "";
    const nouveauxLivres = livres.slice(-4).reverse();
    nouveauxLivres.forEach((livre) => createBookCard(divNouveautes, livre));
}
