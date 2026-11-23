// ==UserScript==
// @name         Brio : thèmes, échéances et notes
// @namespace    lecteur-brio
// @version      2.1.0
// @description  Tout-en-un pour Brio : thèmes (Canadien, synthwave, saisons, météo), panneau des échéances et du calendrier, note cumulée et cote de chaque cours, note à viser sur la page Résultats (avec le seuil des examens). Lecture seule, rien n'est modifié sur Brio.
// @match        https://www.brioeducation.ca/*
// @homepageURL  https://github.com/Quentin-rib/Best_Brio
// @updateURL    https://raw.githubusercontent.com/Quentin-rib/Best_Brio/main/brio.user.js
// @downloadURL  https://raw.githubusercontent.com/Quentin-rib/Best_Brio/main/brio.user.js
// @noframes
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      apis.brioeducation.ca
// @connect      identites.brioeducation.ca
// @connect      api-web.nhle.com
// @connect      assets.nhle.com
// @connect      api.open-meteo.com
// @connect      geocoding-api.open-meteo.com
// ==/UserScript==

/*
 * Ce script regroupe deux parties :
 *   PARTIE 1 : les thèmes (s'applique dès le début du chargement, pour éviter un flash de couleurs)
 *   PARTIE 2 : échéances, calendrier, notes et cibles (démarre une fois la page chargée)
 * Si tu avais installé les anciens scripts « Brio : thèmes » et « Brio : échéances et calendrier »,
 * supprime-les dans Tampermonkey pour éviter que tout s'affiche en double.
 */

// =====================================================================
// PARTIE 1 : THÈMES
// =====================================================================
/*
 * Principe : Brio utilise partout la même petite palette de couleurs.
 * Le script repère la couleur d'origine de chaque élément (fond, texte, bordure),
 * lui pose une étiquette (ex. data-lbt-bg="surface"), puis la feuille de style
 * du thème choisi remplace chaque étiquette par la couleur du thème.
 * Rien n'est modifié sur le serveur : tout se passe dans ton navigateur.
 *
 * Les couleurs du thème sont aussi publiées en variables CSS sur <html>
 * (--lbt-surface, --lbt-accent, --lbt-police...). Elles traversent le Shadow DOM :
 * le panneau « Brio : bilan et échéances » les utilise pour suivre le thème.
 */

(function () {
  'use strict';

  // ================================================================
  // 1. LES THÈMES
  //    Chaque thème = des couleurs + une police + quelques décorations.
  //    bg       : fond de la page            surface  : cartes, en-tête
  //    surface2 : fonds secondaires           bordure  : traits fins
  //    fonce    : barres foncées (menu)       primaire : bandeaux bleus
  //    accent   : liens, boutons, icônes      texte    : texte normal
  //    titre    : titres                      discret  : texte secondaire
  //    surFonce : texte sur les barres foncées
  // ================================================================


  const THEMES = {
    origine: { nom: 'Brio d\'origine', icone: '◻' },

    ch: {
      nom: 'Soir de match au Centre Bell', icone: '🏒',
      bg: '#eaf1f8', surface: '#ffffff', surface2: '#e8edf6', bordure: '#c3cbe2',
      fonce: '#192168', primaire: '#af1e2d', accent: '#af1e2d',
      texte: '#101433', titre: '#192168', discret: '#555b7d', surFonce: '#ffffff',
      bgElement: '#eaf1f8',
      policeTitre: 'Overpass, "Source Sans 3", "Segoe UI", Arial, sans-serif', // style panneau routier, lisible
      deco: `
        /* La glace : lignes bleues et ligne rouge du centre, comme une patinoire vue d'en haut */
        html, body {
          background-image:
            linear-gradient(90deg, transparent calc(50% - 4px), rgba(175,30,45,.22) calc(50% - 4px),
              rgba(175,30,45,.22) calc(50% + 4px), transparent calc(50% + 4px)),
            linear-gradient(90deg, transparent calc(28% - 7px), rgba(25,33,104,.14) calc(28% - 7px),
              rgba(25,33,104,.14) calc(28% + 7px), transparent calc(28% + 7px)),
            linear-gradient(90deg, transparent calc(72% - 7px), rgba(25,33,104,.14) calc(72% - 7px),
              rgba(25,33,104,.14) calc(72% + 7px), transparent calc(72% + 7px)),
            radial-gradient(circle at 50% 50%, transparent 118px, rgba(25,33,104,.12) 119px 121px, transparent 122px)
            !important;
          background-attachment: fixed !important; }

        /* Menu de gauche : bleu du chandail, rayures rouge-blanc-rouge en haut, liseré rouge */
        .p-template-site__grid-item-nav[data-lbt-bg="fonce"] {
          background-image: linear-gradient(180deg, #af1e2d 0 7px, #ffffff 7px 12px, #af1e2d 12px 19px,
            transparent 19px) !important;
          border-right: 4px solid #af1e2d !important; }

        /* Bandeaux rouges : rayure blanche puis bleue en bas, comme le bas du chandail */
        [data-lbt-bg="primaire"] { box-shadow: inset 0 -4px 0 #192168, inset 0 -8px 0 #ffffff !important; }

        /* Cartes : haut bleu, bas rouge, comme les bandes d'un chandail */
        [data-lbt-bg="surface"] { border-top: 5px solid #192168 !important; border-radius: 4px !important;
          box-shadow: 0 2px 8px rgba(25,33,104,.18), inset 0 -3px 0 #af1e2d !important; }

        /* Titres : style tableau indicateur, souligné rouge-blanc-bleu */
        h1, h2 { font-weight: 800 !important; letter-spacing: .02em; }
        h1 { text-transform: uppercase; letter-spacing: .05em; }
        h1 { display: inline-block; width: fit-content; max-width: 100%; padding-bottom: 6px;
          background: linear-gradient(90deg, #af1e2d 0 33%, #ffffff 33% 66%, #192168 66%) left bottom / 100% 5px no-repeat; }

        /* Élément du menu sélectionné : bande rouge */
        [class*="is-selected"] { box-shadow: inset 6px 0 0 #af1e2d !important; }
        a:hover { text-decoration-color: #192168 !important; }

        /* Barre de défilement aux couleurs du club */
        ::-webkit-scrollbar { width: 12px; height: 12px; }
        ::-webkit-scrollbar-track { background: #192168; }
        ::-webkit-scrollbar-thumb { background: #af1e2d; border: 2px solid #192168; border-radius: 6px; }
        ::selection { background: #af1e2d !important; color: #ffffff !important; }`,
    },

    synthwave: {
      nom: 'Synthwave 1986', icone: '🌆', sombre: true,
      bg: '#1a0933', surface: '#241046', surface2: '#2f1659', bordure: '#5d2a8c',
      fonce: '#0e0322', primaire: '#3d0f63', accent: '#ff5fdc',
      texte: '#efe3ff', titre: '#5cf2ff', discret: '#b49ad8', surFonce: '#f6ecff',
      bgElement: 'transparent', // les zones de fond laissent voir le ciel et la grille
      policeTitre: '"Trebuchet MS", "Segoe UI", Arial, sans-serif',
      deco: `
        /* Ciel du soir : violet en haut, rose à l'horizon */
        html { background: linear-gradient(180deg, #0c0320 0%, #23094a 40%, #6a1670 63%, #12041f 63.3%) fixed !important; }
        body { background: transparent !important; }
        /* Le soleil rayé, posé sur l'horizon */
        html::before { content: ""; position: fixed; z-index: -2; left: 50%; top: calc(63vh - 240px); width: 300px; height: 300px;
          margin-left: -150px; border-radius: 50%; pointer-events: none; opacity: .55;
          clip-path: inset(0 0 60px 0); /* le bas du soleil est caché sous l'horizon */
          background: linear-gradient(180deg, #ffe66b 0%, #ff8a3d 45%, #ff3fa4 75%);
          -webkit-mask: linear-gradient(180deg, #000 0 52%, transparent 52% 56%, #000 56% 63%, transparent 63% 67%,
            #000 67% 73%, transparent 73% 78%, #000 78% 100%);
          mask: linear-gradient(180deg, #000 0 52%, transparent 52% 56%, #000 56% 63%, transparent 63% 67%,
            #000 67% 73%, transparent 73% 78%, #000 78% 100%); }
        /* La grille au sol qui défile vers nous */
        html::after { content: ""; position: fixed; z-index: -1; left: -50%; right: -50%; top: 63vh; height: 80vh;
          pointer-events: none; transform-origin: top; transform: perspective(260px) rotateX(62deg);
          background-image: linear-gradient(rgba(255,95,220,.55) 2px, transparent 2px),
            linear-gradient(90deg, rgba(255,95,220,.55) 2px, transparent 2px);
          background-size: 64px 64px; animation: lbt-grille 1.6s linear infinite; }
        @keyframes lbt-grille { to { background-position: 0 64px; } }
        @media (prefers-reduced-motion: reduce) { html::after { animation: none; } }
        /* Néons */
        [data-lbt-bg="surface"] { border: 1px solid #ff5fdc !important; border-radius: 6px !important;
          box-shadow: 0 0 14px rgba(255,95,220,.45), inset 0 0 0 1px rgba(92,242,255,.15) !important; }
        .p-template-site__grid-item-nav[data-lbt-bg="fonce"] { border-right: 2px solid #5cf2ff !important;
          box-shadow: 0 0 18px rgba(92,242,255,.45) !important; }
        [data-lbt-bg="primaire"] { background-image: linear-gradient(90deg, #3d0f63, #861c8f) !important; }
        h1, h2 { text-transform: uppercase; letter-spacing: .07em; font-style: italic;
          text-shadow: 0 0 6px rgba(92,242,255,.8), 0 0 20px rgba(255,95,220,.6); }
        [data-lbt-fg="accent"]:hover { text-shadow: 0 0 8px rgba(255,95,220,.9); }
        [class*="is-selected"] { box-shadow: inset 4px 0 0 #5cf2ff !important; }
        ::-webkit-scrollbar { width: 12px; height: 12px; }
        ::-webkit-scrollbar-track { background: #0e0322; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(#ff5fdc, #5cf2ff); border-radius: 6px; border: 2px solid #0e0322; }`,
    },

    // Thèmes « vivants » : leurs couleurs viennent de SAISONS ou de METEO (voir plus bas)
    saisons: { nom: 'Saisons automatiques', icone: '🍂', dynamique: true },
    meteo: { nom: 'Météo en direct', icone: '⛅', dynamique: true },
  };

  // ================================================================
  // 1 b. LES SAISONS (choisies selon la date du jour)
  //      particules : petites choses qui tombent ou volent à l'écran
  // ================================================================
  const FLOCONS_CLAIR = { car: ['❄', '❅', '❆'], n: 22, taille: [10, 20], duree: [10, 20], couleur: '#ffffff',
    ombre: '0 0 3px rgba(30,70,110,.75)', type: 'tomber' };
  const SAISONS = {
    sucres: {
      nom: 'Temps des sucres', icone: '🍁',
      bg: '#f3e6cf', surface: '#fffaf0', surface2: '#f1e2c4', bordure: '#c9a46a',
      fonce: '#4a2a14', primaire: '#8a4b16', accent: '#a84d14',
      texte: '#33220f', titre: '#5a2e0e', discret: '#7b6448', surFonce: '#fbe7c2',
      policeTitre: 'Georgia, "Palatino Linotype", serif',
      deco: `
        /* Nappe à carreaux de cabane à sucre en haut du menu */
        .p-template-site__grid-item-nav[data-lbt-bg="fonce"] {
          background-image: repeating-conic-gradient(#b3202a 0 25%, #f6efe4 0 50%) !important;
          background-size: 16px 16px !important; background-repeat: repeat-x !important; }
        [data-lbt-bg="surface"] { border: 1px solid #c9a46a !important; border-radius: 8px !important;
          box-shadow: 0 3px 0 #b07a3c !important; }
        h1::before { content: "🍁 "; }`,
      particules: { car: ['🍁'], n: 7, taille: [14, 22], duree: [14, 24], type: 'feuilles' },
    },
    printemps: {
      nom: 'Printemps', icone: '🌸',
      bg: '#eef7ea', surface: '#ffffff', surface2: '#e3f1dc', bordure: '#b9d7a9',
      fonce: '#1f4d2b', primaire: '#3c8a4a', accent: '#b03a6f',
      texte: '#1c2a1f', titre: '#1f4d2b', discret: '#5b7262', surFonce: '#ffffff',
      deco: `
        [data-lbt-bg="surface"] { border-radius: 10px !important; border-top: 4px solid #e48bb4 !important;
          box-shadow: 0 3px 10px rgba(31,77,43,.15) !important; }
        h1::before { content: "🌷 "; }`,
      particules: { car: ['🌸'], n: 9, taille: [10, 16], duree: [13, 22], type: 'feuilles' },
    },
    fete: {
      nom: 'Fête nationale', icone: '⚜',
      bg: '#e8f0fb', surface: '#ffffff', surface2: '#dfe8f7', bordure: '#a9bfe3',
      fonce: '#002c77', primaire: '#003da5', accent: '#003da5',
      texte: '#0f1a2e', titre: '#002c77', discret: '#4f5f7a', surFonce: '#ffffff',
      deco: `
        [data-lbt-bg="surface"] { border: 2px solid #003da5 !important; border-radius: 6px !important; }
        [data-lbt-bg="primaire"] { box-shadow: inset 0 -4px 0 #ffffff !important; }
        h1::before { content: "⚜ "; color: #003da5; }`,
      particules: { car: ['⚜'], n: 10, taille: [12, 20], duree: [12, 20], couleur: '#2c63c9', type: 'feuilles' },
    },
    ete: {
      nom: 'Été', icone: '☀',
      bg: '#fff6e0', surface: '#ffffff', surface2: '#fdecc4', bordure: '#f0cf86',
      fonce: '#0b5d7a', primaire: '#0e86a8', accent: '#b8540d',
      texte: '#2a2316', titre: '#0b5d7a', discret: '#7a6a4c', surFonce: '#ffffff',
      deco: `
        html, body { background-image: radial-gradient(circle at 92% 6%, rgba(255,200,60,.55) 0 60px, rgba(255,200,60,.15) 61px 160px, transparent 161px) !important;
          background-attachment: fixed !important; }
        [data-lbt-bg="surface"] { border-radius: 12px !important; box-shadow: 0 4px 14px rgba(11,93,122,.15) !important; }
        [data-lbt-bg="fonce"] { box-shadow: inset 0 -6px 0 #f6d27a !important; }
        h1::before { content: "☀ "; color: #f2a516; }`,
    },
    automne: {
      nom: 'Automne', icone: '🍂',
      bg: '#f6ebdc', surface: '#fffaf3', surface2: '#f1dfc7', bordure: '#d6a77a',
      fonce: '#5a2412', primaire: '#a5401b', accent: '#a83f0c',
      texte: '#2f1e12', titre: '#6b2410', discret: '#7e624b', surFonce: '#fde9d4',
      policeTitre: 'Georgia, "Palatino Linotype", serif',
      deco: `
        [data-lbt-bg="surface"] { border: 1px solid #d6a77a !important; border-radius: 8px !important;
          box-shadow: 0 3px 10px rgba(90,36,18,.15) !important; }
        [data-lbt-bg="fonce"] { background-image: linear-gradient(180deg, #7a3216, #5a2412) !important; }
        h1::before { content: "🍂 "; }`,
      particules: { car: ['🍂', '🍁', '🍂'], n: 10, taille: [14, 22], duree: [12, 22], type: 'feuilles' },
    },
    halloween: {
      nom: 'Halloween', icone: '🎃', sombre: true,
      bg: '#1b1320', surface: '#271c2e', surface2: '#33253b', bordure: '#4b3756',
      fonce: '#0f0a12', primaire: '#3b1f47', accent: '#ff9a2e',
      texte: '#efe3d6', titre: '#ffa53d', discret: '#a993a8', surFonce: '#efe3d6',
      deco: `
        html, body { background-image: radial-gradient(circle at 88% 10%, rgba(255,240,200,.35) 0 46px, transparent 47px) !important;
          background-attachment: fixed !important; }
        [data-lbt-bg="surface"] { border: 1px solid #ff9a2e !important; box-shadow: 0 0 14px rgba(255,154,46,.25) !important; }
        h1::before { content: "🎃 "; }
        h1, h2 { text-shadow: 0 0 10px rgba(255,154,46,.45); }`,
      particules: { car: ['🦇'], n: 4, taille: [16, 26], duree: [14, 26], type: 'voler' },
    },
    noel: {
      nom: 'Temps des fêtes', icone: '🎄',
      bg: '#f4efe6', surface: '#ffffff', surface2: '#efe6d6', bordure: '#d3c3a5',
      fonce: '#14452f', primaire: '#a51d26', accent: '#a51d26',
      texte: '#1d1a16', titre: '#14452f', discret: '#6b6152', surFonce: '#ffffff',
      policeTitre: 'Georgia, "Palatino Linotype", serif',
      deco: `
        /* Guirlande lumineuse en haut du menu */
        .p-template-site__grid-item-nav[data-lbt-bg="fonce"] {
          background-image: radial-gradient(circle, #ff4b4b 0 4px, transparent 5px), radial-gradient(circle, #ffd84a 0 4px, transparent 5px),
            radial-gradient(circle, #4bc3ff 0 4px, transparent 5px), radial-gradient(circle, #6bff8a 0 4px, transparent 5px) !important;
          background-size: 64px 18px !important; background-repeat: repeat-x !important;
          background-position: 4px 4px, 20px 8px, 36px 4px, 52px 8px !important; }
        [data-lbt-bg="surface"] { border-top: 4px solid #a51d26 !important; border-radius: 6px !important;
          box-shadow: 0 3px 10px rgba(20,69,47,.18), inset 0 -3px 0 #14452f !important; }
        h1::before { content: "🎄 "; }`,
      particules: FLOCONS_CLAIR,
    },
    hiver: {
      nom: 'Hiver', icone: '❄',
      bg: '#e9f1f8', surface: '#ffffff', surface2: '#dde9f3', bordure: '#b4c9dc',
      fonce: '#16324f', primaire: '#2a5b8a', accent: '#245f99',
      texte: '#122233', titre: '#16324f', discret: '#5a7189', surFonce: '#ffffff',
      deco: `
        [data-lbt-bg="surface"] { border: 1px solid #c6d8e8 !important; border-radius: 10px !important;
          box-shadow: 0 0 0 3px rgba(255,255,255,.8), 0 4px 14px rgba(22,50,79,.15) !important; }
        h1::before { content: "❄ "; color: #6fa3d1; }`,
      particules: FLOCONS_CLAIR,
    },
    valentin: {
      nom: 'Saint-Valentin', icone: '❤',
      bg: '#fbeef1', surface: '#ffffff', surface2: '#f7dfe5', bordure: '#e6b3c0',
      fonce: '#5c1a2e', primaire: '#b8325a', accent: '#b0174f',
      texte: '#2a1219', titre: '#7a1d3a', discret: '#80606a', surFonce: '#ffffff',
      deco: `
        [data-lbt-bg="surface"] { border-radius: 12px !important; border-top: 4px solid #e57399 !important; }
        h1::before { content: "❤ "; color: #d6336c; }`,
      particules: { car: ['❤'], n: 9, taille: [10, 18], duree: [12, 20], couleur: '#e05a86', type: 'feuilles' },
    },
  };

  /** Quelle saison aujourd'hui ? (dates du Québec) */
  function saisonDuJour(d = new Date()) {
    const md = (d.getMonth() + 1) * 100 + d.getDate(); // ex. 14 novembre = 1114
    if (md >= 1201 || md <= 106) return 'noel';
    if (md >= 210 && md <= 214) return 'valentin';
    if (md <= 228 || md === 229) return 'hiver';
    if (md <= 430) return 'sucres';
    if (md <= 620) return 'printemps';
    if (md <= 625) return 'fete';
    if (md <= 921) return 'ete';
    if (md >= 1020 && md <= 1031) return 'halloween';
    return 'automne';
  }

  // ================================================================
  // 1 c. LES AMBIANCES MÉTÉO (choisies selon la météo réelle de ta ville)
  // ================================================================
  const METEO = {
    soleil: {
      nom: 'Soleil', icone: '☀',
      bg: '#e6f3fc', surface: '#ffffff', surface2: '#dcecf8', bordure: '#aacbe6',
      fonce: '#0f4c81', primaire: '#1a73b8', accent: '#b0560a',
      texte: '#14212e', titre: '#0f4c81', discret: '#5a6f84', surFonce: '#ffffff',
      deco: `
        html, body { background-image: radial-gradient(circle at 92% 6%, rgba(255,205,70,.6) 0 56px, rgba(255,205,70,.15) 57px 170px, transparent 171px) !important;
          background-attachment: fixed !important; }
        [data-lbt-bg="surface"] { border-radius: 10px !important; box-shadow: 0 4px 14px rgba(15,76,129,.14) !important; }`,
    },
    nuageux: {
      nom: 'Nuageux', icone: '☁',
      bg: '#e7eaee', surface: '#ffffff', surface2: '#dde1e7', bordure: '#b8c0ca',
      fonce: '#3a4654', primaire: '#56657a', accent: '#2c659c',
      texte: '#1e252d', titre: '#2e3a48', discret: '#66717e', surFonce: '#ffffff',
      deco: `
        html, body { background-image: radial-gradient(ellipse 340px 90px at 15% 8%, rgba(255,255,255,.9), transparent 70%),
          radial-gradient(ellipse 420px 110px at 80% 14%, rgba(255,255,255,.8), transparent 70%) !important;
          background-attachment: fixed !important; }
        [data-lbt-bg="surface"] { border-radius: 10px !important; box-shadow: 0 3px 10px rgba(58,70,84,.14) !important; }`,
    },
    pluie: {
      nom: 'Pluie', icone: '🌧',
      bg: '#d9e1ea', surface: '#f7f9fb', surface2: '#e2e8ef', bordure: '#a7b5c4',
      fonce: '#22313f', primaire: '#355a7c', accent: '#285a88',
      texte: '#16202a', titre: '#22313f', discret: '#5c6b7a', surFonce: '#ffffff',
      deco: `
        [data-lbt-bg="surface"] { border-radius: 8px !important; box-shadow: 0 3px 12px rgba(34,49,63,.2) !important; }`,
      particules: { type: 'pluie', n: 45, duree: [0.7, 1.2], couleur: 'rgba(40,80,120,.45)' },
    },
    neige: {
      nom: 'Neige', icone: '❄',
      bg: '#e9f1f8', surface: '#ffffff', surface2: '#dde9f3', bordure: '#b4c9dc',
      fonce: '#16324f', primaire: '#2a5b8a', accent: '#245f99',
      texte: '#122233', titre: '#16324f', discret: '#5a7189', surFonce: '#ffffff',
      deco: `
        [data-lbt-bg="surface"] { border: 1px solid #c6d8e8 !important; border-radius: 10px !important;
          box-shadow: 0 0 0 3px rgba(255,255,255,.8), 0 4px 14px rgba(22,50,79,.15) !important; }`,
      particules: { ...FLOCONS_CLAIR, n: 30 },
    },
    orage: {
      nom: 'Orage', icone: '⛈', sombre: true,
      bg: '#2a2733', surface: '#363241', surface2: '#423d4f', bordure: '#575168',
      fonce: '#17151d', primaire: '#3d3550', accent: '#ffd84a',
      texte: '#ece9f2', titre: '#fff3b0', discret: '#a8a2b8', surFonce: '#ece9f2',
      deco: `
        [data-lbt-bg="surface"] { border: 1px solid #575168 !important; box-shadow: 0 0 16px rgba(0,0,0,.5) !important; }
        h1, h2 { text-shadow: 0 0 8px rgba(255,216,74,.35); }`,
      particules: { type: 'pluie', n: 55, duree: [0.5, 0.9], couleur: 'rgba(200,210,240,.35)', eclair: true },
    },
    brouillard: {
      nom: 'Brouillard', icone: '🌫',
      bg: '#eceeef', surface: '#fbfbfb', surface2: '#e4e6e8', bordure: '#c4c8cc',
      fonce: '#4a5258', primaire: '#6b747b', accent: '#336685',
      texte: '#22282d', titre: '#3a4248', discret: '#6f777d', surFonce: '#ffffff',
      deco: `
        html, body { background-image: linear-gradient(180deg, rgba(255,255,255,.85), rgba(255,255,255,0) 60%) !important;
          background-attachment: fixed !important; }
        [data-lbt-bg="surface"] { border-radius: 10px !important; box-shadow: 0 0 24px rgba(255,255,255,.9) !important; }`,
    },
    nuit: {
      nom: 'Nuit', icone: '🌙', sombre: true,
      bg: '#0f1626', surface: '#18223a', surface2: '#212d48', bordure: '#33415f',
      fonce: '#0a0f1c', primaire: '#1f2c4d', accent: '#8fb8ff',
      texte: '#dde5f3', titre: '#f2e6b8', discret: '#93a0b8', surFonce: '#dde5f3',
      deco: `
        /* Ciel étoilé et lune */
        html, body { background-image:
          radial-gradient(circle at 90% 9%, #f2e6b8 0 26px, rgba(242,230,184,.12) 27px 70px, transparent 71px),
          radial-gradient(1.5px 1.5px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 28% 42%, #fff, transparent),
          radial-gradient(1.5px 1.5px at 47% 12%, #fff, transparent), radial-gradient(1px 1px at 63% 33%, #fff, transparent),
          radial-gradient(1.5px 1.5px at 76% 58%, #fff, transparent), radial-gradient(1px 1px at 34% 76%, #fff, transparent),
          radial-gradient(1.5px 1.5px at 85% 82%, #fff, transparent), radial-gradient(1px 1px at 6% 64%, #fff, transparent) !important;
          background-attachment: fixed !important; }
        [data-lbt-bg="surface"] { border: 1px solid #33415f !important; box-shadow: 0 0 16px rgba(0,0,0,.5) !important; }
        h1, h2 { text-shadow: 0 0 10px rgba(242,230,184,.3); }`,
    },
  };

  /** Code météo international (WMO) → ambiance du thème, et description en français */
  function ambianceMeteo(code, jour) {
    if ([95, 96, 99].includes(code)) return 'orage';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'neige';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'pluie';
    if ([45, 48].includes(code)) return 'brouillard';
    if (!jour) return 'nuit';
    return code <= 1 ? 'soleil' : 'nuageux';
  }
  const DESC_METEO = {
    0: 'Ciel dégagé', 1: 'Plutôt dégagé', 2: 'Partiellement nuageux', 3: 'Couvert',
    45: 'Brouillard', 48: 'Brouillard givrant',
    51: 'Bruine légère', 53: 'Bruine', 55: 'Bruine forte', 56: 'Bruine verglaçante', 57: 'Bruine verglaçante forte',
    61: 'Pluie faible', 63: 'Pluie', 65: 'Pluie forte', 66: 'Pluie verglaçante', 67: 'Pluie verglaçante forte',
    71: 'Neige faible', 73: 'Neige', 75: 'Neige forte', 77: 'Grésil',
    80: 'Averses', 81: 'Averses', 82: 'Averses violentes', 85: 'Averses de neige', 86: 'Fortes averses de neige',
    95: 'Orage', 96: 'Orage et grêle', 99: 'Orage et forte grêle',
  };
  function iconeMeteo(code, jour) {
    if ([95, 96, 99].includes(code)) return '⛈️';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️';
    if (code >= 51 && code <= 57) return '🌦️';
    if ([45, 48].includes(code)) return '🌫️';
    if (code === 3) return '☁️';
    if (code === 2) return jour ? '⛅' : '☁️';
    return jour ? '☀️' : '🌙';
  }

  // Les cadres décoratifs ne vont que sur les « grandes » cartes : une surface claire qui n'est pas
  // déjà à l'intérieur d'une autre (sinon chaque ligne d'un tableau était encadrée, collée au texte).
  const CADRE = '[data-lbt-bg="surface"]:not([data-lbt-bg="surface"] [data-lbt-bg="surface"])';

  // ================================================================
  // 2. LA PALETTE D'ORIGINE DE BRIO → rôle dans le thème
  // ================================================================
  const FONDS = {
    'rgb(255, 255, 255)': 'surface',
    'rgb(238, 242, 246)': 'bg',
    'rgb(246, 248, 250)': 'bg',
    'rgb(221, 227, 233)': 'surface2',
    'rgb(201, 210, 220)': 'bordure',
    'rgb(15, 38, 62)': 'fonce',
    'rgba(15, 38, 62, 0.5)': 'fonce',
    'rgba(15, 38, 62, 0.75)': 'fonce',
    'rgb(7, 85, 177)': 'primaire',
    'rgb(14, 103, 214)': 'accent',
    'rgb(78, 102, 126)': 'discret',
  };
  const TEXTES = {
    'rgb(0, 0, 0)': 'texte',
    'rgb(15, 38, 62)': 'titre',
    'rgb(14, 103, 214)': 'accent',
    'rgb(7, 85, 177)': 'accent',
    'rgb(78, 102, 126)': 'discret',
    'rgb(166, 181, 195)': 'discret',
    'rgb(201, 210, 220)': 'discret',
    'rgb(255, 255, 255)': 'surFonce',
    'rgb(170, 210, 255)': 'accent',
  };
  const BORDURES = {
    'rgb(201, 210, 220)': 'bordure',
    'rgb(221, 227, 233)': 'bordure',
    'rgb(78, 102, 126)': 'bordure',
    'rgb(14, 103, 214)': 'accent',
  };

  // ================================================================
  // 3. MÉMOIRE DU CHOIX (stockage Tampermonkey, sinon navigateur)
  // ================================================================
  const CLE = 'brio-theme';
  const lireChoix = () => {
    try { if (typeof GM_getValue === 'function') return GM_getValue(CLE, 'origine'); } catch (e) { /* rien */ }
    try { return localStorage.getItem(CLE) || 'origine'; } catch (e) { return 'origine'; }
  };
  const ecrireChoix = (v) => {
    try { if (typeof GM_setValue === 'function') { GM_setValue(CLE, v); return; } } catch (e) { /* rien */ }
    try { localStorage.setItem(CLE, v); } catch (e) { /* rien */ }
  };
  let choix = THEMES[lireChoix()] ? lireChoix() : 'origine';

  // Animations (flocons, pluie, feuilles...) : activées par défaut, désactivables dans le menu
  const CLE_ANIM = 'brio-anim';
  let animations = true;
  try { if (typeof GM_getValue === 'function') animations = GM_getValue(CLE_ANIM, true) !== false; } catch (e) { /* rien */ }

  /** Le thème réellement affiché (pour Saisons et Météo, il change selon la date ou la météo) */
  function themeActif() {
    if (choix === 'saisons') return SAISONS[saisonDuJour()];
    if (choix === 'meteo') return METEO[ambianceActuelle()] || METEO.nuageux;
    return THEMES[choix];
  }

  // ================================================================
  // 4. ÉTIQUETAGE DES ÉLÉMENTS SELON LEUR COULEUR D'ORIGINE
  // ================================================================
  const IGNORER = '#lecteur-brio-bilan, #lbt-menu, #lbt-bouton, #lbt-match, #lbt-meteo, #lbt-ambiance, script, style, svg *';
  const ATTRS = ['data-lbt-bg', 'data-lbt-fg', 'data-lbt-bd'];

  function etiqueter(el) {
    if (el.nodeType !== 1 || (el.closest && el.closest(IGNORER))) return;
    // On retire nos étiquettes pour relire la VRAIE couleur d'origine
    ATTRS.forEach((a) => el.removeAttribute(a));
    const s = getComputedStyle(el);
    const bg = FONDS[s.backgroundColor];
    const fg = TEXTES[s.color];
    const bdCouleur = s.borderTopWidth !== '0px' ? s.borderTopColor
      : s.borderBottomWidth !== '0px' ? s.borderBottomColor
        : s.borderLeftWidth !== '0px' ? s.borderLeftColor : null;
    const bd = bdCouleur ? BORDURES[bdCouleur] : null;
    // Les liens sans couleur reconnue prennent la couleur des liens du thème
    let texte = fg || (el.tagName === 'A' ? 'accent' : null);
    // Sur un fond foncé (le fond étiqueté le plus proche, lui-même compris), le texte passe en clair
    if (texte && texte !== 'surFonce') {
      const fondProche = bg || (el.parentElement && el.parentElement.closest('[data-lbt-bg]')
        ? el.parentElement.closest('[data-lbt-bg]').getAttribute('data-lbt-bg') : null);
      if (fondProche === 'fonce' || fondProche === 'primaire') texte = texte === 'discret' ? 'surFonceDiscret' : 'surFonce';
    }
    if (bg) el.setAttribute('data-lbt-bg', bg);
    if (texte) el.setAttribute('data-lbt-fg', texte);
    if (bd) el.setAttribute('data-lbt-bd', bd);
  }

  // Brio anime ses changements de couleur : pendant la lecture, on coupe les animations
  // pour lire la couleur finale et non une couleur en cours de transition.
  let sansTransition = null;
  function etiqueterArbre(racine) {
    if (racine.nodeType !== 1) return;
    if (!sansTransition) {
      sansTransition = document.createElement('style');
      sansTransition.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
    }
    (document.head || document.documentElement).appendChild(sansTransition);
    etiqueter(racine);
    racine.querySelectorAll('*').forEach(etiqueter);
    sansTransition.remove();
  }

  // File d'attente : on traite les changements par paquets, sans bloquer la page
  const aTraiter = new Set();
  let prevu = false;
  function planifier(el) {
    aTraiter.add(el);
    if (prevu) return;
    prevu = true;
    requestAnimationFrame(() => {
      prevu = false;
      const liste = [...aTraiter];
      aTraiter.clear();
      assurerModule(); // le tableau (match du CH ou météo) suit les changements de page dans Brio
      if (choix === 'origine') return;
      liste.forEach((n) => (n.isConnected ? etiqueterArbre(n) : null));
    });
  }

  const observateur = new MutationObserver((mutations) => {
    if (choix === 'origine') return;
    for (const m of mutations) {
      if (m.type === 'childList') m.addedNodes.forEach((n) => n.nodeType === 1 && planifier(n));
      else if (m.type === 'attributes') planifier(m.target); // changement de classe (onglet actif, survol...)
    }
  });

  // ================================================================
  // 5. FEUILLE DE STYLE DU THÈME
  // ================================================================
  function cssDuTheme(t) {
    const roles = ['bg', 'surface', 'surface2', 'bordure', 'fonce', 'primaire', 'accent', 'texte', 'titre', 'discret', 'surFonce'];
    const vars = roles.map((r) => `--lbt-${r}: ${t[r]};`).join(' ');
    const regles = roles.map((r) => `
      [data-lbt-bg="${r}"] { background-color: var(--lbt-${r}) !important; }
      [data-lbt-fg="${r}"] { color: var(--lbt-${r}) !important; }
      [data-lbt-bd="${r}"] { border-color: var(--lbt-${r}) !important; }`).join('');
    const police = t.police ? `
      body, body *:not(i):not(svg):not(svg *):not([class*="fa-"]):not([class*="m-icon"]) { font-family: ${t.police} !important; }` : '';
    const policeTitre = t.policeTitre ? `h1, h2, h3, h4 { font-family: ${t.policeTitre} !important; }` : '';
    return `
      html { ${vars} --lbt-bgElement: ${t.bgElement || t.bg};
        ${t.police ? `--lbt-police: ${t.police};` : ''} ${t.policeTitre ? `--lbt-policeTitre: ${t.policeTitre};` : ''}
        background: var(--lbt-bg) !important;
        color-scheme: ${t.sombre ? 'dark' : 'light'}; }
      body { background-color: var(--lbt-bg) !important; color: var(--lbt-texte); }
      ${regles}
      [data-lbt-bg="bg"] { background-color: var(--lbt-bgElement) !important; }
      /* Texte secondaire posé sur une barre foncée */
      [data-lbt-fg="surFonceDiscret"] { color: var(--lbt-surFonce) !important; opacity: .75; }
      ::selection { background: var(--lbt-accent); color: var(--lbt-surface); }
      input, textarea, select { background: var(--lbt-surface) !important; color: var(--lbt-texte) !important; }
      ${police}
      ${policeTitre}
      ${(t.deco || '').split('[data-lbt-bg="surface"]').join(CADRE)}`;
  }

  let feuille = null;
  let cssCourant = '';
  function appliquer(nom) {
    choix = THEMES[nom] ? nom : 'origine';
    ecrireChoix(choix);
    cssCourant = '';
    if (!feuille) {
      feuille = document.createElement('style');
      feuille.id = 'lbt-feuille';
      (document.head || document.documentElement).appendChild(feuille);
    }
    if (choix === 'origine') {
      feuille.textContent = '';
      majAmbiance(null);
      document.querySelectorAll('[data-lbt-bg],[data-lbt-fg],[data-lbt-bd]')
        .forEach((el) => ATTRS.forEach((a) => el.removeAttribute(a)));
    } else {
      feuille.textContent = '';                      // on relit les vraies couleurs...
      if (document.body) etiqueterArbre(document.body);
      rafraichirTheme(); // ...puis on applique le thème
    }
    majMenu();
    assurerModule();
    if (choix === 'meteo') donneesMeteo().then(() => { if (choix === 'meteo') { rafraichirTheme(); majMenu(); } });
  }

  /** Réapplique les couleurs si le thème vivant a changé (nouvelle saison, nouvelle météo) */
  function rafraichirTheme() {
    if (choix === 'origine' || !feuille) return;
    const t = themeActif();
    const css = cssDuTheme(t);
    if (css !== cssCourant) { feuille.textContent = css; cssCourant = css; }
    majAmbiance(t.particules || null);
  }

  // ================================================================
  // 6. BOUTON ET MENU DE CHOIX (en bas à gauche, isolés du reste)
  // ================================================================
  let menuRacine = null;
  function installerMenu() {
    const hote = document.createElement('div');
    hote.id = 'lbt-bouton';
    menuRacine = hote.attachShadow({ mode: 'open' });
    menuRacine.innerHTML = `
      <style>
        :host { all: initial; }
        .btn { position: fixed; left: 20px; bottom: 20px; z-index: 2147483000; width: 46px; height: 46px; border-radius: 50%;
          border: 0; background: #0f263e; color: #fff; font: 22px/46px Arial, sans-serif; cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,.35); }
        .btn:hover { transform: scale(1.08); }
        .menu { position: fixed; left: 20px; bottom: 76px; z-index: 2147483000; background: #fff; border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,.35); padding: 6px; min-width: 230px; font: 15px Arial, sans-serif; }
        .menu[hidden] { display: none; }
        .titre { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #4e667e; padding: 6px 10px; }
        .choix { display: flex; align-items: center; gap: 10px; width: 100%; border: 0; background: none; padding: 8px 10px;
          border-radius: 6px; cursor: pointer; font: inherit; color: #0f263e; text-align: left; }
        .choix:hover { background: #eef2f6; }
        .choix.actif { background: #0f263e; color: #fff; }
        .pastilles { margin-left: auto; display: flex; gap: 3px; }
        .pastilles i { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(0,0,0,.2); }
        .sous { display: block; font-size: 12px; opacity: .7; }
        .anim { display: flex; align-items: center; gap: 8px; padding: 8px 10px 4px; margin-top: 4px; border-top: 1px solid #dde3e9;
          color: #4e667e; font-size: 13px; cursor: pointer; }
        .anim + .anim { border-top: 0; margin-top: 0; padding-top: 2px; }
      </style>
      <button class="btn" title="Changer le thème de Brio" aria-label="Changer le thème de Brio">🎨</button>
      <div class="menu" hidden role="menu">
        <div class="titre">Thème de Brio</div>
        ${Object.entries(THEMES).map(([cle, t]) => `
          <button class="choix" data-theme="${cle}" role="menuitem">
            <span>${t.icone}</span><span>${t.nom}<span class="sous"></span></span>
            <span class="pastilles"></span>
          </button>`).join('')}
        <label class="anim"><input type="checkbox" ${animations ? 'checked' : ''}> Animations (neige, pluie, feuilles…)</label>
      </div>`;
    document.body.appendChild(hote);
    const menu = menuRacine.querySelector('.menu');
    menuRacine.querySelector('.btn').addEventListener('click', () => { menu.hidden = !menu.hidden; });
    menuRacine.querySelectorAll('.choix').forEach((b) => b.addEventListener('click', () => {
      appliquer(b.dataset.theme);
      menu.hidden = true;
    }));
    menuRacine.querySelector('.anim input').addEventListener('change', (e) => {
      animations = e.target.checked;
      try { if (typeof GM_setValue === 'function') GM_setValue(CLE_ANIM, animations); } catch (err) { /* rien */ }
      cleAmbiance = '';
      if (choix === 'origine') majAmbiance(null); else rafraichirTheme();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') menu.hidden = true; });
    majMenu();
  }

  function majMenu() {
    if (!menuRacine) return;
    menuRacine.querySelectorAll('.choix').forEach((b) => {
      const cle = b.dataset.theme;
      b.classList.toggle('actif', cle === choix);
      // Pour Saisons et Météo : on montre l'ambiance du moment et ses couleurs
      const t = cle === 'saisons' ? SAISONS[saisonDuJour()]
        : cle === 'meteo' ? (meteoConnue() ? METEO[ambianceActuelle()] : null) : THEMES[cle];
      b.querySelector('.sous').textContent = THEMES[cle].dynamique
        ? (t ? `En ce moment : ${t.icone} ${t.nom}` : 'Selon la météo de ta ville') : '';
      b.querySelector('.pastilles').innerHTML = t && t.bg
        ? [t.bg, t.surface, t.accent].map((c) => `<i style="background:${c}"></i>`).join('') : '';
    });
  }

  // ================================================================
  // 6 b. ANIMATIONS D'AMBIANCE (flocons, feuilles, pluie, éclairs...)
  //      Couche transparente par-dessus la page : les clics passent au travers.
  //      Désactivées si l'ordinateur demande de réduire les animations.
  // ================================================================
  let hoteAmbiance = null;
  let cleAmbiance = '';
  const hasard = (a, b) => a + Math.random() * (b - a);
  function majAmbiance(p) {
    const cle = animations && p ? JSON.stringify(p) : '';
    if (cle === cleAmbiance) return;
    cleAmbiance = cle;
    if (hoteAmbiance) { hoteAmbiance.remove(); hoteAmbiance = null; }
    if (!cle || !document.body) return;
    hoteAmbiance = document.createElement('div');
    hoteAmbiance.id = 'lbt-ambiance';
    const r = hoteAmbiance.attachShadow({ mode: 'open' });
    let parts = '';
    for (let i = 0; i < p.n; i++) {
      const duree = hasard(p.duree[0], p.duree[1]).toFixed(2);
      const delai = (-Math.random() * duree).toFixed(2); // délai négatif : déjà répartis à l'écran dès le départ
      if (p.type === 'pluie') {
        parts += `<i class="goutte" style="left:${hasard(-5, 105).toFixed(1)}%;height:${hasard(40, 80).toFixed(0)}px;`
          + `animation-duration:${duree}s;animation-delay:${delai}s"></i>`;
      } else {
        const car = p.car[i % p.car.length];
        const type = p.type === 'voler' ? 'vole' : 'tombe';
        const pos = p.type === 'voler' ? `top:${hasard(5, 70).toFixed(1)}%` : `left:${hasard(0, 100).toFixed(1)}%`;
        parts += `<span class="${type}" style="${pos};font-size:${hasard(p.taille[0], p.taille[1]).toFixed(0)}px;`
          + `animation-duration:${duree}s;animation-delay:${delai}s;--derive:${hasard(-80, 80).toFixed(0)}px;`
          + `--tour:${hasard(-360, 360).toFixed(0)}deg">${car}</span>`;
      }
    }
    r.innerHTML = `
      <style>
        :host { all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147482000; overflow: hidden; }
        span, i { position: absolute; display: block; will-change: transform; animation-timing-function: linear;
          animation-iteration-count: infinite; }
        .tombe { top: -40px; color: ${p.couleur || 'inherit'}; text-shadow: ${p.ombre || 'none'}; opacity: .75;
          animation-name: tomber; font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif; }
        .vole { left: -60px; opacity: .8; animation-name: voler; font-family: "Segoe UI Emoji", "Apple Color Emoji", sans-serif; }
        .goutte { top: -100px; width: 1.5px; background: linear-gradient(transparent, ${p.couleur}); animation-name: pluie; }
        .eclair { position: absolute; inset: 0; background: #fff; opacity: 0; animation: eclair 11s infinite; }
        @keyframes tomber {
          0%   { transform: translate(0, 0) rotate(0deg); }
          50%  { transform: translate(var(--derive), 55vh) rotate(calc(var(--tour) / 2)); }
          100% { transform: translate(0, 110vh) rotate(var(--tour)); } }
        @keyframes voler {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(28vw, -30px); }
          50%  { transform: translate(55vw, 20px); }
          75%  { transform: translate(82vw, -25px); }
          100% { transform: translate(112vw, 0); } }
        @keyframes pluie { to { transform: translate(-60px, 115vh); } }
        @keyframes eclair { 0%, 93%, 95.5%, 100% { opacity: 0; } 94% { opacity: .14; } 96.5% { opacity: .09; } }
        @media (prefers-reduced-motion: reduce) { :host { display: none; } }
      </style>
      ${p.eclair ? '<div class="eclair"></div>' : ''}${parts}`;
    document.body.appendChild(hoteAmbiance);
  }



  // ================================================================
  // 8. TABLEAU DU DERNIER MATCH DU CANADIEN (thème « Soir de match » seulement)
  //    Données : API publique de la LNH (api-web.nhle.com), en lecture seule.
  //    Brio bloque les images externes : les logos SVG sont donc téléchargés par
  //    Tampermonkey, nettoyés (aucun script), puis insérés directement en SVG.
  // ================================================================
  const NHL = 'https://api-web.nhle.com/v1';
  const EQUIPE = 'MTL';
  const CLE_MATCH = 'brio-ch-match';
  const FRAIS_MIN = 20;       // minutes de cache normal
  const FRAIS_MIN_DIRECT = 2; // minutes de cache pendant un match en cours

  function telecharger(url, texte) {
    return new Promise((ok, echec) => {
      if (typeof GM_xmlhttpRequest !== 'function') { echec(new Error('GM_xmlhttpRequest absent')); return; }
      GM_xmlhttpRequest({
        method: 'GET', url, timeout: 20000, headers: { Accept: texte ? 'image/svg+xml,*/*' : 'application/json' },
        onload: (r) => {
          if (r.status < 200 || r.status >= 300) { echec(new Error('HTTP ' + r.status)); return; }
          try { ok(texte ? r.responseText : JSON.parse(r.responseText)); } catch (e) { echec(e); }
        },
        onerror: () => echec(new Error('Réseau')),
        ontimeout: () => echec(new Error('Délai dépassé')),
      });
    });
  }

  /** Garde seulement le dessin : retire scripts, liens externes et attributs « on... ». */
  function nettoyerSvg(svg, prefixe) {
    if (!svg || !/<svg[\s>]/i.test(svg)) return '';
    // Les identifiants internes reçoivent un préfixe : deux logos ne se marchent pas dessus
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    ids.forEach((id) => {
      const echappe = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      svg = svg.replace(new RegExp(`id="${echappe}"`, 'g'), `id="${prefixe}-${id}"`)
        .replace(new RegExp(`#${echappe}([")\\s])`, 'g'), `#${prefixe}-${id}$1`);
    });
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const racine = doc.documentElement;
    if (!racine || racine.nodeName.toLowerCase() !== 'svg') return '';
    racine.querySelectorAll('script, foreignObject, iframe, object, embed').forEach((n) => n.remove());
    [racine, ...racine.querySelectorAll('*')].forEach((n) => {
      [...n.attributes].forEach((a) => {
        const v = a.value.trim().toLowerCase();
        if (a.name.toLowerCase().startsWith('on')) n.removeAttribute(a.name);
        else if (/href$/i.test(a.name) && !v.startsWith('#')) n.removeAttribute(a.name);
      });
    });
    racine.removeAttribute('width');
    racine.removeAttribute('height');
    return new XMLSerializer().serializeToString(racine);
  }

  async function chargerMatch() {
    const calendrier = await telecharger(`${NHL}/club-schedule-season/${EQUIPE}/now`);
    const matchs = calendrier.games || [];
    const enDirect = matchs.find((g) => ['LIVE', 'CRIT'].includes(g.gameState));
    const finis = matchs.filter((g) => ['OFF', 'FINAL'].includes(g.gameState));
    const match = enDirect || finis[finis.length - 1];
    if (!match) return null;
    const prochain = matchs.find((g) => ['FUT', 'PRE'].includes(g.gameState) && g.id !== match.id);

    const [fiche, rail, classement, logoVisiteur, logoLocal] = await Promise.all([
      telecharger(`${NHL}/gamecenter/${match.id}/landing`),
      telecharger(`${NHL}/gamecenter/${match.id}/right-rail`).catch(() => null),
      telecharger(`${NHL}/standings/now`).catch(() => null),
      telecharger(match.awayTeam.darkLogo || match.awayTeam.logo, true).catch(() => ''),
      telecharger(match.homeTeam.darkLogo || match.homeTeam.logo, true).catch(() => ''),
    ]);

    const nous = classement && (classement.standings || []).find((t) => t.teamAbbrev && t.teamAbbrev.default === EQUIPE);
    const stat = (cat) => ((rail && rail.teamGameStats) || []).find((s) => s.category === cat);
    const buts = ((fiche.summary && fiche.summary.scoring) || []).flatMap((p) => (p.goals || []).map((g) => ({
      periode: p.periodDescriptor ? p.periodDescriptor : {},
      temps: g.timeInPeriod,
      equipe: g.teamAbbrev && (g.teamAbbrev.default || g.teamAbbrev),
      nom: g.name && (g.name.default || g.name),
      force: g.strength,
      passes: (g.assists || []).map((a) => (a.name && (a.name.default || a.name)) || '').filter(Boolean),
    })));
    const etoiles = ((fiche.summary && fiche.summary.threeStars) || []).map((s) => ({
      rang: s.star, nom: (s.name && (s.name.default || s.name)) || '', equipe: s.teamAbbrev,
    }));

    return {
      quand: Date.now(),
      enDirect: !!enDirect,
      id: match.id,
      debut: match.startTimeUTC,
      etat: fiche.gameState || match.gameState,
      periode: fiche.periodDescriptor || {},
      horloge: fiche.clock ? fiche.clock.timeRemaining : null,
      finPeriode: (match.gameOutcome && match.gameOutcome.lastPeriodType) || (fiche.periodDescriptor && fiche.periodDescriptor.periodType) || 'REG',
      visiteur: { abbr: match.awayTeam.abbrev, nom: match.awayTeam.commonName && match.awayTeam.commonName.default,
        buts: fiche.awayTeam.score, tirs: fiche.awayTeam.sog, logo: nettoyerSvg(logoVisiteur, 'v') },
      local: { abbr: match.homeTeam.abbrev, nom: match.homeTeam.commonName && match.homeTeam.commonName.default,
        buts: fiche.homeTeam.score, tirs: fiche.homeTeam.sog, logo: nettoyerSvg(logoLocal, 'l') },
      stats: ['sog', 'faceoffWinningPctg', 'powerPlay', 'hits', 'blockedShots', 'pim']
        .map((c) => stat(c)).filter(Boolean).map((s) => ({ cat: s.category, v: s.awayValue, l: s.homeValue })),
      buts,
      etoiles,
      fiche_ch: nous ? { v: nous.wins, d: nous.losses, dp: nous.otLosses, pts: nous.points,
        rangDiv: nous.divisionSequence, div: nous.divisionName, serie: `${nous.streakCode || ''}${nous.streakCount || ''}` } : null,
      prochain: prochain ? { debut: prochain.startTimeUTC, local: prochain.homeTeam.abbrev === EQUIPE,
        adversaire: prochain.homeTeam.abbrev === EQUIPE ? prochain.awayTeam.abbrev : prochain.homeTeam.abbrev } : null,
    };
  }

  let enChargement = null;
  async function donneesMatch() {
    let cache = null;
    try { cache = typeof GM_getValue === 'function' ? GM_getValue(CLE_MATCH, null) : null; } catch (e) { /* rien */ }
    const limite = (cache && cache.enDirect ? FRAIS_MIN_DIRECT : FRAIS_MIN) * 60000;
    if (cache && Date.now() - cache.quand < limite) return cache;
    if (!enChargement) {
      enChargement = chargerMatch()
        .then((d) => { try { if (d && typeof GM_setValue === 'function') GM_setValue(CLE_MATCH, d); } catch (e) { /* rien */ } return d; })
        .catch((e) => { console.warn('[Brio thèmes] Match du CH introuvable', e); return cache; })
        .finally(() => { enChargement = null; });
    }
    return enChargement;
  }

  // ---------- Affichage ----------
  const FUSEAU_MATCH = 'America/Toronto';
  const escM = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const ordinal = (n) => (n === 1 ? '1re' : `${n}e`);
  function nomPeriode(p) {
    if (!p) return '';
    if (p.periodType === 'OT') return 'Prol.';
    if (p.periodType === 'SO') return 'TB';
    return `${ordinal(p.number)} pér.`;
  }
  const jourCourt = (iso) => new Date(iso).toLocaleDateString('fr-CA', { timeZone: FUSEAU_MATCH, weekday: 'short', day: 'numeric', month: 'short' });
  const heureCourte = (iso) => new Date(iso).toLocaleTimeString('fr-CA', { timeZone: FUSEAU_MATCH, hour: 'numeric', minute: '2-digit' })
    .replace(':', ' h ').replace(' h 00', ' h');
  const NOMS_STATS = { sog: 'Tirs', faceoffWinningPctg: 'Mises en jeu', powerPlay: 'Avantage num.', hits: 'Mises en échec', blockedShots: 'Tirs bloqués', pim: 'Pénalités (min)' };
  const valeurStat = (cat, v) => (cat === 'faceoffWinningPctg' ? `${Math.round(Number(v) * 100)} %` : escM(v));

  function htmlMatch(m) {
    const ch = m.local.abbr === EQUIPE ? m.local : m.visiteur;
    const eux = ch === m.local ? m.visiteur : m.local;
    let resultat = '';
    let couleurRes = '#ffffff';
    if (m.enDirect) {
      resultat = `EN DIRECT · ${nomPeriode(m.periode)}${m.horloge ? ' · ' + escM(m.horloge) : ''}`;
      couleurRes = '#ffd24a';
    } else {
      const gagne = ch.buts > eux.buts;
      const suffixe = m.finPeriode === 'OT' ? ' (prol.)' : m.finPeriode === 'SO' ? ' (t. de barrage)' : '';
      resultat = `${gagne ? 'VICTOIRE' : 'DÉFAITE'}${suffixe}`;
      couleurRes = gagne ? '#5fe08a' : '#ff8a8a';
    }
    const equipe = (e) => `
      <div class="eq">
        <div class="logo">${e.logo || `<span class="abbr">${escM(e.abbr)}</span>`}</div>
        <div class="abbr2">${escM(e.abbr)}</div>
      </div>`;
    const stats = m.stats.map((s) => `
      <tr><td class="num">${valeurStat(s.cat, s.v)}</td><td class="nom">${NOMS_STATS[s.cat] || s.cat}</td><td class="num">${valeurStat(s.cat, s.l)}</td></tr>`).join('');
    const buts = m.buts.map((b) => `
      <li><span class="t">${nomPeriode(b.periode)} ${escM(b.temps)}</span>
        <b class="${b.equipe === EQUIPE ? 'nous' : ''}">${escM(b.equipe)}</b> ${escM(b.nom)}${b.force && b.force !== 'ev' ? ` <i>(${b.force === 'pp' ? 'AN' : b.force === 'sh' ? 'DN' : escM(b.force)})</i>` : ''}
        ${b.passes.length ? `<div class="passes">${b.passes.map(escM).join(', ')}</div>` : ''}</li>`).join('');
    const etoiles = m.etoiles.map((e) => `<li>${'★'.repeat(e.rang)} ${escM(e.nom)} <span class="t">${escM(e.equipe)}</span></li>`).join('');
    const f = m.fiche_ch;
    return `
      <div class="carte">
        <div class="surtitre">${m.enDirect ? 'Match en cours' : 'Dernier match'} · ${escM(jourCourt(m.debut))}</div>
        <div class="score">
          ${equipe(m.visiteur)}
          <div class="pts">${escM(m.visiteur.buts)}<span>–</span>${escM(m.local.buts)}</div>
          ${equipe(m.local)}
        </div>
        <div class="res" style="color:${couleurRes}">${resultat}</div>
        ${stats ? `<table>${stats}</table>` : ''}
        ${buts ? `<details><summary>Buts (${m.buts.length})</summary><ul class="buts">${buts}</ul></details>` : ''}
        ${etoiles ? `<details><summary>Trois étoiles</summary><ul class="etoiles">${etoiles}</ul></details>` : ''}
        ${f ? `<div class="fiche"><b>${f.v}-${f.d}-${f.dp}</b> · ${f.pts} pts · ${ordinal(f.rangDiv)} ${escM(f.div === 'Atlantic' ? 'Atlantique' : f.div)}${f.serie ? ` · séquence ${escM(f.serie.replace('W', 'V').replace('L', 'D').replace('OT', 'DP'))}` : ''}</div>` : ''}
        ${m.prochain ? `<div class="prochain">Prochain : ${escM(jourCourt(m.prochain.debut))}, ${escM(heureCourte(m.prochain.debut))} ${m.prochain.local ? 'vs' : '@'} ${escM(m.prochain.adversaire)}</div>` : ''}
        <div class="source">Source : LNH, mis à jour à ${escM(heureCourte(new Date(m.quand).toISOString()))}</div>
      </div>`;
  }

  const CSS_MATCH = `
    :host { all: initial; display: block; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .carte { margin: 18px 12px; padding: 12px; border-top: 4px solid #af1e2d; border-radius: 6px;
      background: rgba(255,255,255,.07); color: #ffffff; font: 13px/1.35 Overpass, "Source Sans 3", "Segoe UI", Arial, sans-serif; }
    .surtitre { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .8; text-align: center; }
    .score { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 4px; }
    .eq { width: 72px; text-align: center; }
    .logo { width: 64px; height: 46px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
    .logo svg { width: 100%; height: 100%; }
    .abbr { font-weight: 900; font-size: 18px; }
    .abbr2 { font-size: 11px; font-weight: 700; opacity: .8; }
    .pts { font: 900 30px Overpass, "Segoe UI", Arial, sans-serif; display: flex; gap: 6px; align-items: center; }
    .pts span { opacity: .5; font-size: 22px; }
    .res { text-align: center; font-weight: 900; letter-spacing: .06em; font-size: 12px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 4px 0 6px; }
    td { padding: 2px 0; border-top: 1px solid rgba(255,255,255,.12); }
    td.num { width: 52px; font-weight: 800; }
    td.num:last-child { text-align: right; }
    td.nom { text-align: center; opacity: .8; font-size: 12px; }
    details { margin-top: 6px; }
    summary { cursor: pointer; font-weight: 800; font-size: 12px; letter-spacing: .04em; text-transform: uppercase; }
    summary:hover { color: #ffd24a; }
    ul { list-style: none; margin-top: 4px; }
    li { padding: 3px 0; border-top: 1px solid rgba(255,255,255,.1); font-size: 12px; }
    li b.nous { color: #ff8a8a; }
    li i { opacity: .8; }
    .t { opacity: .7; font-size: 11px; }
    .passes { opacity: .7; font-size: 11px; padding-left: 6px; }
    .fiche, .prochain { margin-top: 8px; font-size: 12px; text-align: center; }
    .fiche b { font-size: 14px; }
    .prochain { opacity: .85; }
    .source { margin-top: 8px; font-size: 10px; opacity: .55; text-align: center; }
    .info { margin: 18px 12px; padding: 10px; font: 12px Overpass, Arial, sans-serif; color: #ffffff; opacity: .7; text-align: center; }`;

  // ================================================================
  // 9. MÉTÉO (thème « Météo en direct »)
  //    Données : Open-Meteo (api.open-meteo.com), gratuit, sans compte, lecture seule.
  //    La ville se change dans le tableau ; par défaut : Québec.
  // ================================================================
  const CLE_VILLE = 'brio-meteo-ville';
  const CLE_METEO = 'brio-meteo';
  const FRAIS_METEO_MIN = 20;
  const VILLE_DEFAUT = { nom: 'Québec', region: 'Québec', lat: 46.8139, lon: -71.208 };
  const lireGM = (cle, defaut) => { try { return typeof GM_getValue === 'function' ? GM_getValue(cle, defaut) : defaut; } catch (e) { return defaut; } };
  const ecrireGM = (cle, v) => { try { if (typeof GM_setValue === 'function') GM_setValue(cle, v); } catch (e) { /* rien */ } };
  const villeChoisie = () => lireGM(CLE_VILLE, null) || VILLE_DEFAUT;

  let meteoMemoire = lireGM(CLE_METEO, null);
  const meteoConnue = () => !!(meteoMemoire && meteoMemoire.actuel);
  const ambianceActuelle = () => (meteoConnue() ? ambianceMeteo(meteoMemoire.actuel.code, meteoMemoire.actuel.jour) : 'nuageux');

  async function chargerMeteo(ville) {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + `?latitude=${ville.lat}&longitude=${ville.lon}`
      + '&current=temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m'
      + '&hourly=temperature_2m,weather_code,precipitation_probability,is_day'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset'
      + '&timezone=auto&forecast_days=4&wind_speed_unit=kmh';
    const d = await telecharger(url);
    const c = d.current;
    const h = d.hourly;
    const debut = Math.max(0, h.time.findIndex((t) => t >= c.time.slice(0, 13)));
    return {
      quand: Date.now(),
      ville: ville.nom,
      cleVille: `${ville.lat},${ville.lon}`,
      actuel: { temp: c.temperature_2m, ressenti: c.apparent_temperature, code: c.weather_code, jour: !!c.is_day,
        vent: c.wind_speed_10m, rafales: c.wind_gusts_10m, humidite: c.relative_humidity_2m },
      heures: h.time.slice(debut + 1, debut + 7).map((t, i) => ({ heure: t.slice(11, 13), temp: h.temperature_2m[debut + 1 + i],
        code: h.weather_code[debut + 1 + i], jour: !!h.is_day[debut + 1 + i], pluie: h.precipitation_probability[debut + 1 + i] })),
      jours: d.daily.time.map((t, i) => ({ date: t, code: d.daily.weather_code[i], max: d.daily.temperature_2m_max[i],
        min: d.daily.temperature_2m_min[i], pluie: d.daily.precipitation_probability_max[i],
        lever: d.daily.sunrise[i].slice(11), coucher: d.daily.sunset[i].slice(11) })),
    };
  }

  let meteoEnCours = null;
  async function donneesMeteo(forcer) {
    const ville = villeChoisie();
    const bonneVille = meteoMemoire && meteoMemoire.cleVille === `${ville.lat},${ville.lon}`;
    if (!forcer && bonneVille && Date.now() - meteoMemoire.quand < FRAIS_METEO_MIN * 60000) return meteoMemoire;
    if (!meteoEnCours) {
      meteoEnCours = chargerMeteo(ville)
        .then((d) => { meteoMemoire = d; ecrireGM(CLE_METEO, d); return d; })
        .catch((e) => { console.warn('[Brio thèmes] Météo introuvable', e); return bonneVille ? meteoMemoire : null; })
        .finally(() => { meteoEnCours = null; });
    }
    return meteoEnCours;
  }

  async function chercherVilles(texte) {
    const d = await telecharger('https://geocoding-api.open-meteo.com/v1/search'
      + `?name=${encodeURIComponent(texte)}&count=6&language=fr&format=json`);
    return (d.results || []).map((r) => ({ nom: r.name, region: [r.admin1, r.country].filter(Boolean).join(', '),
      lat: Math.round(r.latitude * 1e4) / 1e4, lon: Math.round(r.longitude * 1e4) / 1e4 }));
  }

  const deg = (v) => `${Math.round(v)}°`;
  const jourSemaine = (iso) => new Date(`${iso}T12:00`).toLocaleDateString('fr-CA', { weekday: 'short' }).replace('.', '');

  function htmlMeteo(m) {
    const a = m.actuel;
    const amb = METEO[ambianceMeteo(a.code, a.jour)];
    const auj = m.jours[0] || {};
    const heures = m.heures.map((x) => `
      <div class="h"><div class="t">${escM(x.heure)} h</div><div class="ico">${iconeMeteo(x.code, x.jour)}</div>
        <div><b>${deg(x.temp)}</b></div><div class="t">${x.pluie != null ? `${escM(x.pluie)} %` : ''}</div></div>`).join('');
    const jours = m.jours.slice(1).map((j) => `
      <tr><td class="nom">${escM(jourSemaine(j.date))}</td><td>${iconeMeteo(j.code, true)}</td>
        <td class="num"><b>${deg(j.max)}</b> / ${deg(j.min)}</td><td class="t">${j.pluie != null ? `💧 ${escM(j.pluie)} %` : ''}</td></tr>`).join('');
    return `
      <div class="carte">
        <div class="surtitre">Météo · ${escM(m.ville)} <button class="lien" data-action="ville">📍 changer</button></div>
        <div class="maintenant">
          <div class="gros">${iconeMeteo(a.code, a.jour)}</div>
          <div><div class="temp">${deg(a.temp)}</div><div class="desc">${escM(DESC_METEO[a.code] || '')}</div></div>
        </div>
        <div class="details">Ressenti <b>${deg(a.ressenti)}</b> · Max <b>${deg(auj.max)}</b> · Min <b>${deg(auj.min)}</b></div>
        <div class="details">Vent ${Math.round(a.vent)} km/h${a.rafales ? ` (rafales ${Math.round(a.rafales)})` : ''} · Humidité ${escM(a.humidite)} %</div>
        <div class="details">Soleil ${escM(auj.lever || '')} → ${escM(auj.coucher || '')}</div>
        ${heures ? `<div class="heures">${heures}</div>` : ''}
        ${jours ? `<table>${jours}</table>` : ''}
        <div class="ambiance">Ambiance du thème : ${amb.icone} ${amb.nom}</div>
        <div class="source">Source : Open-Meteo, mis à jour à ${escM(heureCourte(new Date(m.quand).toISOString()))}
          · <button class="lien" data-action="actualiser">actualiser</button></div>
      </div>`;
  }

  function htmlChoixVille() {
    return `
      <div class="carte">
        <div class="surtitre">Choisir ta ville</div>
        <form class="cherche"><input type="text" placeholder="ex. Lévis, Montréal, Rimouski" autocomplete="off">
          <button type="submit">OK</button></form>
        <ul class="villes"></ul>
        <button class="lien" data-action="annuler">annuler</button>
      </div>`;
  }

  const CSS_METEO = `
    ${CSS_MATCH}
    .carte { border-top-color: var(--lbt-accent, #5aa2ff); font-family: "Segoe UI", "Source Sans 3", Arial, sans-serif; }
    .lien { background: none; border: 0; color: inherit; font: inherit; font-size: 10px; text-decoration: underline;
      cursor: pointer; opacity: .85; text-transform: none; letter-spacing: 0; padding: 0 2px; }
    .lien:hover { opacity: 1; }
    .maintenant { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 8px 0 6px; }
    .gros { font-size: 40px; line-height: 1; }
    .temp { font-size: 32px; font-weight: 800; line-height: 1; }
    .desc { font-size: 13px; opacity: .9; }
    .details { text-align: center; font-size: 12px; opacity: .85; margin-top: 2px; }
    .heures { display: flex; justify-content: space-between; margin: 10px 0 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,.12); }
    .h { text-align: center; font-size: 12px; width: 16%; }
    .ico { font-size: 16px; line-height: 1.4; }
    td { vertical-align: middle; }
    td.nom { text-align: left; text-transform: capitalize; opacity: 1; width: 40px; }
    td.num { width: auto; text-align: center; font-weight: 400; }
    td.t { text-align: right; }
    .ambiance { margin-top: 8px; text-align: center; font-size: 12px; opacity: .85; }
    .cherche { display: flex; gap: 6px; margin: 10px 0 6px; }
    .cherche input { flex: 1; min-width: 0; padding: 6px 8px; border-radius: 4px; border: 0; font: 13px Arial, sans-serif; color: #111; background: #fff; }
    .cherche button { padding: 6px 10px; border: 0; border-radius: 4px; cursor: pointer; font-weight: 700;
      background: var(--lbt-accent, #5aa2ff); color: #111; }
    .villes button { display: block; width: 100%; text-align: left; background: none; border: 0; color: inherit;
      font: 12px Arial, sans-serif; padding: 5px 2px; cursor: pointer; }
    .villes button:hover { background: rgba(255,255,255,.1); }
    .villes small { opacity: .7; }`;

  // ================================================================
  // 10. TABLEAU DE GAUCHE (dans un cours) : match du CH ou météo selon le thème
  // ================================================================
  const MODULES = {
    ch: { id: 'lbt-match', css: CSS_MATCH, charger: donneesMatch, rendre: htmlMatch,
      attente: 'Chargement du dernier match…', vide: 'Match du CH introuvable pour l\'instant.' },
    meteo: { id: 'lbt-meteo', css: CSS_METEO, charger: () => donneesMeteo(), rendre: htmlMeteo,
      attente: 'Chargement de la météo…', vide: 'Météo introuvable pour l\'instant. <button class="lien" data-action="ville">Choisir une ville</button>' },
  };

  let hoteModule = null;
  let racineModule = null;
  let typeModule = null;
  function assurerModule() {
    const dansCours = /^\/sites\//.test(location.pathname);
    const zone = document.querySelector('.p-template-site__grid-item-nav-interne');
    const mod = MODULES[choix];
    if (!mod || !dansCours || !zone) {
      if (hoteModule) { hoteModule.remove(); hoteModule = null; racineModule = null; typeModule = null; }
      return;
    }
    if (hoteModule && typeModule === choix) {
      if (hoteModule.parentElement !== zone) zone.appendChild(hoteModule);
      return;
    }
    if (hoteModule) hoteModule.remove();
    typeModule = choix;
    hoteModule = document.createElement('div');
    hoteModule.id = mod.id;
    racineModule = hoteModule.attachShadow({ mode: 'open' });
    racineModule.addEventListener('click', clicModule);
    racineModule.addEventListener('submit', soumettreVille);
    afficherModule(false);
    zone.appendChild(hoteModule);
  }

  function afficherModule(forcer) {
    const mod = MODULES[typeModule];
    const racine = racineModule;
    if (!mod || !racine) return;
    if (!racine.querySelector('.carte')) racine.innerHTML = `<style>${mod.css}</style><div class="info">${mod.attente}</div>`;
    const promesse = typeModule === 'meteo' ? donneesMeteo(forcer) : mod.charger();
    promesse.then((d) => {
      if (racine !== racineModule) return; // le thème a changé entre-temps
      racine.innerHTML = `<style>${mod.css}</style>${d ? mod.rendre(d) : `<div class="info">${mod.vide}</div>`}`;
      if (typeModule === 'meteo') { rafraichirTheme(); majMenu(); }
    });
  }

  function clicModule(e) {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const action = b.dataset.action;
    if (action === 'actualiser') afficherModule(true);
    else if (action === 'annuler') afficherModule(false);
    else if (action === 'ville') {
      racineModule.innerHTML = `<style>${CSS_METEO}</style>${htmlChoixVille()}`;
      racineModule.querySelector('input').focus();
    } else if (action === 'choisir') {
      ecrireGM(CLE_VILLE, JSON.parse(b.dataset.ville));
      racineModule.innerHTML = `<style>${CSS_METEO}</style><div class="info">Chargement de la météo…</div>`;
      afficherModule(true);
    }
  }

  async function soumettreVille(e) {
    e.preventDefault();
    const texte = racineModule.querySelector('input').value.trim();
    const liste = racineModule.querySelector('.villes');
    if (!texte || !liste) return;
    liste.innerHTML = '<li class="t">Recherche…</li>';
    try {
      const villes = await chercherVilles(texte);
      liste.innerHTML = villes.length ? villes.map((v) => `
        <li><button data-action="choisir" data-ville="${escM(JSON.stringify(v))}">${escM(v.nom)} <small>${escM(v.region)}</small></button></li>`).join('')
        : '<li class="t">Aucune ville trouvée.</li>';
    } catch (err) {
      liste.innerHTML = '<li class="t">Recherche impossible (autorisation Tampermonkey ?).</li>';
    }
  }

  // Thèmes vivants : on revérifie la saison et la météo toutes les 20 minutes
  setInterval(() => {
    if (choix === 'saisons') { rafraichirTheme(); majMenu(); }
    if (choix === 'meteo') donneesMeteo().then(() => { rafraichirTheme(); majMenu(); if (hoteModule) afficherModule(false); });
  }, FRAIS_METEO_MIN * 60000);

  // ================================================================
  // 7. DÉMARRAGE
  // ================================================================
  function demarrer() {
    observateur.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    installerMenu();
    appliquer(choix);
  }
  if (document.body) demarrer();
  else document.addEventListener('DOMContentLoaded', demarrer);
})();


// =====================================================================
// PARTIE 2 : ÉCHÉANCES, CALENDRIER, NOTES ET CIBLES
// (démarre quand la page est chargée, comme l'ancien script en « document-idle »)
// =====================================================================
(function () {
  function demarrerPartie2() {
    "use strict";
  
    // Réglages ----------------------------------------------------------
  
    const API = "https://apis.brioeducation.ca";
    const IDENTITES = "https://identites.brioeducation.ca";
    const ORGANISATION = "ckieepp152"; // Université Laval
    const JOURS_A_VENIR = 30;         // horizon de l'onglet « À venir » ; le bouton ajoute 30 jours de plus à chaque clic
    const CACHE_MINUTES = 10;
    const FUSEAU = "America/Toronto";
  
    // Noms courts (clé : idSite Brio). Les cours absents gardent leur premier mot.
    const COURTS = {
      pnjhzyc139: "Dynamique",
      nzyphsw881: "Environnement",
      pbvysnx84: "Logistique",
      pvfgdpj475: "Projets diag.",
      qrbhbdf360: "Gestion intégrée",
    };
  
    // Même palette que l'app Lecteur Brio (couleur vive par cours, triés par nom).
    const COULEURS = ["#378ADD", "#D85A30", "#7F77DD", "#1D9E75", "#D4537E", "#BA7517", "#639922"];
  
    // Calculs (sans DOM, testables) -------------------------------------
  
    function premier(obj, ...chemins) {
      for (const chemin of chemins) {
        let v = obj;
        for (const morceau of chemin.split(".")) {
          if (v && typeof v === "object") v = v[morceau];
          else { v = undefined; break; }
        }
        if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)) return v;
      }
      return undefined;
    }
  
    function nombre(v) {
      return typeof v === "number" && isFinite(v) ? v : null;
    }
  
    /** Code de session ULaval : H (janv.-avr.), E (mai-août), A (sept.-déc.) + année sur 2 chiffres. */
    function codeSession(date) {
      const m = date.getMonth();
      return (m < 4 ? "H" : m < 8 ? "E" : "A") + String(date.getFullYear()).slice(-2);
    }
  
    function dateRemise(ev) {
      const v = premier(ev, "parametresEvaluationGroupe.0.horodateRemise",
        "parametresEvaluationGroupe.0.periodeEvaluation.horodateFin", "horodateRemise");
      return v ? new Date(v) : null;
    }
  
    /** Toutes les évaluations datées de tous les cours, triées par date. */
    function evenements(cours) {
      const liste = [];
      for (const c of cours) {
        for (const ev of c.evaluations) {
          const d = dateRemise(ev);
          if (!d) continue;
          const idEval = premier(ev, "idEvaluation", "id");
          // Construction de l'URL directe vers l'évaluation sur Brio
          const url = idEval
            ? `https://www.brioeducation.ca/sites/${c.idSite}/evaluations/${idEval}`
            : `https://www.brioeducation.ca/sites/${c.idSite}/evaluations`;
  
          liste.push({
            cours: c,
            titre: premier(ev, "titre", "titreAbrege") || "Évaluation",
            date: d,
            poids: ev.formative ? "formatif" : nombre(premier(ev, "ponderation.valeur")),
            equipe: ev.modeTravail === "EQUIPE",
            url,
          });
        }
      }
      return liste.sort((a, b) => a.date - b.date);
    }
  
    function echeances(cours, maintenant, jours) {
      const limite = maintenant.getTime() + jours * 86400000;
      return evenements(cours).filter((e) => e.date >= maintenant && e.date.getTime() <= limite);
    }
  
    /** Semaines (dimanche à samedi) couvrant un mois ; chaque jour est une clé AAAA-MM-JJ. */
    function semainesDuMois(annee, mois) {
      const cle = (t) => new Date(t).toISOString().slice(0, 10);
      const premierJour = Date.UTC(annee, mois, 1, 12);
      const debut = premierJour - new Date(premierJour).getUTCDay() * 86400000;
      const semaines = [];
      for (let t = debut; ; t += 7 * 86400000) {
        if (semaines.length && new Date(t).getUTCMonth() !== mois) break;
        semaines.push(Array.from({ length: 7 }, (_, i) => {
          const d = new Date(t + i * 86400000);
          return { cle: cle(d.getTime()), jour: d.getUTCDate(), dansMois: d.getUTCMonth() === mois };
        }));
      }
      return semaines;
    }
  
    if (typeof module !== "undefined" && module.exports) {
      module.exports = { codeSession, evenements, echeances, semainesDuMois, dateRemise };
      return;
    }
  
    // Accès à l'API Brio (GET seulement) --------------------------------
  
    function lireToken() {
      let etat;
      try { etat = JSON.parse(localStorage.getItem("auth_etat") || "null"); } catch (e) { etat = null; }
      if (!etat || !etat.token) return null;
      let exp = etat.expiration;
      if (typeof exp === "number") exp = exp > 1e11 ? exp : exp * 1000;
      else if (exp) exp = Date.parse(exp);
      if (exp && exp < Date.now() + 30000) return null;
      return etat.token;
    }
  
    function get(url, params) {
      const token = lireToken();
      if (!token) return Promise.reject(new Error("SESSION"));
      if (params) url += "?" + new URLSearchParams(params).toString();
      return new Promise((ok, echec) => {
        GM_xmlhttpRequest({
          method: "GET", url, timeout: 30000,
          headers: { Authorization: "Bearer " + token, Accept: "application/json" },
          onload: (r) => {
            if (r.status === 401 || r.status === 403) return echec(new Error("SESSION"));
            if (r.status < 200 || r.status >= 300) return echec(new Error("HTTP " + r.status));
            try { ok(JSON.parse(r.responseText)); } catch (e) { echec(new Error("Réponse illisible")); }
          },
          onerror: () => echec(new Error("Réseau")),
          ontimeout: () => echec(new Error("Délai dépassé")),
        });
      });
    }
  
    async function chargerCours(c, idUtilisateur) {
      const [evals, sommaire] = await Promise.all([
        get(`${API}/sites/sites/${c.idSite}/evaluations/`, { sommativesPonderation: "false" }),
        get(`${API}/sites/sommairessites/${c.idSite}/`, { idutilisateur: idUtilisateur }).catch(() => ({})),
      ]);
      const som = sommaire.element || sommaire;
      const code = premier(som, "groupesApprenantsPrincipaux.0.informationCours.codeCours") || c.code;
      const evaluations = evals.elements || [];
      return { ...c, code, evaluations };
    }
  
    async function charger() {
      const info = await get(`${IDENTITES}/auth/oauth2/userinfo/`);
      const idUtilisateur = premier(info, "idUtilisateur", "id_utilisateur", "sub", "id");
      const rep = await get(`${API}/sites/sommairessitescredites`, {
        idutilisateur: idUtilisateur, codesession: codeSession(new Date()), idorganisation: ORGANISATION,
        inclurerelations: "relationEnseignants", incluresitestravail: "true",
      });
      const sites = (rep.elements || [])
        .map((s) => ({
          idSite: premier(s, "idSite", "id"),
          nom: premier(s, "nomSite", "titre", "nom") || "?",
          code: premier(s, "codeCours", "sigle")
        }))
        .filter((s) => s.idSite)
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
      sites.forEach((s, i) => {
        s.court = COURTS[s.idSite] || s.nom.split(" ")[0];
        s.couleur = COULEURS[i % COULEURS.length];
      });
      return Promise.all(sites.map((s) => chargerCours(s, idUtilisateur)));
    }
  
    // Cache de session : évite de refaire les requêtes à chaque changement de page.
    let memoire = null;
    async function donnees(forcer) {
      if (!forcer && memoire && Date.now() - memoire.quand < CACHE_MINUTES * 60000) return memoire.cours;
      const cours = await charger();
      memoire = { quand: Date.now(), cours };
      return cours;
    }
  
    // Affichage (style Brio, ou thème du script « Brio : thèmes ») ------
  
    const fmtNombre = (n, dec = 1) => n.toLocaleString("fr-CA", { maximumFractionDigits: dec });
    const fmtHeure = (d) => d.toLocaleTimeString("fr-CA", { timeZone: FUSEAU, hour: "numeric", minute: "2-digit" })
      .replace(":", " h ").replace(" h 00", " h");
    const fmtJour = (d) => {
      const t = d.toLocaleDateString("fr-CA", { timeZone: FUSEAU, weekday: "long", day: "numeric", month: "long" });
      return t.charAt(0).toUpperCase() + t.slice(1);
    };
    const jourDe = (d) => d.toLocaleDateString("en-CA", { timeZone: FUSEAU });
    const ecartJours = (d) => Math.round((Date.parse(jourDe(d)) - Date.parse(jourDe(new Date()))) / 86400000);
    const relatif = (n) => (n === 0 ? "aujourd'hui" : n === 1 ? "demain" : `dans ${n} jours`);
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  
    const CSS = `
      :host { all: initial; }
      * { box-sizing: border-box; margin: 0; }
      .racine {
        --c-surface: var(--lbt-surface, #fff);
        --c-fond: var(--lbt-bgElement, #eef2f6);
        --c-fond2: var(--lbt-surface2, #dde3e9);
        --c-bordure: var(--lbt-bordure, #c9d2dc);
        --c-fonce: var(--lbt-fonce, #0f263e);
        --c-primaire: var(--lbt-primaire, #0755b1);
        --c-accent: var(--lbt-accent, #0e67d6);
        --c-texte: var(--lbt-texte, #000);
        --c-titre: var(--lbt-titre, #0f263e);
        --c-discret: var(--lbt-discret, #4e667e);
        --c-sur-fonce: var(--lbt-surFonce, #fff);
        --c-bouton: var(--lbt-primaire, #0e67d6);
        --c-bouton-survol: var(--lbt-fonce, #0755b1);
        --f-texte: var(--lbt-police, "Source Sans 3", arial, sans-serif);
        --f-titre: var(--lbt-policeTitre, Overpass, "Source Sans 3", arial, sans-serif);
        font-family: var(--f-texte); font-size: 16px; font-weight: 350; color: var(--c-texte); }
      .titre-brio { font-family: var(--f-titre); font-weight: 700; color: var(--c-titre); }
      .surtitre { font-family: var(--f-titre); font-size: 12px; font-weight: 900;
        text-transform: uppercase; letter-spacing: .02em; color: var(--c-discret); }
  
      .declencheur { position: fixed; right: 24px; bottom: 24px; z-index: 2147483000; display: flex; align-items: center;
        gap: 10px; border: 0; border-radius: 4px; padding: 12px 18px; background: var(--c-bouton); color: var(--c-sur-fonce); cursor: pointer;
        font: 550 16px var(--f-texte); box-shadow: 0 2px 4px rgba(0,0,0,.25); }
      .declencheur:hover { background: var(--c-bouton-survol); }
      .declencheur:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid var(--c-texte); outline-offset: 2px; }
      .pastille { background: var(--c-surface); color: var(--c-primaire); border-radius: 999px; min-width: 22px; padding: 1px 7px;
        font-size: 13px; font-weight: 700; text-align: center; }
  
      .fond { position: fixed; inset: 0; z-index: 2147483001; background: rgba(0,0,0,.75);
        display: flex; align-items: center; justify-content: center; padding: 24px; }
      .fond[hidden] { display: none; }
      .fenetre { width: min(1040px, 100%); height: min(88vh, 860px); display: flex; flex-direction: column;
        background: var(--c-fond); box-shadow: 0 2px 4px rgba(0,0,0,.25); overflow: hidden; }
  
      .entete { background: var(--c-surface); padding: 22px 32px 18px; display: flex; align-items: flex-end; gap: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,.25); position: relative; z-index: 1; }
      .entete h1 { font-size: 32px; line-height: 1.1; }
      .fermer { margin-left: auto; align-self: flex-start; border: 1px solid var(--c-accent); background: var(--c-surface); color: var(--c-accent);
        border-radius: 4px; padding: 8px 14px; font: 550 16px var(--f-texte); cursor: pointer; }
      .fermer:hover { background: var(--c-bouton); color: var(--c-sur-fonce); }
      .outil { align-self: flex-start; border: 0; background: none; color: var(--c-accent); cursor: pointer; padding: 9px 6px;
        font: 550 16px var(--f-texte); }
      .outil:hover { text-decoration: underline; }
  
      .menu { background: var(--c-primaire); padding: 10px 32px; display: flex; gap: 8px; }
      .onglet { border: 0; background: none; color: var(--c-sur-fonce); padding: 9px 14px; border-radius: 3px; cursor: pointer;
        font: 550 18px var(--f-texte); text-transform: uppercase; }
      .onglet:hover { background: rgba(0,0,0,.2); }
      .onglet.actif { background: rgba(0,0,0,.35); }
      .maj { margin-left: auto; align-self: center; color: var(--c-sur-fonce); opacity: .8; font-size: 14px; }
  
      .corps { flex: 1; overflow-y: auto; padding: 24px 32px 32px; }
      .info { padding: 48px 16px; text-align: center; color: var(--c-discret); font-size: 18px; line-height: 1.5; }
  
      .jour { margin: 24px 0 8px; display: flex; align-items: baseline; gap: 10px; }
      .jour:first-child { margin-top: 0; }
      .jour h2 { font-size: 20px; }
      .carte { background: var(--c-surface); box-shadow: 0 1px 2px rgba(0,0,0,.25); }
      .remise { display: flex; align-items: stretch; margin-bottom: 8px; text-decoration: none; color: inherit;
        transition: transform .1s ease, box-shadow .1s ease; }
      .remise:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,.2); }
      .remise:hover h3 { color: var(--c-accent); text-decoration: underline; }
      .bande { width: 6px; flex: none; }
      .remise .texte { padding: 14px 18px; flex: 1; min-width: 0; }
      .remise h3 { font-size: 18px; line-height: 1.3; transition: color .1s ease; }
      .remise .meta { margin-top: 4px; color: var(--c-discret); font-size: 15px; }
      .remise .droite { padding: 14px 18px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
        justify-content: center; text-align: right; flex: none; }
      .heure { font-weight: 550; color: var(--c-titre); }
      .etiquette { display: inline-block; background: var(--c-fond2); color: var(--c-titre); border-radius: 3px; padding: 2px 8px;
        font-size: 13px; font-weight: 700; }
      .urgent { color: #e30513; font-weight: 700; }
      .proche { color: #c06a00; font-weight: 700; }
  
      .cal-tete { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
      .avenir-nav { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; margin: 18px 0 6px; }
      .cal-tete h2 { font-size: 24px; margin-right: auto; }
      .bouton2 { border: 1px solid var(--c-accent); background: var(--c-surface); color: var(--c-accent); border-radius: 4px; padding: 7px 14px;
        font: 550 16px var(--f-texte); cursor: pointer; }
      .bouton2:hover { background: var(--c-bouton); color: var(--c-sur-fonce); }
      .legende { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-bottom: 12px; font-size: 14px; color: var(--c-discret); }
      .legende span { display: inline-flex; align-items: center; gap: 6px; }
      .legende i, .point { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex: none; }
      .mois { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 1px; background: var(--c-fond2);
        box-shadow: 0 1px 2px rgba(0,0,0,.25); }
      .mois .nom-jour { background: var(--c-fond2); color: var(--c-titre); font-weight: 700; font-size: 14px; padding: 6px 8px; }
      .case { background: var(--c-surface); min-height: 104px; padding: 6px; border: 0; text-align: left; cursor: pointer;
        font: inherit; color: inherit; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
      .case:hover { background: color-mix(in srgb, var(--c-fond) 60%, var(--c-surface)); }
      .case.hors { background: color-mix(in srgb, var(--c-fond) 60%, var(--c-surface)); color: var(--c-discret); }
      .case.choisi { box-shadow: inset 0 0 0 2px var(--c-accent); }
      .num-jour { font-weight: 550; font-size: 14px; width: 26px; height: 26px; display: flex; align-items: center;
        justify-content: center; border-radius: 50%; }
      .case.auj .num-jour { background: var(--c-bouton); color: var(--c-sur-fonce); }
      .puce-ev { display: block; font-size: 13px; line-height: 1.25; padding: 2px 5px; border-left: 3px solid var(--c);
        background: var(--c-fond); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--c-titre); }
      .puce-ev b { font-weight: 700; }
      .puce-ev.passee { opacity: .55; }
      .points { display: none; gap: 3px; flex-wrap: wrap; }
      .detail { margin-top: 22px; }
  
      @media (max-width: 640px) {
        .case { min-height: 52px; align-items: center; padding: 4px 2px; }
        .puce-ev { display: none; }
        .points { display: flex; justify-content: center; }
        .mois .nom-jour { text-align: center; padding: 6px 0; }
        .cal-tete h2 { font-size: 20px; }
        .fond { padding: 0; }
        .fenetre { height: 100%; }
        .entete, .menu, .corps { padding-left: 16px; padding-right: 16px; }
        .entete h1 { font-size: 24px; }
        .maj { display: none; }
        .menu { gap: 2px; padding: 8px 10px; overflow-x: auto; }
        .onglet { font-size: 15px; padding: 8px 10px; white-space: nowrap; }
        .outil { font-size: 15px; white-space: nowrap; align-self: center; padding: 8px 6px; }
      }`;
  
    function carteRemise(e) {
      const poids = e.poids === "formatif" ? "Formatif" : e.poids !== null ? `${fmtNombre(e.poids)} %` : "";
      const meta = [esc(e.cours.court), esc(e.cours.code || ""), e.equipe ? "en équipe" : "individuel"]
        .filter(Boolean).join(" · ");
      return `<a class="carte remise" href="${esc(e.url)}">
        <div class="bande" style="background:${e.cours.couleur}"></div>
        <div class="texte"><h3 class="titre-brio">${esc(e.titre)}</h3><div class="meta">${meta}</div></div>
        <div class="droite"><span class="heure">${fmtHeure(e.date)}</span>
          ${poids ? `<span class="etiquette">${poids}</span>` : ""}</div>
      </a>`;
    }
  
    const NOMS_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
      "septembre", "octobre", "novembre", "décembre"];
  
    function vueCalendrier(cours, cal) {
      const parJour = new Map();
      for (const e of evenements(cours)) {
        const k = jourDe(e.date);
        if (!parJour.has(k)) parJour.set(k, []);
        parJour.get(k).push(e);
      }
      const auj = jourDe(new Date());
      const maintenant = new Date();
      const legende = cours.map((c) => `<span><i style="background:${c.couleur}"></i>${esc(c.court)}</span>`).join("");
      const entetes = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."]
        .map((j) => `<div class="nom-jour">${j}</div>`).join("");
      const cases = semainesDuMois(cal.annee, cal.mois).flat().map((j) => {
        const evs = parJour.get(j.cle) || [];
        const classes = ["case", j.dansMois ? "" : "hors", j.cle === auj ? "auj" : "", j.cle === cal.choisi ? "choisi" : ""]
          .filter(Boolean).join(" ");
        const puces = evs.map((e) => `<span class="puce-ev${e.date < maintenant ? " passee" : ""}" style="--c:${e.cours.couleur}"
          title="${esc(e.cours.court)} : ${esc(e.titre)}, ${fmtHeure(e.date)}"><b>${esc(e.cours.court)}</b> ${esc(e.titre)}</span>`).join("");
        const points = evs.map((e) => `<span class="point" style="background:${e.cours.couleur}"></span>`).join("");
        return `<button class="${classes}" data-jour="${j.cle}" aria-label="${j.cle}, ${evs.length} évaluation(s)">
          <span class="num-jour">${j.jour}</span>${puces}<span class="points">${points}</span></button>`;
      }).join("");
      const choisis = parJour.get(cal.choisi) || [];
      const dateChoisie = new Date(cal.choisi + "T12:00:00");
      const detail = `<div class="jour"><h2 class="titre-brio">${fmtJour(dateChoisie)}</h2>
          <span class="surtitre">${choisis.length ? choisis.length + " évaluation" + (choisis.length > 1 ? "s" : "") : "Rien de prévu"}</span></div>
        ${choisis.map(carteRemise).join("")}`;
      return `<div class="cal-tete"><h2 class="titre-brio">${NOMS_MOIS[cal.mois].replace(/^./, (c) => c.toUpperCase())} ${cal.annee}</h2>
          <button class="bouton2" data-cal="-1" aria-label="Mois précédent">‹</button>
          <button class="bouton2" data-cal="0">Aujourd'hui</button>
          <button class="bouton2" data-cal="1" aria-label="Mois suivant">›</button></div>
        <div class="legende">${legende}</div>
        <div class="mois">${entetes}${cases}</div>
        <div class="detail">${detail}</div>`;
    }
  
    function vueEcheances(cours, jours) {
      const maintenant = new Date();
      const liste = echeances(cours, maintenant, jours);
      const limite = new Date(maintenant.getTime() + jours * 86400000);
      const fmtCourt = (d) => d.toLocaleDateString("fr-CA", { timeZone: FUSEAU, day: "numeric", month: "long" });
      const jusqua = fmtCourt(limite);
      const plusTard = evenements(cours).some((e) => e.date > limite);
      const boutons = `<div class="avenir-nav">
          <span class="surtitre">${jours} prochains jours, jusqu'au ${jusqua}</span>
          ${jours > JOURS_A_VENIR ? `<button class="bouton2" data-avenir="-1">Revenir aux ${JOURS_A_VENIR} prochains jours</button>` : ""}
          <button class="bouton2" data-avenir="1">Voir les ${JOURS_A_VENIR} jours suivants</button>
          ${plusTard ? "" : `<span class="surtitre">Aucune autre évaluation datée pour l'instant</span>`}
        </div>`;
      if (!liste.length) return `<div class="info">Rien à remettre d'ici le ${jusqua}.</div>${boutons}`;
      let html = "";
      let jourCourant = null;
      for (const e of liste) {
        const n = ecartJours(e.date);
        const classe = n <= 2 ? "urgent" : n <= 7 ? "proche" : "";
        if (jourDe(e.date) !== jourCourant) {
          jourCourant = jourDe(e.date);
          html += `<div class="jour"><h2 class="titre-brio">${fmtJour(e.date)}</h2>
            <span class="surtitre ${classe}">${relatif(n)}</span></div>`;
        }
        html += carteRemise(e);
      }
      return html + boutons;
    }
  
    // Note du cours dans la liste « Sites de cours » (à droite de la personne enseignante) --
  
    let promesseIdUtilisateur = null;
    function idUtilisateurCourant() {
      if (!promesseIdUtilisateur) {
        promesseIdUtilisateur = get(`${IDENTITES}/auth/oauth2/userinfo/`)
          .then((info) => premier(info, "idUtilisateur", "id_utilisateur", "sub", "id"))
          .catch((e) => { promesseIdUtilisateur = null; throw e; });
      }
      return promesseIdUtilisateur;
    }
  
    const notesSites = new Map(); // idSite -> { quand, promesse }
    function noteDuSite(idSite) {
      const m = notesSites.get(idSite);
      if (m && Date.now() - m.quand < CACHE_MINUTES * 60000) return m.promesse;
      const promesse = idUtilisateurCourant()
        .then((id) => get(`${API}/sites/sites/${idSite}/resultats/${id}`))
        .then((r) => r.element || r)
        .catch((e) => { notesSites.delete(idSite); throw e; });
      notesSites.set(idSite, { quand: Date.now(), promesse });
      return promesse;
    }
  
    // Barème de conversion du cours (lu dans Brio) ; à défaut, celui de l'Université Laval par défaut.
    const BAREME_DEFAUT = [["A+", 85], ["A", 82], ["A-", 79], ["B+", 76], ["B", 73], ["B-", 70],
      ["C+", 66], ["C", 62], ["C-", 58], ["D+", 54], ["D", 50], ["E", 0]];
    const baremes = new Map(); // idSite -> promesse de [[lettre, minimum], ...]
    function baremeDuSite(idSite, codeCours) {
      if (!baremes.has(idSite)) {
        const p = (codeCours ? get(`${API}/sites/sites/${idSite}/baremesnotation`, { codecours: codeCours }) : Promise.reject())
          .then((r) => {
            const cotes = premier(r, "element.cotes", "cotes") || [];
            const liste = cotes.map((c) => [String(c.cote).replace("_PLUS", "+").replace("_MOINS", "-"),
              nombre(premier(c, "noteMinimale.valeur"))]).filter((c) => c[1] !== null);
            return liste.length ? liste.sort((a, b) => b[1] - a[1]) : BAREME_DEFAUT;
          })
          .catch(() => BAREME_DEFAUT);
        baremes.set(idSite, p);
      }
      return baremes.get(idSite);
    }
    function lettrePour(pct, bareme) {
      const arrondi = Math.round(pct * 100) / 100;
      const trouve = bareme.find(([, min]) => arrondi >= min);
      return trouve ? trouve[0] : bareme[bareme.length - 1][0];
    }
  
    const STYLE_NOTE = "display:flex;align-items:center;gap:14px;margin-left:20px;padding:7px 15px;"
      + "border-radius:9px;text-decoration:none;line-height:1.25;white-space:nowrap;"
      + "background:var(--lbt-surface2,#eef2f6);color:var(--lbt-titre,#0f263e);";
    const TITRE_NOTE = `<span style="display:block;font-size:17px;opacity:.75">Note cumulée</span>`;
  
    function remplirNote(lien, r, bareme) {
      const note = nombre(premier(r, "noteCumulee.valeur"));
      const sur = nombre(premier(r, "ponderationCumulee.valeur"));
      if (note === null || !sur) {
        lien.innerHTML = `<span>${TITRE_NOTE}<span style="font-size:20px">Aucune note pour l'instant</span></span>`;
        return;
      }
      const pct = (note / sur) * 100;
      const lettre = lettrePour(pct, bareme);
      lien.innerHTML = `<span>${TITRE_NOTE}<span style="font-size:22px"><b>${fmtNombre(note, 2)}/${fmtNombre(sur, 2)}</b>`
        + ` · ${fmtNombre(pct, 1)} %</span></span>`
        + `<span style="font-size:38px;font-weight:700;line-height:1;color:var(--lbt-accent,#0e67d6)">${lettre}</span>`;
      lien.title = `Note cumulée : ${fmtNombre(note, 2)} sur ${fmtNombre(sur, 2)} points évalués jusqu'ici `
        + `(${fmtNombre(pct, 1)} %), soit ${lettre} selon le barème du cours`;
    }
  
    function poserNotes() {
      if (!location.pathname.startsWith("/mon-espace/")) return;
      document.querySelectorAll("article[data-id-site]").forEach((article) => {
        const enseignants = article.querySelector(".p-liste-enseignants");
        const idSite = article.dataset.idSite;
        if (!enseignants || !idSite) return;
        const deja = enseignants.querySelector(".lbt-note-cours");
        if (deja && deja.dataset.site === idSite) return;
        if (deja) deja.remove();
        const lien = document.createElement("a");
        lien.className = "lbt-note-cours";
        lien.dataset.site = idSite;
        lien.href = `/sites/${idSite}/resultats/`;
        lien.setAttribute("style", STYLE_NOTE);
        lien.innerHTML = `<span>${TITRE_NOTE}<span style="font-size:20px">…</span></span>`;
        enseignants.appendChild(lien);
        const groupe = article.querySelector(".p-espace-partenaire-formation-utilisateur-multi__nom-groupe");
        const codeCours = ((groupe && groupe.textContent) || "").match(/[A-Z]{2,4}-\d{4}/);
        Promise.all([noteDuSite(idSite), baremeDuSite(idSite, codeCours && codeCours[0])])
          .then(([r, bareme]) => remplirNote(lien, r, bareme))
          .catch(() => { lien.style.display = "none"; }); // pas de résultats accessibles pour ce cours : on n'affiche rien
      });
    }
  
    // Page « Résultats » d'un cours : note à viser sur chaque évaluation pas encore notée ---------
    //   Calcul : quel pourcentage obtenir, partout pareil, sur les évaluations restantes
    //   pour atteindre la cote juste au-dessus de la cote actuelle.
  
    // Règle de réussite de la page Évaluations (texte libre écrit par l'enseignant, placé n'importe où
    // sur la page). On y cherche un seuil sur les examens, par ex. « double seuil de réussite [...]
    // moyenne pondérée obtenue aux examens [...] d'au moins 50 % » ou « 50 % sur le total du regroupement Examens ».
    const DECLENCHEURS = /double seuil|seuils? de r[ée]ussite|pour r[ée]ussir|r[ée]ussite du cours/gi;
    const SEUIL_EXAMENS = /(\d+(?:[.,]\d+)?)\s*%[^.;]{0,80}?examens?|examens?[^.;]{0,160}?(\d+(?:[.,]\d+)?)\s*%/i;
  
    /** Tout le texte d'une réponse de l'API (tous les blocs, HTML converti en texte). */
    function texteDe(objet) {
      const morceaux = [];
      (function parcourir(v) {
        if (typeof v === "string") {
          if (v.length > 20) morceaux.push(v.includes("<") ? new DOMParser().parseFromString(v, "text/html").body.textContent : v);
        } else if (v && typeof v === "object") Object.values(v).forEach(parcourir);
      })(objet);
      return morceaux.join(" ").replace(/\s+/g, " ");
    }
  
    /** Cherche le seuil des examens à chaque mention de réussite ou de seuil, pas seulement la première. */
    function trouverSeuil(texte) {
      for (const d of texte.matchAll(DECLENCHEURS)) {
        const m = texte.slice(d.index, d.index + 700).match(SEUIL_EXAMENS);
        const v = m && parseFloat((m[1] || m[2]).replace(",", "."));
        if (v > 0 && v <= 100) return v;
      }
      return null;
    }
  
    const reglesExamens = new Map(); // idSite -> promesse du seuil en % (ou null)
    function seuilExamens(idSite) {
      if (!reglesExamens.has(idSite)) {
        reglesExamens.set(idSite, get(`${API}/sites/pages/${idSite}-hnikums801/`, { inclurecontenus: "true" })
          .then((p) => trouverSeuil(texteDe(p)))
          .catch(() => null));
      }
      return reglesExamens.get(idSite);
    }
  
    const estExamen = (e) => /\bexamens?\b/i.test(e.titre || "");
  
    function cibleCoteSuivante(r, bareme, seuil) {
      const evals = (premier(r, "resultatsEvaluationsApprenantAbrege") || [])
        .filter((e) => e.sommativePonderation && !e.formative && nombre(premier(e, "ponderation.valeur")));
      const poids = (e) => premier(e, "ponderation.valeur");
      const obtenue = (e) => nombre(premier(e, "notePonderee.valeur"));
      const note = nombre(premier(r, "noteCumulee.valeur")) || 0;
      const evalue = nombre(premier(r, "ponderationCumulee.valeur")) || 0;
      const restantes = evals.filter((e) => obtenue(e) === null);
      const reste = restantes.reduce((s, e) => s + poids(e), 0);
      if (!reste) return null;
      const total = evalue + reste;
      const croissant = [...bareme].sort((a, b) => a[1] - b[1]);
      const actuelle = evalue ? lettrePour((note / evalue) * 100, bareme) : croissant[0][0];
      const i = croissant.findIndex(([l]) => l === actuelle);
      const garder = i === croissant.length - 1; // déjà la meilleure cote : on montre ce qu'il faut pour la garder
      const [lettre, minimum] = croissant[garder ? i : i + 1];
      const objectif = (minimum * total) / 100 - note; // points à aller chercher sur ce qui reste
      const uniforme = (objectif / reste) * 100;
      const c = { lettre, garder, actuelle, seuil, examen: uniforme, autre: uniforme, seuilExam: null, ids: new Set() };
      restantes.forEach((e) => c.ids.add(e.idEvaluation));
  
      // Seuil sur les examens : seulement quand la cible est la note de passage (D), la plus basse après l'échec.
      const examens = evals.filter(estExamen);
      const examensRestants = examens.filter((e) => obtenue(e) === null);
      const resteExam = examensRestants.reduce((s, e) => s + poids(e), 0);
      const visePassage = croissant.length > 1 && lettre === croissant[1][0];
      if (seuil && resteExam && visePassage) {
        const totalExam = examens.reduce((s, e) => s + poids(e), 0);
        const noteExam = examens.reduce((s, e) => s + (obtenue(e) || 0), 0);
        c.seuilExam = ((seuil * totalExam) / 100 - noteExam) / resteExam * 100;
        c.examensIds = new Set(examensRestants.map((e) => e.idEvaluation));
        // Les examens visent la note de seuil ; les autres évaluations fournissent le reste pour avoir la cote.
        const resteAutre = reste - resteExam;
        const autreSiSeuil = resteAutre ? ((objectif - (c.seuilExam * resteExam) / 100) / resteAutre) * 100 : null;
        if (c.seuilExam > uniforme || !resteAutre) {
          c.examen = Math.max(c.seuilExam, uniforme);
          if (resteAutre) c.autre = autreSiSeuil;
        } else if (c.seuilExam > 0 && autreSiSeuil <= 100) {
          c.examen = c.seuilExam;
          c.autre = autreSiSeuil;
          c.examenAuSeuil = true;
        } // sinon les autres évaluations ne suffiraient pas : on garde la même cible partout
      }
      return c;
    }
  
    const STYLE_CIBLE = "display:inline-block;padding:3px 10px;border-radius:8px;font-size:16px;line-height:1.4;"
      + "background:var(--lbt-surface2,#eef2f6);color:var(--lbt-titre,#0f263e);";
    // Affichage étroit (liste) : pastille centrée entre « Note obtenue » et « Note pondérée »
    const STYLE_CIBLE_LISTE = "grid-column:3;grid-row:1 / span 2;align-self:center;justify-self:start;margin-left:16px;";
    const pourcent = (x) => `${fmtNombre(Math.ceil(x * 10) / 10, 1)} %`;
  
    function texteCible(c, examen) {
      const x = examen ? c.examen : c.autre;
      const cote = `${c.garder ? "garder " : ""}${c.lettre}`;
      const seuilDecisif = examen && c.seuilExam !== null && c.seuilExam >= c.examen - 1e-9 && c.seuilExam > 0;
      if (examen && c.seuilExam !== null && c.seuilExam > 100) return `Seuil des examens (${c.seuil} %) hors d'atteinte`;
      if (x > 100) return `${c.lettre} hors d'atteinte`;
      if (examen && c.examenAuSeuil) return `Vise <b>${pourcent(x)}</b> pour le seuil des examens (${c.seuil} %)`;
      if (x <= 0) return `${c.lettre} déjà assuré` + (examen && c.seuilExam > 0 ? ` (seuil examens : ${pourcent(c.seuilExam)})` : "");
      const rappelSeuil = examen && c.seuilExam !== null && !seuilDecisif && c.seuilExam > 0
        ? ` (seuil examens : ${pourcent(c.seuilExam)})` : ""; // seuil déjà couvert par la cible : on le rappelle
      return `Vise <b>${pourcent(x)}</b> pour ${cote}` + (seuilDecisif ? ` et le seuil des examens (${c.seuil} %)` : rappelSeuil);
    }
  
    const idEvalDe = (el) => {
      const lien = el.querySelector('a[href*="/evaluations/"]');
      return lien && (lien.getAttribute("href").match(/evaluations\/([^/?#]+)/) || [])[1];
    };

    /** Remplit la pastille pour une évaluation ; renvoie false si l'évaluation n'a pas de cible (déjà notée, formative...). */
    function remplirCible(pastille, c, idEval, styleEnPlus) {
      if (!idEval || !c.ids.has(idEval)) return false;
      const examen = !!(c.examensIds && c.examensIds.has(idEval));
      pastille.hidden = false;
      pastille.setAttribute("style", STYLE_CIBLE + (styleEnPlus || ""));
      pastille.innerHTML = texteCible(c, examen);
      pastille.title = `Cote actuelle : ${c.actuelle}. Pourcentage à obtenir sur cette évaluation (et les autres du même type) `
        + `pour finir le cours avec ${c.lettre}, selon le barème du cours`
        + (c.seuilExam !== null ? ` et la règle de réussite : au moins ${c.seuil} % au total des examens.` : ".");
      return true;
    }

    const TH_OBTENUE = ".p-tableau-resultat-evaluations-participant__th-note-obtenue";
    const TD_OBTENUE = ".p-tableau-resultat-evaluations-participant__td-note-obtenue";

    function poserCibles() {
      const m = location.pathname.match(/^\/sites\/([^/]+)\/resultats/);
      if (!m) return;
      const idSite = m[1];

      // Affichage étroit : une liste de blocs « Note obtenue / Note pondérée »
      const lignes = [...document.querySelectorAll(".p-element-liste-resultat-evaluations-participant")]
        .filter((l) => !l.querySelector(".lbt-cible"));
      lignes.forEach((l) => {
        const marque = document.createElement("span");
        marque.className = "lbt-cible";
        marque.hidden = true;
        l.appendChild(marque);
      });

      // Affichage large : un tableau ; on ajoute une colonne « Note visée » à gauche de « Note obtenue »
      const tableaux = [...document.querySelectorAll("table")].filter((t) => t.querySelector(TH_OBTENUE));
      tableaux.filter((t) => !t.querySelector(".lbt-th-cible")).forEach((t) => {
        const thObtenue = t.querySelector(TH_OBTENUE);
        const th = document.createElement("th");
        th.className = thObtenue.className.replace("p-tableau-resultat-evaluations-participant__th-note-obtenue", "lbt-th-cible");
        th.scope = "col";
        th.style.width = "300px";
        th.innerHTML = "<div>Note visée</div>";
        thObtenue.before(th);
      });
      tableaux.forEach((t) => {
        // La ligne « Note cumulée » du bas : élargir sa case vide d'une colonne pour rester sous « Note pondérée »
        const vide = t.querySelector("tfoot .p-tableau-resultat-evaluations-participant__td-footer-vide");
        if (vide && !vide.dataset.lbtOrigine) {
          vide.dataset.lbtOrigine = String(vide.colSpan);
          vide.colSpan += 1;
        }
      });
      const cellules = [];
      tableaux.forEach((t) => t.querySelectorAll("tbody tr").forEach((tr) => {
        const tdObtenue = tr.querySelector(TD_OBTENUE);
        if (!tdObtenue || tr.querySelector(".lbt-td-cible")) return;
        const td = document.createElement("td");
        td.className = "lbt-td-cible";
        td.setAttribute("style", "text-align:center;vertical-align:middle;padding:8px;");
        tdObtenue.before(td);
        cellules.push([tr, td]);
      }));

      if (!lignes.length && !cellules.length) return;
      const code = (document.body.innerText.match(/\b([A-Z]{2,4}-\d{4}) \(Groupe/) || [])[1];
      Promise.all([noteDuSite(idSite), baremeDuSite(idSite, code), seuilExamens(idSite)]).then(([r, bareme, seuil]) => {
        const c = cibleCoteSuivante(r, bareme, seuil);
        if (!c) return;
        lignes.forEach((l) => {
          const pastille = l.querySelector(".lbt-cible");
          const contenu = l.querySelector(".p-element-liste-resultat-evaluations-participant__contenu");
          if (remplirCible(pastille, c, idEvalDe(l), STYLE_CIBLE_LISTE) && contenu) contenu.appendChild(pastille);
        });
        cellules.forEach(([tr, td]) => {
          const pastille = document.createElement("span");
          pastille.className = "lbt-cible";
          if (remplirCible(pastille, c, idEvalDe(tr))) td.appendChild(pastille);
        });
      }).catch(() => { /* pas de résultats accessibles : on n'affiche rien */ });
    }

    let notesPlanifiees = false;
    function planifierNotes() {
      if (notesPlanifiees) return;
      notesPlanifiees = true;
      setTimeout(() => { notesPlanifiees = false; poserNotes(); poserCibles(); }, 300);
    }
  
    function monter() {
      const hote = document.createElement("div");
      hote.id = "lecteur-brio-bilan";
      const racine = hote.attachShadow({ mode: "closed" });
      racine.innerHTML = `<style>${CSS}</style><div class="racine">
        <button class="declencheur" aria-haspopup="dialog"><span>Échéances</span><span class="pastille" hidden></span></button>
        <div class="fond" hidden>
          <div class="fenetre" role="dialog" aria-modal="true" aria-labelledby="titre-bilan">
            <div class="entete">
              <div><div class="surtitre">Mon espace Brio</div><h1 class="titre-brio" id="titre-bilan">Échéances et calendrier</h1></div>
              <button class="fermer" data-action="fermer">Fermer</button>
            </div>
            <div class="menu">
              <button class="onglet actif" data-vue="echeances">À venir</button>
              <button class="onglet" data-vue="calendrier">Calendrier</button>
              <span class="maj"></span>
              <button class="outil" data-action="rafraichir" style="color:var(--c-sur-fonce)">Actualiser</button>
            </div>
            <div class="corps"><div class="info">Chargement…</div></div>
          </div>
        </div></div>`;
      document.body.appendChild(hote);
  
      const fond = racine.querySelector(".fond");
      const corps = racine.querySelector(".corps");
      const pastille = racine.querySelector(".pastille");
      const maj = racine.querySelector(".maj");
      const declencheur = racine.querySelector(".declencheur");
      let vue = "echeances";
      let joursAVenir = JOURS_A_VENIR;
      const aujourdhui = () => jourDe(new Date());
      const cal = { annee: 0, mois: 0, choisi: "" };
      function calSur(cle) {
        cal.annee = Number(cle.slice(0, 4));
        cal.mois = Number(cle.slice(5, 7)) - 1;
        cal.choisi = cle;
      }
      calSur(aujourdhui());
      let defilementPage = "";
  
      async function afficher(forcer, garderDefilement) {
        if (forcer) corps.innerHTML = `<div class="info">Chargement…</div>`;
        try {
          const cours = await donnees(forcer);
          const urgents = echeances(cours, new Date(), 7).length;
          pastille.hidden = !urgents;
          pastille.textContent = urgents;
          declencheur.title = `${urgents} remise(s) dans les 7 prochains jours`;
          maj.textContent = `Mis à jour à ${fmtHeure(new Date(memoire.quand))}`;
          if (!fond.hidden) {
            const haut = corps.scrollTop;
            corps.innerHTML = vue === "calendrier" ? vueCalendrier(cours, cal) : vueEcheances(cours, joursAVenir);
            corps.scrollTop = garderDefilement ? haut : 0;
          }
        } catch (e) {
          corps.innerHTML = e.message === "SESSION"
            ? `<div class="info">Session Brio introuvable ou expirée.<br>Recharge la page Brio, puis actualise.</div>`
            : `<div class="info">Impossible de lire Brio (${esc(e.message)}).</div>`;
        }
      }
  
      function ouvrir() {
        fond.hidden = false;
        defilementPage = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";
        racine.querySelector(".fermer").focus();
        afficher(false);
      }
      function fermer() {
        fond.hidden = true;
        document.documentElement.style.overflow = defilementPage;
        declencheur.focus();
      }
  
      declencheur.addEventListener("click", ouvrir);
      racine.querySelector('[data-action="fermer"]').addEventListener("click", fermer);
      fond.addEventListener("click", (e) => { if (e.target === fond) fermer(); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !fond.hidden) fermer(); });
      racine.querySelectorAll(".onglet").forEach((o) => o.addEventListener("click", () => {
        racine.querySelectorAll(".onglet").forEach((x) => x.classList.toggle("actif", x === o));
        vue = o.dataset.vue;
        afficher(false);
      }));
      racine.querySelector('[data-action="rafraichir"]').addEventListener("click", () => afficher(true));
      corps.addEventListener("click", (e) => {
        const jour = e.target.closest("[data-jour]");
        const nav = e.target.closest("[data-cal]");
        const avenir = e.target.closest("[data-avenir]");
        if (avenir) {
          joursAVenir = Number(avenir.dataset.avenir) > 0 ? joursAVenir + JOURS_A_VENIR : JOURS_A_VENIR;
        } else if (jour) {
          calSur(jour.dataset.jour);
        } else if (nav) {
          const pas = Number(nav.dataset.cal);
          if (pas === 0) calSur(aujourdhui());
          else {
            const d = new Date(Date.UTC(cal.annee, cal.mois + pas, 1, 12));
            calSur(d.toISOString().slice(0, 10));
          }
        } else return;
        afficher(false, true);
      });
  
      // Pastille au démarrage, quand Brio a eu le temps de poser son token.
      setTimeout(() => afficher(false), 1500);
    }
  
    if (!document.getElementById("lecteur-brio-bilan")) monter();
    new MutationObserver(planifierNotes).observe(document.body, { childList: true, subtree: true });
    planifierNotes();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrerPartie2, { once: true });
  else demarrerPartie2();
})();
