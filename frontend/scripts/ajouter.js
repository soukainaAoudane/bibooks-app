        const urlLivres = "https://bibooks-app-production.up.railway.app/livres";
        let livres = [];
        
        fetch(urlLivres)
            .then(response => response.json())
            .then(data => {
                livres = data;
            })
            .catch(error => {
                console.error('Erreur:', error);
            });

        document.addEventListener("DOMContentLoaded", async () => {
            const response = await fetch(urlLivres);
            livres = await response.json();

            const connecté = localStorage.getItem("connecté");
            const utilisateur = JSON.parse(localStorage.getItem("utilisateur"));

            const nom = document.getElementById("nom");
            const profileBtn = document.getElementById("profile");
            const button = document.getElementById("button");
            const buttonIcon = document.getElementById("button-icon");
            const buttonText = document.getElementById("button-text");

            if (connecté !== "oui" || !utilisateur || (utilisateur.role !== "admin" && utilisateur.role !== "auteur")) {
                window.location.href = "connexion";
                return;
            }

            if (utilisateur.role === "auteur") {
                document.getElementById("auteur").value = utilisateur.nom;
                document.getElementById("auteur").readOnly = true;
            }

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

            if (utilisateur.role === "admin") {
                profileBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
                profileBtn.title = "Espace Admin";
                profileBtn.onclick = () => (window.location.href = "admin");
            } else if (utilisateur.role === "auteur") {
                profileBtn.innerHTML = '<i class="fas fa-cog"></i>';
                profileBtn.title = "Espace Auteur";
                profileBtn.onclick = () => (window.location.href = "auteur");
            }

            const imageInput = document.getElementById("image");
            const imgPreview = document.getElementById("imgPreview");
            const fileName = document.getElementById("file-name");

            imageInput.addEventListener("change", function (e) {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                        showMessage("L'image ne doit pas dépasser 2MB", "error");
                        return;
                    }

                    fileName.textContent = file.name;

                    const reader = new FileReader();
                    reader.onload = function (e) {
                        imgPreview.src = e.target.result;
                        imgPreview.style.display = "block";
                    };
                    reader.readAsDataURL(file);
                }
            });

            const form = document.getElementById("ajoutForm");

            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                try {
                    const response = await fetch(urlLivres);
                    livres = await response.json();
                } catch (error) {
                    console.error("Erreur:", error);
                }

                const file = imageInput.files[0];
                if (!file) {
                    showMessage("Veuillez sélectionner une image", "error");
                    return;
                }

                const nouveauLivre = {
                    titre: form.titre.value.trim(),
                    auteur: form.auteur.value.trim(),
                };

                if (isNaN(form.prix.value) || isNaN(form.exp.value)) {
                    showMessage("Veuillez entrer un prix et un nombre d'exemplaires valides", "error");
                    return;
                }

                const livreExiste = livres.some(
                    l =>
                        l.titre.toLowerCase() === nouveauLivre.titre.toLowerCase() &&
                        l.auteur.toLowerCase() === nouveauLivre.auteur.toLowerCase()
                );

                if (livreExiste) {
                    showMessage("Ce livre existe déjà", "error");
                    return;
                }

                const formData = new FormData(form);
                ajouter(formData);
            });

            function showMessage(message, type) {
                const messageDiv = document.getElementById("ajout");
                messageDiv.textContent = message;
                messageDiv.className = `message ${type}`;
                messageDiv.style.display = "block";

                setTimeout(() => {
                    messageDiv.style.display = "none";
                }, 5000);
            }

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
                    setTimeout(() => {
                        window.location.href = "liste_livres";
                    }, 1500);
                } catch (error) {
                    showMessage(error.message, "error");
                }
            }

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
        });
