// URL de l'API pour les livres
const urlLivres = "https://bibooks-backend-nnrk.vercel.app/livres";
// Variable globale pour stocker les livres
let livres = [];

// Chargement initial des livres
fetch(urlLivres)
    .then(response => response.json())
    .then(data => {
        livres = data;
    })
    .catch(error => {
        console.error('Erreur:', error);
    });

// Initialisation au chargement du DOM
document.addEventListener("DOMContentLoaded", async () => {
    // Rechargement des livres pour s'assurer d'avoir les données à jour
    const response = await fetch(urlLivres);
    livres = await response.json();

    // Récupération des informations de connexion
    const connecté = localStorage.getItem("connecté");
    const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));

    // Récupération des éléments DOM
    const nom = document.getElementById("nom");
    const profileBtn = document.getElementById("profile");
    const button = document.getElementById("button");
    const buttonIcon = document.getElementById("button-icon");
    const buttonText = document.getElementById("button-text");

    // Vérification des autorisations d'accès
    if (connecté !== "oui" || !utilisateur || (utilisateur.role !== "admin" && utilisateur.role !== "auteur")) {
        window.location.href = "connexion";
        return;
    }

    // Configuration spécifique pour les auteurs
    if (utilisateur.role === "auteur") {
        document.getElementById("auteur").value = utilisateur.nom;
        document.getElementById("auteur").readOnly = true;
    }

    // Gestion de l'état de connexion et des boutons
    if (connecté === "oui" && utilisateur) {
        buttonIcon.className = "fas fa-sign-out-alt";
        buttonText.textContent = "Déconnexion";
        nom.textContent = "Bienvenue " + utilisateur.nom;
        button.onclick = () => {
            localStorage.removeItem("connecté");
            localStorage.removeItem("utilisateur");
            window.location.href = "accueil";
        };
    } else {
        button.onclick = () => {
            window.location.href = "inscription";
        };
    }

    // Configuration du profil selon le rôle
    if (utilisateur.role === "admin") {
        profileBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
        profileBtn.title = "Espace Admin";
        profileBtn.onclick = () => (window.location.href = "admin");
    } else if (utilisateur.role === "auteur") {
        profileBtn.innerHTML = '<i class="fas fa-cog"></i>';
        profileBtn.title = "Espace Auteur";
        profileBtn.onclick = () => (window.location.href = "auteur");
    }

    // Gestion de l'upload d'image
    const imageInput = document.getElementById("image");
    const imgPreview = document.getElementById("imgPreview");
    const fileName = document.getElementById("file-name");

    imageInput.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
            // Vérification de la taille du fichier (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                showMessage("L'image ne doit pas dépasser 2MB", "error");
                return;
            }

            // Affichage du nom du fichier
            fileName.textContent = file.name;

            // Création de l'aperçu de l'image
            const reader = new FileReader();
            reader.onload = function (e) {
                imgPreview.src = e.target.result;
                imgPreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });

    // Gestion de la soumission du formulaire
    const form = document.getElementById("ajoutForm");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Rechargement des livres pour vérifier les doublons
        try {
            const response = await fetch(urlLivres);
            livres = await response.json();
        } catch (error) {
            console.error("Erreur:", error);
        }

        // Vérification de la présence d'une image
        const file = imageInput.files[0];
        if (!file) {
            showMessage("Veuillez sélectionner une image", "error");
            return;
        }

        // Préparation des données du nouveau livre
        const nouveauLivre = {
            titre: form.titre.value.trim(),
            auteur: form.auteur.value.trim(),
        };

        // Validation des champs numériques
        if (isNaN(form.prix.value) || isNaN(form.exp.value)) {
            showMessage("Veuillez entrer un prix et un nombre d'exemplaires valides", "error");
            return;
        }

        // Vérification des doublons
        const livreExiste = livres.some(
            l =>
                l.titre.toLowerCase() === nouveauLivre.titre.toLowerCase() &&
                l.auteur.toLowerCase() === nouveauLivre.auteur.toLowerCase()
        );

        if (livreExiste) {
            showMessage("Ce livre existe déjà", "error");
            return;
        }

        // Envoi des données via FormData
        const formData = new FormData(form);
        ajouter(formData);
    });

    // Fonction d'affichage des messages
    function showMessage(message, type) {
        const messageDiv = document.getElementById("ajout");
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = "block";

        // Disparition automatique après 5 secondes
        setTimeout(() => {
            messageDiv.style.display = "none";
        }, 5000);
    }

    // Fonction d'ajout du livre à l'API
    async function ajouter(formData) {
        try {
            const response = await fetch(urlLivres, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors de l'ajout du livre");
            }

            showMessage("Livre ajouté avec succès ! Redirection...", "success");
            // Redirection après succès
            setTimeout(() => {
                window.location.href = "liste_livres";
            }, 1500);
        } catch (error) {
            showMessage(error.message, "error");
        }
    }

    // Gestion du mode sombre
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

    // Restauration du mode sombre depuis le localStorage
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
        sombreBtn.innerHTML = '<i class="fas fa-sun"></i><span> Mode clair</span>';
    }
});
