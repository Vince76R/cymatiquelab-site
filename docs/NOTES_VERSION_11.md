# CymatiqueLab V11 — correctifs finaux

## Corrigé
- Débordement horizontal et mise en page mobile.
- Logo, bouton Menu, titres, boutons et cartes adaptatifs.
- Navigation unique sur toutes les pages.
- Boucle de réservation supprimée.
- Quatre horaires Calendly accessibles directement depuis la page Réserver.
- Liens internes convertis en chemins absolus depuis la racine.
- Page 404 ajoutée.
- Badge « LIVE » remplacé par « APERÇU · EXEMPLE ».
- Principales notes internes reformulées.
- Politique d’annulation affichée avant le paiement.
- Balises Open Graph de base ajoutées.

## À vérifier après déploiement
- Les quatre événements Calendly sont actifs, ont les bonnes disponibilités et une capacité maximale de 15.
- Cloudflare sert 404.html avec un vrai code 404.
- Le parcours complet fonctionne en navigation privée sur mobile.

## V11.1 — correctif ciblé
Cette mise à jour ne refond aucun gabarit. Elle modifie uniquement :
1. la référence 432/440 Hz dans la ligne « Fréquences dominantes » du laboratoire;
2. l’explication du nom CymatiqueLab sur la page À propos;
3. l’adresse des pieds de page pour ouvrir Google Maps avec « Voir sur la carte »;
4. les fichiers mémoire/documentation correspondants.


## V11.2 — correctifs ciblés
- La page `/pages/reserver` retrouve le header/navigation partagé, sans autre refonte.
- La page `/pages/paiement-voyage-sonore` devient une page de paiement express pensée pour la redirection après Calendly : un seul appel à l’action principal vers Square, politique repliable et liens secondaires discrets.
- Sur l’accueil, la chronologie du voyage sonore est explicitement présentée comme un déroulement habituel relatif à l’heure de réservation; les repères sont `Début`, `+ 20 min`, `+ 30 min`, `+ 1 h 30` afin d’éviter toute interprétation comme minuit.
- Méthode de maintenance : correctifs ciblés uniquement; ne pas réécrire les autres pages lorsqu’un changement n’est pas demandé.
