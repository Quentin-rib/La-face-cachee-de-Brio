# La face cachée de Brio pour Tampermonkey

Un script, **« La face cachée de Brio »**, qui améliore l'affichage de [Brio](https://www.brioeducation.ca/) :

- **Festival de Sciences et Génie :** un thème avec le logo du Festival en fond d'écran, et un bouton « Festival » avec l'horaire des activités (WikiWars, GeoGuessr, Génie en herbe, Improvisation). Il met en évidence les matchs de ton bac.
- **Autres thèmes :** soir de match du Canadien, synthwave, saisons automatiques, météo en direct (bouton 🎨 en bas à gauche). La grande bannière en haut des pages change avec le thème : score et prochains matchs du CH, météo du moment, saison du jour…
- **Échéances et calendrier :** un panneau avec les remises des 30 prochains jours (et un bouton pour voir les 30 suivants), le calendrier de tous tes cours et des liens directs vers les évaluations. Le bouton « 📅 Ajouter à mon agenda » de l'onglet Calendrier exporte tes remises vers Google Agenda, Apple Calendrier, Samsung Calendrier ou Outlook.
- **Notes :** ta note cumulée et ta cote à côté de chaque cours dans la liste « Sites de cours ».
- **Note à viser :** sur la page Résultats d'un cours, le pourcentage à obtenir sur chaque évaluation restante pour monter d'une cote, en tenant compte du seuil de réussite des examens quand le cours en a un.

Tout se passe dans ton navigateur : rien n'est modifié sur Brio et aucune donnée n'est envoyée ailleurs.

## Installation (2 minutes)

### 1. Installer Tampermonkey

Ajoute l'extension à ton navigateur :

- Chrome / Brave : [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- Edge : [Modules Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- Firefox : [Firefox Add-ons](https://addons.mozilla.org/fr/firefox/addon/tampermonkey/)
- Safari (Mac, iPhone, iPad) : **payant**. Tampermonkey pour Safari s'achète sur l'App Store (quelques dollars). Sur Mac, Chrome, Edge et Firefox sont des options gratuites.
- Android : Chrome ne prend pas les extensions. Utilise Firefox pour Android avec le module Tampermonkey (gratuit).
- Autres navigateurs : [tampermonkey.net](https://www.tampermonkey.net/)

**Chrome, Edge, Brave :** il faut aussi autoriser les scripts utilisateur. Clic droit sur l'icône Tampermonkey → *Gérer l'extension*, puis active **« Autoriser les scripts utilisateur »** (ou le *Mode développeur* sur les anciennes versions).

### 2. Installer le script

Clique sur ce lien, puis sur **Installer** dans la page de Tampermonkey qui s'ouvre :

👉 [Installer « La face cachée de Brio »](https://raw.githubusercontent.com/Quentin-rib/Best_Brio/main/brio-festival.user.js)

Au premier clic sur le bouton « Festival », choisis ton bac. Tu pourras le changer plus tard avec « Changer de bac ».

Si tu avais déjà d'anciens scripts Brio (par exemple « Brio Festival » ou « New_Brio »), supprime-les dans le tableau de bord de Tampermonkey, sinon tout s'affichera en double.

### 3. C'est prêt

Ouvre ou recharge [brioeducation.ca](https://www.brioeducation.ca/) et connecte-toi comme d'habitude.

## Mises à jour

Elles sont automatiques : Tampermonkey vérifie régulièrement s'il existe une nouvelle version. Pour forcer la vérification : icône Tampermonkey → *Utilitaires* → *Rechercher des mises à jour des scripts*.

## Problèmes fréquents

- **Rien ne change sur Brio :** vérifie que Tampermonkey est activé et que le script est coché dans son tableau de bord, puis recharge la page. Sur Chrome et Edge, vérifie l'option « Autoriser les scripts utilisateur ».
- **Le panneau des échéances dit que la session est expirée :** déconnecte-toi puis reconnecte-toi à Brio.
- **Tampermonkey demande une autorisation d'accès à un site :** clique sur *Toujours autoriser*. Les seuls sites contactés sont les serveurs de Brio, l'API publique de la LNH (thème Canadien) et Open-Meteo (thème Météo).

Le panneau des échéances est réglé pour l'Université Laval.

