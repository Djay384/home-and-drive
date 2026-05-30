
# Site Routh Location — refonte moderne

Un site mono-page guidé par un questionnaire (voiture / logement / les deux), avec catalogue géré dans Lovable Cloud et paiement en ligne via Stripe.

## Expérience utilisateur (mono-page conversationnelle)

Une seule route `/` qui déroule des étapes animées en plein écran, façon « question / réponse ». Chaque étape avance avec une transition fluide, retour possible en arrière, barre de progression discrète.

```
1. Bienvenue            → "Que recherchez-vous ?"
                          [Voiture] [Logement] [Voiture + Logement]

2a. Voiture — Lieux     → départ / retour (Aéroport, Port, Agence)
2b. Voiture — Dates     → date+heure départ / retour
2c. Voiture — Catalogue → cartes des modèles dispos sur la période,
                          prix total calculé, sélection

3a. Logement — Dates    → check-in / check-out, nb voyageurs
3b. Logement — Catalogue→ galerie soignée (grande photo, équipements,
                          prix/nuit, total), sélection

4. Coordonnées          → nom, email, téléphone, vol (optionnel)

5. Récapitulatif        → résumé + choix du mode de paiement :
                          • Acompte 30 %  • Paiement intégral

6. Paiement Stripe      → Stripe Checkout (hébergé)

7. Confirmation         → numéro de réservation + email de confirmation
```

Règles : si une étape n'a aucune disponibilité, on l'indique clairement et on propose d'ajuster les dates. Le client peut choisir voiture seule, logement seul, ou les deux indépendamment.

## Design

Direction visuelle moderne, tropicale et premium (Guadeloupe) : palette sable / océan profond / accent corail, typographie éditoriale (display serif + sans moderne), beaucoup d'espace, animations Motion subtiles, photos pleine largeur pour les logements. Entièrement responsive (mobile-first, le questionnaire est pensé pour le pouce).

Je proposerai 3 directions visuelles rendues avant d'implémenter pour que tu choisisses.

## Catalogue et back-office (Lovable Cloud)

Tables :
- `vehicles` (modèle, catégorie, photos, prix/jour, caution, transmission, places, options)
- `vehicle_availability` (véhicule, indispo: dates réservées)
- `properties` (nom, description, photos[], capacité, équipements, prix/nuit, localisation)
- `property_availability` (logement, dates réservées)
- `bookings` (client, type, dates, items, total, acompte, statut paiement, stripe_session_id)
- `pickup_locations` (3 lieux statiques)
- `user_roles` (admin) + table séparée comme exigé par les bonnes pratiques

Une route admin protégée `/admin` (auth email/password + rôle `admin`) avec :
- liste/création/édition des véhicules et logements (photos, prix, descriptions)
- vue des réservations + statut paiement
- blocage manuel de dates (indispo)

L'auth admin est isolée du flux client (le client n'a pas besoin de compte pour réserver).

## Disponibilité

Fonction serveur `checkAvailability(type, dateStart, dateEnd)` qui croise les réservations payées + indispos manuelles et renvoie les items disponibles avec le prix total calculé pour la période.

## Paiement

Lovable Payments — Stripe intégré (pas de compte Stripe à créer pour démarrer, test immédiat).

Tu as coché les trois options paiement. Je propose ce compromis : **le client choisit au récapitulatif** entre *acompte 30 %* et *paiement intégral*. Les deux passent par Stripe Checkout. Modifiable plus tard depuis le back-office.

Flux :
1. Création de la réservation (statut `pending`) côté serveur
2. Création d'une Stripe Checkout Session (montant = acompte ou total)
3. Redirection vers Stripe
4. Webhook `/api/public/stripe-webhook` → marque la réservation `paid`, bloque les dates, envoie l'email de confirmation
5. Retour sur la page de confirmation

Aucune date n'est bloquée tant que le paiement n'est pas confirmé (avec un hold court de 15 min pendant le checkout pour éviter les doubles réservations).

## Détails techniques

- Stack : TanStack Start (déjà en place), Tailwind v4, Motion pour les transitions
- État du questionnaire : machine d'état simple (React context + reducer), persistance `sessionStorage` pour ne pas perdre la progression
- Server functions pour : `checkAvailability`, `createBooking`, `createCheckoutSession`, `getCatalog`
- Server route publique : webhook Stripe (signature vérifiée)
- Email de confirmation : via Resend (clé API à fournir plus tard, optionnel à l'étape 1)
- SEO : meta tags FR optimisés "location voiture Guadeloupe", JSON-LD `LocalBusiness`
- Validation Zod sur toutes les entrées serveur

## Ordre de livraison

1. Activation Lovable Cloud + Stripe Payments + schéma BDD + rôle admin
2. Génération des 3 directions visuelles → tu choisis
3. Construction du questionnaire mono-page + transitions
4. Catalogue + dispo (avec données de démo seed)
5. Stripe Checkout + webhook + page de confirmation
6. Back-office admin (CRUD véhicules/logements, réservations)
7. SEO, polish responsive, QA

## Ce qu'il me faut de ta part au fil de l'eau

- Validation de la direction visuelle (étape 2)
- Le contenu réel (photos, descriptions, prix) ou tu utilises mes données de démo pour démarrer ?
- Plus tard : email pro pour Stripe live + clé Resend pour les emails
