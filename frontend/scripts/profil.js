let livres = [];
let demandes = [];
let prets = [];
let utilisateurs = [];
let utilisateur = JSON.parse(localStorage.getItem("utilisateur")) || {};
const connecté = localStorage.getItem("connecté");

// Initialisation de la page
document.addEventListener("DOMContentLoaded", () => {
  verifierCompte();
  chargerDonnees();
  configurerBoutons();
  
  if (utilisateur.role === 'auteur') {
    document.getElementById('pro').href = 'auteur';
  }
});

async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erreur lors de la récupération de ${url}`);
  return res.json();
}

async function chargerDonnees() {
  try {
    [livres, prets, demandes, utilisateurs] = await Promise.all([
      fetchData("https://bibooks-app-production.up.railway.app/livres"),
      fetchData("https://bibooks-app-production.up.railway.app/prets"),
      fetchData("https://bibooks-app-production.up.railway.app/demandes"),
      fetchData("https://bibooks-app-production.up.railway.app/utilisateurs")
    ]);

    afficherDemandes(utilisateur);
    afficherEmprunts(prets, livres, utilisateur, demandes);
    verifierEtatUtilisateur(prets, utilisateur);
    afficherLivresRendu(prets, livres, utilisateur);
    afficherFavoris();
    if (demandeRefuse(demandes, utilisateur)) {
      showToast("Votre demande a été refusée", "error");
    }
  } catch (error) {
    console.error(error);
    showToast("Erreur lors du chargement des données", "error");
  }
}

function configurerBoutons() {
  const button = document.getElementById("button");
  const buttonIcon = document.getElementById("button-icon");
  const buttonText = document.getElementById("button-text");

  // Vérifier si l'utilisateur est connecté
  const estConnecte = localStorage.getItem("connecté") === "oui" && utilisateur.nom;

  if (estConnecte) {
    // Utilisateur connecté - bouton Déconnexion
    buttonIcon.className = "fas fa-sign-out-alt";
    buttonText.textContent = "Déconnexion";
    button.onclick = () => {
      localStorage.removeItem("connecté");
      localStorage.removeItem("utilisateur");
      location.href = "accueil";
    };

    // Afficher les infos utilisateur
    if (utilisateur.nom) {
      document.getElementById("nom_affichage").textContent = utilisateur.nom;
      document.getElementById("email").textContent = utilisateur.email;
      document.getElementById("nom_modifier").value = utilisateur.nom;
      document.getElementById("email_modifier").value = utilisateur.email;
      
      const avatar = document.getElementById("profile-avatar");
      const initials = utilisateur.nom
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      avatar.textContent = initials;
    }
  } else {
    // Utilisateur NON connecté - bouton Connexion
    buttonIcon.className = "fas fa-sign-in-alt";
    buttonText.textContent = "Connexion";
    button.onclick = () => (location.href = "connexion");
    
    // Rediriger immédiatement vers la connexion
    showToast("Veuillez vous connecter pour accéder à votre profil", "warning");
    setTimeout(() => {
      location.href = "connexion";
    }, 1500);
    return; // Arrêter l'exécution pour éviter les erreurs
  }

  document.querySelector(".popup form").onsubmit = async (e) => {
    e.preventDefault();
    await modifier();
  };

  document.getElementById("sombre").onclick = () => {
    document.body.classList.toggle("dark-mode");
    showToast(
      `Mode ${
        document.body.classList.contains("dark-mode") ? "sombre" : "clair"
      } activé`
    );
  };
}

function demandeRefuse(demandes, utilisateur) {
  if (localStorage.getItem('notification_refus') === 'true') {
    return false;
  }
  
  const demandeRefuseeExistante = demandes.some(
    (d) => d.statut === "refusé" && d.nom === utilisateur.nom
  );
  
  if (demandeRefuseeExistante) {
    localStorage.setItem('notification_refus', 'true');
  }
  
  return demandeRefuseeExistante;
}

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

async function hashage(MotDePasse) {
  const encodeur = new TextEncoder();
  const donnees = encodeur.encode(MotDePasse);
  const calculer = await crypto.subtle.digest("SHA-256", donnees);
  const tableau = Array.from(new Uint8Array(calculer));
  return tableau.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function joursDeRetard(dateRetour) {
  const now = new Date();
  const retour = new Date(dateRetour);
  return Math.floor((now - retour) / (1000 * 60 * 60 * 24));
}

function compteADelete(prets, utilisateur) {
  return prets.some(
    (pret) =>
      pret.nom === utilisateur.nom && joursDeRetard(pret.date_retour) > 10
  );
}

async function verifierCompte() {
  if (!utilisateur.nom) return;
  
  try {
    const prets = await fetchData("https://bibooks-app-production.up.railway.app/prets");
    if (compteADelete(prets, utilisateur)) {
      showToast(
        "Votre compte a été supprimé car vous avez un prêt en retard de plus de 10 jours.",
        "error"
      );
      localStorage.removeItem("utilisateur");
      localStorage.removeItem("connecté");
      await supprimerPretsUtilisateur(utilisateur.nom);
      setTimeout(() => {
        location.href = "accueil";
      }, 2000);
    }
  } catch (e) {
    console.error(e);
  }
}

async function supprimerPretsUtilisateur(nom) {
  const prets = await fetchData("https://bibooks-app-production.up.railway.app/prets");
  const pretsASupprimer = prets.filter((pret) => pret.nom === nom);
  
  for (const pret of pretsASupprimer) {
    await fetch(`https://bibooks-app-production.up.railway.app/prets/${pret.id}`, {
      method: "DELETE",
    });
  }
}

async function modifier() {
  const nom = document.getElementById("nom_modifier").value.trim();
  const email = document.getElementById("email_modifier").value.trim();
  const password = document.getElementById("password").value.trim();
  const nouveau_password = document.getElementById("nouveau_password").value.trim();

  let hashedPsd = await hashage(password);

  const user = utilisateurs.find(
    (u) => u.email === utilisateur.email && u.mot_de_passe === hashedPsd
  );

  if (!user) {
    showToast("Mot de passe incorrect.", "error");
    return;
  }

  user.nom = nom;
  user.email = email;

  if (nouveau_password) {
    user.mot_de_passe = await hashage(nouveau_password);
  }

  await fetch(`https://bibooks-app-production.up.railway.app/utilisateurs/${user.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  localStorage.setItem("utilisateur", JSON.stringify(user));
  await fetch("https://bibooks-app-production.up.railway.app/changement-mot-de-passe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, email }),
  });
  showToast("Profil mis à jour avec succès !", "success");
  setTimeout(() => location.reload(), 1500);
}

function afficherEmprunts(prets, livres, utilisateur, demandes) {
  const container = document.getElementById("mes-emprunts");
  container.innerHTML = "";
  const mesPrets = prets.filter((pret) => pret.nom === utilisateur.nom && pret.statut !== "retourné");
  
  if (mesPrets.length === 0) {
    container.innerHTML = `<div class="livre-card empty-message">Vous n'avez aucun prêt en cours.</div>`;
    document.getElementById("emp").textContent = "0";
    return;
  }
  
  document.getElementById("emp").textContent = mesPrets.length;

  const aujourdHui = new Date().toISOString().split("T")[0];
  mesPrets.forEach((pret, index) => {
    const livre = livres.find((l) => l.id === pret.livre_id);
    if (!livre) return;
    
    const enRetard = pret.date_retour < aujourdHui;
    const pretDiv = document.createElement("div");
    pretDiv.className = "livre-card";
    
    if (enRetard) {
      pretDiv.style.border = "2px solid var(--error-color)";
      pretDiv.style.backgroundColor = "rgba(230, 57, 70, 0.1)";
    }
    
    pretDiv.innerHTML = `
      <div class="livre-content">
        <div class="livre-img">
          <img src="images/${livre.img}" alt="${livre.titre}" onerror="this.src='images/default-book.jpg'">
        </div>
        <div class="livre-info">
          <h3>${livre.titre}</h3>
          <p><strong>Auteur :</strong> ${livre.auteur}</p>
          <p><strong>Date de prêt :</strong> ${new Date(pret.date_pret).toLocaleDateString()}</p>
          <p class="${enRetard ? "en-retard" : ""}">
            <strong>Date de retour :</strong> ${new Date(pret.date_retour).toLocaleDateString()} ${enRetard ? "(En retard)" : ""}
          </p>
        </div>
      </div>
      <div class="livre-actions">
        <button onclick="retourLivre(${pret.id})" style="background: var(--primary-color); color: white;">
          <i class="fas fa-book"></i> Retourner ce livre
        </button>
      </div>
    `;
    container.appendChild(pretDiv);
  });
}

async function afficherFavoris() {
  const container = document.getElementById("mes-favories");
  container.innerHTML = "";
  
  const favoris = JSON.parse(localStorage.getItem("favoris")) || [];
  const favorisUtilisateur = favoris.filter(f => f.userId === utilisateur.id);
  
  document.getElementById("fav").textContent = favorisUtilisateur.length;

  if (favorisUtilisateur.length === 0) {
    container.innerHTML = `
      <div class="livre-card empty-message">
        <i class="fas fa-heart"></i>
        <p>Vous n'avez aucun livre dans vos favoris.</p>
      </div>
    `;
    return;
  }

  for (const favori of favorisUtilisateur) {
    try {
      const response = await fetch(`https://bibooks-app-production.up.railway.app/livres/${favori.livreId}`);
      if (!response.ok) continue;
      
      const livre = await response.json();
      const livreDiv = document.createElement("div");
      livreDiv.className = "livre-card";
      livreDiv.innerHTML = `
        <div class="livre-content">
          <div class="livre-img">
            <img src="images/${livre.img}" alt="${livre.titre}" onerror="this.src='images/default-book.jpg'">
          </div>
          <div class="livre-info">
            <h3>${livre.titre}</h3>
            <p><strong>Auteur:</strong> ${livre.auteur}</p>
            <p><strong>Genre:</strong> ${livre.genre}</p>
            <p><strong>Prix:</strong> ${livre.prix} €</p>
          </div>
        </div>
        <div class="livre-actions">
          <button onclick="supprimerFavori(${livre.id})" style="background: var(--error-color); color: white;">
            <i class="fas fa-trash"></i> Retirer des favoris
          </button>
          <button onclick="emprunterLivre(${livre.id})" style="background: var(--primary-color); color: white;">
            <i class="fas fa-book"></i> Emprunter
          </button>
        </div>
      `;
      container.appendChild(livreDiv);
    } catch (error) {
      console.error("Erreur lors du chargement du livre favori:", error);
    }
  }
}

function supprimerFavori(livreId) {
  const favoris = JSON.parse(localStorage.getItem("favoris")) || [];
  const nouveauxFavoris = favoris.filter(f => 
    !(f.userId === utilisateur.id && f.livreId === livreId)
  );
  
  localStorage.setItem("favoris", JSON.stringify(nouveauxFavoris));
  showToast("Livre retiré des favoris", "success");
  afficherFavoris();
}

function afficherLivresRendu(prets, livres, utilisateur) {
  const container = document.getElementById("mes-rendu");
  container.innerHTML = "";
  
  const mesPretsRendu = prets.filter(pret => 
    pret.nom === utilisateur.nom && 
    pret.statut === "retourné"
  );

  if (mesPretsRendu.length === 0) {
    container.innerHTML = `
      <div class="livre-card empty-message">
        <i class="fas fa-book-open"></i>
        <p>Vous n'avez aucun prêt rendu.</p>
      </div>
    `;
    document.getElementById("rend").textContent = "0";
    return;
  }

  document.getElementById("rend").textContent = mesPretsRendu.length;

  mesPretsRendu.forEach((pret) => {
    const livre = livres.find((l) => l.id === pret.livre_id);
    if (!livre) return;

    const pretDiv = document.createElement("div");
    pretDiv.className = "livre-card";
    pretDiv.innerHTML = `
      <div class="livre-content">
        <div class="livre-img">
          <img src="images/${livre.img}" alt="${livre.titre}" onerror="this.src='images/default-book.jpg'">
        </div>
        <div class="livre-info">
          <h3>${livre.titre}</h3>
          <p><strong>Auteur:</strong> ${livre.auteur}</p>
          <p><strong>Date de prêt:</strong> ${new Date(pret.date_pret).toLocaleDateString()}</p>
          <p><strong>Date de retour:</strong> ${new Date(pret.date_retour).toLocaleDateString()}</p>
          <p class="statut-accepté">
            <strong>Statut:</strong> Retourné
          </p>
        </div>
      </div>
      <div class="livre-actions">
        <button onclick="emprunterLivre(${livre.id})" style="background: var(--primary-color); color: white;">
          <i class="fas fa-book"></i> Emprunter à nouveau
        </button>
      </div>
    `;
    container.appendChild(pretDiv);
  });
}

async function retourLivre(pretId) {
  if (!confirm("Confirmez-vous le retour de ce livre ?")) return;
  
  try {
    const response = await fetch(`https://bibooks-app-production.up.railway.app/prets/${pretId}`, {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({statut: "retourné"}),
    });

    if (!response.ok) {
      throw new Error("Erreur lors du retour du livre");
    }

    const pret = prets.find(p => p.id === pretId);
    if (pret) {
      const livre = livres.find(l => l.id === pret.livre_id);
      if (livre) {
        localStorage.setItem('livreSelectionne', JSON.stringify(livre));
        livre.exp = (livre.exp || 0) + 1;
        await fetch(`https://bibooks-app-production.up.railway.app/livres/${livre.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exp: livre.exp })
        });
      }
    }

    showToast("Merci d'avoir retourné le livre !", "success");
    window.location.href='laisser_avis';
    setTimeout(() => chargerDonnees(), 1000);
  } catch (e) {
    console.error(e);
    showToast("Erreur lors du retour du livre.", "error");
  }
}

async function emprunterLivre(livreId) {
  window.location.href='demande_pret';
}

function aUnPretEnRetard(prets, utilisateur) {
  const aujourdHui = new Date().toISOString().split("T")[0];
  return prets.some(
    (pret) =>
      pret.nom === utilisateur.nom && 
      pret.date_retour < aujourdHui && 
      pret.statut !== "retourné"
  );
}

function verifierEtatUtilisateur(prets, utilisateur) {
  if (aUnPretEnRetard(prets, utilisateur)) {
    bloquerUtilisateur();
  } else {
    debloquerUtilisateur();
  }
}

function bloquerUtilisateur() {
  showToast(
    "Vous avez un prêt en retard. Veuillez le retourner avant de pouvoir continuer.",
    "warning"
  );
  
  if (!document.getElementById("alerte-retard")) {
    const alerte = document.createElement("div");
    alerte.id = "alerte-retard";
    alerte.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      Vous avez un prêt en retard. Veuillez le retourner pour débloquer les fonctionnalités.
    `;
    alerte.style.background = "rgba(230, 57, 70, 0.2)";
    alerte.style.color = "var(--error-color)";
    alerte.style.padding = "15px";
    alerte.style.border = "1px solid var(--error-color)";
    alerte.style.marginBottom = "20px";
    alerte.style.borderRadius = "8px";
    alerte.style.fontWeight = "bold";
    alerte.style.textAlign = "center";
    document.querySelector("main").insertBefore(alerte, document.querySelector("main").firstChild);
  }
  
  const modifierBtn = document.querySelector(".profile-actions button");
  if (modifierBtn) {
    modifierBtn.disabled = true;
    modifierBtn.style.opacity = 0.5;
    modifierBtn.style.cursor = "not-allowed";
    modifierBtn.onclick = () =>
      showToast("Action bloquée : vous avez un prêt en retard.", "error");
  }
  
  document.querySelectorAll("nav a").forEach((link) => link.classList.add("nav-disabled"));
}

function debloquerUtilisateur() {
  const alerte = document.getElementById("alerte-retard");
  if (alerte) alerte.remove();
  
  const modifierBtn = document.querySelector(".profile-actions button");
  if (modifierBtn) {
    modifierBtn.disabled = false;
    modifierBtn.style.opacity = 1;
    modifierBtn.style.cursor = "pointer";
    modifierBtn.onclick = () =>
      (document.querySelector(".popup").style.display = "flex");
  }
  
  document.querySelectorAll("nav a").forEach((link) => link.classList.remove("nav-disabled"));
}

function afficherDemandes(utilisateur) {
  const container = document.getElementById("mes-demandes");
  const filtreSelect = document.getElementById("filtre-statut-demande");

  container.innerHTML = "";

  if (!demandes || !livres) {
    container.innerHTML = `<div class="livre-card empty-message">Chargement des données...</div>`;
    return;
  }

  const demandesUtilisateur = demandes.filter(d => d.nom === utilisateur.nom);
  const filtreStatut = filtreSelect.value;
  const demandesFiltrees = filtreStatut === "tout" 
    ? demandesUtilisateur 
    : demandesUtilisateur.filter(d => d.statut === filtreStatut);

  document.getElementById("demandes").textContent = demandesUtilisateur.length;

  if (demandesFiltrees.length === 0) {
    const message = filtreStatut === "tout" 
      ? "Vous n'avez aucune demande en cours." 
      : `Vous n'avez aucune demande "${filtreStatut}".`;

    container.innerHTML = `
      <div class="livre-card empty-message">
        ${message}
      </div>
    `;
    return;
  }

  demandesFiltrees.forEach((demande) => {
    const livre = livres.find((l) => l.id === demande.livre_id);
    if (!livre) return;

    let statutClass = "";
    if(demande.statut === "accepté"){
      statutClass = "statut-accepté";
    } else if(demande.statut === "refusé"){
      statutClass = "statut-refusé";
    } else {
      statutClass = "statut-en-attente";
    }
    
    const dateDemande = new Date(demande.date_demande).toLocaleDateString();
    const dateRetour = demande.date_retour
      ? new Date(demande.date_retour).toLocaleDateString()
      : "Non définie";

    const demandeDiv = document.createElement("div");
    demandeDiv.className = "livre-card";
    demandeDiv.innerHTML = `
      <div class="livre-content">
        <div class="livre-img">
          <img src="images/${livre.img}" alt="${livre.titre}" onerror="this.src='images/default-book.jpg'">
        </div>
        <div class="livre-info">
          <h3>${livre.titre}</h3>
          <p><strong>Auteur:</strong> ${livre.auteur}</p>
          <p><strong>Date de demande:</strong> ${dateDemande}</p>
          <p><strong>Date de retour prévue:</strong> ${dateRetour}</p>
          <p class="${statutClass}">
            <strong>Statut:</strong> ${demande.statut}
            ${demande.statut === "refusé" && demande.raison
              ? `<br><small>Raison: ${demande.raison}</small>`
              : ""}
          </p>
        </div>
      </div>
      ${demande.statut === "en_attente"
        ? `
      <div class="livre-actions">
        <button onclick="annulerDemande(${demande.id})" style="background: var(--error-color); color: white;">
          <i class="fas fa-times"></i> Annuler
        </button>
      </div>`
        : ""}
    `;
    container.appendChild(demandeDiv);
  });
}

async function annulerDemande(demandeId) {
  if (!confirm("Êtes-vous sûr de vouloir annuler cette demande ?")) {
    return;
  }

  try {
    const response = await fetch(`https://bibooks-app-production.up.railway.app/demandes/${demandeId}`, {
      method: "DELETE",
      headers: {"Content-Type": "application/json"}
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression de la demande");
    }

    showToast("Demande annulée avec succès", "success");
    setTimeout(async () => {
      demandes = await fetchData("https://bibooks-app-production.up.railway.app/demandes");
      afficherDemandes(utilisateur);
      document.getElementById("demandes").textContent = 
        demandes.filter(d => d.nom === utilisateur.nom).length;
    }, 1000);
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error);
    showToast("Échec de l'annulation de la demande", "error");
  }
}

function fermer() {
  document.querySelector(".popup").style.display = "none";
}
