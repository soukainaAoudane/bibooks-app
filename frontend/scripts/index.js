// Variables globales simplifiées
let livresFiltres = [];
let pageCourante = 1;
const livresParPage = 5;

let livres = [];
const urlLivres = "https://bibooks-app-production.up.railway.app/livres";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM chargé - initialisation...");
    
    // Récupérer l'état de connexion à l'intérieur de l'event listener
    const connected = localStorage.getItem("connecté");
    const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));

    // Menu hamburger pour mobile
    const menuToggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("nav");

    if (menuToggle && nav) {
        menuToggle.addEventListener("click", () => {
            nav.classList.toggle("active");
        });
    }

    // Fermer le menu lorsqu'on clique sur un lien
    document.querySelectorAll("nav a").forEach((link) => {
        link.addEventListener("click", () => {
            if (nav) nav.classList.remove("active");
        });
    });

    // Fetch books from your local server on page load
    try {
        const response = await fetch(urlLivres);
        if (!response.ok) {
            console.warn("Could not load local books.");
        } else {
            livres = await response.json();
            afficherNouveautes();
            afficherPopulaires();
        }
    } catch (err) {
        console.error("Error fetching local books:", err);
    }

    // Gestion de l'authentification
    const button = document.getElementById("button");
    const buttonIcon = document.getElementById("button-icon");
    const buttonText = document.getElementById("button-text");
    const nom = document.getElementById("nom");
    const profileBtn = document.getElementById("profile");

    if (connected === "oui" && utilisateur) {
        buttonIcon.className = "fas fa-sign-out-alt";
        buttonText.textContent = "Déconnexion";
        nom.textContent = "Bienvenue " + utilisateur.nom;

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

    // Catégories
    document.querySelectorAll(".categorie").forEach((btn) => {
        btn.addEventListener("click", () => {
            const filter = btn.getAttribute("data-genre");
            filtrer(filter);
        });
    });

    // Recherche
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

        // Suggestions de recherche
        searchInput.addEventListener("input", (e) => {
            const value = e.target.value.trim();
            if (value.length > 2) {
                showSuggestions(value);
            } else {
                if (suggestions) suggestions.style.display = "none";
            }
        });
    }

    // Cacher les suggestions quand on clique ailleurs
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-container") && suggestions) {
            suggestions.style.display = "none";
        }
    });

    // Mode sombre
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

    // Bouton "Voir tous"
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

// Afficher les suggestions de recherche
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
        console.error("Error fetching suggestions:", error);
    }
}

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

// Fonction pour sauvegarder un livre Google Books dans la base MySQL
async function sauvegarderLivreGoogle(livreGoogle) {
    try {
        // Pour les livres déjà dans la base locale, retourner l'ID existant
        if (livreGoogle.id && !livreGoogle.id.startsWith('http')) {
            return livreGoogle.id;
        }

        // Vérifier si le livre existe déjà dans la base
        const response = await fetch(`https://bibooks-app-production.up.railway.app/livres`);
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

        // Préparer les données du livre pour l'insertion
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

        // Créer le livre dans la base
        const responseCreation = await fetch("https://bibooks-app-production.up.railway.app/livres", {
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
        // En cas d'erreur, on utilise l'ID temporaire pour continuer
        return 'temp_' + Date.now();
    }
}

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

    // Récupérer l'état de connexion actuel
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
            
            // Pour les livres Google Books, sauvegarder d'abord
            let livreId = livre.id;
            if (livre.id && livre.id.length > 10) { // C'est un ID Google Books
                livreId = await sauvegarderLivreGoogle(livre);
            }
            
            // Mettre à jour l'ID du livre
            livre.id = livreId;
            
            // Sauvegarder dans localStorage
            localStorage.setItem("livreSelectionne", JSON.stringify(livre));
            console.log("Livre sauvegardé dans localStorage, redirection vers detail");
            
            // Rediriger
            window.location.href = "detail";
        } catch (error) {
            console.error("Erreur:", error);
            // Même en cas d'erreur, on redirige vers les détails
            localStorage.setItem("livreSelectionne", JSON.stringify(livre));
            window.location.href = "detail";
        }
    };
    divLivre.appendChild(details);

    // Bouton "Demander un prêt" (seulement pour les utilisateurs connectés non-admin)
    if (connected === "oui" && utilisateur && utilisateur.role !== "admin") {
        const btnPret = document.createElement("button");
        btnPret.className = "demander-pret";
        btnPret.textContent = "Demander un prêt";
        btnPret.style.marginTop = "10px";
        btnPret.onclick = async (e) => {
            e.stopPropagation();
            try {
                console.log("Clic sur Demander un prêt pour:", livre.titre);
                
                // Pour les livres Google Books, sauvegarder d'abord
                let livreId = livre.id;
                if (livre.id && livre.id.length > 10) { // C'est un ID Google Books
                    livreId = await sauvegarderLivreGoogle(livre);
                }
                
                // Mettre à jour l'ID du livre
                livre.id = livreId;
                
                // Sauvegarder dans localStorage
                localStorage.setItem("livreSelectionne", JSON.stringify(livre));
                console.log("Livre sauvegardé dans localStorage, redirection vers demande_pret");
                
                // Rediriger
                window.location.href = "demande_pret";
            } catch (error) {
                console.error("Erreur:", error);
                // Même en cas d'erreur, on redirige vers la demande de prêt
                localStorage.setItem("livreSelectionne", JSON.stringify(livre));
                window.location.href = "demande_pret";
            }
        };
        divLivre.appendChild(btnPret);
    }

    // Clic sur la carte du livre
    divLivre.addEventListener("click", async (e) => {
        // Éviter de déclencher quand on clique sur les boutons
        if (e.target.tagName === 'BUTTON') return;
        
        try {
            console.log("Clic sur la carte livre pour:", livre.titre);
            
            // Pour les livres Google Books, sauvegarder d'abord
            let livreId = livre.id;
            if (livre.id && livre.id.length > 10) { // C'est un ID Google Books
                livreId = await sauvegarderLivreGoogle(livre);
            }
            
            // Mettre à jour l'ID du livre
            livre.id = livreId;
            
            // Sauvegarder dans localStorage
            localStorage.setItem("livreSelectionne", JSON.stringify(livre));
            console.log("Livre sauvegardé dans localStorage, redirection vers detail");
            
            // Rediriger
            window.location.href = "detail";
        } catch (error) {
            console.error("Erreur:", error);
            localStorage.setItem("livreSelectionne", JSON.stringify(livre));
            window.location.href = "detail";
        }
    });

    container.appendChild(divLivre);
}

function afficherPopulaires() {
    const divPopulaires = document.getElementById("populaires");
    if (!divPopulaires) return;
    
    divPopulaires.innerHTML = "";
    const livresPopulaires = livres.slice(0, 6);
    livresPopulaires.forEach((livre) => createBookCard(divPopulaires, livre));
}

function afficherNouveautes() {
    const divNouveautes = document.getElementById("liste-nouveautes");
    if (!divNouveautes) return;
    
    divNouveautes.innerHTML = "";
    const nouveauxLivres = livres.slice(-4).reverse();
    nouveauxLivres.forEach((livre) => createBookCard(divNouveautes, livre));
}
