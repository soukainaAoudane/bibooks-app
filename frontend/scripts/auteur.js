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

      const urlLivres = "https://bibooks-app.up.railway.app/livres";
      const urlDemandes = "https://bibooks-app.up.railway.app/demandes";
      const urlPrets = "https://bibooks-app.up.railway.app/prets";
      let livres = [];
      let demandes = [];
      let prets = [];

      document.addEventListener("DOMContentLoaded", async () => {
        const utilisateur =
          JSON.parse(localStorage.getItem("utilisateur")) || {};
        const connecté = localStorage.getItem("connecté");


        try {

          const reponseLivres = await fetch(urlLivres);
          if (!reponseLivres.ok) throw new Error("Erreur livres");
          livres = await reponseLivres.json();


          const reponseDemandes = await fetch(urlDemandes);
          if (!reponseDemandes.ok) throw new Error("Erreur demandes");
          demandes = await reponseDemandes.json();


          const reponsePrets = await fetch(urlPrets);
          if (!reponsePrets.ok) throw new Error("Erreur prêts");
          prets = await reponsePrets.json();


          const button = document.getElementById("button");
          const buttonIcon = document.getElementById("button-icon");
          const buttonText = document.getElementById("button-text");
          const profileBtn = document.getElementById("profile");

          if (utilisateur.role === "admin") {
            profileBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
            profileBtn.onclick = () => (window.location.href = "admin");
          } else if (utilisateur.role === "auteur") {
            profileBtn.innerHTML = '<i class="fas fa-user"></i>';
            profileBtn.onclick = () => (window.location.href = "auteur");
          }

          if (connecté) {
            buttonText.textContent = "Déconnexion";
            buttonIcon.className = "fas fa-sign-out-alt";
            button.onclick = () => {
              localStorage.removeItem("connecté");
              localStorage.removeItem("utilisateur");
              window.location.href = "accueil";
            };
          }

          document.getElementById("nom").textContent = utilisateur.nom || "";

          if (!connecté || utilisateur.role !== "auteur") {
            window.location.href = "404";
            return;
          }

          document.getElementById("sombre").addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
          });


          afficherStatistiques();
          afficherLivres();
          exemplairesFinies(livres,utilisateur);
        } catch (error) {
          console.error("Erreur chargement:", error);
        }
      });

     

      
      function afficherStatistiques() {
        const utilisateur =
          JSON.parse(localStorage.getItem("utilisateur")) || {};

        const livresAuteur = livres.filter(
          (l) =>
            l.auteur && l.auteur.toLowerCase() === utilisateur.nom.toLowerCase()
        );


        const demandesAuteur = demandes.filter(
          (d) =>
            d.statut === "en attente" &&
            livresAuteur.some((l) => l.id === d.livre_id)
        );

        document.getElementById("demandes_attentes").textContent =
          demandesAuteur.length;
        document.getElementById("livres").textContent = livresAuteur.length;
        document.getElementById("pret_cours").textContent = prets.filter((p) =>
          livresAuteur.some((l) => l.id === p.livre_id)
        ).length;
      }

      function afficherLivres() {
        const utilisateur =
          JSON.parse(localStorage.getItem("utilisateur")) || {};
        const conteneurLivres = document.getElementById("data-livres");
        conteneurLivres.innerHTML = "";

        const livresAuteur = livres.filter(
          (l) =>
            l.auteur &&
            l.auteur.trim().toLowerCase() ===
              utilisateur.nom.trim().toLowerCase()
        );

        if (livresAuteur.length === 0) {
          conteneurLivres.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-book-open"></i>
          <p>Vous n'avez pas encore publié de livres.</p>
        </div>`;
          return;
        }

        livresAuteur.forEach((livre) => {
          const div = document.createElement("div");
          div.className = "livre-card";
          div.innerHTML = `
        <div class="livre-content">
          <div class="livre-img">
            ${
              livre.img
                ? `<img src="images/${livre.img}" alt="${livre.titre}">`
                : '<div class="no-image"><i class="fas fa-book"></i></div>'
            }
          </div>
          <div class="livre-info">
            <h3>${livre.titre}</h3>
            <p><strong>Auteur:</strong> ${livre.auteur}</p>
            <p><strong>Genre:</strong> ${livre.genre}</p>
            <p><strong>Prix:</strong> ${livre.prix} €</p>
            <p><strong>Stock:</strong> ${livre.exp}</p>
          </div>
        </div>
        <div class="livre-actions">
          <button class="modifier" onclick="modifierLivre('${livre.id}')">
            <i class="fas fa-edit"></i> Modifier
          </button>
          <button class="supprimer" onclick="supprimerLivre('${livre.id}')">
            <i class="fas fa-trash"></i> Supprimer
          </button>
        </div>`;
          conteneurLivres.appendChild(div);
        });
      }

      async function supprimerLivre(id) {
        if (confirm("Voulez-vous vraiment supprimer ce livre ?")) {
          try {
            const response = await fetch(`${urlLivres}/${id}`, {
              method: "DELETE",
            });

            if (!response.ok) throw new Error("Erreur suppression");


            livres = livres.filter((l) => l.id !== id);
            afficherLivres();
            afficherStatistiques();
          } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de la suppression");
          }
        }
      }

      async function modifierLivre(id) {
        try {
          const response = await fetch(`${urlLivres}/${id}`);
          if (!response.ok) throw new Error("Livre non trouvé");

          const livre = await response.json();


          document.getElementById("titre").value = livre.titre;
          document.getElementById("auteur").value = livre.auteur;
          document.getElementById("genre").value = livre.genre;
          document.getElementById("Description").value =
            livre.description || "";
          document.getElementById("date").value = new Date(livre.date).toISOString().split("T")[0] || "";
          document.getElementById("prix").value = livre.prix || 0;
          document.getElementById("exp").value = livre.exp || 0;
          document.getElementById("imgPreview").src = `images/${livre.img}` || "#";

          document.getElementById("popup").style.display = "flex";


          const form = document.getElementById("form");
          form.onsubmit = async (e) => {
            e.preventDefault();

            const updatedLivre = {
              titre: document.getElementById("titre").value,
              auteur: document.getElementById("auteur").value,
              genre: document.getElementById("genre").value,
              description: document.getElementById("Description").value,
              date: document.getElementById("date").value,
              prix: parseFloat(document.getElementById("prix").value),
              exp: parseInt(document.getElementById("exp").value),
              img: livre.img,
            };

            try {
              const updateResponse = await fetch(`${urlLivres}/${id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedLivre),
              });

              if (!updateResponse.ok) throw new Error("Erreur mise à jour");


              const index = livres.findIndex((l) => l.id === id);
              if (index !== -1) {
                livres[index] = { ...livres[index], ...updatedLivre };
              }

              afficherLivres();
              afficherStatistiques();
              fermer();
            } catch (error) {
              console.error("Erreur:", error);
              alert("Erreur lors de la modification");
            }
          };
        } catch (error) {
          console.error("Erreur:", error);
          alert("Erreur lors du chargement du livre");
        }
      }

      function chercherLivres(){
        const utilisateur=JSON.parse(localStorage.getItem('utilisateur'));
        const motClee=document.getElementById('chercher-livre').value.trim().toLowerCase();
        const div=document.getElementById('resultats-livres');
        div.innerHTML='';

        if(!motClee){
          div.innerHTML="<p class ='empty-message'>Veuillez entrer un mot-clé pour chercher'</p>";
          return;
        }
        livresAuteur=livres.filter(l=>
          l.auteur.toLowerCase()===utilisateur.nom.toLowerCase()
        );
        console.log(livres);
        const result=livresAuteur.filter(l=>l.titre.toLowerCase().includes(motClee)||
        l.auteur.toLowerCase().includes(motClee)||
        (l.genre && l.genre.toLowerCase().includes(motClee)));

        if(result.length===0){
          div.innerHTML="<p class='empty-message'>Aucun livre trouvé.</p>";
          return;
        }

        result.forEach(l=>{
          div.innerHTML+=`
          <div class='result-item'>
            <div class='result-img'>
              <img src="images/${l.img}" alt=${l.titre}>
            </div>
            <div class='result-text'>
              <strong>${l.titre}</strong>
              <small>${l.auteur} - ${l.genre} - ${l.prix} €
            </div>
          </div>
          `;
        });
      }

      function fermer() {
        document.getElementById("popup").style.display = "none";
      }
