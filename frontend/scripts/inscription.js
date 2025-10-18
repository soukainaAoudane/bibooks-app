        // Fonction de hashage commune
        async function hashage(MotDePasse) {
            const encodeur = new TextEncoder();
            const donnees = encodeur.encode(MotDePasse);
            const hashBuffer = await crypto.subtle.digest("SHA-256", donnees);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
            return hashHex;
        }

        // Gestion des onglets
        document.addEventListener('DOMContentLoaded', () => {
            const loginTab = document.getElementById('login-tab');
            const registerTab = document.getElementById('register-tab');
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            const showRegister = document.getElementById('show-register');
            const showLogin = document.getElementById('show-login');

            function showLoginForm() {
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            }

            function showRegisterForm() {
                loginTab.classList.remove('active');
                registerTab.classList.add('active');
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            }

            loginTab.addEventListener('click', showLoginForm);
            registerTab.addEventListener('click', showRegisterForm);
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                showRegisterForm();
            });
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                showLoginForm();
            });

            // Initialisation admin
            initializeAdmin();
            
            // Gestion des formulaires
            setupLoginForm();
            setupRegisterForm();
        });

        // Initialisation du compte admin
        async function initializeAdmin() {
            const ADMIN_EMAIL = "admin@gmail.com";
            const ADMIN_PASSWORD = "admin";
            const urlUtilisateurs = "http://localhost:3001/utilisateurs";

            try {
                const response = await fetch(urlUtilisateurs);
                if (!response.ok) return;
                
                const utilisateurs = await response.json();
                if (!utilisateurs.some(user => user.role === "admin")) {
                    const hashedAdmin = await hashage(ADMIN_PASSWORD);
                    await fetch(urlUtilisateurs, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            nom: "Admin",
                            email: ADMIN_EMAIL,
                            mot_de_passe: hashedAdmin,
                            role: "admin",
                        }),
                    });
                }
            } catch (error) {
                console.error("Erreur initialisation admin:", error);
            }
        }

        // Configuration du formulaire de connexion
        function setupLoginForm() {
            const form = document.getElementById('connexionForm');
            const message = document.getElementById('login-message');
            const urlUtilisateurs = "http://localhost:3001/utilisateurs";

            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value.trim().toLowerCase();
                const psd = document.getElementById('login-psd').value.trim();
                
                if (!email || !psd) {
                    showMessage("Veuillez remplir tous les champs", "error", message);
                    return;
                }

                try {
                    const hashedPsd = await hashage(psd);
                    const response = await fetch(urlUtilisateurs);
                    const utilisateurs = await response.json();
                    
                    const utilisateur = utilisateurs.find(user => 
                        user.email === email && user.mot_de_passe === hashedPsd
                    );

                    if (utilisateur) {
                        localStorage.setItem('connecté', 'oui');
                        localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
                        showMessage("Connexion réussie ! Redirection...", "success", message);
                        
                        setTimeout(() => {
                            window.location.href = 
                                utilisateur.role === "admin" ? "admin" :
                                utilisateur.role === "auteur" ? "auteur" : "accueil";
                        }, 1500);
                    } else {
                        showMessage("Email ou mot de passe incorrect", "error", message);
                    }
                } catch (error) {
                    console.error("Erreur connexion:", error);
                    showMessage("Erreur lors de la connexion", "error", message);
                }
            });
        }

        // Configuration du formulaire d'inscription
        function setupRegisterForm() {
            const form = document.getElementById('inscriptionForm');
            const message = document.getElementById('register-message');
            const urlUtilisateurs = "http://localhost:3001/utilisateurs";
            const ADMIN_EMAIL = "admin@gmail.com";

            form.addEventListener('submit', async function(e) {
                e.preventDefault();

                const nom = document.getElementById('register-nom').value.trim();
                const email = document.getElementById('register-email').value.trim().toLowerCase();
                const psd1 = document.getElementById('register-psd1').value;
                const psd2 = document.getElementById('register-psd2').value;
                const role = document.getElementById('register-role').value;

                if (!nom || !email || !psd1 || !psd2) {
                    showMessage("Veuillez remplir tous les champs", "error", message);
                    return;
                }

                if (psd1 !== psd2) {
                    showMessage("Les mots de passe ne correspondent pas", "error", message);
                    return;
                }

                if (psd1.length < 6) {
                    showMessage("Le mot de passe doit contenir au moins 6 caractères", "error", message);
                    return;
                }

                try {
                    // Vérification si l'email existe déjà
                    const usersResponse = await fetch(urlUtilisateurs);
                    const allUsers = await usersResponse.json();
                    
                    if (allUsers.some(user => user.email === email)) {
                        showMessage("Cet email est déjà utilisé", "error", message);
                        return;
                    }

                    // Vérification spéciale pour le rôle admin
                    if (role === "admin") {
                        const emailAdmin = prompt("Email admin:");
                        const passwordAdmin = prompt("Mot de passe admin:");

                        const hashedInput = await hashage(passwordAdmin);
                        const adminUser = allUsers.find(u => u.role === "admin");

                        if (emailAdmin !== ADMIN_EMAIL || !adminUser || hashedInput !== adminUser.mot_de_passe) {
                            showMessage("Accès refusé: informations admin incorrectes", "error", message);
                            document.getElementById('register-role').value = "user";
                            return;
                        }
                    }

                    // Enregistrement du nouvel utilisateur
                    const motDePasseHasher = await hashage(psd1);
                    const newUser = { nom, email, mot_de_passe: motDePasseHasher, role };

                    const postResponse = await fetch(urlUtilisateurs, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newUser),
                    });

                    if (!postResponse.ok) throw new Error("Erreur d'enregistrement");

                    // Envoi de l'email de confirmation
                    await fetch("http://localhost:3001/send-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ nom, email, nom_ut: nom }),
                    });

                    localStorage.setItem("utilisateur", JSON.stringify(newUser));
                    localStorage.setItem("connecté", "oui");

                    showMessage("Inscription réussie! Redirection...", "success", message);

                    setTimeout(() => {
                        window.location.href = 
                            role === "admin" ? "admin" :
                            role === "auteur" ? "auteur" : "accueil";
                    }, 1500);
                } catch (error) {
                    console.error("Erreur inscription:", error);
                    showMessage("Erreur lors de l'inscription", "error", message);
                }
            });
        }

        // Fonction d'affichage des messages
        function showMessage(text, type, element) {
            element.textContent = text;
            element.className = `message ${type}`;
            
            if (type !== "success") {
                setTimeout(() => {
                    element.textContent = "";
                    element.className = "message";
                }, 5000);
            }
        }
