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


       setupImagePreview();
    setupFileInputButton();
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

    // Remplir le formulaire avec les données du livre
    document.getElementById("titre").value = livre.titre;
    document.getElementById("auteur").value = livre.auteur;
    document.getElementById("genre").value = livre.genre;
    document.getElementById("Description").value = livre.description || "";
    document.getElementById("date").value = livre.date ? new Date(livre.date).toISOString().split("T")[0] : "";
    document.getElementById("prix").value = livre.prix || 0;
    document.getElementById("exp").value = livre.exp || 1;

    // Afficher l'image actuelle
    const imgPreview = document.getElementById("imgPreview");
    const fileName = document.getElementById("fileName");
    
    if (livre.img) {
      imgPreview.src = `images/${livre.img}`;
      imgPreview.style.display = 'block';
      fileName.textContent = livre.img;
    } else {
      imgPreview.style.display = 'none';
      fileName.textContent = "Aucune image sélectionnée";
    }

    // Afficher la popup
    document.getElementById("popup").style.display = "flex";

    // Gérer la soumission du formulaire
    const form = document.getElementById("form");
    
    form.onsubmit = async (e) => {
      e.preventDefault();

      // Créer FormData pour gérer les fichiers
      const formData = new FormData();
      
      // Ajouter tous les champs texte
      formData.append('titre', document.getElementById("titre").value);
      formData.append('auteur', document.getElementById("auteur").value);
      formData.append('genre', document.getElementById("genre").value);
      formData.append('description', document.getElementById("Description").value);
      formData.append('date', document.getElementById("date").value);
      formData.append('prix', document.getElementById("prix").value);
      formData.append('exp', document.getElementById("exp").value);
      
      // Gérer l'image
      const imageInput = document.getElementById("image");
      if (imageInput.files.length > 0) {
        // Nouvelle image sélectionnée
        formData.append('image', imageInput.files[0]);
      } else if (livre.img) {
        // Garder l'ancienne image
        formData.append('img', livre.img);
      }

      try {
        const updateResponse = await fetch(`${urlLivres}/${id}`, {
          method: "PUT",
          body: formData // FormData pour gérer les fichiers
          // Pas de Content-Type, le navigateur le gère automatiquement
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`Erreur serveur: ${errorText}`);
        }

        const result = await updateResponse.json();
        
        // Mettre à jour la liste des livres localement
        const index = livres.findIndex((l) => l.id == id);
        if (index !== -1) {
          livres[index] = { 
            ...livres[index],
            titre: document.getElementById("titre").value,
            auteur: document.getElementById("auteur").value,
            genre: document.getElementById("genre").value,
            description: document.getElementById("Description").value,
            date: document.getElementById("date").value,
            prix: parseFloat(document.getElementById("prix").value),
            exp: parseInt(document.getElementById("exp").value),
            img: result.nouvelleImage || livre.img // Utiliser la nouvelle image si elle existe
          };
        }

        afficherLivres();
        afficherStatistiques();
        fermer();
        showToast("Livre modifié avec succès !", "success");
        
      } catch (error) {
        console.error("Erreur modification:", error);
        showToast("Erreur lors de la modification: " + error.message, "error");
      }
    };

  } catch (error) {
    console.error("Erreur:", error);
    showToast("Erreur lors du chargement du livre", "error");
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
// Fonction pour l'aperçu de l'image
function setupImagePreview() {
  const imageInput = document.getElementById("image");
  const imgPreview = document.getElementById("imgPreview");
  const fileName = document.getElementById("fileName");

  imageInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    
    if (file) {
      // Afficher le nom du fichier
      fileName.textContent = file.name;
      
      // Aperçu de l'image
      const reader = new FileReader();
      reader.onload = function(e) {
        imgPreview.src = e.target.result;
        imgPreview.style.display = 'block';
      }
      reader.readAsDataURL(file);
    } else {
      fileName.textContent = "Aucune image sélectionnée";
      imgPreview.style.display = 'none';
    }
  });
}

// Fonction pour simuler le clic sur l'input file
function setupFileInputButton() {
  const fileInputButton = document.querySelector('.file-input-button');
  const fileInput = document.getElementById('image');

  fileInputButton.addEventListener('click', function() {
    fileInput.click();
  });

  fileInput.addEventListener('change', function() {
    const fileName = document.getElementById('fileName');
    if (this.files.length > 0) {
      fileName.textContent = this.files[0].name;
    } else {
      fileName.textContent = "Aucune image sélectionnée";
    }
  });
}

      function fermer() {
        document.getElementById("popup").style.display = "none";
      }
