// Variables globales pour stocker les données
let livres = [];
const url = "https://bibooks-backend-nnrk.vercel.app/livres";

// Récupération des informations utilisateur depuis le localStorage
const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
const estConnecte = localStorage.getItem("connecté") === "oui";
const estAdmin = utilisateur && utilisateur.role === "admin";
const estAuteur = utilisateur && utilisateur.role === "auteur";
const estUser = utilisateur && utilisateur.role === "user";

// Initialisation de la page au chargement
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Récupération des livres depuis l'API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        "Erreur lors de la recuperation des livres",
        response.status
      );
    }
    livres = await response.json();
    
    // Récupération des éléments DOM
    const profil = document.getElementById("profile");
    const button = document.getElementById("button");
    const buttonIcon = document.getElementById("button-icon");
    const buttonText = document.getElementById("button-text");
    const nom = document.getElementById("nom");
    
    // Configuration du bouton profil si utilisateur non connecté
    if (!utilisateur) {
      profil.onclick = () => (window.location.href = "404");
    }
    
    // Configuration pour les utilisateurs connectés
    if (estConnecte && utilisateur) {
      buttonIcon.className = "fas fa-sign-out-alt";
      buttonText.textContent = "Déconnexion";
      nom.textContent = "Bienvenue " + utilisateur.nom;

      // Affichage du bouton d'ajout pour admin et auteur
      if (estAdmin || estAuteur) {
        document.getElementById("aj").style.display = "block";
      }

      // Configuration des redirections selon le rôle
      if (estAdmin) {
        ajouterBouton("Espace Admin", "admin");
        profil.onclick = () => (window.location.href = "admin");
      } else if (estAuteur) {
        ajouterBouton("Espace Auteur", "auteur");
        profil.onclick = () => (window.location.href = "auteur");
      } else if (estUser) {
        profil.onclick = () => (window.location.href = "profil");
      } else {
        profil.onclick = () => (window.location.href = "404");
      }

      // Configuration du bouton de déconnexion
      button.onclick = () => {
        localStorage.removeItem("connecté");
        localStorage.removeItem("utilisateur");
        window.location.href = "accueil";
      };
    } else {
      // Configuration pour les utilisateurs non connectés
      button.onclick = () => (window.location.href = "connexion");
      document.getElementById("aj").style.display = "none";
    }

    // Configuration de la barre de recherche
    document
      .getElementById("chercher")
      .addEventListener("input", chercher);

    // Affichage des livres ou message d'absence
    if (livres.length > 0) {
      afficher(livres);
    } else {
      document.getElementById("listeLivres").innerHTML =
        "<p>Aucun livre disponible</p>";
    }
  } catch (error) {
    console.error("Erreur lors du chargement de la page:", error);
  }    
});

// Fonction pour ajouter un bouton spécifique selon le rôle
function ajouterBouton(texte, lien) {
  try {
    const btn = document.createElement("button");
    btn.className = "adminBtn";
    btn.textContent = texte;
    btn.onclick = () => (window.location.href = lien);
    document.querySelector(".bouton").appendChild(btn);
  } catch (error) {
    console.error("Erreur lors de l'ajout de bouton:", error);
  }
}

// Fonction pour créer une carte de livre
function creerCarteLivre(livre, id) {
  try {
    const livreDiv = document.createElement("div");
    livreDiv.className = "livre-card";
    livreDiv.innerHTML = `
      <img src="images/${livre.img}" alt="${livre.titre}">
      <h1>${livre.titre}</h1>
      <h3>${livre.auteur}</h3>
      <p><strong>Description:</strong> ${livre.description}</p>
      <p><strong>Genre:</strong> ${livre.genre}</p>
      <p><strong>Prix:</strong> ${Number(livre.prix).toFixed(2)} €</p>
    `;
    console.log(livre.img);
    
    // Création du conteneur pour les actions
    const actions = document.createElement("div");
    actions.className = "actions";

    // Bouton d'ajout aux favoris
    const btnFavoris = document.createElement("button");
    btnFavoris.className = "btn-favoris";
    btnFavoris.innerHTML = '<i class="fas fa-heart"></i> Ajouter aux favoris';
    btnFavoris.onclick = (e) => {
      e.stopPropagation();
      ajouterAuxFavoris(livre);
    };

    // Boutons spécifiques pour les administrateurs
    if (estAdmin) {
      const btnMod = document.createElement("button");
      btnMod.className = "btn-modifier";
      btnMod.textContent = "Modifier";
      btnMod.onclick = (e) => {
        e.stopPropagation();
        modifier(id);
      };

      const btnSup = document.createElement("button");
      btnSup.className = "btn-supprimer";
      btnSup.textContent = "Supprimer";
      btnSup.onclick = (e) => {
        e.stopPropagation();
        supprimer(id);
      };

      actions.appendChild(btnMod);
      actions.appendChild(btnSup);
    }

    livreDiv.appendChild(actions);
    livreDiv.appendChild(btnFavoris);

    // Gestion du clic sur la carte du livre
    livreDiv.addEventListener("click", () => {
      try {
        localStorage.setItem("livreSelectionne", JSON.stringify(livre));
        setTimeout(() => {
          window.location.href = "detail";
        }, 100);
      } catch (error) {
        console.error(
          "Erreur lors de la direction vers la page detail.html",
          error
        );
      }
    });

    return livreDiv;
  } catch (error) {
    console.error("Erreur lors de la création des divs", error);
  }
}

// Fonction pour ajouter un livre aux favoris
function ajouterAuxFavoris(livre) {
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));
  if (!utilisateur) {
    showToast(
      "Vous devez être connecté pour ajouter aux favoris",
      "error"
    );
    return;
  }

  const favoris = JSON.parse(localStorage.getItem("favoris")) || [];

  const existeDeja = favoris.some(
    (f) => f.userId === utilisateur.id && f.livreId === livre.id
  );

  if (!existeDeja) {
    favoris.push({
      userId: utilisateur.id,
      userName: utilisateur.nom,
      livreId: livre.id,
      livreTitre: livre.titre,
      livreImg: livre.img,
      dateAjout: new Date().toISOString(),
    });
    localStorage.setItem("favoris", JSON.stringify(favoris));
    showToast(`${livre.titre} ajouté aux favoris !`, "success");
  } else {
    showToast("Ce livre est déjà dans vos favoris", "info");
  }
}

// Fonction d'affichage des notifications
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("show");
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }, 100);
}

// Fonction d'affichage de la liste des livres
function afficher(liste) {
  try {
    const div = document.getElementById("listeLivres");
    div.innerHTML = "";
    liste.forEach((livre, index) => {
      div.appendChild(creerCarteLivre(livre, livre.id));
    });
  } catch (error) {
    console.error("Erreur lors de l'affichage", error);
  }
}

// Fonction de recherche de livres
function chercher() {
  try {
    const texte = document
      .getElementById("chercher")
      .value.trim()
      .toLowerCase();
    const filtres = livres.filter(
      (livre) =>
        livre.titre.toLowerCase().includes(texte) ||
        livre.auteur.toLowerCase().includes(texte) ||
        livre.genre.toLowerCase().includes(texte) ||
        livre.prix.toString().includes(texte)
    );

    if (filtres.length > 0) {
      document.getElementById("cherche").textContent = "";
      afficher(filtres);
    } else {
      document.getElementById("listeLivres").innerHTML = "";
      document.getElementById("cherche").textContent =
        "Aucun livre trouvé";
    }
  } catch (error) {
    console.error("Erreur lors de la recherche", error);
  }
}

// Fonction de modification d'un livre
async function modifier(id) {
  try {
    const response = await fetch(`${url}/${id}`);
    if (!response.ok) {
      throw new Error(
        "Erreur lors de la récupération du livre",
        response.status
      );
    }
    livre = await response.json();

    // Formatage de la date pour l'input
    const dateObj = new Date(livre.date_publication || livre.date);
    const dateFormatted = dateObj.toISOString().split("T")[0];

    // Remplissage du formulaire avec les données existantes
    document.getElementById("titre").value = livre.titre;
    document.getElementById("auteur").value = livre.auteur;
    document.getElementById("genre").value = livre.genre;
    document.getElementById("Description").value = livre.description;
    document.getElementById("date").value = dateFormatted;
    document.getElementById("prix").value = livre.prix;
    document.getElementById("exp").value = livre.exp;
    document.getElementById("imgPreview").src = `images/${livre.img}`;
    document.getElementById("popup").style.display = "flex";

    document.getElementById("image").value = "";

    // Gestion de la soumission du formulaire
    document.getElementById("form").onsubmit = async (e) => {
      e.preventDefault();

      try {
        // Mise à jour de l'objet livre avec les nouvelles valeurs
        livre.titre = document.getElementById("titre").value;
        livre.auteur = document.getElementById("auteur").value;
        livre.genre = document.getElementById("genre").value;
        livre.description = document.getElementById("Description").value;
        livre.date = document.getElementById("date").value;
        livre.prix = parseFloat(document.getElementById("prix").value);
        livre.exp = parseInt(document.getElementById("exp").value);

        // Gestion de l'image
        const imageInput = document.getElementById("image");
        if (imageInput.files && imageInput.files[0]) {
          const reader = new FileReader();
          reader.onload = function (e) {
            livre.img = e.target.result;
            updateBook(id, livre);
          };
          reader.readAsDataURL(imageInput.files[0]);
        } else {
          await updateBook(id, livre);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la préparation des données:",
          error
        );
        document.getElementById("modification").textContent =
          "Erreur lors de la préparation des données";
        document.getElementById("modification").style.color = "red";
      }
    };
  } catch (error) {
    console.error("Erreur lors de la modification", error);
    document.getElementById("modification").textContent =
      "Erreur lors du chargement du livre";
    document.getElementById("modification").style.color = "red";
  }
}

// Gestion du changement d'image
document.getElementById("image").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("imgPreview").src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Fonction de fermeture de la popup
function fermer() {
  try {
    document.getElementById("popup").style.display = "none";
    document.getElementById("modification").textContent = "";
  } catch (error) {
    console.error("Erreur lors de la fermeture", error);
  }
}

// Fonction de suppression d'un livre
async function supprimer(id) {
  try {
    if (confirm("Voulez-vous vraiment supprimer ce livre ?")) {
      const response = await fetch(`${url}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du livre");
      }
      const res = await fetch(url);
      livres = await res.json();

      afficher(livres);
    }
  } catch (error) {
    console.error("Erreur lors de la suppression de livre", error);
  }
}

// Fonction utilitaire pour mettre à jour un livre (à compléter selon l'API)
async function updateBook(id, livre) {
  try {
    const response = await fetch(`${url}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(livre),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la mise à jour du livre");
    }

    document.getElementById("modification").textContent = 
      "Livre modifié avec succès !";
    document.getElementById("modification").style.color = "green";
    
    // Rechargement des données après modification
    const res = await fetch(url);
    livres = await res.json();
    afficher(livres);
    
    setTimeout(() => {
      fermer();
    }, 2000);
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    document.getElementById("modification").textContent = 
      "Erreur lors de la modification du livre";
    document.getElementById("modification").style.color = "red";
  }
}
