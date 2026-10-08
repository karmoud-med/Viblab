import { CourseData } from '../types/course';

export const INITIAL_COURSES: CourseData[] = [
  {
    id: 'vibration_1',
    title: 'Vibrations Niveau 1 — Formation Certifiante',
    desc: 'Support officiel de formation Niveau 1 en surveillance vibratoire des machines tournantes, analyse spectrale et maintenance conditionnelle.',
    badge: 'Niveau 1 — ISO 18436-2',
    color: 'from-blue-600 via-indigo-600 to-cyan-600',
    duration: '35 Heures (5 jours)',
    target: 'Techniciens mécaniques, inspecteurs vibratoires, agents de maintenance prédictive, opérateurs de ronde.',
    prerequisites: 'Notions élémentaires en mécanique industrielle et cinématique des machines tournantes.',
    objectives: [
      'Comprendre le rôle clé de la maintenance prédictive conditionnelle et la surveillance vibratoire.',
      'Maîtriser les notions fondamentales : période, fréquence, amplitude (Déplacement, Vitesse, Accélération).',
      'Appliquer les protocoles de fixation et de mesure avec capteurs piézo-électriques.',
      'Exploiter les indicateurs globaux RMS, facteur de crête et la norme de sévérité ISO 10816-3 / 20816-3.',
      'Identifier et diagnostiquer les défauts majeurs : balourd 1X, désalignement 1X/2X, jeux mécaniques et dégradation de roulements.',
      'S\'entraîner sur des scénarios réels industriels et des ateliers pratiques de mesure.'
    ],
    chapters: [
      { num: '01', title: 'Module 1 : Stratégie de maintenance & Rôle de la surveillance vibratoire', duration: '4h' },
      { num: '02', title: 'Module 2 : Notions vibratoires fondamentales (Déplacement, Vitesse, Accélération)', duration: '5h' },
      { num: '03', title: 'Module 3 : Chaîne de mesure, Capteurs piézo-électriques & Fixation', duration: '5h' },
      { num: '04', title: 'Module 4 : Indicateurs globaux, RMS, Facteur de crête & Normes ISO', duration: '5h' },
      { num: '05', title: 'Module 5 : Diagnostic des défauts (Balourd, Désalignement, Jeux, Roulements)', duration: '6h' },
      { num: '06', title: 'Module 5 : Pratique Diagnostic sur scénarios réels terrain', duration: '5h' },
      { num: '07', title: 'Module Pratique Niveau 1 : Ateliers pratiques & Simulateur OCP MS', duration: '5h' }
    ],
    modules: [
      {
        id: 'v1_mod_1',
        title: 'Module 1 - Stratégie de maintenance',
        subtitle: 'Maintenance conditionnelle, surveillance vibratoire & retour sur investissement',
        type: 'html',
        htmlUrl: '/courses/niveau1/module_1_strategie_maintenance.html',
        trainerNotes: 'Présenter la courbe P-F (intervalle Potentiel - Défaillance) et le ROI de la maintenance prédictive.',
        dateAdded: '2026-09-29',
        author: 'OCP Maintenance Solutions',
        isStandalone: true
      },
      {
        id: 'v1_mod_2',
        title: 'Module 2 - Notions vibratoires',
        subtitle: 'Fréquence, amplitude, période, grandeurs Déplacement, Vitesse, Accélération',
        type: 'html',
        htmlUrl: '/courses/niveau1/module_2_notions_vibratoires.html',
        trainerNotes: 'Faire manipuler les conversions d\'unités et la relation physique v = 2*pi*f*d.',
        dateAdded: '2026-09-29',
        author: 'OCP Maintenance Solutions',
        isStandalone: true
      },
      {
        id: 'v1_mod_3',
        title: 'Module 3 - Chaîne de mesure',
        subtitle: 'Accéléromètres piézo, montage (aimant, embase, goujon), réponse en fréquence',
        type: 'html',
        htmlUrl: '/courses/niveau1/module_3_chaine_mesure.html',
        trainerNotes: 'Insister sur l\'impact direct du mode de fixation sur la bande passante utile du capteur.',
        dateAdded: '2026-09-29',
        author: 'OCP Maintenance Solutions',
        isStandalone: true
      },
      {
        id: 'v1_mod_4',
        title: 'Module 4 - Indicateurs et normes',
        subtitle: 'Norme ISO 10816-3 / 20816-3, vitesse globale RMS, facteur de crête & seuils d\'alarme',
        type: 'html',
        htmlUrl: '/courses/niveau1/module_4_indicateurs_normes.html',
        trainerNotes: 'Faire classer des machines tournantes selon leur groupe ISO (puissance, fondation rigide ou souple).',
        dateAdded: '2026-09-29',
        author: 'OCP Maintenance Solutions',
        isStandalone: true
      },
      {
        id: 'v1_mod_5',
        title: 'Module 5 - Diagnostic des défauts',
        subtitle: 'Balourd statique/couple, désalignement angulaire/parallèle, jeu, roulements (BPFO/BPFI)',
        type: 'html',
        htmlUrl: '/courses/niveau1/module_5_diagnostic_defauts.html',
        trainerNotes: 'Détailler les signatures spectrales FFT typiques et l\'apparition des harmoniques 1X, 2X, 3X.',
        dateAdded: '2026-09-29',
        author: 'OCP Maintenance Solutions',
        isStandalone: true
      },
      {
        id: 'v1_mod_6',
        title: 'Module 5 - Pratique Diagnostic sur scénarios',
        subtitle: 'Études de cas réels industriels, cascades spectrales, diagnostics et préconisations',
        type: 'html',
        htmlUrl: '/courses/niveau1/module_5_pratique_scenarios.html',
        trainerNotes: 'Mettre les stagiaires en situation d\'expert diagnostiqueur avec rapport de recommandations.',
        dateAdded: '2026-09-29',
        author: 'OCP Maintenance Solutions',
        isStandalone: true
      },
      {
        id: 'v1_mod_7',
        title: 'Module Pratique Niveau 1 — OCP MS',
        subtitle: 'Travaux pratiques interactifs, banc d\'essai et validation des compétences Niveau 1',
        type: 'html',
        htmlUrl: '/courses/niveau1/module_pratique_niveau_1.html',
        trainerNotes: 'Atelier de synthèse pratique préparatoire à l\'examen de certification Niveau 1.',
        dateAdded: '2026-09-29',
        author: 'OCP Maintenance Solutions',
        isStandalone: true
      }
    ]
  }
];
