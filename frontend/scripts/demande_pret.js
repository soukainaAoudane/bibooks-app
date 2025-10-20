let livres = [];
let demandes = [];
let prets = [];

const urlLivres = "https://bibooks-app.up.railway.app/livres";
const urlDemandes = "https://bibooks-app.up.railway.app/demandes";
const urlPrets = "https://bibooks-app.up.railway.app/prets";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Charger les données
        const [resLivres, resDemandes, resPrets] = await Promise.all([
            fetch(urlLivres),
            fetch(urlDemandes),
            fetch(urlPrets)
        ]);

        if (!resLivres.ok || !resDemandes.ok || !resPrets.ok) {
            throw new Error("Erreur lors du chargement des données.");
        }

        livres = await resLivres.json();
        demandes = await resDemandes.json();
        prets = await resPrets.json();

        // Gestion de l'authentification
        const connecté = localStorage.getItem("connecté");
        const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
        const button = document.getElementById("button");
        const buttonIcon = document.getElementById("button-icon");
        const buttonText = document.getElementById("button-text");
        const nom = document.getElementById("nom");
        const profileBtn = document.getElementById("profile");
        const administration = document.querySelector('.hidden');

        if (connecté === "oui" && utilisateur) {
            buttonIcon.className = "fas fa-sign-out-alt";
            buttonText.textContent = "Déconnexion";
            nom.textContent = "Bienvenue " + utilisateur.nom;

            if (utilisateur.role === "admin") {
                profileBtn.title = "Espace Admin";
                profileBtn.onclick = () => (window.location.href = "admin");
                administration.style.display = 'block';
            } else {
                profileBtn.title = "Mon Profil";
                profileBtn.onclick = () => (window.location.href = "profil");
            }

            button.onclick = () => {
                localStorage.removeItem("connecté");
                localStorage.removeItem("utilisateur");
                window.location.reload();
            };
        } else {
            profileBtn.onclick = () => (window.location.href = "connexion");
            button.onclick = () => (window.location.href = "connexion");
        }

        // Remplir le nom de l'utilisateur
        if (utilisateur) {
            document.getElementById("nom_emprunteur").value = utilisateur.nom;
        } else {
            alert("Vous devez vous connecter pour effectuer une demande de prêt.");
            window.location.href = "connexion";
            return;
        }

        // Configuration des dates
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("date_pret_demande").min = today;

        const datePretInput = document.getElementById("date_pret_demande");
        const dateRetourInput = document.getElementById("date_retour_demande");

        datePretInput.addEventListener("change", () => {
            const datePret = new Date(datePretInput.value);
            if (isNaN(datePret)) return;

            const maxRetour = new Date(datePret);
            maxRetour.setDate(maxRetour.getDate() + 30);

            dateRetourInput.min = datePretInput.value;
            dateRetourInput.max = maxRetour.toISOString().split("T")[0];

            if (dateRetourInput.value < dateRetourInput.min || dateRetourInput.value > dateRetourInput.max) {
                dateRetourInput.value = dateRetourInput.min;
            }
        });

        // Afficher les livres et gérer la sélection automatique
        afficherLivres();
        await gererSelectionAutomatique();

        const select = document.getElementById("livre_select_demande");
        select.addEventListener("change", afficherDisponibilite);

        // Mode sombre
        const sombreBtn = document.getElementById("sombre");
        sombreBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");

            if (document.body.classList.contains("dark-mode")) {
                sombreBtn.innerHTML = '<i class="fas fa-sun"></i><span> Mode clair</span>';
                localStorage.setItem("darkMode", "enabled");
            } else {
                sombreBtn.innerHTML = '<i class="fas fa-moon"></i><span> Mode sombre</span>';
                localStorage.setItem("darkMode", "disabled");
            }
        });

        if (localStorage.getItem("darkMode") === "enabled") {
            document.body.classList.add("dark-mode");
            sombreBtn.innerHTML = '<i class="fas fa-sun"></i><span> Mode clair</span>';
        }
    } catch (error) {
        console.error(error);
        alert("Impossible de charger les données. Veuillez réessayer plus tard.");
    }
});

// Fonction pour gérer la sélection automatique du livre
async function gererSelectionAutomatique() {
    const livreSelectionne = JSON.parse(localStorage.getItem("livreSelectionne"));
    
    if (!livreSelectionne) {
        console.log("Aucun livre sélectionné dans le localStorage");
        return;
    }

    console.log("Livre sélectionné:", livreSelectionne);
    
    const select = document.getElementById("livre_select_demande");
    if (!select) {
        console.log("Select non trouvé");
        return;
    }
    
    // Attendre un peu que la liste soit peuplée
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let livreTrouve = false;
    
    console.log("Nombre d'options:", select.options.length);
    
    // Rechercher le livre dans la liste des options
    for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        
        // Ignorer l'option vide
        if (option.value === "") continue;
        
        console.log(`Option ${i}:`, option.value, "-", option.text);
        
        // Vérifier par titre et auteur (méthode principale)
        const optionText = option.text.toLowerCase();
        const titreRecherche = livreSelectionne.titre.toLowerCase();
        const auteurRecherche = livreSelectionne.auteur.toLowerCase();
        
        if (optionText.includes(titreRecherche) && optionText.includes(auteurRecherche)) {
            select.selectedIndex = i;
            afficherDisponibilite();
            livreTrouve = true;
            console.log("Livre trouvé par titre/auteur");
            break;
        }
    }

    // Si le livre n'est pas trouvé, l'ajouter comme option Google Books
    if (!livreTrouve) {
        console.log("Ajout du livre comme option Google Books");
        
        // Vérifier si l'option Google Books existe déjà
        let optionExistante = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === "google_books") {
                optionExistante = true;
                break;
            }
        }
        
        if (!optionExistante) {
            const option = document.createElement("option");
            option.value = "google_books";
            option.textContent = `${livreSelectionne.titre} - ${livreSelectionne.auteur}`;
            option.setAttribute("data-google-books", "true");
            
            const copies = livreSelectionne.exp !== undefined ? livreSelectionne.exp : 1;
            option.setAttribute("data-copies", copies);
            
            select.appendChild(option);
        }
        
        select.value = "google_books";
        afficherDisponibilite();
        livreTrouve = true;
        console.log("Livre ajouté et sélectionné comme Google Books");
    }

    if (!livreTrouve) {
        console.log("Livre non trouvé dans la liste après toutes les tentatives");
    }
}

// Fonction pour sauvegarder un livre Google Books
async function sauvegarderLivreSiNecessaire(livre) {
    try {
        // Vérifier si le livre existe déjà
        const response = await fetch(urlLivres);
        const tousLesLivres = await response.json();
        
        const livreExistant = tousLesLivres.find(
            l => l.titre === livre.titre && l.auteur === livre.auteur
        );
        
        if (livreExistant) {
            console.log("Livre existant trouvé:", livreExistant.id);
            return livreExistant.id;
        }

        // Créer le nouveau livre
        const nouveauLivre = {
            titre: livre.titre,
            auteur: livre.auteur,
            description: livre.description || "Description non disponible",
            genre: livre.genre || "Non spécifié",
            date: livre.date || new Date().toISOString().split('T')[0],
            prix: livre.prix || "0.00",
            img: livre.img || "",
            exp: livre.exp !== undefined ? livre.exp : 1
        };

        console.log("Création du livre:", nouveauLivre);

        const responseCreation = await fetch(urlLivres, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(nouveauLivre),
        });

        if (!responseCreation.ok) {
            throw new Error("Erreur lors de la création du livre");
        }

        const resultat = await responseCreation.json();
        console.log("Livre créé avec ID:", resultat.id);
        return resultat.id;
        
    } catch (error) {
        console.error("Erreur sauvegarde livre:", error);
        throw error;
    }
}

function afficherLivres() {
    const select = document.getElementById("livre_select_demande");
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Sélectionner un livre --</option>';

    livres.forEach((livre, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${livre.titre} - ${livre.auteur}`;

        const copies = Number(livre.exp) || 0;
        option.setAttribute("data-copies", copies);

        if (copies <= 0) {
            option.disabled = true;
            option.textContent += " (Indisponible)";
        }

        select.appendChild(option);
    });
    
    console.log("Livres chargés:", livres.length);
}

function afficherDisponibilite() {
    const select = document.getElementById("livre_select_demande");
    const availabilityText = document.getElementById("availability-text");
    const imageEl = document.getElementById("livre-image");
    
    if (!select || !availabilityText) return;
    
    const selectedValue = select.value;

    if (selectedValue !== "") {
        let livre;
        let copies;
        
        if (selectedValue === "google_books") {
            // Livre Google Books
            livre = JSON.parse(localStorage.getItem("livreSelectionne"));
            copies = livre.exp !== undefined ? livre.exp : 1;
            console.log("Livre Google Books sélectionné:", livre.titre);
        } else {
            // Livre existant
            livre = livres[selectedValue];
            copies = Number(livre.exp) || 0;
            console.log("Livre existant sélectionné:", livre.titre);
        }

        if (livre && livre.img) {
    if (livre.img.startsWith('http://') || livre.img.startsWith('https://')) {
        imageEl.src = livre.img;
    } else {
        imageEl.src = `../images/${livre.img}`;
    }
    imageEl.alt = `Image du livre ${livre.titre}`;
    imageEl.style.display = "block";
} else {
    imageEl.style.display = "none";
}


        if (copies > 0) {
            availabilityText.innerHTML = `<i class="fas fa-check-circle"></i> ${copies} exemplaire(s) disponible(s)`;
            availabilityText.className = "book-availability available";
        } else {
            availabilityText.innerHTML = `<i class="fas fa-times-circle"></i> Indisponible actuellement`;
            availabilityText.className = "book-availability unavailable";
        }
    } else {
        availabilityText.textContent = "";
        if (imageEl) imageEl.style.display = "none";
    }
}

document.getElementById("form-demande").addEventListener("submit", async function (e) {
    e.preventDefault();

    const utilisateur = JSON.parse(localStorage.getItem('utilisateur')); 
    if (!utilisateur) {
        showMessage("Vous devez être connecté pour effectuer une demande.", "error");
        window.location.href = "connexion";
        return;
    }

    const email = utilisateur.email;
    const nom = document.getElementById("nom_emprunteur").value.trim();
    const livreValue = document.getElementById("livre_select_demande").value;
    const datePret = document.getElementById("date_pret_demande").value;
    const dateRetour = document.getElementById("date_retour_demande").value;
    const messageEl = document.getElementById("message_demande");
    const submitBtn = document.querySelector(".btn-submit");

    // Réinitialiser le message
    if (messageEl) {
        messageEl.className = "message";
        messageEl.textContent = "";
    }

    // Validation des champs
    if (!nom || livreValue === "" || !datePret || !dateRetour) {
        showMessage("Veuillez remplir tous les champs.", "error");
        return;
    }

    if (datePret > dateRetour) {
        showMessage("La date de prêt doit être avant la date de retour.", "error");
        return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (datePret < today) {
        showMessage("La date de prêt ne peut pas être dans le passé.", "error");
        return;
    }

    const diffTime = Math.abs(new Date(dateRetour) - new Date(datePret));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
        showMessage("La durée maximale de prêt est de 30 jours.", "error");
        return;
    }

    let livre;
    let livreId;

    try {
        // Récupérer l'ID du livre selon le type
        if (livreValue === "google_books") {
            // Sauvegarder le livre Google Books
            const livreGoogle = JSON.parse(localStorage.getItem("livreSelectionne"));
            if (!livreGoogle) {
                showMessage("Livre Google Books non trouvé.", "error");
                return;
            }
            
            console.log("Sauvegarde du livre Google Books:", livreGoogle.titre);
            livreId = await sauvegarderLivreSiNecessaire(livreGoogle);
            livre = { ...livreGoogle, id: livreId };
            
            // Recharger la liste des livres
            const respLivres = await fetch(urlLivres);
            livres = await respLivres.json();
            afficherLivres();
        } else {
            // Livre existant
            livre = livres[livreValue];
            if (!livre) {
                showMessage("Livre sélectionné non trouvé.", "error");
                return;
            }
            livreId = livre.id;
        }

        console.log("Livre ID à utiliser:", livreId);
        console.log("Livre sélectionné:", livre);

        // Vérifier la disponibilité
        if (!livre || (Number(livre.exp) || 0) <= 0) {
            showMessage("Ce livre n'est plus disponible.", "error");
            afficherLivres();
            return;
        }

        // Vérifier les prêts existants
        const aPretNonRendu = prets.some(
            (pret) =>
                pret.nom === nom &&
                pret.livre_id === livreId &&
                pret.statut !== "retourné"
        );

        if (aPretNonRendu) {
            showMessage(
                "Vous avez déjà un prêt actif pour ce livre. Veuillez le rendre avant de faire une nouvelle demande.",
                "error"
            );
            return;
        }

        // Vérifier les demandes existantes
        const demandeExistante = demandes.find(
            d => d.livre_id === livreId &&
                 d.nom === nom &&
                 d.statut === "en attente"
        );

        if (demandeExistante) {
            showMessage("Vous avez déjà une demande en attente pour ce livre.", "error");
            return;
        }
const dateDemande = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

console.log("Date demande formatée:", dateDemande);
        // Préparer les données pour l'API
        const demandeData = {
    nom: nom,
    livre_id: livreId,
    date_pret: datePret,
    date_retour: dateRetour,
    statut: "en attente",
    date_demande: dateDemande
        };

        console.log("Données à envoyer:", demandeData);

        // Désactiver le bouton pendant l'envoi
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = 0.7;
            submitBtn.textContent = "Envoi en cours...";
        }

        // Envoyer la demande
        const response = await fetch(urlDemandes, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(demandeData),
        });

        console.log("Réponse API:", response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Erreur détaillée:", errorText);
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const resultat = await response.json();
        console.log("Demande créée avec succès:", resultat);

        // Afficher le message de succès
        showMessage(
            `Votre demande pour "${livre.titre}" a été envoyée avec succès. Redirection vers l'accueil...`,
            "success"
        );
        
        // Envoyer l'email de confirmation (optionnel)
        try {
            await fetch("https://bibooks-app.up.railway.app/demande-pret", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    nom: nom, 
                    email: email, 
                    date_demande: new Date().toISOString(),
                    livre_titre: livre.titre 
                }),
            });
            console.log("Email de confirmation envoyé");
        } catch (emailError) {
            console.warn("Erreur lors de l'envoi de l'email:", emailError);
            // Ne pas bloquer le processus principal pour une erreur d'email
        }

        // Réinitialiser le formulaire
        this.reset();
        const availabilityText = document.getElementById("availability-text");
        if (availabilityText) {
            availabilityText.textContent = "";
        }
        
        // Nettoyer le localStorage
        localStorage.removeItem("livreSelectionne");
        
        // Recharger les données pour mettre à jour les listes
        const [newLivres, newDemandes] = await Promise.all([
            fetch(urlLivres).then(r => r.json()),
            fetch(urlDemandes).then(r => r.json())
        ]);
        livres = newLivres;
        demandes = newDemandes;
        afficherLivres();

        // Redirection après succès
        setTimeout(() => {
            window.location.href = "accueil";
        }, 3000);

    } catch (error) {
        console.error("Erreur détaillée lors de la soumission:", error);
        showMessage(
            error.message || "Une erreur est survenue lors de l'envoi de la demande. Veuillez réessayer.", 
            "error"
        );
    } finally {
        // Réactiver le bouton
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = 1;
            submitBtn.textContent = "Envoyer la demande";
        }
    }
});

// Fonction showMessage améliorée
function showMessage(text, type) {
    const messageEl = document.getElementById("message_demande");
    if (!messageEl) {
        console.error("Élément message_demande non trouvé");
        // Créer un message d'urgence
        alert(`${type.toUpperCase()}: ${text}`);
        return;
    }
    
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = "block";

    if (type === "success") {
        // Le message de succès reste affiché jusqu'à la redirection
        messageEl.style.display = "block";
    } else {
        // Les messages d'erreur disparaissent après 5 secondes
        setTimeout(() => {
            messageEl.style.display = "none";
            messageEl.textContent = "";
        }, 5000);
    }
}
