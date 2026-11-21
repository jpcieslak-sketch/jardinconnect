# 🌱 JardinConnect

Application web (PWA) de gestion complète du jardin. **Fonctionne hors ligne**, données stockées sur l'appareil (IndexedDB), aucun compte requis.

## Fonctionnalités (version 1)

- **Jardins, parcelles et sols** : descriptions, surfaces, expositions, profils de sol (texture, pH, drainage)
- **Plantations** : suivi de chaque plante (espèce, quantité, date, statut, arrosage)
- **Référentiel botanique** : 20 espèces intégrées (conseils, calendriers de semis/récolte, plantes amies/ennemies)
- **Eau** : réserves (citernes, puits, bassins) avec niveaux, mesures dans le temps
- **Irrigation** : secteurs d'arrosage, méthodes, historique des arrosages
- **Capteurs** : déclaration, mesures, seuils
- **Météo** : relevés manuels avec alertes gel et fortes pluies
- **Diagnostics & traitements** : état sanitaire, photos, produits, renouvellements
- **Alertes automatiques** : arrosages en retard, niveaux d'eau bas, traitements à refaire, gel prévu
- **Sauvegarde** : export/import JSON de toutes les données
- **Installable** : s'ajoute à l'écran d'accueil comme une vraie app (PWA), service worker offline

## Développer

```bash
npm install
npm run dev      # développement (http://localhost:5173)
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build
```

## Déployer gratuitement

Le dossier `dist/` peut être déposé tel quel sur **Netlify**, **Vercel**, **Cloudflare Pages** (gratuits, avec HTTPS) pour rendre l'app accessible au public.

## Qualité des données

Le référentiel botanique intégré contient des valeurs **indicatives** pour un climat tempéré (hémisphère nord). Vérifiez et adaptez selon votre climat. Provenance documentée dans l'écran « À propos » (table `data_sources`).
