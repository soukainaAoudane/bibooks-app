      let livres = [];
      const urlLivres = "http://localhost:3001/livres";

      let demandes = [];
      const urlDemandes = "http://localhost:3001/demandes";

      let prets = [];
      const urlPrets = "http://localhost:3001/prets";

      let utilisateurs = [];
      const urlUtilisateurs = "http://localhost:3001/utilisateurs";

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
      function afficherPretsExpirés() {
        const aujourdHui = new Date();
        const section = document.getElementById("data-expire");
        if (!section) return;

        section.innerHTML = "";

        const pretsExpirés = prets.filter((p) => {
          const date_retour = new Date(p.date_retour);
          return date_retour < aujourdHui && p.statut!=='retourné';
        });

        if (pretsExpirés.length === 0) {
          section.innerHTML = "<p>Aucun prêt expiré pour le moment.</p>";
          return;
        }

        pretsExpirés.forEach((pret) => {
          const livre = livres.find((l) => l.id === pret.livre_id) || {};
          const utilisateur =
            utilisateurs.find((u) => u.id === pret.utilisateur_id) || {};

          const datePret = new Date(pret.date_pret).toLocaleDateString();
          const dateRetour = new Date(pret.date_retour).toLocaleDateString();
          const enRetard = dateRetour < aujourdHui;

          const div = document.createElement("div");
          div.innerHTML = `
      <div class="livre-card">
        <div class="livre-content">
          <div class="livre-img">
            <img src="images/${livre.img || "default.jpg"}" alt="${
            livre.titre || "Livre inconnu"
          }">
          </div>
          <div class="livre-info">
            <h3>Prêt expiré</h3>
            <p><strong>Emprunteur:</strong> ${
              utilisateur.nom || pret.nom || "Inconnu"
            }</p>
            <p><strong>Livre:</strong> ${livre.titre || "Livre inconnu"}</p>
            <p><strong>Date prêt:</strong> ${datePret}</p>
            <p class="${"en-retard"}">
              <strong>Date retour:</strong> ${dateRetour} ${
            "(Expiré)" 
          }
            </p>
          </div>
        </div>
      </div>
    `;
          section.appendChild(div);
        });
      }
      document.addEventListener("DOMContentLoaded", async () => {
        try {
          const [resLivres, resDemandes, resPrets, resUtilisateurs] =
            await Promise.all([
              fetch(urlLivres),
              fetch(urlDemandes),
              fetch(urlPrets),
              fetch(urlUtilisateurs),
            ]);

          if (resLivres.ok) livres = await resLivres.json();
          else showToast("Erreur de chargement des livres", "error");

          if (resDemandes.ok) demandes = await resDemandes.json();
          else showToast("Erreur de chargement des demandes", "error");

          if (resPrets.ok) prets = await resPrets.json();
          else showToast("Erreur de chargement des prêts", "error");

          if (resUtilisateurs.ok) utilisateurs = await resUtilisateurs.json();
          else showToast("Erreur de chargement des utilisateurs", "error");

          const connecté = localStorage.getItem("connecté");
          const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));

          if (
            !connecté ||
            connecté !== "oui" ||
            !utilisateur ||
            utilisateur.role !== "admin"
          ) {
            return (window.location.href = "404");
          }

          const button = document.getElementById("button");
          const buttonIcon = document.getElementById("button-icon");
          const buttonText = document.getElementById("button-text");
          const nom = document.getElementById("nom");
          const profileBtn = document.getElementById("profile");
          const sombreBtn = document.getElementById("sombre");

          buttonIcon.className = "fas fa-sign-out-alt";
          buttonText.textContent = "Déconnexion";
          nom.textContent = "Bienvenue " + utilisateur.nom;

          profileBtn.title =
            utilisateur.role === "admin" ? "Espace Admin" : "Mon Profil";
          profileBtn.onclick = () =>
            (window.location.href =
              utilisateur.role === "admin" ? "admin" : "profil");

          button.onclick = () => {
            localStorage.removeItem("connecté");
            localStorage.removeItem("utilisateur");
            window.location.href = "connexion";
          };

          sombreBtn.onclick = () => {
            document.body.classList.toggle("dark-mode");
            showToast(
              `Mode ${
                document.body.classList.contains("dark-mode")
                  ? "sombre"
                  : "clair"
              } activé`
            );
          };

          document.getElementById("livres").textContent = livres.length;
          document.getElementById("pret_cours").textContent = prets.length;
          document.getElementById("demandes_attentes").textContent =
            demandes.filter((d) => d.statut === "en attente").length;
          document.getElementById("utilisateurs_actifs").textContent =
            utilisateurs.length;

          document
            .getElementById("livre")
            .addEventListener("click", () =>
              localStorage.removeItem("livreSelectionne")
            );

          afficherLivres();
          afficherDemandes();
          afficherPrets();
          afficherUtilisateurs();
          afficherPretsExpirés && afficherPretsExpirés();
        } catch (e) {
          console.error(e);
          showToast("Erreur lors du chargement des données", "error");
        }
      });

      function afficherLivres() {
        const container = document.getElementById("data-livres");
        container.innerHTML = "";

        if (livres.length === 0) {
          container.innerHTML = `<div class="livre-card empty-message">Aucun livre disponible.</div>`;
          return;
        }

        livres.forEach((livre) => {
          const row = document.createElement("div");
          row.className = "livre-card";

          row.innerHTML = `
      <div class="livre-content">
        <div class="livre-img">
          <img src="images/${livre.img || "default.jpg"}" alt="${
            livre.titre || "Livre"
          }">
        </div>
        <div class="livre-info">
          <h3>${livre.titre}</h3>
          <p><strong>Auteur :</strong> ${livre.auteur}</p>
          <p><strong>Genre :</strong> ${livre.genre || "N/A"}</p>
          <p><strong>Description :</strong> ${livre.description || ""}</p>
          <p><strong>Prix :</strong> ${Number(livre.prix).toFixed(2)} €</p>
          <p><strong>Stock :</strong> ${livre.exp}</p>
        </div>
      </div>
      <div class="livre-actions">
        <button class="supprimer" onclick="supprimerLivre(${livre.id})">
          <i class="fas fa-trash"></i> Supprimer
        </button>
      </div>
    `;

          container.appendChild(row);
        });
      }

      async function supprimerLivre(id) {
        if (confirm("Supprimer ce livre ?")) {
          const resp = await fetch(`${urlLivres}/${id}`, { method: "DELETE" });
          if (resp.ok) {
            livres = livres.filter((l) => l.id !== id);
            afficherLivres();
            document.getElementById("livres").textContent = livres.length;
            showToast("Livre supprimé avec succès", "success");
          } else {
            showToast("Erreur lors de la suppression du livre", "error");
          }
        }
      }

      function afficherDemandes() {
        const container = document.getElementById("data-demandes");
        container.innerHTML = "";

        let filtered = demandes;
        const filtre =
          document.getElementById("filtre-statut-demande")?.value || "tout";

        if (filtre !== "tout") {
          filtered = demandes.filter((d) => d.statut === filtre);
        }

        if (filtered.length === 0) {
          container.innerHTML = `<div class="livre-card empty-message">Aucune demande enregistrée.</div>`;
          return;
        }

        filtered.forEach((demande) => {
          const livre = livres.find((l) => l.id === demande.livre_id) || {};
          const imageUrl = livre.img || "default.jpg";
          const titreLivre = livre.titre || "Livre inconnu";

          const datePret =
            demande.date_pret instanceof Date
              ? demande.date_pret.toLocaleDateString()
              : new Date(demande.date_pret).toLocaleDateString();

          const dateRetour =
            demande.date_retour instanceof Date
              ? demande.date_retour.toLocaleDateString()
              : new Date(demande.date_retour).toLocaleDateString();

          const row = document.createElement("div");
          row.className = "livre-card";

          row.innerHTML = `
      <div class="livre-content">
        <div class="livre-img">
          <img src="images/${imageUrl}" alt="${titreLivre}">
        </div>
        <div class="livre-info">
          <h3>Demande de prêt</h3>
          <p><strong>Emprunteur:</strong> ${demande.nom}</p>
          <p><strong>Livre:</strong> ${titreLivre}</p>
          <p><strong>Date prêt:</strong> ${datePret}</p>
          <p><strong>Date retour:</strong> ${dateRetour}</p>
          <p><strong>Statut:</strong> <span class="statut-${demande.statut}">${
            demande.statut
          }</span></p>
        </div>
      </div>
      <div class="livre-actions">
        ${
          demande.statut === "en attente"
            ? `
          <button class="accepter" onclick="accepter(${demande.id})">
            <i class="fas fa-check"></i> Accepter
          </button>
          <button class="refuser" onclick="refuser(${demande.id})">
            <i class="fas fa-times"></i> Refuser
          </button>
        `
            : `<span class="statut-final">Action terminée</span>`
        }
      </div>
    `;

          container.appendChild(row);
        });
      }
      function utilisateurBloqué(nomUtilisateur) {
        const aujourdHui = new Date();
        return prets.some(
          (pret) =>
            pret.nom === nomUtilisateur &&
            new Date(pret.date_retour) < aujourdHui && pret.statut!=='retourné'
        );
      }
      function keepLocalDate(dateString) {
        const [jour, mois, annee] = dateString.split("/");
        return `${annee}-${mois}-${jour}`;
      }
      async function accepter(id) {
        try {
          const demande = demandes.find((d) => d.id === id);
          if (!demande) {
            showToast("Demande introuvable", "error");
            return;
          }

          const emprunteur = utilisateurs.find((u) => u.nom === demande.nom);
          if (!emprunteur) {
            showToast("Utilisateur introuvable", "error");
            return;
          }

          if (utilisateurBloqué(emprunteur.nom)) {
            showToast("Utilisateur bloqué: prêt expiré non rendu", "error");
            return;
          }

          const livre = livres.find((l) => l.id === demande.livre_id);
          if (!livre) {
            showToast("Livre introuvable", "error");
            return;
          }
          if (livre.exp <= 0) {
            showToast("Stock insuffisant !", "error");
            return;
          }

          const datePret = new Date().toISOString().split("T")[0];
          const dateRetour = new Date(demande.date_retour);
          dateRetour.setDate(dateRetour.getDate() + 1);
          const dateRetourISO = dateRetour.toISOString().split("T")[0];

          const respPrets = await fetch(urlPrets, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nom: emprunteur.nom,
              utilisateur_id: emprunteur.id,
              livre_id: demande.livre_id,
              statut: "en cours",
              date_pret: datePret,
              date_retour: dateRetourISO,
            }),
          });

          if (!respPrets.ok) {
            const errorDetails = await respPrets.json().catch(() => ({}));
            throw new Error(
              errorDetails.message || "Échec de la création du prêt"
            );
          }

          livre.exp--;
          const updateLivre = await fetch(`${urlLivres}/${livre.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exp: livre.exp }),
          });

          const updateDemande = await fetch(`${urlDemandes}/${demande.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statut: "accepté" }),
          });

          if (!updateLivre.ok || !updateDemande.ok) {
            throw new Error("Échec de la mise à jour des données");
          }

          const [newPrets, newDemandes] = await Promise.all([
            fetch(urlPrets).then((r) => r.json()),
            fetch(urlDemandes).then((r) => r.json()),
          ]);

          prets = newPrets;
          demandes = newDemandes;

          afficherDemandes();
          afficherPrets();
          document.getElementById("demandes_attentes").textContent =
            demandes.filter((d) => d.statut === "en attente").length;
          document.getElementById("pret_cours").textContent = prets.length;

          const email = emprunteur.email;

          await fetch("http://localhost:3001/pret-confirme", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nom: emprunteur.nom, email, datePret, dateRetour }),
});

          showToast("Prêt accepté avec succès", "success");
          
        } catch (error) {
          console.error("Erreur complète:", error);
          showToast(
            error.message || "Erreur lors de l'acceptation du prêt",
            "error"
          );

          if (livre) livre.exp++;
          
        }
        setTimeout(()=>{
          window.location.reload();
        },1000);
      }
      async function refuser(demandeId) {
        const demande = demandes.find((d) => d.id === demandeId);
        if (!demande) {
          showToast("Demande introuvable", "error");
          return;
        }

        if (
          !confirm(
            `Voulez-vous vraiment refuser la demande de ${demande.nom} ?`
          )
        ) {
          return;
        }

        const resp = await fetch(`${urlDemandes}/${demandeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut: "refusé" }),
        });

        if (!resp.ok) {
          showToast("Erreur lors du refus", "error");
          return;
        }

        demande.statut = "refusé";
        afficherDemandes();
        document.getElementById("demandes_attentes").textContent =
          demandes.filter((d) => d.statut === "en attente").length;

           await fetch("http://localhost:3001/pret-refus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom: emprunteur.nom, email }),
          });
        showToast("Demande refusée avec succès", "success");
      }

      function afficherPrets() {
    const container = document.getElementById("data-prets");
    container.innerHTML = "";

    const filtre = document.getElementById("filtre-statut-pret")?.value || "tout";
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);

    let pretsFiltres = prets;

    if (filtre === "en cours") {
        pretsFiltres = prets.filter((pret) => {
            const dateRetour = new Date(pret.date_retour);
            return dateRetour >= aujourdHui && pret.statut !== "retourné";
        });
    } else if (filtre === "en retard") {
        pretsFiltres = prets.filter((pret) => {
            const dateRetour = new Date(pret.date_retour);
            return dateRetour < aujourdHui && pret.statut !== "retourné";
        });
    } else if (filtre === "retourné") {
        pretsFiltres = prets.filter((pret) => pret.statut === "retourné");
    }

    if (pretsFiltres.length === 0) {
        container.innerHTML = `<div class="livre-card empty-message">Aucun prêt ${
            filtre !== "tout" ? filtre : ""
        } trouvé.</div>`;
        return;
    }

    pretsFiltres.forEach((pret) => {
        const livre = livres.find((l) => l.id === pret.livre_id) || {};
        const utilisateur = utilisateurs.find((u) => u.id === pret.utilisateur_id) || {};

        const datePret = pret.date_pret
            ? new Date(pret.date_pret).toLocaleDateString()
            : "N/A";
        const dateRetour = pret.date_retour
            ? new Date(pret.date_retour).toLocaleDateString()
            : "N/A";
        const enRetard = pret.date_retour
            ? new Date(pret.date_retour) < aujourdHui && pret.statut !== "retourné"
            : false;

        // ...existing code...
const statutClass =
  pret.statut === "retourné"
    ? "statut-retourné"
    : enRetard
    ? "statut-en-retard"
    : "statut-en-cours";

container.innerHTML += `
  <div class="livre-card">
    <div class="livre-content">
      <div class="livre-img">
        <img src="images/${livre.img || "default.jpg"}" alt="${livre.titre || "Livre inconnu"}">
      </div>
      <div class="livre-info">
        <h3>Prêt <span class="${statutClass}">${pret.statut === "retourné" ? "retourné" : enRetard ? "en retard" : "en cours"}</span></h3>
        <p><strong>Emprunteur:</strong> ${utilisateur.nom || pret.nom || "Inconnu"}</p>
        <p><strong>Livre:</strong> ${livre.titre || "Livre inconnu"}</p>
        <p><strong>Date prêt:</strong> ${datePret}</p>
        <p>
          <strong>Date retour:</strong> ${dateRetour} 
        </p>
      </div>
    </div>
  </div>
`;
// ...existing code...
    });
}
      function afficherUtilisateurs() {
        const container = document.getElementById("data-utilisateur");
        container.innerHTML = "";

        let filtered = utilisateurs;
        const filtre =
          document.getElementById("filtre-role-utilisateur")?.value || "tout";

        if (filtre === "utilisateur") {
          filtered = utilisateurs.filter((u) => u.role === "user");
        } else if (filtre === "auteur") {
          filtered = utilisateurs.filter((u) => u.role === "auteur");
        }

        if (filtered.length === 0) {
          container.innerHTML = `<div class="livre-card empty-message">Aucun utilisateur actif.</div>`;
          return;
        }

        filtered.forEach((utili) => {
          const row = document.createElement("div");
          row.className = "livre-card";

          row.innerHTML = `
      <div class="livre-content">
        <div class="livre-img">
          <i class="fas fa-user-circle" style="font-size: 3rem; color: var(--primary-color)"></i>
        </div>
        <div class="livre-info">
          <h3>${utili.nom}</h3>
          <p><strong>Email :</strong> ${utili.email || "N/A"}</p>
          <p><strong>Rôle :</strong> ${utili.role || "Utilisateur"}</p>
        </div>
      </div>
      <div class="livre-actions">
        <button class="supprimer" onclick="supprimerUtilisateur(${utili.id})">
          <i class="fas fa-trash"></i> Supprimer
        </button>
      </div>
    `;

          container.appendChild(row);
        });
      }

      async function supprimerUtilisateur(id) {
        try {
          if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
            return;
          }

          console.log("Tentative de suppression de l'utilisateur ID:", id);

          const response = await fetch(`${urlUtilisateurs}/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log("Réponse du serveur:", response);

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage =
              errorData?.message || "Échec de la suppression";
            throw new Error(errorMessage);
          }

          utilisateurs = utilisateurs.filter((u) => u.id !== id);
          afficherUtilisateurs();
          document.getElementById("utilisateurs_actifs").textContent =
            utilisateurs.length;

          showToast("Utilisateur supprimé avec succès", "success");
        } catch (error) {
          console.error("Erreur détaillée:", error);
          showToast(`Erreur: ${error.message}`, "error");
        }
      }
      function chercherLivres() {
        const motCle = document
          .getElementById("chercher-livre")
          .value.trim()
          .toLowerCase();
        const div = document.getElementById("resultats-livres");
        div.innerHTML = "";

        if (!motCle) {
          div.innerHTML =
            "<p class='empty-message'>Veuillez entrer un mot-clé.</p>";
          return;
        }

        const result = livres.filter(
          (l) =>
            l.titre.toLowerCase().includes(motCle) ||
            l.auteur.toLowerCase().includes(motCle) ||
            (l.genre && l.genre.toLowerCase().includes(motCle))
        );

        if (result.length === 0) {
          div.innerHTML = "<p class='empty-message'>Aucun livre trouvé.</p>";
          return;
        }

        result.forEach((l) => {
          div.innerHTML += `
      <div class="result-item">
        <div class="result-img">
          <img src="images/${l.img || "default.jpg"}" alt="${l.titre}">
        </div>
        <div class="result-text">
          <strong>${l.titre}</strong><br>
          <small>${l.auteur} • ${l.genre || "N/A"} • ${Number(l.prix).toFixed(
            2
          )} €</small>
        </div>
      </div>
    `;
        });
      }

      function chercherDemandes() {
        const motCle = document
          .getElementById("chercher-demande")
          .value.trim()
          .toLowerCase();
        const div = document.getElementById("resultats-demandes");
        div.innerHTML = "";

        if (!motCle) {
          div.innerHTML =
            "<p class='empty-message'>Veuillez entrer un mot-clé.</p>";
          return;
        }

        const result = demandes.filter((d) => {
          const livre = livres.find((l) => l.id === d.livre_id);
          return (
            (livre?.titre && livre.titre.toLowerCase().includes(motCle)) ||
            (livre?.auteur && livre.auteur.toLowerCase().includes(motCle)) ||
            (livre?.genre && livre.genre.toLowerCase().includes(motCle)) ||
            d.nom.toLowerCase().includes(motCle)
          );
        });

        if (result.length === 0) {
          div.innerHTML =
            "<p class='empty-message'>Aucune demande trouvée.</p>";
          return;
        }

        result.forEach((d) => {
          const livre = livres.find((l) => l.id === d.livre_id);
          div.innerHTML += `
      <div class="result-item">
        <div class="result-img">
          <img src="images/${livre?.img || "default.jpg"}" alt="${
            livre?.titre || "Livre inconnu"
          }">
        </div>
        <div class="result-text">
          <strong>${d.nom}</strong><br>
          <small>${livre ? livre.titre : "Livre inconnu"} • ${d.date_pret} → ${
            d.date_retour
          }</small><br>
          <span class="statut-${d.statut}">${d.statut}</span>
        </div>
      </div>
    `;
        });
      }

      function chercherPrets() {
        const motCle = document
          .getElementById("chercher-pret")
          .value.trim()
          .toLowerCase();
        const div = document.getElementById("resultats-prets");
        div.innerHTML = "";

        if (!motCle) {
          div.innerHTML =
            "<p class='empty-message'>Veuillez entrer un mot-clé.</p>";
          return;
        }

        const result = prets.filter((p) => {
          const livre = livres.find((l) => l.id === p.livre_id);
          return (
            (livre?.titre && livre.titre.toLowerCase().includes(motCle)) ||
            (p.nom && p.nom.toLowerCase().includes(motCle)) ||
            (p.date_pret && p.date_pret.includes(motCle)) ||
            (p.date_retour && p.date_retour.includes(motCle))
          );
        });

        if (result.length === 0) {
          div.innerHTML = "<p class='empty-message'>Aucun prêt trouvé.</p>";
          return;
        }

        const aujourdHui = new Date();

        result.forEach((p) => {
          const livre = livres.find((l) => l.id === p.livre_id);
          const dateRetour = new Date(p.date_retour);
          const enRetard = aujourdHui > dateRetour;

          div.innerHTML += `
      <div class="result-item">
        <div class="result-img">
          <img src="images/${livre?.img || "default.jpg"}" alt="${
            livre?.titre || "Livre inconnu"
          }">
        </div>
        <div class="result-text">
          <strong>${p.nom}</strong><br>
          <small>
  ${livre ? livre.titre : "Livre inconnu"} • 
  ${new Date(p.date_pret).toLocaleDateString()} → 
  ${new Date(p.date_retour).toLocaleDateString()}
</small><br>

          ${
            enRetard
              ? '<span class="en-retard">En retard</span>'
              : '<span class="en-cours">En cours</span>'
          }
        </div>
      </div>
    `;
        });
      }

      function chercherUtilisateurs() {
        const motCle = document
          .getElementById("chercher-utilisateur")
          .value.trim()
          .toLowerCase();
        const div = document.getElementById("resultats-utilisateurs");
        div.innerHTML = "";

        if (!motCle) {
          div.innerHTML =
            "<p class='empty-message'>Veuillez entrer un mot-clé.</p>";
          return;
        }

        const result = utilisateurs.filter((u) =>
          u.nom.toLowerCase().includes(motCle)
        );

        if (result.length === 0) {
          div.innerHTML =
            "<p class='empty-message'>Aucun utilisateur trouvé.</p>";
          return;
        }

        result.forEach((u) => {
          div.innerHTML += `
      <div class="result-item">
        <div class="result-img">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="result-text">
          <strong>${u.nom}</strong><br>
          <small>${u.email || "N/A"} • ${u.role || "Utilisateur"}</small>
        </div>
      </div>
    `;
        });
      }

      async function chargerLesDonnees() {
        try {
          const [resLivres, resDemandes, resPrets, resUtilisateurs] =
            await Promise.all([
              fetch(urlLivres),
              fetch(urlDemandes),
              fetch(urlPrets),
              fetch(urlUtilisateurs),
            ]);
          if (resLivres.ok) livres = await resLivres.json();
          if (resDemandes.ok) demandes = await resDemandes.json();
          if (resPrets.ok) prets = await resPrets.json();
          if (resUtilisateurs.ok) utilisateurs = await resUtilisateurs.json();

          afficherLivres();
          afficherDemandes();
          afficherPrets();
          afficherUtilisateurs();

          document.getElementById("livres").textContent = livres.length;
          document.getElementById("pret_cours").textContent = prets.length;
          document.getElementById("demandes_attentes").textContent =
            demandes.filter((d) => d.statut === "en attente").length;
          document.getElementById("utilisateurs_actifs").textContent =
            utilisateurs.length;
        } catch (error) {
          showToast("Erreur lors du rechargement des données", "error");
        }
      }
