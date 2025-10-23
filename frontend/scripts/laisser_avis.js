      document.addEventListener("DOMContentLoaded", async function () {
        const utilisateur =
          JSON.parse(localStorage.getItem("utilisateur")) || {};
        const livreSelectionne =
          JSON.parse(localStorage.getItem("livreSelectionne")) || {};
        const urlAvis = "https://bibooks-backend-nnrk.vercel.app//avis";
        // Afficher les infos du livre
        document.getElementById("livre-titre").textContent =
          livreSelectionne.titre || "Titre non disponible";
        document.getElementById("livre-auteur").textContent =
          livreSelectionne.auteur || "Auteur non spécifié";
        document.getElementById("livre-genre").textContent =
          livreSelectionne.genre || "Genre non classé";

        if (livreSelectionne.img) {
          document.getElementById(
            "livre-image"
          ).src = `images/${livreSelectionne.img}`;
        }

        // Pré-remplir le nom si utilisateur connecté
        if (utilisateur.nom) {
          document.getElementById("nom").value = utilisateur.nom;
          if (utilisateur.email) {
            document.getElementById("email").value = utilisateur.email;
          }
        }

        // Gestion du formulaire
        const form = document.getElementById("review-form");
        form.addEventListener("submit", async function (e) {
          e.preventDefault();

          const nom = document.getElementById("nom").value.trim();
          const email = document.getElementById("email").value.trim();
          const rating = document.querySelector('input[name="rating"]:checked')?.value;
          const avis = document.getElementById("avis").value.trim();

          if (!nom || !rating || !avis) {
            alert("Veuillez remplir tous les champs obligatoires");
            return;
          }

         

          console.log("Avis soumis:", {
            livre: livreSelectionne.titre,
            nom,
            email,
            note: rating,
            avis,
          });
          const response = await fetch(urlAvis, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              livreId: livreSelectionne.id,
              nom,
              email,
              note: rating,
              commentaire: avis,
            }),
          }); await fetch("https://bibooks-backend-nnrk.vercel.app//envoi-avis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom, email }),
          });

          alert("Merci pour votre évaluation précieuse !");
          form.reset();
          window.location.href = "/";
        });
      });
