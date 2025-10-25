// Initialisation de la page au chargement
document.addEventListener("DOMContentLoaded", async function () {
  // Récupération des données utilisateur et livre depuis le localStorage
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur")) || {};
  const livreSelectionne = JSON.parse(localStorage.getItem("livreSelectionne")) || {};
  const urlAvis = "https://bibooks-backend-nnrk.vercel.app/avis";
  
  // Affichage des informations du livre sélectionné
  document.getElementById("livre-titre").textContent = 
    livreSelectionne.titre || "Titre non disponible";
  document.getElementById("livre-auteur").textContent = 
    livreSelectionne.auteur || "Auteur non spécifié";
  document.getElementById("livre-genre").textContent = 
    livreSelectionne.genre || "Genre non classé";

  // Affichage de l'image du livre si disponible
  if (livreSelectionne.img) {
    document.getElementById("livre-image").src = `images/${livreSelectionne.img}`;
  }

  // Pré-remplissage des champs si l'utilisateur est connecté
  if (utilisateur.nom) {
    document.getElementById("nom").value = utilisateur.nom;
    if (utilisateur.email) {
      document.getElementById("email").value = utilisateur.email;
    }
  }

  // Gestion de la soumission du formulaire d'avis
  const form = document.getElementById("review-form");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Récupération des valeurs du formulaire
    const nom = document.getElementById("nom").value.trim();
    const email = document.getElementById("email").value.trim();
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const avis = document.getElementById("avis").value.trim();

    // Validation des champs obligatoires
    if (!nom || !rating || !avis) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Affichage des données soumises dans la console (pour débogage)
    console.log("Avis soumis:", {
      livre: livreSelectionne.titre,
      nom,
      email,
      note: rating,
      avis,
    });

    // Envoi de l'avis à l'API
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
    });

    // Envoi d'une notification par email
    await fetch("https://bibooks-backend-nnrk.vercel.app/envoi-avis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, email }),
    });

    // Confirmation à l'utilisateur et redirection
    alert("Merci pour votre évaluation précieuse !");
    form.reset();
    window.location.href = "/";
  });
  
});
