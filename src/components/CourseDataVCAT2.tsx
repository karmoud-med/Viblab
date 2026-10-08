import React from 'react';
import { SkiSlopeDemo } from './SkiSlopeDemo';
import { Info, AlertTriangle, Lightbulb, CheckCircle2, AlertCircle, Activity, TrendingDown, BarChart3, List, Presentation } from 'lucide-react';

export interface Slide {
  id: number;
  part: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  notes?: string;
  visualType?: 'none' | 'waveform' | 'spectrum' | 'pf-curve' | 'iso-table' | 'vector' | 'resonance' | 'sensor-mounting' | 'bearing-defects' | 'laser-alignment' | 'quiz' | 'image';
  isCover?: boolean;
  imageUrl?: string;
  quizData?: {
    timeLimitSeconds?: number;
    questions: {
      id: string;
      question: string;
      imageUrl?: string;
      options: { id: string; text: string; isCorrect: boolean; explanation: string }[];
    }[];
  };
}

export const COURSE_SLIDES: Slide[] = [
  {
    id: 0,
    part: "Introduction",
    title: "Analyse Vibratoire Niveau 2",
    visualType: "none",
    isCover: true,
    content: (
      <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <p className="text-2xl md:text-3xl font-light text-blue-100/90 leading-relaxed text-center max-w-4xl mt-8 tracking-wide">
          De la maintenance à la surveillance vibratoire : principes physiques, mesure, traitement du signal et diagnostic des défauts des machines tournantes.
        </p>
        <div className="mt-16 flex items-center justify-center gap-4 text-white/50 text-sm font-semibold tracking-widest uppercase">
          <span className="w-12 h-px bg-white/20"></span>
          OCP Maintenance Solutions
          <span className="w-12 h-px bg-white/20"></span>
        </div>
      </div>
    ),
  },
  {
    id: 1,
    part: "Plan de la formation",
    title: "Sommaire",
    visualType: "none",
    content: (
      <div className="w-full max-w-5xl mx-auto mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
          
          <div className="space-y-6">
            <div className="group cursor-pointer">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-4 border-b-2 border-slate-100 pb-3 transition-colors group-hover:border-emerald-500">
                <span className="text-emerald-500 font-black text-2xl">I</span>
                Rappel & principes de la vibration
                <span className="text-sm font-normal text-slate-400 ml-auto">(8 sujets)</span>
              </h3>
            </div>
            
            <div className="group cursor-pointer">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-4 border-b-2 border-slate-100 pb-3 transition-colors group-hover:border-emerald-500">
                <span className="text-emerald-500 font-black text-2xl">II</span>
                Acquisition, capteurs & seuils
                <span className="text-sm font-normal text-slate-400 ml-auto">(6 sujets)</span>
              </h3>
            </div>

            <div className="group cursor-pointer">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-4 border-b-2 border-slate-100 pb-3 transition-colors group-hover:border-emerald-500">
                <span className="text-emerald-500 font-black text-2xl">III</span>
                Traitement du signal
                <span className="text-sm font-normal text-slate-400 ml-auto">(6 sujets)</span>
              </h3>
            </div>

            <div className="group cursor-pointer">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-4 border-b-2 border-slate-100 pb-3 transition-colors group-hover:border-emerald-500">
                <span className="text-emerald-500 font-black text-2xl">IV</span>
                Diagnostic des défauts
                <span className="text-sm font-normal text-slate-400 ml-auto">(7 sujets)</span>
              </h3>
            </div>

            <div className="group cursor-pointer">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-4 border-b-2 border-slate-100 pb-3 transition-colors group-hover:border-emerald-500">
                <span className="text-emerald-500 font-black text-2xl">V</span>
                Techniques de correction
                <span className="text-sm font-normal text-slate-400 ml-auto">(4 sujets)</span>
              </h3>
            </div>
          </div>

          <div className="space-y-6">
            <div className="group cursor-pointer">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-4 border-b-2 border-slate-100 pb-3 transition-colors group-hover:border-blue-500">
                <span className="text-blue-600 font-black text-2xl">Évaluations</span>
              </h3>
              <p className="text-slate-600 mt-2 font-medium">Exercices, cas réels, QCM</p>
            </div>
            
            <div className="group cursor-pointer">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-4 border-b-2 border-slate-100 pb-3 transition-colors group-hover:border-blue-500">
                <span className="text-blue-600 font-black text-2xl">Pratique Essentiel</span>
              </h3>
              <p className="text-slate-600 mt-2 font-medium">MobiVib, i-Sense, Toolbox, banc d'essai, rapports</p>
            </div>

            <div className="group cursor-pointer">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-4 border-b-2 border-slate-100 pb-3 transition-colors group-hover:border-blue-500">
                <span className="text-blue-600 font-black text-2xl">Annexes</span>
              </h3>
              <p className="text-slate-600 mt-2 font-medium">Récapitulatif signatures, galerie photo</p>
            </div>

            <div className="mt-8 bg-slate-50 border-l-4 border-emerald-500 p-6 rounded-r-xl shadow-sm">
              <p className="text-slate-700 italic font-medium">
                Niveau 2 approfondit chaque sujet du Niveau 1 : formules, cas chiffrés, technologies avancées.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    ),
  },
  {
    id: 2,
    part: "Partie I",
    title: "Rappel et principes de la vibration",
    visualType: "none",
    isCover: true,
    content: (
      <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <p className="text-xl md:text-2xl font-light text-blue-100/80 leading-relaxed text-center max-w-3xl mt-8">
          La maintenance et ses stratégies, la courbe P-F, puis les bases physiques : nature de la vibration, période, fréquence, ordres, amplitudes et unités.
        </p>
        <div className="mt-12 w-16 h-1 bg-emerald-500 rounded-full"></div>
      </div>
    ),
  },
  {
    id: 3,
    part: "Rappel et principes de la vibration",
    title: "1. La maintenance : définition et enjeux",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-emerald-500 p-5 rounded-r-xl">
          <p className="text-lg text-slate-700 italic">
            La maintenance regroupe l'ensemble des actions destinées à maintenir ou à rétablir un bien dans un état lui permettant d'accomplir la fonction pour laquelle il a été conçu.
          </p>
        </div>
        
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Selon la norme européenne <strong>EN 13306</strong>, c'est « l'ensemble de toutes les actions techniques, administratives et de gestion durant le cycle de vie d'un bien... ». Pour une entreprise industrielle, ce n'est pas un simple centre de coût : c'est un levier de performance.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white border-t-4 border-t-blue-500 border-x border-b border-slate-100 rounded-b-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Disponibilité</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Augmenter le temps de fonctionnement (moins d'arrêts non planifiés).</p>
          </div>
          
          <div className="bg-white border-t-4 border-t-emerald-500 border-x border-b border-slate-100 rounded-b-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <span className="text-emerald-600 font-bold">2</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Réduction des coûts</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Diminuer les réparations d'urgence et les pertes de production.</p>
          </div>
          
          <div className="bg-white border-t-4 border-t-amber-500 border-x border-b border-slate-100 rounded-b-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <span className="text-amber-600 font-bold">3</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Sécurité</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Améliorer la sécurité des personnes et de l'environnement.</p>
          </div>
          
          <div className="bg-white border-t-4 border-t-indigo-500 border-x border-b border-slate-100 rounded-b-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <span className="text-indigo-600 font-bold">4</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Durée de vie</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Prolonger la durée de vie globale des actifs industriels.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 p-6 rounded-2xl shadow-sm mt-8 flex gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="text-amber-900 font-bold uppercase tracking-wider text-xs mb-2">Idée Clé</h4>
            <p className="text-amber-800/90 leading-relaxed text-sm">
              Toute la difficulté consiste à intervenir <span className="font-bold">ni trop tôt</span> (gaspillage de pièces encore bonnes) <span className="font-bold">ni trop tard</span> (panne subie). C'est précisément ce compromis que la surveillance vibratoire permet d'optimiser.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    part: "Rappel et principes de la vibration",
    title: "2. Les types de maintenance",
    visualType: "none",
    content: (
      <div className="w-full space-y-12 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          On distingue classiquement deux grandes familles : la maintenance <strong>corrective</strong> (on agit après la défaillance) et la maintenance <strong>préventive</strong> (on agit avant). La préventive se subdivise elle-même selon la manière dont on déclenche l'intervention.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 relative overflow-hidden group hover:border-slate-300 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200 rounded-bl-full -mr-16 -mt-16 opacity-50 group-hover:bg-slate-300 transition-colors"></div>
            <h4 className="text-xl font-bold text-slate-800 mb-4 relative z-10">Maintenance Corrective</h4>
            <p className="text-slate-600 relative z-10">Intervention exécutée après la détection d'une panne et destinée à remettre un bien dans un état dans lequel il peut accomplir une fonction requise.</p>
          </div>
          
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8 relative overflow-hidden group hover:border-blue-200 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -mr-16 -mt-16 opacity-50 group-hover:bg-blue-200 transition-colors"></div>
            <h4 className="text-xl font-bold text-blue-900 mb-4 relative z-10">Maintenance Préventive</h4>
            <p className="text-blue-800/80 relative z-10">Intervention exécutée à des intervalles prédéterminés ou selon des critères prescrits et destinée à réduire la probabilité de défaillance ou la dégradation du fonctionnement.</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-2xl shadow-sm mt-8 flex gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Lightbulb className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-emerald-900 font-bold uppercase tracking-wider text-xs mb-2">Notre Sujet</h4>
            <p className="text-emerald-800/90 leading-relaxed text-sm">
              L'analyse vibratoire est l'une des principales technologies au service de la maintenance <span className="font-bold underline decoration-emerald-300 decoration-2 underline-offset-4">conditionnelle</span> et <span className="font-bold underline decoration-emerald-300 decoration-2 underline-offset-4">prédictive</span>. Elle « écoute » la machine pour détecter une dégradation naissante avant la panne.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    part: "Rappel et principes de la vibration",
    title: "3. Panne et défaillance",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Dans le langage courant, « panne » et « défaillance » sont employés comme synonymes. En maintenance, ce sont deux choses différentes : l'une est un <strong>événement</strong>, l'autre est un <strong>état</strong>.
        </p>

        <div className="flex flex-col md:flex-row gap-6 mt-10">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h4 className="text-2xl font-black text-slate-800 mb-2">Défaillance</h4>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-widest rounded-full mb-4">L'événement</span>
            <p className="text-slate-500">C'est le moment de bascule, l'événement qui vient altérer le bien.</p>
          </div>
          
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-2xl font-black text-slate-800 mb-2">Panne</h4>
            <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-widest rounded-full mb-4">L'état</span>
            <p className="text-slate-500">C'est l'état qui en résulte. L'équipement ne peut plus assurer sa fonction.</p>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl shadow-sm mt-8 flex gap-4 text-white">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-2">À retenir</h4>
            <p className="text-slate-300 leading-relaxed text-sm">
              On dit : « la défaillance d'un roulement <em>provoque</em> la mise en panne de la pompe ». La défaillance <em>survient</em>, la panne <em>dure</em>.<br/><br/>
              L'objectif de la surveillance vibratoire est de détecter la <strong>dégradation</strong> qui mènera à la défaillance, afin d'agir <em>avant</em> que la machine ne tombe en panne.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    part: "Rappel et principes de la vibration",
    title: "4. Conditionnelle, Monitoring & Prédictive",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Ces trois expressions sont souvent utilisées comme synonymes, ce qui crée une confusion fréquente. Elles décrivent en réalité des notions <strong>complémentaires mais distinctes</strong> : l'une est une activité de mesure, les deux autres sont des stratégies de décision.
        </p>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h4 className="font-bold text-slate-800">Une façon simple de les relier :</h4>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-blue-600 font-black">1</span>
              </div>
              <div>
                <h5 className="text-lg font-bold text-slate-800">Condition Monitoring</h5>
                <p className="text-slate-600 mt-1">Il <strong>mesure</strong> et fournit la donnée sur l'état de santé de la machine.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-emerald-600 font-black">2</span>
              </div>
              <div>
                <h5 className="text-lg font-bold text-slate-800">Maintenance Conditionnelle</h5>
                <p className="text-slate-600 mt-1">Elle <strong>réagit</strong> à un seuil d'alarme prédéfini (décision sur l'état présent).</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-indigo-600 font-black">3</span>
              </div>
              <div>
                <h5 className="text-lg font-bold text-slate-800">Maintenance Prédictive</h5>
                <p className="text-slate-600 mt-1">Elle <strong>anticipe</strong> grâce à la tendance d'évolution (décision sur l'état futur).</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 font-medium text-center">
              On peut faire du condition monitoring sans faire de prédictif ; mais on ne peut pas faire de prédictif sans condition monitoring.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl mt-8">
          <p className="text-blue-900 leading-relaxed font-medium">
            L'analyse vibratoire se situe au cœur de ces trois notions : c'est une <strong>technique de condition monitoring</strong> qui alimente aussi bien la maintenance <strong>conditionnelle</strong> (alarmes sur seuils) que la maintenance <strong>prédictive</strong> (analyse de tendance et pronostic).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    part: "Rappel et principes de la vibration",
    title: "5. La courbe P-F et l'intervalle P-F",
    visualType: "pf-curve",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          La courbe P-F est l'outil conceptuel qui justifie l'intérêt de la maintenance conditionnelle. Elle décrit la <strong>dégradation d'un composant dans le temps</strong>, depuis l'apparition d'un défaut jusqu'à la défaillance fonctionnelle.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white border-t-4 border-t-emerald-500 rounded-2xl p-6 shadow-sm hover:-translate-y-1 transition-transform relative">
            <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Le Point P</div>
            <h4 className="font-bold text-slate-800 mb-2 mt-4">Défaillance Potentielle</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instant où la dégradation devient <span className="font-semibold text-emerald-600">détectable</span> par une technique de surveillance. La machine fonctionne encore normalement, mais « quelque chose » a commencé.
            </p>
          </div>

          <div className="bg-white border-t-4 border-t-red-500 rounded-2xl p-6 shadow-sm hover:-translate-y-1 transition-transform relative">
            <div className="absolute -top-3 left-6 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Le Point F</div>
            <h4 className="font-bold text-slate-800 mb-2 mt-4">Défaillance Fonctionnelle</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instant où le composant <span className="font-semibold text-red-600">ne remplit plus sa fonction</span> — c'est la défaillance, puis la panne. L'équipement est arrêté.
            </p>
          </div>

          <div className="bg-slate-50 border-t-4 border-t-blue-500 rounded-2xl p-6 shadow-sm hover:-translate-y-1 transition-transform relative">
            <div className="absolute -top-3 left-6 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Intervalle P-F</div>
            <h4 className="font-bold text-slate-800 mb-2 mt-4">La fenêtre d'action</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Le temps qui s'écoule entre P et F. C'est le temps dont dispose l'équipe pour <span className="font-semibold text-blue-600">détecter, diagnostiquer et corriger</span> avant la panne.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    part: "Rappel et principes de la vibration",
    title: "Où se placent les technologies de surveillance ?",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Différentes technologies détectent le défaut à différents moments de la courbe. Plus une technique détecte tôt (près de P), plus l'intervalle P-F utilisable est long.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-widest">
                <th className="py-4 px-6 font-semibold">Technologie</th>
                <th className="py-4 px-6 font-semibold">Stade de détection</th>
                <th className="py-4 px-6 font-semibold">Phénomènes ciblés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-6 font-bold text-emerald-600">Ultrasons / Émission acoustique</td>
                <td className="py-4 px-6 text-slate-600"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold">Le plus précoce</span></td>
                <td className="py-4 px-6 text-sm text-slate-500">Défauts sous surface, micro-impacts, lubrification</td>
              </tr>
              <tr className="hover:bg-blue-50 transition-colors bg-blue-50/30">
                <td className="py-4 px-6 font-bold text-blue-700 flex items-center gap-2">Analyse Vibratoire <AlertCircle className="w-4 h-4 text-blue-500" /></td>
                <td className="py-4 px-6 text-slate-600"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Très précoce</span></td>
                <td className="py-4 px-6 text-sm text-slate-600 font-medium">Surtout via l'enveloppe et la haute fréquence</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-6 font-bold text-slate-700">Analyse d'huile</td>
                <td className="py-4 px-6 text-slate-600"><span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">Précoce à moyen</span></td>
                <td className="py-4 px-6 text-sm text-slate-500">Particules d'usure, contamination</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-6 font-bold text-amber-600">Thermographie Infrarouge</td>
                <td className="py-4 px-6 text-slate-600"><span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-semibold">Tardif</span></td>
                <td className="py-4 px-6 text-sm text-slate-500">Échauffement mécanique ou électrique</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-6 font-bold text-red-600">Bruit et Toucher</td>
                <td className="py-4 px-6 text-slate-600"><span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold">Très tardif (Proche de F)</span></td>
                <td className="py-4 px-6 text-sm text-slate-500">Perceptible par l'opérateur, panne imminente</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 p-6 rounded-2xl shadow-sm flex gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="text-amber-900 font-bold uppercase tracking-wider text-xs mb-2">Règle pratique de surveillance</h4>
            <p className="text-amber-800/90 leading-relaxed text-sm">
              Pour ne pas « rater » le défaut, l'<strong>intervalle de collecte doit être nettement plus court que l'intervalle P-F</strong> — en pratique on vise <strong>la moitié de l'intervalle P-F</strong>. Si l'intervalle P-F est de 2 mois, une collecte mensuelle est nécessaire.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    part: "Rappel et principes de la vibration",
    title: "Principes de la vibration : système M-K-C",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 flex flex-col md:flex-row gap-8 items-center justify-center animate-in fade-in duration-500">
        <div className="flex-1 max-w-sm">
           <svg viewBox="0 0 200 250" className="w-full h-auto drop-shadow-md">
             <rect x="40" y="20" width="120" height="10" fill="#334155" />
             <path d="M 70,30 L 70,50 L 55,60 L 85,80 L 55,100 L 85,120 L 70,130 L 70,160" fill="none" stroke="#3b82f6" strokeWidth="2" />
             <text x="35" y="100" className="text-sm font-bold fill-blue-600">K</text>
             <path d="M 130,30 L 130,80" fill="none" stroke="#0ea5e9" strokeWidth="2" />
             <rect x="120" y="80" width="20" height="30" fill="none" stroke="#0ea5e9" strokeWidth="2" />
             <path d="M 130,110 L 130,160" fill="none" stroke="#0ea5e9" strokeWidth="2" />
             <line x1="115" y1="100" x2="145" y2="100" stroke="#0ea5e9" strokeWidth="2" />
             <text x="155" y="100" className="text-sm font-bold fill-sky-600">C</text>
             <rect x="50" y="160" width="100" height="50" rx="4" fill="#1e3a8a" />
             <text x="100" y="190" textAnchor="middle" className="text-xl font-bold fill-white">M</text>
           </svg>
        </div>
        <div className="flex-1 space-y-4 text-[0.95rem]">
           <p className="text-slate-600 mb-6">Mouvement de va-et-vient autour d'un équilibre. La machine vibre en <strong>réponse (effet)</strong> à une <strong>force (cause)</strong> — l'amplitude dépend aussi des propriétés du système.</p>
           <div className="space-y-4">
              <p><strong className="text-[#10416B] font-serif text-xl mr-3">M</strong> <strong className="text-slate-700">Masse</strong> <span className="text-slate-500">= Poids / g.</span></p>
              <p><strong className="text-[#10416B] font-serif text-xl mr-3">K</strong> <strong className="text-slate-700">Raideur</strong> <span className="text-slate-500">= Force / déplacement.</span></p>
              <p><strong className="text-[#10416B] font-serif text-xl mr-3">C</strong> <strong className="text-slate-700">Amortissement</strong> <span className="text-slate-500">= Force / vitesse (dissipe l'énergie en chaleur).</span></p>
           </div>
           <div className="mt-8 bg-[#EEF7F6] border-l-4 border-[#3FA89E] p-4 rounded-r text-sm text-slate-700 shadow-sm">
              Ordre de grandeur : un cheveu humain ≈ <strong>130 µm (5 mils)</strong> — déjà inacceptable sur une turbine.
           </div>
        </div>
      </div>
    )
  },
  {
    id: 10,
    part: "Rappel et principes de la vibration",
    title: "Qu'est-ce que la vibration ?",
    visualType: "waveform",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          C'est un <strong>mouvement de va-et-vient (oscillation)</strong> d'un corps autour de sa position d'équilibre. Dans l'industrie, les machines vibrent en <strong>réponse (effet)</strong> à une ou plusieurs <strong>forces (cause)</strong>.
        </p>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 shadow-sm my-8 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex-1">
              <span className="block text-3xl font-black text-blue-900 mb-2">LA FORCE</span>
              <span className="text-blue-700/80 font-medium uppercase tracking-widest text-sm">La Cause (ex: Balourd)</span>
            </div>
            
            <div className="text-blue-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            
            <div className="flex-1">
              <span className="block text-3xl font-black text-indigo-900 mb-2">LA VIBRATION</span>
              <span className="text-indigo-700/80 font-medium uppercase tracking-widest text-sm">La Réponse (le Mouvement)</span>
            </div>
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les valeurs de vibration ne dépendent donc pas seulement de la force, mais aussi des <strong>propriétés du système mécanique</strong> (masse, rigidité, amortissement).
        </p>
        
        <div className="bg-slate-50 border-l-4 border-slate-300 p-5 rounded-r-xl mt-8">
          <p className="text-slate-600 italic">
            Le mouvement vibratoire le plus simple est une <strong>onde sinusoïdale</strong> (mouvement oscillatoire pur), comme le balancier d'une horloge.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 11,
    part: "Rappel et principes de la vibration",
    title: "Période et Fréquence",
    visualType: "waveform",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les deux caractéristiques principales d'un signal vibratoire sont la <strong>fréquence</strong> (à quelle vitesse ça vibre) et l'<strong>amplitude</strong> (à quel point ça vibre).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white border-2 border-emerald-100 rounded-2xl p-8 text-center shadow-sm hover:border-emerald-500 transition-colors group">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black text-emerald-600">T</span>
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">La Période (T)</h4>
            <p className="text-slate-600 mb-4">La durée d'un cycle complet de vibration.</p>
            <span className="inline-block px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg">Secondes par cycle</span>
          </div>

          <div className="bg-white border-2 border-blue-100 rounded-2xl p-8 text-center shadow-sm hover:border-blue-500 transition-colors group">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black text-blue-600">F</span>
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">La Fréquence (F)</h4>
            <p className="text-slate-600 mb-4">Le nombre de cycles par unité de temps.</p>
            <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg">Hertz (Hz) ou CPM</span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl shadow-sm mt-8 flex items-center justify-between text-white">
          <div className="text-center w-full">
            <h4 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-2">Relation Fondamentale</h4>
            <p className="text-3xl font-black font-mono mt-2 tracking-widest">
              F = 1 / T
            </p>
          </div>
        </div>

        <p className="text-slate-600 italic text-center mt-6">
          En analyse de machines, on exprime souvent la fréquence en <strong>CPM</strong> (cycles par minute), pratique pour la relier directement à la vitesse de rotation en tr/min : <span className="font-bold text-slate-800">1 Hz = 60 CPM</span>.
        </p>
      </div>
    ),
  },
  {
    id: 12,
    part: "Rappel et principes de la vibration",
    title: "Classification des fréquences : les « ordres »",
    visualType: "waveform",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500 text-[0.95rem]">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          En analyse vibratoire, on rapporte presque toujours les fréquences à la <strong className="text-slate-900 font-bold">vitesse de rotation</strong> de l'arbre, notée <strong className="text-slate-900 font-bold">1X</strong>. C'est la clé du diagnostic : chaque défaut génère de l'énergie à des multiples ou sous-multiples caractéristiques de 1X.
        </p>

        <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-sm mt-6">
          <thead>
            <tr className="bg-[#10416B] text-white">
              <th className="py-3 px-4 font-bold border-r border-[#1e4e7c] w-1/4">Catégorie</th>
              <th className="py-3 px-4 font-bold border-r border-[#1e4e7c] w-1/2">Définition</th>
              <th className="py-3 px-4 font-bold w-1/4">Exemples</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 border-b border-slate-200 text-slate-700">
            <tr className="bg-white hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-bold">Synchrone (1X)</td>
              <td className="py-3 px-4">Identique à la vitesse du rotor (« 1 fois la vitesse »).</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-500">1X</td>
            </tr>
            <tr className="bg-slate-50 hover:bg-slate-100 transition-colors">
              <td className="py-3 px-4 font-bold">Non-synchrone</td>
              <td className="py-3 px-4">Toute fréquence sauf 1X.</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-500">BPFO, BPFI...</td>
            </tr>
            <tr className="bg-white hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-bold">Sous-synchrone</td>
              <td className="py-3 px-4">Inférieure à 1X.</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-500">½X, ⅓X, 0,48X...</td>
            </tr>
            <tr className="bg-slate-50 hover:bg-slate-100 transition-colors">
              <td className="py-3 px-4 font-bold">Super-synchrone</td>
              <td className="py-3 px-4">Supérieure à 1X.</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-500">1,6X, 5/2X...</td>
            </tr>
            <tr className="bg-white hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-bold">
                Subharmoniques <span className="font-normal text-slate-500">(sous-ordres)</span>
              </td>
              <td className="py-3 px-4">Inférieure à 1X, rapport entier avec 1 au numérateur.</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-500">½X, ⅓X</td>
            </tr>
            <tr className="bg-slate-50 hover:bg-slate-100 transition-colors">
              <td className="py-3 px-4 font-bold">
                Superharmoniques <span className="font-normal text-slate-500">(ordres)</span>
              </td>
              <td className="py-3 px-4">Multiple entier de 1X.</td>
              <td className="py-3 px-4 font-mono text-sm text-slate-500">2X, 3X, 4X...</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  },
  {
    id: 13,
    part: "Rappel et principes de la vibration",
    title: "Amplitude : crête, RMS, facteur de crête, kurtosis",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500 text-[0.95rem]">
        <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-[#10416B] text-white">
              <th className="py-3 px-4 font-bold border-r border-[#1e4e7c]">Descripteur</th>
              <th className="py-3 px-4 font-bold border-r border-[#1e4e7c]">Définition</th>
              <th className="py-3 px-4 font-bold">Sinusoïde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 border-b border-slate-200">
            <tr className="bg-white"><td className="py-3 px-4 font-bold text-[#10416B]">Crête</td><td className="py-3 px-4 text-slate-600">Valeur max / zéro.</td><td className="py-3 px-4 font-serif text-slate-600">Pk</td></tr>
            <tr className="bg-slate-50"><td className="py-3 px-4 font-bold text-[#10416B]">Crête-à-crête</td><td className="py-3 px-4 text-slate-600">Excursion totale.</td><td className="py-3 px-4 font-serif text-slate-600">2×Pk</td></tr>
            <tr className="bg-white"><td className="py-3 px-4 font-bold text-[#3FA89E]">RMS (efficace)</td><td className="py-3 px-4 text-slate-600">Racine moy. des carrés — énergie.</td><td className="py-3 px-4 font-serif text-slate-600">0,707×Pk</td></tr>
            <tr className="bg-slate-50"><td className="py-3 px-4 font-bold text-[#10416B]">Moyenne redressée</td><td className="py-3 px-4 text-slate-600">Moyenne de |valeur|.</td><td className="py-3 px-4 font-serif text-slate-600">0,637×Pk</td></tr>
          </tbody>
        </table>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-[#FAF8ED] border border-[#E8E1C5] p-5 rounded">
            <h5 className="text-[10px] font-bold text-yellow-700 tracking-wider uppercase mb-1">Facteur de crête</h5>
            <h4 className="text-xl font-bold text-[#10416B] mb-2">Crête / RMS</h4>
            <p className="text-slate-600 text-sm">Sinusoïde : 1,41 - <strong>&gt;3-4</strong> : impacts (roulement, engrenage, jeu).</p>
          </div>
          <div className="bg-[#EEF7F6] border border-[#BDE0DB] p-5 rounded">
            <h5 className="text-[10px] font-bold text-[#3FA89E] tracking-wider uppercase mb-1">Kurtosis</h5>
            <h4 className="text-xl font-bold text-[#10416B] mb-2">Moment statistique d'ordre 4</h4>
            <p className="text-slate-600 text-sm">Sain ≈ 3 - <strong>&gt;4</strong> : impacts. Robuste, peu sensible vitesse/charge.</p>
          </div>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r text-sm text-slate-700 shadow-sm mt-4">
          <strong className="text-red-900">True-RMS vs dérivé :</strong> l'ISO exige la vitesse RMS <strong>vraie</strong>. Un RMS dérivé de la crête (×0,707) est faux dès qu'il y a des impacts.
        </div>
      </div>
    )
  },
  {
    id: 14,
    part: "Rappel et principes de la vibration",
    title: "Décibels, unités et notion d'ordres",
    visualType: "none",
    content: (
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500 text-[0.9rem]">
        <div className="space-y-6">
          <div className="bg-[#FAF8ED] border border-[#E8E1C5] p-4 rounded">
             <h5 className="text-[10px] font-bold text-yellow-700 tracking-wider uppercase mb-1">Échelle des décibels</h5>
             <h4 className="text-xl font-bold text-[#10416B] mb-1 font-serif">dB = 20·log10(A/Aréf)</h4>
             <p className="text-slate-500 text-xs">+6dB = ×2 · +20dB = ×10 · +40dB = ×100</p>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            L'échelle log « écrase » les grands pics et révèle le bas du spectre : indispensable pour voir une BPFO naissante 100× plus petite que le 1X.
          </p>
          <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#10416B] text-white">
                <th className="py-2 px-3 font-bold border-r border-[#1e4e7c]">Grandeur</th><th className="py-2 px-3 font-bold border-r border-[#1e4e7c]">Métrique</th><th className="py-2 px-3 font-bold">Impérial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-200">
              <tr className="bg-white"><td className="py-2 px-3 text-slate-700 font-medium">Déplacement</td><td className="py-2 px-3 text-slate-600">µm</td><td className="py-2 px-3 text-slate-600">mils (25,4µm)</td></tr>
              <tr className="bg-slate-50"><td className="py-2 px-3 text-slate-700 font-medium">Vitesse</td><td className="py-2 px-3 text-slate-600">mm/s</td><td className="py-2 px-3 text-slate-600">ips (25,4mm/s)</td></tr>
              <tr className="bg-white"><td className="py-2 px-3 text-slate-700 font-medium">Accélération</td><td className="py-2 px-3 text-slate-600">m/s²</td><td className="py-2 px-3 text-slate-600">g (9,81 m/s²)</td></tr>
              <tr className="bg-slate-50"><td className="py-2 px-3 text-slate-700 font-medium">Fréquence</td><td className="py-2 px-3 text-slate-600">Hz</td><td className="py-2 px-3 text-slate-600">CPM (1Hz=60CPM)</td></tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-6">
          <h4 className="font-bold text-[#10416B] text-base">La notion d'ordres — approfondissement</h4>
          <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#10416B] text-white">
                <th className="py-2 px-3 font-bold border-r border-[#1e4e7c] w-1/3">Terme</th><th className="py-2 px-3 font-bold">Signification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-200">
              <tr className="bg-white"><td className="py-3 px-3 font-bold text-slate-800">Synchrone</td><td className="py-3 px-3 text-slate-600 leading-tight">Multiple entier (1X,2X,3X) — balourd, désalignement, jeu, engrènement.</td></tr>
              <tr className="bg-slate-50"><td className="py-3 px-3 font-bold text-slate-800">Sous-synchrone</td><td className="py-3 px-3 text-slate-600 leading-tight">&lt;1X (oil whirl 0,42X, ½X frottement).</td></tr>
              <tr className="bg-white"><td className="py-3 px-3 font-bold text-slate-800">Non-synchrone</td><td className="py-3 px-3 text-slate-600 leading-tight">Multiple non entier (roulements : BPFO, BPFI).</td></tr>
            </tbody>
          </table>
          <div className="bg-[#EEF7F6] border-l-4 border-[#3FA89E] p-3 rounded-r text-sm text-slate-700 shadow-sm mt-4">
             <strong className="text-[#10416B]">Order tracking :</strong> sur VFD, un tachymètre accroche l'analyse à la rotation ; le spectre en ordres évite que les raies « glissent » avec la vitesse.
          </div>
        </div>
      </div>
    )
  },
  {
    id: 15,
    part: "Rappel et principes de la vibration",
    title: "Unités et conversions",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Il est impératif de maîtriser les unités de mesure pour analyser correctement un signal et se référer aux normes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white border-t-4 border-t-blue-500 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <h4 className="font-bold text-slate-800 mb-2">1. Déplacement</h4>
            <div className="text-2xl font-black text-blue-600 mb-2">mils ou µm</div>
            <p className="text-sm text-slate-600">
              Mesure la distance totale du mouvement. Historiquement utilisé (Peak-to-Peak). 
              <br/><br/>
              <span className="font-mono text-xs bg-slate-100 p-1 rounded">1 mil = 25.4 µm</span>
            </p>
          </div>

          <div className="bg-white border-t-4 border-t-emerald-500 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform md:-translate-y-2">
            <h4 className="font-bold text-slate-800 mb-2">2. Vitesse (Vélocité)</h4>
            <div className="text-2xl font-black text-emerald-600 mb-2">mm/s ou in/s</div>
            <p className="text-sm text-slate-600">
              C'est le <strong>meilleur indicateur de sévérité globale</strong> et de fatigue. La norme ISO 10816 se base sur le RMS de la vitesse.
              <br/><br/>
              <span className="font-mono text-xs bg-slate-100 p-1 rounded">1 in/s = 25.4 mm/s</span>
            </p>
          </div>

          <div className="bg-white border-t-4 border-t-amber-500 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <h4 className="font-bold text-slate-800 mb-2">3. Accélération</h4>
            <div className="text-2xl font-black text-amber-600 mb-2">g ou m/s²</div>
            <p className="text-sm text-slate-600">
              Directement mesurée par le capteur. Très sensible aux hautes fréquences (impacts, roulements).
              <br/><br/>
              <span className="font-mono text-xs bg-slate-100 p-1 rounded">1 g = 9.81 m/s²</span>
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 16,
    part: "Quiz 1",
    title: "Test de Connaissances - Partie I",
    visualType: "quiz",
    quizData: {
      timeLimitSeconds: 300,
      questions: [
        { id: "q1", question: "La vibration est définie par 3 paramètres fondamentaux. Lesquels ?", options: [
            { id: "a", text: "Vitesse, Pression, Température", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Amplitude, Fréquence, Phase", isCorrect: true, explanation: "Correct ! L'amplitude indique la sévérité, la fréquence identifie la source, la phase identifie le mode de déformation." }
        ]},
        { id: "q2", question: "Quelle unité est utilisée pour les très basses fréquences (< 10 Hz) ?", options: [
            { id: "a", text: "Accélération (g)", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Déplacement (μm ou mils)", isCorrect: true, explanation: "Correct ! Aux basses fréquences, le déplacement est l'indicateur le plus fort." }
        ]},
        { id: "q3", question: "La norme ISO 10816 se base principalement sur quelle mesure ?", options: [
            { id: "a", text: "La Vitesse RMS en mm/s", isCorrect: true, explanation: "Correct ! La vitesse RMS est proportionnelle à la fatigue." },
            { id: "b", text: "L'Accélération Crête en g", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q4", question: "Sur un spectre, l'axe horizontal représente :", options: [
            { id: "a", text: "Le temps", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "La fréquence", isCorrect: true, explanation: "Correct ! Un spectre montre l'amplitude en fonction de la fréquence." }
        ]},
        { id: "q5", question: "L'amplitude Crête-à-Crête (Peak-to-Peak) est utilisée surtout pour :", options: [
            { id: "a", text: "La Vitesse", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Le Déplacement", isCorrect: true, explanation: "Correct ! On exprime le déplacement des arbres en crête-à-crête." }
        ]},
        { id: "q6", question: "Pour un moteur tournant à 1500 tr/min, que vaut 1X en Hz ?", options: [
            { id: "a", text: "15 Hz", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "25 Hz", isCorrect: true, explanation: "Correct ! 1500 / 60 = 25 Hz." }
        ]},
        { id: "q7", question: "Qu'est-ce que la valeur RMS ?", options: [
            { id: "a", text: "La valeur absolue maximale", isCorrect: false, explanation: "Faux. C'est la valeur Peak." },
            { id: "b", text: "Root Mean Square (Énergie efficace du signal)", isCorrect: true, explanation: "Correct !" }
        ]},
        { id: "q8", question: "Pour une onde sinusoïdale pure, la relation RMS / Peak est :", options: [
            { id: "a", text: "RMS = Peak × 0.707", isCorrect: true, explanation: "Correct ! Uniquement valable pour un sinus pur." },
            { id: "b", text: "RMS = Peak × 1.414", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q9", question: "L'Analyse Spectrale (FFT) transforme :", options: [
            { id: "a", text: "Le domaine fréquentiel en domaine temporel", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Le domaine temporel en domaine fréquentiel", isCorrect: true, explanation: "Correct !" }
        ]},
        { id: "q10", question: "L'Accélération met en évidence :", options: [
            { id: "a", text: "Les basses fréquences", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Les hautes fréquences", isCorrect: true, explanation: "Correct ! Roulements, engrenages, chocs." }
        ]}
      ]
    },
    content: ( <div className="hidden"></div> ),
  },
  {
    id: 17,
    part: "Partie II",
    title: "Acquisition, capteurs & seuils d'alarme",
    visualType: "none",
    isCover: true,
    content: (
      <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <p className="text-xl md:text-2xl font-light text-blue-100/80 leading-relaxed text-center max-w-3xl mt-8">
          Comment mesurer correctement la vibration ? Le choix du capteur, son montage, son positionnement, 
          et l'établissement des seuils de sévérité selon les normes internationales.
        </p>
        <div className="mt-12 w-16 h-1 bg-emerald-500 rounded-full"></div>
      </div>
    ),
  },
  {
    id: 18,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "Capteurs, montage et positionnement",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500 text-[0.9rem]">
        <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-[#10416B] text-white">
              <th className="py-3 px-4 font-bold border-r border-[#1e4e7c]">Capteur</th>
              <th className="py-3 px-4 font-bold border-r border-[#1e4e7c]">Principe & mesure</th>
              <th className="py-3 px-4 font-bold">Usage typique</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 border-b border-slate-200">
            <tr className="bg-white"><td className="py-3 px-4 font-bold text-[#3FA89E]">Accéléromètre</td><td className="py-3 px-4 text-slate-600">Effet piézoélectrique : F=m·a. Large bande, robuste.</td><td className="py-3 px-4 text-slate-600">Le plus courant : HF (roulements, engrenages).</td></tr>
            <tr className="bg-slate-50"><td className="py-3 px-4 font-bold text-slate-700">Vélocimètre</td><td className="py-3 px-4 text-slate-600">Mesure directe de la vitesse vibratoire.</td><td className="py-3 px-4 text-slate-600">Sévérité BF/MF (ISO 10816).</td></tr>
            <tr className="bg-white"><td className="py-3 px-4 font-bold text-slate-700">Proximité</td><td className="py-3 px-4 text-slate-600">Sans contact : déplacement relatif arbre/palier.</td><td className="py-3 px-4 text-slate-600">Paliers lisses (turbines, gros compresseurs).</td></tr>
          </tbody>
        </table>
        
        <div className="flex flex-col md:flex-row gap-6 items-stretch justify-between h-48">
           <div className="flex-1 bg-slate-50 p-5 rounded-lg border border-slate-200 flex flex-col justify-start">
              <p className="text-[0.95rem] text-slate-700 leading-relaxed">
                 <strong>Deux familles d'accéléromètres :</strong> <strong className="text-[#10416B]">IEPE/ICP®</strong> (électronique intégrée, standard portable) · <strong>sortie charge</strong> (sans électronique, très hautes températures).
              </p>
           </div>
           <div className="flex-[1.5] bg-white flex justify-center items-center">
              <svg viewBox="0 0 300 200" className="w-full h-full max-w-sm">
                 <rect x="50" y="140" width="200" height="20" rx="4" fill="#cbd5e1" />
                 <rect x="70" y="90" width="160" height="50" rx="4" fill="#10416B" />
                 <line x1="70" y1="115" x2="150" y2="115" stroke="#3b82f6" strokeWidth="2" />
                 <line x1="150" y1="90" x2="150" y2="40" stroke="#10b981" strokeWidth="4" />
                 <text x="160" y="55" className="text-xl font-bold fill-[#10b981]">V</text>
                 <line x1="70" y1="115" x2="30" y2="115" stroke="#3b82f6" strokeWidth="4" />
                 <text x="45" y="105" className="text-xl font-bold fill-[#3b82f6]">H</text>
                 <line x1="230" y1="115" x2="270" y2="115" stroke="#ef4444" strokeWidth="4" />
                 <text x="245" y="105" className="text-xl font-bold fill-[#ef4444]">A</text>
                 <text x="150" y="180" textAnchor="middle" className="text-xs fill-slate-500">3 directions : H/V radiales, A axiale.</text>
              </svg>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 19,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "Galerie Visuelle : Les 3 Familles de Capteurs",
    visualType: "none",
    content: (
      <div className="w-full flex flex-col justify-center h-full animate-in fade-in duration-500">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Accelerometer */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md flex flex-col items-center justify-between hover:shadow-lg transition-shadow">
              <h4 className="font-bold text-[#3FA89E] mb-6 text-center text-lg h-12">Accéléromètre <br/><span className="text-sm text-slate-500">(Piézoélectrique IEPE)</span></h4>
              <svg viewBox="0 0 100 150" className="w-24 h-auto mb-6 drop-shadow-md">
                 <rect x="40" y="10" width="20" height="15" fill="#94a3b8" />
                 <rect x="45" y="0" width="10" height="10" fill="#cbd5e1" />
                 <path d="M 30,25 L 70,25 L 75,35 L 75,100 L 25,100 L 25,35 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
                 <rect x="20" y="100" width="60" height="15" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
                 <line x1="35" y1="100" x2="35" y2="115" stroke="#94a3b8" strokeWidth="1" />
                 <line x1="65" y1="100" x2="65" y2="115" stroke="#94a3b8" strokeWidth="1" />
                 <rect x="40" y="115" width="20" height="10" fill="#475569" />
                 <text x="50" y="60" textAnchor="middle" className="text-[9px] fill-slate-500 font-mono font-bold tracking-widest">100 mV/g</text>
                 <line x1="30" y1="80" x2="70" y2="80" stroke="#cbd5e1" strokeWidth="1" />
              </svg>
              <p className="text-sm text-slate-600 text-center border-t border-slate-100 pt-4">Le standard industriel par excellence. Compact, extrêmement robuste (pas de pièces mobiles), excellente réponse en haute fréquence (roulements/engrenages). Se fixe par aimant ou goujon.</p>
           </div>

           {/* Velocimeter */}
           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-md flex flex-col items-center justify-between hover:shadow-lg transition-shadow">
              <h4 className="font-bold text-[#10416B] mb-6 text-center text-lg h-12">Vélocimètre <br/><span className="text-sm text-slate-500">(Électrodynamique)</span></h4>
              <svg viewBox="0 0 100 150" className="w-28 h-auto mb-6 drop-shadow-md">
                 <path d="M 50,0 Q 60,10 50,20" fill="none" stroke="#334155" strokeWidth="4" />
                 <rect x="20" y="20" width="60" height="90" rx="5" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                 <rect x="25" y="25" width="50" height="80" rx="3" fill="#475569" />
                 <rect x="15" y="110" width="70" height="10" fill="#94a3b8" />
                 <line x1="20" y1="50" x2="80" y2="50" stroke="#1e293b" strokeWidth="2" />
                 <line x1="20" y1="80" x2="80" y2="80" stroke="#1e293b" strokeWidth="2" />
                 <text x="50" y="68" textAnchor="middle" className="text-[8px] fill-slate-300 font-mono">COIL</text>
              </svg>
              <p className="text-sm text-slate-600 text-center border-t border-slate-200 pt-4">Mesure directement la vitesse via une bobine mobile interne. Lourd et massif. Très performant pour isoler les basses fréquences, mais sensible à l'usure mécanique au fil des années.</p>
           </div>

           {/* Proximity Probe */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md flex flex-col items-center justify-between hover:shadow-lg transition-shadow">
              <h4 className="font-bold text-slate-700 mb-6 text-center text-lg h-12">Sonde de Proximité <br/><span className="text-sm text-slate-500">(Courants de Foucault)</span></h4>
              <svg viewBox="0 0 150 150" className="w-32 h-auto mb-6 drop-shadow-md">
                 <rect x="70" y="20" width="20" height="110" fill="#cbd5e1" opacity="0.3" />
                 <rect x="60" y="60" width="10" height="20" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
                 <rect x="90" y="60" width="10" height="20" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
                 <rect x="30" y="65" width="80" height="10" fill="#e2e8f0" />
                 <path d="M 30,65 L 110,65 M 30,67 L 110,67 M 30,69 L 110,69 M 30,71 L 110,71 M 30,73 L 110,73 M 30,75 L 110,75" stroke="#94a3b8" strokeWidth="1" />
                 <rect x="25" y="66" width="5" height="8" fill="#1e293b" />
                 <path d="M 110,70 Q 130,70 140,100" fill="none" stroke="#1e293b" strokeWidth="3" />
                 <rect x="0" y="20" width="20" height="100" fill="#334155" />
                 <path d="M 22,70 L 25,70" stroke="#ef4444" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                 <text x="12" y="73" className="text-[7px] fill-red-500 font-mono font-bold">GAP</text>
                 <text x="10" y="15" className="text-[8px] fill-slate-500 font-bold">Arbre</text>
                 <text x="75" y="15" className="text-[8px] fill-slate-400 font-bold">Carter</text>
              </svg>
              <p className="text-sm text-slate-600 text-center border-t border-slate-100 pt-4">Mesure le déplacement relatif de l'arbre <strong>sans contact</strong> physique. Elle est directement vissée à travers le carter. Indispensable pour la surveillance des grands paliers lisses.</p>
           </div>
        </div>
      </div>
    ),
  },
  {
    id: 20,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "10. Technologie capteurs : L'accéléromètre",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          L'accéléromètre est le roi de la surveillance vibratoire. Il est robuste, couvre une large plage de fréquences (de 1 Hz à plus de 10 kHz) et résiste à la température.
        </p>

        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">?</span>
              Comment ça marche ?
            </h4>
            <ul className="space-y-4 text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Il contient un cristal <strong>piézoélectrique</strong> pris en sandwich avec une masse sismique.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Quand la machine vibre, la masse comprime le cristal.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Le cristal génère une <strong>charge électrique</strong> proportionnelle à l'accélération (Effet Piézo).</span>
              </li>
            </ul>
          </div>

          <div className="flex-1 bg-slate-800 rounded-2xl p-8 shadow-sm text-white">
            <h4 className="text-xl font-bold text-white mb-6">Sensibilité classique</h4>
            <div className="bg-slate-700 p-6 rounded-xl text-center border border-slate-600">
              <div className="text-3xl font-mono font-black text-emerald-400 mb-2">100 mV/g</div>
              <p className="text-slate-300 text-sm">Le standard industriel pour les machines tournantes courantes.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-700 p-4 rounded-xl text-center border border-slate-600">
                <div className="text-lg font-mono font-bold text-blue-400">10 mV/g</div>
                <p className="text-slate-400 text-xs">Pour hautes fréquences / chocs (engrenages lourds)</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-xl text-center border border-slate-600">
                <div className="text-lg font-mono font-bold text-amber-400">500 mV/g</div>
                <p className="text-slate-400 text-xs">Pour basses fréquences (éoliennes, agitateurs lents)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 21,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "Sondes de proximité et autres capteurs",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="bg-white border-t-4 border-t-indigo-500 border-x border-b border-slate-100 rounded-b-2xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 text-lg mb-2">Sonde de Proximité (Eddy Current)</h4>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Mesure le déplacement relatif entre l'arbre en rotation et le palier lisse. Indispensable pour les turbomachines (turbines, gros compresseurs).
            </p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Mesure statique : position de l'arbre (Gap)</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Mesure dynamique : vibration de l'arbre</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Montage permanent obligatoire (percé dans le palier)</li>
            </ul>
          </div>
          
          <div className="bg-white border-t-4 border-t-amber-500 border-x border-b border-slate-100 rounded-b-2xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 text-lg mb-2">Vélocimètre</h4>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Délivre un signal directement proportionnel à la vitesse vibratoire. Utilisé historiquement, il est aujourd'hui remplacé par les accéléromètres avec intégration.
            </p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Très peu sensible aux hautes fréquences</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Pièces mobiles internes (usure possible)</li>
            </ul>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 p-6 rounded-2xl shadow-sm mt-8 flex gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="text-amber-900 font-bold uppercase tracking-wider text-xs mb-2">Cas des paliers lisses vs roulements</h4>
            <p className="text-amber-800/90 leading-relaxed text-sm">
              Sur un palier à roulement, la force se transmet au carter : on utilise un <strong>accéléromètre</strong> sur le carter.<br/>
              Sur un palier lisse, le film d'huile amortit la vibration : on doit mesurer le mouvement direct de l'arbre avec une <strong>sonde de proximité</strong>.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 22,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "11. Le montage du capteur : méthodes & Fmax",
    visualType: "sensor-mounting",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          La façon dont le capteur est fixé à la machine a un impact énorme sur les données recueillies, particulièrement en <strong>haute fréquence</strong>. Plus le montage est "mou", plus on perd les signaux rapides.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-widest">
                <th className="py-4 px-6 font-semibold">Type de montage</th>
                <th className="py-4 px-6 font-semibold">Rigidité</th>
                <th className="py-4 px-6 font-semibold">Fmax (Fréquence max)</th>
                <th className="py-4 px-6 font-semibold">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-emerald-600 flex items-center gap-2">Goujon taraudé</td>
                <td className="py-4 px-6 text-slate-600">Maximale</td>
                <td className="py-4 px-6 font-mono font-bold text-emerald-600">~ 20 000 Hz</td>
                <td className="py-4 px-6 text-sm text-slate-500">Permanent, Standard OCP MS</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-blue-600 flex items-center gap-2">Colle dure (Époxy)</td>
                <td className="py-4 px-6 text-slate-600">Excellente</td>
                <td className="py-4 px-6 font-mono font-bold text-blue-600">~ 15 000 Hz</td>
                <td className="py-4 px-6 text-sm text-slate-500">Alternative au perçage</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-amber-600 flex items-center gap-2">Base magnétique</td>
                <td className="py-4 px-6 text-slate-600">Moyenne</td>
                <td className="py-4 px-6 font-mono font-bold text-amber-600">~ 5 000 Hz</td>
                <td className="py-4 px-6 text-sm text-slate-500">Mesures portables (MobiVib)</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-red-600 flex items-center gap-2">Pointe de touche</td>
                <td className="py-4 px-6 text-slate-600">Très faible</td>
                <td className="py-4 px-6 font-mono font-bold text-red-600">~ 1 000 Hz</td>
                <td className="py-4 px-6 text-sm text-slate-500">Zones inaccessibles. À éviter.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-red-50 border border-red-200/60 p-6 rounded-2xl shadow-sm mt-8 flex gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h4 className="text-red-900 font-bold uppercase tracking-wider text-xs mb-2">Erreur classique</h4>
            <p className="text-red-800/90 leading-relaxed text-sm">
              Utiliser une base magnétique ou une pointe pour diagnostiquer un roulement rapide. Les fréquences d'impacts d'un roulement sont très hautes (Enveloppe &gt; 5kHz). <strong>Un mauvais montage va "filtrer" ce signal et cacher le défaut.</strong>
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 23,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "Où placer le capteur ? Directions H / V / A",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500 text-[0.95rem]">
        <div className="flex flex-col md:flex-row gap-12 items-start">
           <div className="flex-1 space-y-4">
              <h4 className="font-bold text-[#10416B] text-base mb-2">Machine horizontale</h4>
              <svg viewBox="0 0 200 120" className="w-full max-w-[240px] h-auto mb-4">
                 <rect x="30" y="90" width="140" height="15" rx="2" fill="#cbd5e1" />
                 <rect x="40" y="60" width="120" height="30" rx="4" fill="#10416B" />
                 <line x1="100" y1="60" x2="100" y2="20" stroke="#10b981" strokeWidth="3" />
                 <text x="105" y="35" className="text-sm font-bold fill-[#10b981]">V</text>
                 <line x1="40" y1="75" x2="20" y2="75" stroke="#3b82f6" strokeWidth="3" />
                 <text x="25" y="65" className="text-sm font-bold fill-[#3b82f6]">H</text>
                 <line x1="160" y1="75" x2="190" y2="75" stroke="#ef4444" strokeWidth="3" />
                 <text x="175" y="65" className="text-sm font-bold fill-[#ef4444]">A</text>
              </svg>
              <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-sm">
                 <thead>
                   <tr className="bg-[#10416B] text-white">
                     <th className="py-2 px-3 font-bold border-r border-[#1e4e7c] w-1/4">Dir.</th>
                     <th className="py-2 px-3 font-bold">Défaut révélé</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200 border-b border-slate-200">
                   <tr className="bg-white"><td className="py-2 px-3 font-bold text-[#3b82f6]">H</td><td className="py-2 px-3 text-slate-600">Balourd (souvent le + élevé)</td></tr>
                   <tr className="bg-slate-50"><td className="py-2 px-3 font-bold text-[#10b981]">V</td><td className="py-2 px-3 text-slate-600">Jeu, pied mou (V&gt;H souvent)</td></tr>
                   <tr className="bg-white"><td className="py-2 px-3 font-bold text-[#ef4444]">A</td><td className="py-2 px-3 text-slate-600">Désalignement, arbre tordu</td></tr>
                 </tbody>
              </table>
           </div>
           
           <div className="flex-1 space-y-4">
              <h4 className="font-bold text-[#10416B] text-base mb-2">Pompe verticale — convention</h4>
              <svg viewBox="0 0 200 170" className="w-full max-w-[200px] h-auto mb-4">
                 <rect x="80" y="20" width="40" height="100" rx="4" fill="#10416B" />
                 <line x1="80" y1="50" x2="40" y2="50" stroke="#3b82f6" strokeWidth="3" />
                 <text x="45" y="40" className="text-sm font-bold fill-[#3b82f6]">H</text>
                 <line x1="120" y1="80" x2="160" y2="80" stroke="#3b82f6" strokeWidth="3" />
                 <text x="145" y="70" className="text-sm font-bold fill-[#3b82f6]">H'</text>
                 <line x1="100" y1="120" x2="100" y2="150" stroke="#ef4444" strokeWidth="3" />
                 <text x="105" y="145" className="text-[10px] font-bold fill-[#ef4444]">A (le long de l'arbre)</text>
              </svg>
              <div className="bg-[#EEF7F6] border-l-4 border-[#3FA89E] p-4 rounded-r text-[0.85rem] text-slate-700 shadow-sm mb-2">
                 Arbre vertical → les <strong className="text-[#10416B]">2 radiales sont horizontales</strong> ; <strong className="text-[#10416B]">l'axiale devient verticale</strong>. Repérer d'abord l'axe de l'arbre.
              </div>
              <p className="text-[11px] text-slate-500">Points multiples : numéroter du moteur vers la charge, garder les mêmes repères à chaque ronde.</p>
           </div>
        </div>
      </div>
    )
  },
  {
    id: 24,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "Fautes de montage & problèmes de capteur",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500 text-[0.95rem]">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Un signal douteux vient plus souvent du <strong className="text-[#10416B]">montage ou du capteur</strong> que de la machine. Savoir reconnaître ces artefacts évite de faux diagnostics.
        </p>
        
        <h4 className="font-bold text-[#10416B] text-lg mt-4 mb-2">Les fautes de montage les plus fréquentes</h4>
        <ul className="list-disc pl-5 space-y-2 text-slate-700">
           <li><strong className="text-slate-900">Surface sale / peinture / rouille</strong> → couplage médiocre, perte des HF.</li>
           <li><strong className="text-slate-900">Pas de graisse de couplage</strong> sous le goujon → résonance abaissée.</li>
           <li><strong className="text-slate-900">Aimant sur surface courbe ou mince</strong> → contact ponctuel, résonance parasite.</li>
           <li><strong className="text-slate-900">Câble qui bouge / boucle</strong> → bruit triboélectrique (surtout capteurs à charge).</li>
           <li><strong className="text-slate-900">Point de mesure incohérent</strong> d'une ronde à l'autre → tendance ininterprétable.</li>
        </ul>

        <h4 className="font-bold text-[#10416B] text-lg mt-6 mb-2">Saturation (écrêtage / overload)</h4>
        <p className="text-slate-700">
          Quand le signal dépasse la pleine échelle de l'entrée, il est <strong className="text-slate-900">écrêté</strong> : la forme d'onde est « rabotée » et le spectre se remplit de <strong className="text-slate-900">fausses harmoniques</strong>.
        </p>

        <div className="bg-[#FAF0ED] border-l-4 border-[#C85A32] p-5 rounded-r-xl shadow-sm mt-4">
           <h5 className="text-[10px] font-bold text-[#C85A32] tracking-wider uppercase mb-2">Causes & Remède — Saturation</h5>
           <p className="text-[#A24220] text-sm leading-relaxed">
              <strong className="text-[#8B3416]">Causes :</strong> capteur trop sensible (ex. 500 mV/g) sur machine très vibrante · gamme d'entrée mal réglée · choc mécanique.<br/>
              <strong className="text-[#8B3416]">Remède :</strong> baisser la sensibilité (ex. 100 → 10 mV/g), élargir la gamme/autorange, vérifier la forme d'onde (sommet aplati = écrêtage).
           </p>
        </div>
      </div>
    ),
  },
  {
    id: 25,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "Cas particulier : la Ski-Slope (Théorie)",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500 text-[0.95rem]">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          La <strong className="text-red-500">« Ski-Slope »</strong> (pente de ski) est un artefact de mesure fréquent. Il se manifeste par une élévation exponentielle et artificielle de l'amplitude dans les très basses fréquences du spectre, masquant les vrais signaux.
        </p>
        <div className="bg-slate-50 border-l-4 border-amber-500 p-6 rounded-r-xl shadow-sm">
           <h4 className="font-bold text-slate-800 mb-3">Causes Principales de l'Artefact :</h4>
           <ul className="list-disc pl-5 space-y-2 text-slate-600">
             <li><strong className="text-slate-700">Choc Thermique :</strong> Déplacement rapide du capteur d'un environnement froid vers une machine très chaude.</li>
             <li><strong className="text-slate-700">Montage Lâche (Choc Mécanique) :</strong> Le capteur rebondit ou "claque" sur la surface de mesure. L'impact sature l'amplificateur interne du capteur (surcharge).</li>
             <li><strong className="text-slate-700">Intégration :</strong> Le phénomène est amplifié lors de l'intégration du signal (ex: Accélération vers Vitesse), car l'intégration "booste" mathématiquement les basses fréquences.</li>
           </ul>
        </div>
        <div className="bg-emerald-50 text-emerald-900 p-4 rounded text-sm mt-4">
          <strong>Règle d'or :</strong> Toujours nettoyer la surface, utiliser un aimant de forte puissance et le poser délicatement (en le roulant sur la surface) pour éviter le choc métallique brutal.
        </div>
      </div>
    ),
  },
  {
    id: 26,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "Démo Active : L'effet Ski-Slope en direct",
    visualType: "none",
    content: (
      <SkiSlopeDemo />
    ),
  },
  {
    id: 27,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "14. Types d'alarmes et Seuils ISO",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Pour savoir si une machine va bien ou non, il faut la comparer à une référence. C'est le rôle des <strong>seuils d'alarme</strong> et des normes internationales, notamment la norme <strong>ISO 10816</strong> (récemment remplacée par ISO 20816).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6">
            <div className="text-emerald-700 font-bold mb-2">Alarmes Statistiques</div>
            <p className="text-sm text-emerald-800/80">Basées sur l'historique de la machine elle-même (Moyenne + 2 Écarts-types). C'est la méthode <strong>la plus précise</strong>.</p>
          </div>
          
          <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-6">
            <div className="text-blue-700 font-bold mb-2">Alarmes Constructeur</div>
            <p className="text-sm text-blue-800/80">Basées sur les spécifications OEM de la machine. Souvent conservatrices ou non communiquées.</p>
          </div>
          
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6">
            <div className="text-amber-700 font-bold mb-2">Normes ISO</div>
            <p className="text-sm text-amber-800/80">Basées sur le retour d'expérience mondial. Idéal quand on n'a pas d'historique (démarrage de programme).</p>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl shadow-sm mt-8 text-white">
          <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-3">La Norme ISO 10816 (Vitesse Globale)</h4>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Elle évalue la sévérité vibratoire sur le carter des machines en utilisant la <strong>Vitesse RMS (10 Hz à 1000 Hz)</strong>. Les machines sont classées par taille / puissance (Classes I à IV).
          </p>
          <div className="flex gap-4 mt-4">
            <span className="px-3 py-1 bg-emerald-500 text-white rounded text-xs font-bold">A : Bon (Vert)</span>
            <span className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-bold">B : Acceptable</span>
            <span className="px-3 py-1 bg-amber-500 text-white rounded text-xs font-bold">C : Alerte (Jaune)</span>
            <span className="px-3 py-1 bg-red-500 text-white rounded text-xs font-bold">D : Danger (Rouge)</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 28,
    part: "Acquisition, capteurs & seuils d'alarme",
    title: "Aperçu de la norme ISO 10816",
    visualType: "iso-table",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le graphique interactif ci-contre illustre une version simplifiée de la norme. Notez comment la classification change en fonction de la taille de la machine.
        </p>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4">Les 4 Classes de Machines (ISO 10816)</h4>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="px-2 py-1 bg-slate-100 font-bold rounded text-slate-700">Classe I</span>
              <span>Petites machines (Moteurs électriques jusqu'à 15 kW).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="px-2 py-1 bg-slate-100 font-bold rounded text-slate-700">Classe II</span>
              <span>Machines moyennes (15 kW à 75 kW) sans fondation spéciale.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="px-2 py-1 bg-slate-100 font-bold rounded text-slate-700">Classe III</span>
              <span>Grandes machines (au-dessus de 75 kW) montées sur fondations rigides et lourdes.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="px-2 py-1 bg-slate-100 font-bold rounded text-slate-700">Classe IV</span>
              <span>Grandes machines montées sur fondations souples (turbogénérateurs).</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-slate-50 border-l-4 border-slate-300 p-5 rounded-r-xl">
          <p className="text-slate-600 text-sm">
            <strong>Exemple :</strong> Une vibration de 4.5 mm/s RMS est classée <strong>C (Alerte)</strong> pour un petit moteur (Classe I), mais elle est <strong>B (Acceptable)</strong> pour une grosse machine sur fondation souple (Classe IV).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 29,
    part: "Quiz 2",
    title: "Test de Connaissances - Partie II",
    visualType: "quiz",
    quizData: {
      timeLimitSeconds: 300,
      questions: [
        { id: "q1", question: "Quel capteur nécessite une alimentation électrique externe ?", options: [
            { id: "a", text: "Le capteur de vitesse sismique", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "L'accéléromètre piézoélectrique (ICP/IEPE)", isCorrect: true, explanation: "Correct ! Il intègre un circuit amplificateur." }
        ]},
        { id: "q2", question: "Quelle est la cause d'une réponse de capteur qui 'skit' (glisse) en basse fréquence (effet ski) ?", options: [
            { id: "a", text: "Saturation thermique (Shock thermique)", isCorrect: true, explanation: "Correct ! Un changement de température brusque fait dériver la mesure." },
            { id: "b", text: "Résonance de montage", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q3", question: "La sonde de proximité à Courants de Foucault mesure :", options: [
            { id: "a", text: "Le déplacement relatif de l'arbre", isCorrect: true, explanation: "Correct !" },
            { id: "b", text: "L'accélération absolue du palier", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q4", question: "Le montage par base magnétique d'un accéléromètre :", options: [
            { id: "a", text: "Augmente la Fmax par rapport au goujon", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Diminue la Fmax (limitée vers 5-7 kHz)", isCorrect: true, explanation: "Correct !" }
        ]},
        { id: "q5", question: "Où doit-on placer le capteur pour une bonne mesure ?", options: [
            { id: "a", text: "Sur la tôle ou le capot de protection", isCorrect: false, explanation: "Faux. Toujours sur la partie massive." },
            { id: "b", text: "Le plus près possible de la zone de charge du roulement", isCorrect: true, explanation: "Correct !" }
        ]},
        { id: "q6", question: "Que provoque la résonance de montage d'un capteur ?", options: [
            { id: "a", text: "Une amplification énorme des hautes fréquences", isCorrect: true, explanation: "Correct ! C'est pour ça que la Fmax est limitée." },
            { id: "b", text: "Une perte du signal 1X", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q7", question: "Pour mesurer la vitesse de rotation avec précision (Tachymètre), on utilise :", options: [
            { id: "a", text: "Un accéléromètre triaxial", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Un capteur optique (Laser) ou inductif", isCorrect: true, explanation: "Correct !" }
        ]},
        { id: "q8", question: "Quel est l'avantage du capteur de déplacement sans contact ?", options: [
            { id: "a", text: "Il voit la position de l'arbre dans son palier (Gap DC)", isCorrect: true, explanation: "Correct !" },
            { id: "b", text: "Il monte jusqu'à 40 kHz", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q9", question: "Si un accéléromètre (100 mV/g) lâche ou a un câble sectionné, le signal temporel montre :", options: [
            { id: "a", text: "Un 1X très fort", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Une tension Bias (Bias Voltage) proche de 0 ou très élevée", isCorrect: true, explanation: "Correct ! Le circuit est ouvert." }
        ]},
        { id: "q10", question: "Le montage par pointe de touche est recommandé pour :", options: [
            { id: "a", text: "L'analyse d'enveloppe de roulements", isCorrect: false, explanation: "Faux ! La pointe coupe le signal bien avant l'enveloppe." },
            { id: "b", text: "Un dépannage rapide basses fréquences (< 1000 Hz)", isCorrect: true, explanation: "Correct !" }
        ]}
      ]
    },
    content: ( <div className="hidden"></div> ),
  },
  {
    id: 30,
    part: "Partie III",
    title: "Traitement du Signal",
    visualType: "none",
    isCover: true,
    content: (
      <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <p className="text-xl md:text-2xl font-light text-blue-100/80 leading-relaxed text-center max-w-3xl mt-8">
          Transformer la vibration brute en données analysables : Conversion d'unités, intégration, analyse de la forme d'onde temporelle, FFT, résolution et fenêtrage.
        </p>
        <div className="mt-12 w-16 h-1 bg-emerald-500 rounded-full"></div>
      </div>
    ),
  },
  {
    id: 31,
    part: "Traitement du Signal",
    title: "15. Conversion Accélération / Vitesse / Déplacement",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le capteur (accéléromètre) mesure l'<strong>accélération</strong>. Mais pour évaluer la sévérité (ISO), on a besoin de la <strong>vitesse</strong>. Pour voir le mouvement d'un arbre lent, on a besoin du <strong>déplacement</strong>. L'analyseur convertit ces grandeurs mathématiquement.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-8">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-xl text-center shadow-sm w-full md:w-auto">
            <div className="font-bold text-lg mb-1">Accélération</div>
            <div className="text-xs uppercase tracking-widest opacity-80">Mesure Brute</div>
          </div>
          
          <div className="text-slate-400 font-bold hidden md:block">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
          <div className="text-slate-400 font-bold block md:hidden">↓</div>
          
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-xl text-center shadow-sm w-full md:w-auto">
            <div className="font-bold text-lg mb-1">Vitesse</div>
            <div className="text-xs uppercase tracking-widest opacity-80">Intégration (1x)</div>
          </div>
          
          <div className="text-slate-400 font-bold hidden md:block">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
          <div className="text-slate-400 font-bold block md:hidden">↓</div>
          
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl text-center shadow-sm w-full md:w-auto">
            <div className="font-bold text-lg mb-1">Déplacement</div>
            <div className="text-xs uppercase tracking-widest opacity-80">Intégration (2x)</div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl shadow-sm mt-8 text-white">
          <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-3">La Règle de Fréquence</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li><span className="font-bold text-white mr-2">Déplacement :</span> Privilégié pour les <strong>basses fréquences</strong> (&lt; 10 Hz / &lt; 600 CPM). Met en évidence le balourd sur machines lentes.</li>
            <li><span className="font-bold text-white mr-2">Vitesse :</span> Privilégiée pour les <strong>moyennes fréquences</strong> (10 Hz à 1000 Hz). Équilibre l'énergie des défauts courants.</li>
            <li><span className="font-bold text-white mr-2">Accélération :</span> Privilégiée pour les <strong>hautes fréquences</strong> (&gt; 1000 Hz). Indispensable pour détecter chocs, roulements, engrenages.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 32,
    part: "Traitement du Signal",
    title: "16. Intégration et dérivation",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          L'intégration mathématique (passer de l'accélération à la vitesse) n'est pas un calcul trivial pour le collecteur. Il amplifie les basses fréquences et atténue les hautes fréquences.
        </p>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
          <div className="bg-slate-50 p-4 border-b border-slate-200">
            <h4 className="font-bold text-slate-800">Effet de l'intégration sur le bruit (Ski-Slope)</h4>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Si le capteur capte un léger bruit thermique à très basse fréquence en accélération, ce bruit sera <strong>massivement amplifié</strong> lors de l'intégration en vitesse, et encore plus en déplacement (double intégration). C'est pourquoi la "Ski-Slope" (Piste de ski) apparaît souvent dans les spectres en vitesse.
            </p>
            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-800">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Ne jamais intégrer en double (Déplacement) à partir d'un accéléromètre sans utiliser un <strong>filtre passe-haut</strong> rigoureux, sinon le bruit de fond explosera !</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 33,
    part: "Traitement du Signal",
    title: "17. Analyse de la forme d'onde (Onde temporelle)",
    visualType: "waveform",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          L'onde temporelle est le <strong>signal brut non altéré</strong> qui sort du capteur. L'analyse spectrale (FFT) en est dérivée. Beaucoup d'analystes l'ignorent à tort !
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-slate-50 border-t-4 border-t-emerald-500 p-6 rounded-b-2xl shadow-sm">
            <h4 className="font-bold text-slate-800 mb-2">Quand utiliser l'Onde ?</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 mt-1.5 bg-emerald-500 rounded-full"></div> Repérer les impacts violents (chocs)</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 mt-1.5 bg-emerald-500 rounded-full"></div> Diagnostics d'engrenages complexes (dents cassées)</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 mt-1.5 bg-emerald-500 rounded-full"></div> Confirmation du frottement (clipping)</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 mt-1.5 bg-emerald-500 rounded-full"></div> Calculer le Kurtosis</li>
            </ul>
          </div>

          <div className="bg-slate-50 border-t-4 border-t-red-500 p-6 rounded-b-2xl shadow-sm">
            <h4 className="font-bold text-slate-800 mb-2">Limites de l'Onde</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 mt-1.5 bg-red-500 rounded-full"></div> Très complexe à lire si 3 défauts se mélangent</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 mt-1.5 bg-red-500 rounded-full"></div> Difficile de distinguer 2 fréquences très proches</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 34,
    part: "Traitement du Signal",
    title: "18. Analyse Spectrale (FFT)",
    visualType: "spectrum",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          La Transformée de Fourier Rapide (FFT) est l'algorithme qui convertit l'onde temporelle complexe en un graphique simple : le <strong>Spectre</strong> (Amplitude en fonction de la Fréquence).
        </p>

        <div className="bg-indigo-50 border border-indigo-200/60 p-6 rounded-2xl shadow-sm mt-6">
          <h4 className="text-indigo-900 font-bold text-lg mb-2">Le rôle de la FFT</h4>
          <p className="text-indigo-800/90 leading-relaxed text-sm mb-4">
            Tout signal vibratoire, aussi complexe soit-il, peut être décomposé en une somme infinie d'ondes sinusoïdales simples. La FFT "démonte" le signal temporel pour vous donner ces ondes simples sous forme de <strong>pics spectraux</strong>.
          </p>
          <div className="flex gap-4">
            <span className="px-3 py-1 bg-white text-indigo-700 font-bold rounded shadow-sm text-xs border border-indigo-100">Temporel = "Quand" ça vibre</span>
            <span className="px-3 py-1 bg-indigo-600 text-white font-bold rounded shadow-sm text-xs">Spectre = "À quelle fréquence" ça vibre</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 35,
    part: "Traitement du Signal",
    title: "Analyse d'enveloppe (Démodulation)",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les défauts de <strong>roulements à billes</strong> (ou d'engrenages) génèrent de l'énergie à très haute fréquence (impacts). Cette énergie est souvent noyée dans le bruit de fond du spectre classique. L'analyse d'enveloppe est la technique magique pour les extraire.
        </p>

        <div className="flex flex-col md:flex-row gap-6 mt-8">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative">
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">1</div>
            <div className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center mb-4">
               <Activity className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Filtrage Passe-Haut</h4>
            <p className="text-sm text-slate-500">On élimine les basses fréquences (Balourd, etc.) pour ne garder que la zone de résonance haute fréquence où les impacts frappent.</p>
          </div>
          
          <div className="flex-shrink-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400 rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative">
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center">2</div>
            <div className="w-16 h-16 bg-slate-50 border-2 border-emerald-300 rounded-full flex items-center justify-center mb-4">
               <TrendingDown className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Démodulation</h4>
            <p className="text-sm text-slate-500">On redresse le signal et on extrait la courbe enveloppe, qui contient la fréquence de répétition des impacts (la cadence).</p>
          </div>
          
          <div className="flex-shrink-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400 rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative">
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center">3</div>
            <div className="w-16 h-16 bg-slate-50 border-2 border-indigo-300 rounded-full flex items-center justify-center mb-4">
               <BarChart3 className="w-8 h-8 text-indigo-500" />
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Spectre d'Enveloppe</h4>
            <p className="text-sm text-slate-500">On applique une FFT sur cette enveloppe. Les fréquences de défaut du roulement (BPFO, BPFI) ressortent très clairement.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 36,
    part: "Traitement du Signal",
    title: "19. Configuration : Fmax et Nlignes",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Pour prendre une mesure, on doit configurer le collecteur. Les deux paramètres fondamentaux sont <strong>Fmax</strong> (Fréquence Maximale) et <strong>Nlignes</strong> (Nombre de Lignes ou Résolution).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl group hover:border-blue-300 transition-colors">
            <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm font-black">1</span> Fmax
            </h4>
            <p className="text-slate-600 mb-4">
              Définit la largeur du spectre (de 0 Hz jusqu'à Fmax). Détermine <strong>ce qu'on pourra voir</strong>.
            </p>
            <div className="bg-white p-4 rounded-xl text-sm text-slate-500 border border-slate-100">
              <strong>Règle :</strong> Toujours couvrir au moins les 10 premières harmoniques (10X) pour l'analyse générale. Couvrir les fréquences d'engrènement pour un réducteur (3x GMF).
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl group hover:border-emerald-300 transition-colors">
            <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded text-sm font-black">2</span> Nlignes (LOR)
            </h4>
            <p className="text-slate-600 mb-4">
              Définit le nombre de "barres" ou "points" qui composent le spectre. Détermine la <strong>précision</strong> avec laquelle on peut distinguer deux pics.
            </p>
            <div className="bg-white p-4 rounded-xl text-sm text-slate-500 border border-slate-100">
              <strong>Valeurs courantes :</strong> 800, 1600, 3200 ou 6400 lignes. Plus on a de lignes, plus c'est précis, mais plus la mesure prend du <strong>temps</strong>.
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 37,
    part: "Traitement du Signal",
    title: "20. Résolution Spectrale et Temps d'Acquisition",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Ces paramètres sont tous liés mathématiquement. L'écart entre chaque ligne du spectre s'appelle la <strong>Résolution (Δf)</strong>.
        </p>

        <div className="bg-slate-800 p-8 rounded-2xl text-white shadow-lg mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-700">
            <div className="px-4 text-center">
              <h4 className="text-amber-400 font-bold mb-4 uppercase tracking-wider text-xs">Formule de la Résolution</h4>
              <div className="text-3xl font-mono font-black mb-2">Δf = Fmax / Nlignes</div>
              <p className="text-slate-400 text-sm mt-4">Plus Δf est petit, meilleure est la capacité à séparer deux pics très proches sur le spectre.</p>
            </div>
            <div className="px-4 text-center pt-8 md:pt-0">
              <h4 className="text-emerald-400 font-bold mb-4 uppercase tracking-wider text-xs">Temps d'acquisition d'un bloc</h4>
              <div className="text-3xl font-mono font-black mb-2">Tacq = Nlignes / Fmax</div>
              <p className="text-slate-400 text-sm mt-4">Pour augmenter la résolution (augmenter Nlignes) sans toucher à Fmax, la machine devra écouter <strong>plus longtemps</strong>.</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl mt-8">
          <p className="text-blue-900 leading-relaxed font-medium">
            <strong>Exemple :</strong> Fmax = 1000 Hz, Nlignes = 1000.<br/>
            Δf = 1 Hz (les pics seront séparés de 1 Hz).<br/>
            Temps d'acquisition = 1 seconde par moyenne.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 38,
    part: "Traitement du Signal",
    title: "Théorème de Shannon-Nyquist & Aliasing",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Pour numériser correctement un signal, la fréquence d'échantillonnage (Fs) doit être au moins <strong>deux fois supérieure</strong> à la fréquence maximale (Fmax) présente dans le signal.
        </p>
        <div className="bg-white border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm mt-6">
          <h4 className="font-bold text-red-700 mb-2">Le Repliement de Spectre (Aliasing)</h4>
          <p className="text-sm text-slate-600 mb-4">
            Si une fréquence supérieure à Fs/2 entre dans le collecteur, elle sera "repliée" et apparaîtra dans le spectre à une fausse basse fréquence. C'est une erreur irréversible.
          </p>
          <div className="bg-slate-50 p-4 rounded text-sm text-slate-700 font-mono">
            Solution : Le Filtre Anti-Repliement (Anti-Aliasing Filter). Un filtre passe-bas analogique coupe tout ce qui dépasse Fmax avant la numérisation.
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 39,
    part: "Traitement du Signal",
    title: "Le Fenêtrage (Windowing)",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          La FFT suppose que le signal est infini et périodique. Si on coupe le signal n'importe où, cela crée une discontinuité aux bords. Cette discontinuité provoque l'<strong>effet de fuite (Leakage)</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
             <h4 className="font-bold text-slate-800 mb-2">Uniforme (Rectangulaire)</h4>
             <p className="text-xs text-slate-500 mb-2">Aucune modification des bords.</p>
             <div className="bg-red-50 text-red-700 p-2 rounded text-xs font-bold">Pire effet de fuite.</div>
             <p className="text-xs text-slate-600 mt-2">Utilisée uniquement pour les chocs transitoires (bump test) qui meurent avant la fin du bloc.</p>
          </div>
          <div className="bg-white border-2 border-emerald-500 p-6 rounded-2xl shadow-sm relative">
             <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">Standard</div>
             <h4 className="font-bold text-slate-800 mb-2">Hanning</h4>
             <p className="text-xs text-slate-500 mb-2">Force les bords à zéro (cloche).</p>
             <div className="bg-emerald-50 text-emerald-700 p-2 rounded text-xs font-bold">Excellent compromis.</div>
             <p className="text-xs text-slate-600 mt-2">La norme pour 95% des analyses vibratoires (spectre général, diagnostic).</p>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
             <h4 className="font-bold text-slate-800 mb-2">Flat-Top</h4>
             <p className="text-xs text-slate-500 mb-2">Écrase le signal, élargit le pic.</p>
             <div className="bg-blue-50 text-blue-700 p-2 rounded text-xs font-bold">Amplitude parfaite.</div>
             <p className="text-xs text-slate-600 mt-2">Utilisée spécifiquement pour la calibration d'amplitude (perte de résolution fréquentielle).</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 40,
    part: "Quiz 3",
    title: "Test de Connaissances - Partie III",
    visualType: "quiz",
    quizData: {
      timeLimitSeconds: 300,
      questions: [
        { id: "q1", question: "Quel phénomène survient si l'on échantillonne à Fs < 2 × Fmax ?", options: [
            { id: "a", text: "Le Repliement (Aliasing)", isCorrect: true, explanation: "Correct ! Les hautes fréquences apparaissent à de fausses basses fréquences." },
            { id: "b", text: "L'Effet de fuite (Leakage)", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q2", question: "Quelle fenêtre est standard pour l'analyse spectrale ?", options: [
            { id: "a", text: "Hanning", isCorrect: true, explanation: "Correct ! Elle force les bords à zéro et offre un bon compromis amplitude/résolution." },
            { id: "b", text: "Uniforme", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q3", question: "La résolution spectrale (Δf) se calcule par :", options: [
            { id: "a", text: "Fmax × Nlignes", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Fmax / Nlignes", isCorrect: true, explanation: "Correct ! C'est l'espacement en Hz entre chaque ligne du spectre." }
        ]},
        { id: "q4", question: "Le moyennage (Averaging) permet de :", options: [
            { id: "a", text: "Améliorer le ratio signal/bruit et lisser les signaux aléatoires", isCorrect: true, explanation: "Correct !" },
            { id: "b", text: "Augmenter la résolution spectrale", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q5", question: "Si la résolution est de 2 Hz, peut-on distinguer un pic à 50 Hz et un à 50.5 Hz ?", options: [
            { id: "a", text: "Oui", isCorrect: false, explanation: "Faux. L'espacement minimal est de 2 Hz." },
            { id: "b", text: "Non", isCorrect: true, explanation: "Correct ! Il faudrait une résolution de 0.5 Hz ou moins." }
        ]},
        { id: "q6", question: "L'Analyse d'Enveloppe (Démodulation) sert à :", options: [
            { id: "a", text: "Détecter les impacts basse énergie noyés dans le bruit basse fréquence", isCorrect: true, explanation: "Correct ! C'est la meilleure méthode pour les roulements." },
            { id: "b", text: "Équilibrer un rotor", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q7", question: "Quel filtre est utilisé dans la première étape de l'Analyse d'Enveloppe ?", options: [
            { id: "a", text: "Filtre Passe-Bas", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Filtre Passe-Haut ou Passe-Bande", isCorrect: true, explanation: "Correct ! On isole la résonance structurelle excitée par les chocs." }
        ]},
        { id: "q8", question: "Qu'est-ce que le Leakage (Effet de Fuite) ?", options: [
            { id: "a", text: "L'étalement de l'énergie d'un pic sur les lignes adjacentes", isCorrect: true, explanation: "Correct ! C'est corrigé par les fenêtres comme Hanning." },
            { id: "b", text: "Une perte d'huile", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q9", question: "Le Tmax (Temps d'acquisition d'un bloc) est égal à :", options: [
            { id: "a", text: "Nlignes / Fmax", isCorrect: true, explanation: "Correct ! Plus la résolution est fine, plus il faut de temps." },
            { id: "b", text: "Fmax × 2", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q10", question: "La fenêtre Flat-Top est utilisée pour :", options: [
            { id: "a", text: "Séparer deux pics très proches", isCorrect: false, explanation: "Faux. Elle écrase les pics." },
            { id: "b", text: "Obtenir une amplitude très précise pour la calibration", isCorrect: true, explanation: "Correct !" }
        ]}
      ]
    },
    content: ( <div className="hidden"></div> ),
  },
  {
    id: 41,
    part: "Partie IV",
    title: "Diagnostic des Défauts",
    visualType: "none",
    isCover: true,
    content: (
      <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <p className="text-xl md:text-2xl font-light text-blue-100/80 leading-relaxed text-center max-w-3xl mt-8">
          Savoir lire un spectre et identifier la signature des anomalies courantes : Balourd, Désalignement, Jeux mécaniques, Défauts de roulements, et problèmes électriques.
        </p>
        <div className="mt-12 w-16 h-1 bg-emerald-500 rounded-full"></div>
      </div>
    ),
  },
  {
    id: 42,
    part: "Traitement du Signal",
    title: "Formulaire : Indicateurs Globaux (Temporels)",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Ces indicateurs temporels sont calculés directement sur la forme d'onde <strong className="text-slate-800">avant toute FFT</strong>. Ils servent d'indicateurs de sévérité globale.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md border-l-4 border-emerald-400">
             <h4 className="font-bold text-emerald-400 mb-2">Niveau RMS (Valeur Efficace)</h4>
             <p className="text-sm mb-2 text-slate-300">Représente l'énergie globale destructrice de la vibration.</p>
             <div className="font-mono text-sm bg-slate-900 p-3 rounded text-center">RMS = √ ( (1/N) × Σ(x²) )</div>
          </div>
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md border-l-4 border-blue-400">
             <h4 className="font-bold text-blue-400 mb-2">Peak & Peak-to-Peak</h4>
             <p className="text-sm mb-2 text-slate-300">Peak : Amplitude max. Peak-to-Peak : Écart total (Max - Min).</p>
             <div className="font-mono text-sm bg-slate-900 p-3 rounded text-center">Peak = Max(|x|)</div>
          </div>
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md border-l-4 border-red-400">
             <h4 className="font-bold text-red-400 mb-2">Facteur de Crête (Crest Factor)</h4>
             <p className="text-sm mb-2 text-slate-300">Indicateur précoce d'impacts. (1.414 pour une sinusoïde).</p>
             <div className="font-mono text-sm bg-slate-900 p-3 rounded text-center">CF = Peak / RMS</div>
          </div>
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md border-l-4 border-amber-400">
             <h4 className="font-bold text-amber-400 mb-2">Kurtosis</h4>
             <p className="text-sm mb-2 text-slate-300">Quantifie le caractère "pointu" (impulsions). (Normal ≈ 3).</p>
             <div className="font-mono text-sm bg-slate-900 p-3 rounded text-center">Kurtosis = (1/N) × Σ( (x - μ)⁴ / σ⁴ )</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 43,
    part: "Diagnostic des Défauts",
    title: "Méthodologie de l'Analyste",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le diagnostic n'est pas de la magie, c'est de la logique. Avant de regarder un spectre, l'analyste a besoin de connaître <strong>la cinématique de la machine</strong>.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 text-lg">Les 3 questions à se poser devant un spectre :</h4>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <h5 className="font-bold text-slate-700">À quelle fréquence se trouve le pic ?</h5>
                <p className="text-sm text-slate-500">Est-ce 1X ? 2X ? Non synchrone ? Cette fréquence correspond à QUEL composant ?</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <h5 className="font-bold text-slate-700">Dans quelle direction l'amplitude est-elle la plus élevée ?</h5>
                <p className="text-sm text-slate-500">Horizontal ? Vertical ? Axial ? (Ex: L'axial signe souvent un désalignement).</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold flex items-center justify-center shrink-0">3</div>
              <div>
                <h5 className="font-bold text-slate-700">Quelle est l'amplitude, et comment évolue-t-elle ?</h5>
                <p className="text-sm text-slate-500">Est-ce que ça augmente dans le temps ? Dépasse-t-on le seuil ISO ou l'alarme statistique ?</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 44,
    part: "Diagnostic des Défauts",
    title: "21. Le Balourd (Déséquilibre Massique)",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le balourd est le défaut le plus fréquent. Il survient lorsque le centre de masse du rotor ne coïncide pas avec son axe de rotation (centre géométrique).
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <div className="bg-white border-2 border-emerald-100 p-6 rounded-2xl shadow-sm">
            <h4 className="font-bold text-emerald-800 mb-4 uppercase tracking-widest text-sm">Signature Spectrale</h4>
            <div className="bg-emerald-50 rounded-xl p-6 text-center border border-emerald-200">
               <div className="text-4xl font-black text-emerald-600 mb-2">1X dominant</div>
               <p className="text-sm text-emerald-700 font-medium">
                 Le pic à la fréquence de rotation (1X) représente au moins 80% de l'énergie globale.
               </p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Harmoniques 2X ou 3X très faibles (&lt; 15% du 1X)</li>
              <li>• Surtout en Horizontal et Vertical</li>
            </ul>
          </div>

          <div className="bg-white border-2 border-blue-100 p-6 rounded-2xl shadow-sm">
            <h4 className="font-bold text-blue-800 mb-4 uppercase tracking-widest text-sm">Caractéristiques</h4>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 bg-blue-500 rounded-full shrink-0"></div>
                <span><strong>L'onde temporelle :</strong> Sinusoïde quasi-pure. C'est l'exemple classique du mouvement harmonique.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 bg-blue-500 rounded-full shrink-0"></div>
                <span><strong>La Phase :</strong> Si l'on mesure H et V sur le même palier, on a un déphasage de ~90°. (La force lourde tourne avec l'arbre).</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 bg-blue-500 rounded-full shrink-0"></div>
                <span><strong>Effet Vitesse :</strong> La force de balourd (et donc la vibration) augmente avec le carré de la vitesse de rotation.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 45,
    part: "Diagnostic des Défauts",
    title: "Le Balourd en image (Spectre type)",
    visualType: "spectrum",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Voici à quoi ressemble le spectre typique d'une machine souffrant uniquement de balourd.
        </p>

        <div className="bg-slate-50 border-l-4 border-slate-300 p-6 rounded-r-xl shadow-sm mt-6">
          <h4 className="font-bold text-slate-800 mb-3">Diagnostic :</h4>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            L'analyse révèle que l'écrasante majorité de la vibration provient de la fréquence 1X. Les harmoniques 2X et 3X sont noyées dans le bruit de fond, indiquant que la machine n'a pas de problème de jeu ou d'alignement significatif.
          </p>
          <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded font-bold text-sm text-center">
            Action recommandée : Planifier un équilibrage dynamique (Partie V)
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 46,
    part: "Diagnostic des Défauts",
    title: "22. Le Désalignement",
    visualType: "spectrum",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le désalignement se produit lorsque les axes de rotation de deux machines accouplées ne sont pas colinéaires. C'est la deuxième cause la plus fréquente de vibration.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-sm">
            <h4 className="font-bold text-indigo-800 mb-4 uppercase tracking-widest text-sm">Signature Spectrale</h4>
            <div className="bg-indigo-50 rounded-xl p-6 text-center border border-indigo-200">
               <div className="text-3xl font-black text-indigo-600 mb-2">1X, 2X, et 3X</div>
               <p className="text-sm text-indigo-700 font-medium">
                 Le spectre présente plusieurs harmoniques de la vitesse de rotation.
               </p>
            </div>
            <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100">
              <span className="font-bold text-red-700">Le signe distinctif :</span> L'amplitude dans la direction <strong>Axiale</strong> est souvent très élevée (parfois supérieure à la direction radiale), avec un fort pic à 1X ou 2X Axial.
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 uppercase tracking-widest text-sm">Caractéristiques & Types</h4>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 bg-slate-400 rounded-full shrink-0"></div>
                <span><strong>Désalignement Angulaire :</strong> Produit une forte vibration axiale à 1X, avec un déphasage axial de 180° de part et d'autre de l'accouplement.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 bg-slate-400 rounded-full shrink-0"></div>
                <span><strong>Désalignement Parallèle :</strong> Produit une forte vibration radiale à 2X (parfois 3X ou 4X si l'accouplement est très rigide).</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 mt-1.5 bg-slate-400 rounded-full shrink-0"></div>
                <span><strong>L'onde temporelle :</strong> Souvent en forme de "M" ou "W" (combinaison de 1X et 2X).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 47,
    part: "Diagnostic des Défauts",
    title: "23. Jeu Mécanique et Pied Mou",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les jeux mécaniques (Looseness) amplifient les autres défauts. Ils se divisent en deux grandes catégories avec des signatures spectrales différentes.
        </p>

        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          <div className="flex-1 bg-white border-t-4 border-t-amber-500 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-2">Jeu de Structure (Type A)</h4>
            <p className="text-sm text-slate-500 mb-4">Fixation de la machine au sol desserrée, pied mou, fondation fissurée.</p>
            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-medium border border-amber-200">
              <strong>Signature :</strong> Un pic <strong>très fort à 1X</strong> uniquement dans la direction de la faiblesse (souvent Vertical). Le déphasage change radicalement entre le socle et la machine.
            </div>
          </div>

          <div className="flex-1 bg-white border-t-4 border-t-red-500 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-2">Jeu Interne (Type C)</h4>
            <p className="text-sm text-slate-500 mb-4">Roulement lâche dans son logement, bague tournante sur l'arbre, etc.</p>
            <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm font-medium border border-red-200">
              <strong>Signature :</strong> Présence d'un "plancher de bruit" élevé, avec de <strong>multiples harmoniques (1X, 2X, 3X... jusqu'à 10X)</strong> et même des demi-harmoniques (0.5X, 1.5X). L'onde temporelle montre des impacts (Clipping).
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl shadow-sm mt-8 flex gap-4 text-white">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-2">Le Pied Mou (Soft Foot)</h4>
            <p className="text-slate-300 leading-relaxed text-sm">
              C'est une condition où les 4 pieds de la machine ne reposent pas à plat. Serrer les boulons va alors <strong>déformer la carcasse</strong>. Au niveau vibratoire, cela génère souvent un pic à 2X (par déformation du stator du moteur) ou à 1X si ça se comporte comme un jeu de structure.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 48,
    part: "Diagnostic des Défauts",
    title: "24. Les défauts de roulements",
    visualType: "bearing-defects",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les roulements à billes ou à rouleaux échouent par <strong>fatigue de contact (écaillage)</strong>. Chaque élément du roulement génère une fréquence spécifique lorsqu'il est endommagé.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-widest">
                <th className="py-4 px-6 font-semibold">Acronyme</th>
                <th className="py-4 px-6 font-semibold">Signification (Défaut sur...)</th>
                <th className="py-4 px-6 font-semibold">Multiple typique de 1X</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-black text-blue-600">BPFO</td>
                <td className="py-4 px-6 text-slate-700 font-medium">Bague Extérieure (Outer Race)</td>
                <td className="py-4 px-6 font-mono text-slate-500">~ 3x à 4x le nb de billes</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-black text-red-600">BPFI</td>
                <td className="py-4 px-6 text-slate-700 font-medium">Bague Intérieure (Inner Race)</td>
                <td className="py-4 px-6 font-mono text-slate-500">~ 4x à 6x le nb de billes</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-black text-amber-600">BSF</td>
                <td className="py-4 px-6 text-slate-700 font-medium">Élément Roulant (Bille/Rouleau)</td>
                <td className="py-4 px-6 font-mono text-slate-500">~ 2x à 4x la vitesse</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-black text-emerald-600">FTF</td>
                <td className="py-4 px-6 text-slate-700 font-medium">Cage (Train)</td>
                <td className="py-4 px-6 font-mono text-slate-500">Toujours &lt; 1X (~0.4X)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 border-l-4 border-slate-300 p-5 rounded-r-xl mt-8">
          <p className="text-slate-600 text-sm">
            <strong>Particularité :</strong> Ces fréquences (BPFO, BPFI, etc.) <strong>ne sont jamais des multiples entiers exacts de la vitesse de rotation (1X)</strong>, car il y a toujours un léger glissement interne. Si vous voyez un pic à 5.0X, ce n'est probablement pas un roulement. Si c'est à 5.23X, c'est très probablement un roulement !
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 49,
    part: "Diagnostic des Défauts",
    title: "Les 4 stades de dégradation d'un roulement",
    visualType: "image",
    imageUrl: "/images/bearing_spalling.png",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          La dégradation d'un roulement suit une évolution très prévisible en 4 stades de la courbe P-F.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white border-t-4 border-t-blue-300 rounded-xl p-5 shadow-sm text-center">
            <h4 className="font-black text-blue-400 mb-2">Stade 1</h4>
            <div className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-4">Très précoce</div>
            <p className="text-xs text-slate-600">
              Apparition d'ondes de contrainte (Ultrasons / Émission acoustique). Rien n'est visible sur un spectre en vitesse. Début de micro-écaillage sous la surface.
            </p>
          </div>
          
          <div className="bg-white border-t-4 border-t-emerald-400 rounded-xl p-5 shadow-sm text-center transform md:-translate-y-2">
            <h4 className="font-black text-emerald-500 mb-2">Stade 2</h4>
            <div className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-4">Précoce</div>
            <p className="text-xs text-slate-600">
              L'écaillage atteint la surface. Le défaut devient visible avec les techniques d'<strong>Enveloppe</strong> (pics avec harmoniques). L'amplitude globale commence à monter légèrement.
            </p>
          </div>
          
          <div className="bg-white border-t-4 border-t-amber-500 rounded-xl p-5 shadow-sm text-center transform md:-translate-y-4">
            <h4 className="font-black text-amber-600 mb-2">Stade 3</h4>
            <div className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-4">Alerte</div>
            <p className="text-xs text-slate-600">
              Défaut très net. Les fréquences (BPFO, etc.) et leurs harmoniques <strong>apparaissent sur le spectre normal en vitesse</strong>. Apparition de "bandes latérales" à 1X.
            </p>
          </div>
          
          <div className="bg-white border-t-4 border-t-red-600 rounded-xl p-5 shadow-sm text-center transform md:-translate-y-6">
            <h4 className="font-black text-red-600 mb-2">Stade 4</h4>
            <div className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-4">Danger</div>
            <p className="text-xs text-slate-600">
              Panne imminente. Les fréquences de défaut se noient dans un <strong>monticule de bruit ("Haystack")</strong>. Le roulement chauffe, le 1X augmente (jeu interne). Arrêt immédiat !
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 50,
    part: "Diagnostic des Défauts",
    title: "25. Problèmes de Lubrification",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le manque de lubrifiant, la dégradation de l'huile ou un graissage excessif peuvent être détectés par la vibration avant même l'échauffement.
        </p>

        <div className="flex flex-col md:flex-row gap-6 mt-8">
          <div className="flex-1 bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-8 shadow-sm">
            <h4 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Signes d'un défaut de lubrification
            </h4>
            <ul className="space-y-4 text-amber-800/80">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                <span><strong>Hautes Fréquences :</strong> Élévation générale du plancher de bruit (monticule) dans la zone des très hautes fréquences (ex: entre 2 kHz et 5 kHz) en accélération.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                <span>Aucun pic harmonique distinct n'accompagne ce monticule (contrairement à un roulement abîmé). C'est un bruit "blanc".</span>
              </li>
            </ul>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
             <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Le Graissage Assisté
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              L'utilisation d'un appareil à ultrasons (ou écoute vibratoire) pendant le graissage permet d'injecter la quantité <strong>exacte</strong> de graisse : on graisse jusqu'à ce que le bruit diminue, et on s'arrête avant qu'il ne remonte.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-700">
              Le sur-graissage (Over-lubrication) fait exploser les joints et provoque la surchauffe. C'est l'une des pires erreurs de maintenance !
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 51,
    part: "Diagnostic des Défauts",
    title: "26. Entraînements par courroies",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les transmissions par courroies génèrent leurs propres fréquences, souvent sous-synchrones (inférieures à 1X).
        </p>

        <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden mt-6 flex flex-col md:flex-row">
           <div className="bg-slate-800 p-8 md:w-1/3 text-white flex flex-col justify-center">
             <h4 className="text-lg font-bold mb-4 text-blue-400">Fréquence Courroie</h4>
             <p className="text-sm text-slate-300 leading-relaxed mb-4">
               C'est la fréquence à laquelle la courroie fait un tour complet.
             </p>
             <div className="font-mono bg-slate-700 p-3 rounded text-sm text-center">
               f_courroie = (π × D × 1X) / L
             </div>
             <p className="text-xs text-slate-400 mt-2 text-center">(D = Diamètre, L = Longueur)</p>
           </div>
           
           <div className="p-8 md:w-2/3">
             <h4 className="font-bold text-slate-800 mb-6">Défauts Courants et Signatures</h4>
             <ul className="space-y-6">
               <li className="flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold">1</div>
                 <div>
                   <h5 className="font-bold text-slate-700">Usure, craquelure, ou épissure (Défaut local)</h5>
                   <p className="text-sm text-slate-500">Génère des pics à la fréquence courroie (1x, 2x, 3x, 4x f_courroie).</p>
                 </div>
               </li>
               <li className="flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold">2</div>
                 <div>
                   <h5 className="font-bold text-slate-700">Défaut de tension (Fouettement)</h5>
                   <p className="text-sm text-slate-500">Courroie lâche : forts pics à la fréquence courroie, souvent instables en amplitude.</p>
                 </div>
               </li>
               <li className="flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">3</div>
                 <div>
                   <h5 className="font-bold text-slate-700">Poulie excentrée</h5>
                   <p className="text-sm text-slate-500">Fort pic à 1X de la poulie concernée (ressemble à un balourd), particulièrement dans la direction de la tension de la courroie.</p>
                 </div>
               </li>
             </ul>
           </div>
        </div>
      </div>
    ),
  },
  {
    id: 52,
    part: "Diagnostic des Défauts",
    title: "27. Les Engrenages",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le diagnostic des boîtes d'engrenages repose sur une fréquence fondamentale appelée <strong>Fréquence d'Engrènement (GMF - Gear Mesh Frequency)</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
            <h4 className="text-lg font-bold text-slate-800 mb-4">Calcul de la GMF</h4>
            <div className="bg-white border-l-4 border-emerald-500 p-4 rounded text-center mb-4 shadow-sm">
               <span className="font-mono font-bold text-slate-700 text-lg">GMF = Nombre de Dents × 1X</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Exemple : Pignon de 30 dents tournant à 1500 tr/min (25 Hz).<br/>
              GMF = 30 × 25 = 750 Hz.
            </p>
            <p className="text-sm text-slate-500 mt-4 italic">
              Note : La GMF est identique pour le pignon et la roue. 
              (30 dents × 25 Hz = 90 dents × 8.33 Hz = 750 Hz).
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h4 className="text-lg font-bold text-slate-800 mb-4">Diagnostic d'usure</h4>
            <ul className="space-y-3 text-sm text-slate-600">
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 mt-1.5 bg-blue-500 rounded-full shrink-0"></div>
                 <span>Il est <strong>normal</strong> de voir la GMF dans un réducteur en bon état.</span>
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 mt-1.5 bg-amber-500 rounded-full shrink-0"></div>
                 <span><strong>Usure générale :</strong> L'amplitude de la GMF augmente, ainsi que ses harmoniques (2x GMF, 3x GMF).</span>
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 mt-1.5 bg-red-500 rounded-full shrink-0"></div>
                 <span><strong>Dent abîmée (Écaillée, Cassée) :</strong> Le problème n'est pas vu sur la GMF, mais provoque une <strong>modulation</strong>. Le spectre montre la GMF entourée de <strong>bandes latérales</strong> espacées de 1X (de l'arbre portant la dent cassée).</span>
               </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 53,
    part: "Diagnostic des Défauts",
    title: "28. Moteurs Électriques",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les moteurs asynchrones génèrent des vibrations d'origine électromagnétique. Le truc infaillible pour différencier une vibration mécanique d'une vibration électrique ? <strong>Couper le courant.</strong> Si la vibration disparaît instantanément, c'est électrique !
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-widest">
                <th className="py-4 px-6 font-semibold">Fréquence clé</th>
                <th className="py-4 px-6 font-semibold">Problème associé</th>
                <th className="py-4 px-6 font-semibold">Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-blue-600">2 × Fréquence Réseau (2x fL)</td>
                <td className="py-4 px-6 text-slate-700 font-medium">Stator excentré, problème fer</td>
                <td className="py-4 px-6 text-sm text-slate-500">Fort pic à 100 Hz (si réseau 50 Hz). Il est proche de 2X, exige une haute résolution pour le séparer !</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-red-600">Passage des Barres Rotor (RBPF)</td>
                <td className="py-4 px-6 text-slate-700 font-medium">Barres rotoriques cassées</td>
                <td className="py-4 px-6 text-sm text-slate-500">Haute fréquence = Nb barres × 1X. Présence de bandes latérales espacées de la fréquence de glissement (Pole Pass Frequency).</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-amber-600">1X avec Bandes Latérales</td>
                <td className="py-4 px-6 text-slate-700 font-medium">Excentricité Dynamique (Rotor excentré)</td>
                <td className="py-4 px-6 text-sm text-slate-500">Fort 1X modulé (encadré) par la fréquence de passage des pôles (très basse fréquence, ex: 1 Hz). L'onde temporelle "bat".</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 54,
    part: "Diagnostic des Défauts",
    title: "Détail : Roulement Stade 1 (Ultrasons)",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le Stade 1 est indétectable en vitesse globale (ISO). Le défaut est sous la surface (micro-fissuration).
        </p>
        <div className="bg-slate-800 text-white p-6 rounded-2xl">
          <h4 className="text-emerald-400 font-bold mb-4">Techniques de Détection</h4>
          <ul className="space-y-4 text-sm">
             <li className="flex gap-3"><span className="text-emerald-500">1.</span> Émission Acoustique / Ultrasons (&gt; 20 kHz). Le roulement "crie".</li>
             <li className="flex gap-3"><span className="text-emerald-500">2.</span> Mesure d'Onde de Contrainte (Spike Energy, Shock Pulse Method - SPM).</li>
          </ul>
        </div>
        <p className="text-slate-500 text-sm italic">Action : Aucune planification de remplacement, mais on vérifie immédiatement la lubrification.</p>
      </div>
    ),
  },
  {
    id: 55,
    part: "Diagnostic des Défauts",
    title: "Détail : Engrenages Planétaires (Épicycloïdaux)",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les réducteurs planétaires (très utilisés dans l'éolien et l'industrie lourde) ont une cinématique complexe. Les satellites tournent sur eux-mêmes ET autour du soleil.
        </p>
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <h4 className="font-bold text-slate-800 mb-2">Signatures Spécifiques</h4>
          <p className="text-sm text-slate-600 mb-4">
            Au lieu d'une simple GMF (Gear Mesh Frequency), le spectre montre des pics très asymétriques. Le passage des satellites devant le capteur crée une <strong>modulation d'amplitude</strong> très sévère.
          </p>
          <div className="bg-blue-50 text-blue-800 p-4 rounded text-sm">
             <strong>Analyses Avancées :</strong> L'analyse d'enveloppe, le fenêtrage temporel synchrone (Time Synchronous Averaging - TSA) et l'analyse Cepstrale sont indispensables pour ces réducteurs.
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 56,
    part: "Diagnostic des Défauts",
    title: "Cavitation et Pompage (Pompes)",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les problèmes fluides génèrent des signatures vibratoires très caractéristiques, souvent confondues avec des défauts de roulements.
        </p>
        <div className="flex flex-col md:flex-row gap-6">
           <div className="flex-1 bg-white border-l-4 border-l-blue-500 p-6 rounded shadow-sm">
              <h4 className="font-bold text-slate-800 mb-2">La Cavitation</h4>
              <p className="text-sm text-slate-600 mb-2">Formation et implosion de bulles de vapeur (pression aspiration trop faible).</p>
              <div className="text-xs bg-slate-100 p-2 rounded font-mono">Spectre : Monticule de bruit aléatoire (Haystack) en haute fréquence. On entend un bruit de "gravier" dans la pompe.</div>
           </div>
           <div className="flex-1 bg-white border-l-4 border-l-amber-500 p-6 rounded shadow-sm">
              <h4 className="font-bold text-slate-800 mb-2">Fréquence de Passage d'Aubes (BPF)</h4>
              <p className="text-sm text-slate-600 mb-2">BPF = Nombre d'aubes × 1X.</p>
              <div className="text-xs bg-slate-100 p-2 rounded font-mono">Spectre : Fort pic à la BPF. S'il augmente fortement, cela indique un jeu interne (volute) ou un colmatage partiel.</div>
           </div>
        </div>
      </div>
    ),
  },
  {
    id: 57,
    part: "Diagnostic des Défauts",
    title: "Courants de Palier & VFD",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les Variateurs de Fréquence (VFD) induisent des courants parasites sur l'arbre du moteur. Si ces courants se déchargent à travers les roulements, ils provoquent le phénomène de <strong>Fluting (Cannelure)</strong>.
        </p>
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm mt-4">
          <h4 className="font-bold text-slate-800 mb-4">Diagnostic Vibratoire du Fluting</h4>
          <ul className="space-y-2 text-sm text-slate-600">
             <li>• Le défaut s'apparente à un <strong>BPFO</strong> (usure de la bague externe).</li>
             <li>• Le spectre montre un gros monticule en haute fréquence (Enveloppe ou Accélération), avec des pics espacés de la BPFO.</li>
             <li>• <strong>Solution :</strong> Bagues de mise à la terre de l'arbre (Shaft Grounding Rings) ou roulements isolés (céramique).</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 58,
    part: "Quiz 4",
    title: "Test de Connaissances - Partie IV",
    visualType: "quiz",
    quizData: {
      timeLimitSeconds: 400,
      questions: [
        { id: "q1", question: "Le désalignement se caractérise souvent par :", options: [
            { id: "a", text: "Une forte vibration radiale à 1X uniquement", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Une forte vibration axiale à 1X ou 2X, déphasée de 180° à travers l'accouplement", isCorrect: true, explanation: "Correct !" }
        ]},
        { id: "q2", question: "Le jeu mécanique de structure (Fixation lâche) génère typiquement :", options: [
            { id: "a", text: "Des harmoniques multiples jusqu'à 10X", isCorrect: false, explanation: "Faux. C'est le jeu interne." },
            { id: "b", text: "Un fort 1X très directionnel", isCorrect: true, explanation: "Correct !" }
        ]},
        { id: "q3", question: "La fréquence BPFO (Bague Extérieure) d'un roulement est-elle un multiple exact de la vitesse (1X) ?", options: [
            { id: "a", text: "Oui", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Non", isCorrect: true, explanation: "Correct ! Il y a un glissement." }
        ]},
        { id: "q4", question: "Stade 3 d'un défaut de roulement :", options: [
            { id: "a", text: "Détection en ultrason uniquement", isCorrect: false, explanation: "Faux. C'est le Stade 1." },
            { id: "b", text: "Apparition des harmoniques de défaut (BPFO) avec bandes latérales sur le spectre normal", isCorrect: true, explanation: "Correct !" }
        ]},
        { id: "q5", question: "Dans une boîte d'engrenage, la présence de la GMF (Gear Mesh Frequency) est :", options: [
            { id: "a", text: "Toujours le signe d'un défaut", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Normale (elle est inhérente à l'engrènement)", isCorrect: true, explanation: "Correct ! C'est l'augmentation de la GMF ou l'apparition de bandes latérales qui indique un défaut." }
        ]},
        { id: "q6", question: "Une dent cassée sur un pignon génère sur le spectre :", options: [
            { id: "a", text: "Une baisse de l'amplitude globale", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Des bandes latérales autour de la GMF espacées de la fréquence du pignon abîmé (1X)", isCorrect: true, explanation: "Correct ! La modulation d'amplitude crée ces bandes." }
        ]},
        { id: "q7", question: "Comment distinguer un défaut électrique d'un défaut mécanique sur un moteur ?", options: [
            { id: "a", text: "On baisse la vitesse de 10%", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "On coupe l'alimentation (Coast-down). Si la vibration disparaît instantanément, c'est électrique.", isCorrect: true, explanation: "Correct !" }
        ]},
        { id: "q8", question: "Une usure de courroie est détectée par des pics à :", options: [
            { id: "a", text: "La fréquence de la courroie (souvent sous-synchrone) et ses harmoniques", isCorrect: true, explanation: "Correct !" },
            { id: "b", text: "La GMF", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q9", question: "La cavitation d'une pompe produit :", options: [
            { id: "a", text: "Un pic parfait à 1X", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Un monticule de bruit aléatoire en haute fréquence", isCorrect: true, explanation: "Correct !" }
        ]},
        { id: "q10", question: "Les harmoniques multiples avec demi-harmoniques (0.5X, 1.5X, 2.5X) signifient souvent :", options: [
            { id: "a", text: "Un balourd grave", isCorrect: false, explanation: "Faux." },
            { id: "b", text: "Un jeu interne grave ou un frottement (Rubbing)", isCorrect: true, explanation: "Correct !" }
        ]}
      ]
    },
    content: ( <div className="hidden"></div> ),
  },
  {
    id: 59,
    part: "Partie V",
    title: "Techniques de Correction",
    visualType: "none",
    isCover: true,
    content: (
      <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <p className="text-xl md:text-2xl font-light text-blue-100/80 leading-relaxed text-center max-w-3xl mt-8">
          Le diagnostic est fait, il faut maintenant agir : Équilibrage sur site, Alignement laser d'arbres, et traitement des résonances structurelles.
        </p>
        <div className="mt-12 w-16 h-1 bg-emerald-500 rounded-full"></div>
      </div>
    ),
  },
  {
    id: 60,
    part: "Techniques de Correction",
    title: "29. Équilibrage des rotors sur site (ISO 21940)",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Lorsqu'un balourd est diagnostiqué (fort 1X radial), il n'est pas toujours nécessaire d'envoyer le rotor en atelier. On peut l'équilibrer <strong>sur site</strong>, dans ses propres paliers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">1</span>
              Équilibrage 1 Plan (Statique)
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Pour les rotors <strong>étroits</strong> (en forme de disque, ex: ventilateurs fins, poulies) où le balourd est concentré dans un seul plan de rotation.
            </p>
            <div className="bg-white p-3 rounded border border-slate-100 text-sm">
               On utilise la méthode des <strong>Coefficients d'Influence</strong> avec des masses d'essai (Trial Weights) pour calculer la masse de correction et son angle.
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">2</span>
              Équilibrage 2 Plans (Dynamique)
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Pour les rotors <strong>longs</strong> (cylindres, soufflantes larges) où le balourd agit sur deux plans différents (créant un couple).
            </p>
            <div className="bg-white p-3 rounded border border-slate-100 text-sm">
               Nécessite de mesurer les vibrations sur les deux paliers simultanément. Le calcul matriciel (Cross-effect) détermine les 2 masses à ajouter.
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 61,
    part: "Techniques de Correction",
    title: "30. Alignement Laser d'Arbres",
    visualType: "image",
    imageUrl: "/images/laser_alignment.png",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le désalignement (1X, 2X axial fort) use prématurément les accouplements, les roulements et les garnitures mécaniques. <strong>L'alignement laser</strong> est la norme industrielle moderne pour y remédier.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-widest">
                <th className="py-4 px-6 font-semibold">Problème à régler</th>
                <th className="py-4 px-6 font-semibold">Méthode de correction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-amber-600">Pied Mou (Soft Foot)</td>
                <td className="py-4 px-6 text-sm text-slate-600"><strong>Étape Préliminaire Obligatoire.</strong> On vérifie avec le laser si la machine se déforme au serrage, et on ajoute des cales (Shims) sous le pied fautif.</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-blue-600">Désalignement Vertical</td>
                <td className="py-4 px-6 text-sm text-slate-600">On ajoute ou retire des <strong>cales d'épaisseur (Shims)</strong> sous les 4 pieds du moteur selon les calculs du boîtier laser.</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-emerald-600">Désalignement Horizontal</td>
                <td className="py-4 px-6 text-sm text-slate-600">On pousse le moteur latéralement à l'aide de vérins de réglage (Jacking bolts).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 border border-blue-200/60 p-6 rounded-2xl shadow-sm mt-6 flex gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="text-blue-900 font-bold uppercase tracking-wider text-xs mb-2">Expansion Thermique (Croissance)</h4>
            <p className="text-blue-800/90 leading-relaxed text-sm">
              Un alignement parfait à froid peut devenir désastreux à chaud (les métaux se dilatent). Le laser permet d'introduire des <strong>cibles thermiques (Thermal Targets)</strong> pour désaligner volontairement à froid, afin que la machine soit parfaitement alignée en fonctionnement (à chaud).
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 62,
    part: "Techniques de Correction",
    title: "Alignement Laser (Schéma Principe)",
    visualType: "laser-alignment",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le désalignement (1X, 2X axial fort) use prématurément les accouplements, les roulements et les garnitures mécaniques. <strong>L'alignement laser</strong> est la norme industrielle moderne pour y remédier.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-widest">
                <th className="py-4 px-6 font-semibold">Problème à régler</th>
                <th className="py-4 px-6 font-semibold">Méthode de correction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-amber-600">Pied Mou (Soft Foot)</td>
                <td className="py-4 px-6 text-sm text-slate-600"><strong>Étape Préliminaire Obligatoire.</strong> On vérifie avec le laser si la machine se déforme au serrage, et on ajoute des cales (Shims) sous le pied fautif.</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-blue-600">Désalignement Vertical</td>
                <td className="py-4 px-6 text-sm text-slate-600">On ajoute ou retire des <strong>cales d'épaisseur (Shims)</strong> sous les 4 pieds du moteur selon les calculs du boîtier laser.</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-bold text-emerald-600">Désalignement Horizontal</td>
                <td className="py-4 px-6 text-sm text-slate-600">On pousse le moteur latéralement à l'aide de vérins de réglage (Jacking bolts).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 border border-blue-200/60 p-6 rounded-2xl shadow-sm mt-6 flex gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="text-blue-900 font-bold uppercase tracking-wider text-xs mb-2">Expansion Thermique (Croissance)</h4>
            <p className="text-blue-800/90 leading-relaxed text-sm">
              Un alignement parfait à froid peut devenir désastreux à chaud (les métaux se dilatent). Le laser permet d'introduire des <strong>cibles thermiques (Thermal Targets)</strong> pour désaligner volontairement à froid, afin que la machine soit parfaitement alignée en fonctionnement (à chaud).
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 63,
    part: "Techniques de Correction",
    title: "Croissance Thermique (Thermal Growth)",
    visualType: "none",
    content: (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Une machine s'aligne à froid. Mais en fonctionnement, la température monte et le métal se dilate. C'est la <strong>croissance thermique</strong>.
        </p>
        <div className="bg-slate-800 p-6 rounded-xl text-white">
          <h4 className="text-blue-400 font-bold mb-4">Calcul de l'Expansion</h4>
          <div className="text-2xl font-mono text-center bg-slate-700 py-4 rounded-xl mb-4">
            ΔL = L × α × ΔT
          </div>
          <p className="text-sm text-slate-300">
            <strong>ΔL</strong> = Expansion<br/>
            <strong>L</strong> = Hauteur de l'axe par rapport à la base<br/>
            <strong>α</strong> = Coefficient d'expansion du matériau (Acier : ~0.01 mm / mètre / °C)<br/>
            <strong>ΔT</strong> = Différence de température (Chaud - Froid)
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 64,
    part: "Diagnostic des Défauts",
    title: "Formulaire : Fréquences de Roulements",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Les roulements à éléments roulants génèrent des fréquences de défaut <strong>calculables à partir de la géométrie</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md border-l-4 border-emerald-400">
             <h4 className="font-bold text-emerald-400 mb-2">BPFO (Bague Extérieure)</h4>
             <div className="font-mono text-sm bg-slate-900 p-3 rounded mb-2">BPFO = (Nb/2) × Fr × (1 − (Bd/Pd) × cos φ)</div>
             <p className="text-xs text-slate-400">Règle empirique : BPFO ≈ 0.4 × Nb × Fr</p>
          </div>
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md border-l-4 border-red-400">
             <h4 className="font-bold text-red-400 mb-2">BPFI (Bague Intérieure)</h4>
             <div className="font-mono text-sm bg-slate-900 p-3 rounded mb-2">BPFI = (Nb/2) × Fr × (1 + (Bd/Pd) × cos φ)</div>
             <p className="text-xs text-slate-400">Règle empirique : BPFI ≈ 0.6 × Nb × Fr</p>
          </div>
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md border-l-4 border-amber-400">
             <h4 className="font-bold text-amber-400 mb-2">BSF (Élément Roulant)</h4>
             <div className="font-mono text-sm bg-slate-900 p-3 rounded mb-2">BSF = (Pd/2Bd) × Fr × (1 − ((Bd/Pd) × cos φ)²)</div>
             <p className="text-xs text-slate-400">Apparaît souvent avec harmoniques paires (2×BSF).</p>
          </div>
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md border-l-4 border-blue-400">
             <h4 className="font-bold text-blue-400 mb-2">FTF (Cage / Train)</h4>
             <div className="font-mono text-sm bg-slate-900 p-3 rounded mb-2">FTF = (Fr/2) × (1 − (Bd/Pd) × cos φ)</div>
             <p className="text-xs text-slate-400">Toujours inférieure à la vitesse de rotation (≈ 0.4X).</p>
          </div>
        </div>
        <div className="bg-slate-100 p-4 rounded text-sm text-slate-600 mt-4 font-mono">
          Variables : Nb = nb d'éléments | Bd = ⌀ élément | Pd = ⌀ primitif | φ = angle de contact | Fr = Vitesse (Hz)
        </div>
      </div>
    ),
  },
  {
    id: 65,
    part: "Diagnostic des Défauts",
    title: "Formulaire : Cinématique des Engrenages",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500">
        <p className="text-slate-700 leading-relaxed text-[1.1rem]">
          Le diagnostic des réducteurs repose sur l'identification de la <strong>GMF</strong> et de l'espacement des bandes latérales.
        </p>
        <div className="bg-white border-2 border-slate-200 p-6 rounded-xl shadow-sm mb-6">
           <h4 className="font-bold text-slate-800 mb-4 text-lg">1. Fréquence d'Engrènement (GMF)</h4>
           <div className="bg-indigo-50 text-indigo-900 font-mono text-xl text-center p-4 rounded-xl border border-indigo-200 shadow-inner">
              GMF = Z_pignon × f_pignon = Z_roue × f_roue
           </div>
           <p className="text-sm text-slate-500 text-center mt-3">Z = Nombre de dents | f = Fréquence de rotation de l'arbre (Hz)</p>
        </div>
        <div className="bg-white border-2 border-slate-200 p-6 rounded-xl shadow-sm">
           <h4 className="font-bold text-slate-800 mb-4 text-lg">2. Fréquence de Dent de Chasse (HTF)</h4>
           <p className="text-sm text-slate-600 mb-4">Indique la fréquence de retour en contact de la <em>même paire de dents</em>. Crucial pour détecter l'usure couplée.</p>
           <div className="bg-emerald-50 text-emerald-900 font-mono text-lg text-center p-4 rounded-xl border border-emerald-200 shadow-inner">
              HTF = (GMF × PGCD) / (Z_pignon × Z_roue)
           </div>
           <p className="text-sm text-slate-500 text-center mt-3">PGCD = Plus Grand Commun Diviseur entre Z_pignon et Z_roue</p>
        </div>
      </div>
    ),
  },
  {
    id: 66,
    part: "Diagnostic des Défauts",
    title: "Matrice de Diagnostic Rapide (Les 3 Grands)",
    visualType: "none",
    content: (
      <div className="w-full space-y-6 animate-in fade-in duration-500">
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="py-4 px-6 font-bold">Défaut</th>
                <th className="py-4 px-6 font-bold">Fréquence Dominante</th>
                <th className="py-4 px-6 font-bold">Direction Typique</th>
                <th className="py-4 px-6 font-bold">Comportement de la Phase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="py-4 px-6 font-bold text-blue-600">Balourd</td>
                <td className="py-4 px-6 font-mono font-medium">1X</td>
                <td className="py-4 px-6">Radial (H ou V)</td>
                <td className="py-4 px-6 text-slate-600">Déphasage de ~90° entre H et V sur le même palier. En phase d'un palier à l'autre.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-4 px-6 font-bold text-red-600">Désalignement</td>
                <td className="py-4 px-6 font-mono font-medium">1X, 2X, parfois 3X</td>
                <td className="py-4 px-6 font-bold">Axial & Radial</td>
                <td className="py-4 px-6 text-slate-600">Déphasage de ~180° à travers l'accouplement (axialement et radialement).</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-4 px-6 font-bold text-amber-600">Jeu Interne</td>
                <td className="py-4 px-6 font-mono font-medium">Harmoniques (1X à 10X)</td>
                <td className="py-4 px-6">Radial (Instable)</td>
                <td className="py-4 px-6 text-slate-600">Phase aléatoire et instable. Bruit de fond élevé (Clipping).</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-4 px-6 font-bold text-emerald-600">Jeu de Structure</td>
                <td className="py-4 px-6 font-mono font-medium">1X</td>
                <td className="py-4 px-6">Directif (Souvent V)</td>
                <td className="py-4 px-6 text-slate-600">Déphasage de ~180° entre le socle et le pied de la machine.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 67,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°1",
    visualType: "vector",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Un ventilateur tourne à 1500 tr/min. Le spectre de vitesse montre un pic très dominant à 25 Hz dans la direction radiale horizontale. En vertical, l'amplitude est très faible. Le déphasage H-V est instable.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            S'agit-il d'un balourd classique ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">NON. Un balourd génère une force tournante (circulaire), on devrait voir le pic en H ET en V avec un déphasage de 90°. Ici, la forte directionalité indique probablement une résonance de structure en horizontal, ou un jeu de structure grave.</p>
        </div>
      </div>
    ),
  },
  {
    id: 68,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°2",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Une pompe à 4 pôles (1485 tr/min) couplée à un moteur présente un pic énorme à 2X (49.5 Hz) en direction Axiale. On mesure le déphasage axial de part et d'autre de l'accouplement : il est de 178°.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Quel est le diagnostic immédiat et quelle est l'action corrective ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">Diagnostic : Désalignement angulaire sévère. Le déphasage de ~180° à travers l'accouplement est la signature absolue. L'action est d'arrêter la machine et d'effectuer un réalignement laser.</p>
        </div>
      </div>
    ),
  },
  {
    id: 69,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°3",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Réducteur : Un pignon de 23 dents (1740 tr/min) engrène avec une roue de 92 dents. Vous observez la GMF entourée de bandes latérales espacées de 7.25 Hz.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Calculez la GMF. Quel arbre porte le défaut (Pignon ou Roue) ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">Vitesse pignon = 1740 / 60 = 29 Hz. GMF = 23 × 29 = 667 Hz. 
Vitesse roue = 29 × (23/92) = 7.25 Hz. 
Les bandes latérales sont espacées de 7.25 Hz, ce qui correspond exactement à la vitesse de la roue. Le défaut (ex: dent abîmée) est donc sur la Roue.</p>
        </div>
      </div>
    ),
  },
  {
    id: 70,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°4",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Roulement : Vous mesurez un moteur à 2880 tr/min (48 Hz). Le spectre d'enveloppe montre des pics clairs à 149 Hz, 298 Hz et 447 Hz.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Identifiez la nature du défaut.
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">149 Hz / 48 Hz = 3.10X. 
Ce n'est pas un harmonique entier (3.0X). C'est la signature typique d'une BPFO (fréquence de bague extérieure). Les pics suivants sont les harmoniques 2×BPFO et 3×BPFO. 
Diagnostic : Écaillage de la bague extérieure (Stade 3).</p>
        </div>
      </div>
    ),
  },
  {
    id: 71,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°5",
    visualType: "waveform",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Moteur électrique (VFD) : Le spectre d'accélération montre un énorme "monticule" (Haystack) centré autour de 1500 Hz. À l'intérieur de ce monticule, on voit des pics espacés de la BPFO.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Quel phénomène particulier se produit ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">C'est la signature classique du Fluting (Courants de palier / EDM). Le variateur VFD génère des courants qui se déchargent à travers les billes, créant des micro-cratères (cannelures) sur la piste extérieure à la fréquence BPFO.</p>
        </div>
      </div>
    ),
  },
  {
    id: 72,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°6",
    visualType: "waveform",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Sur un compresseur, vous voyez le bruit de fond s'élever massivement aux basses fréquences (monticule en ski) lorsque la vanne d'admission est presque fermée.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Est-ce un défaut mécanique de roulement ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">Non, c'est un problème fluide : le Pompage (Surge) ou l'apparition de turbulences sévères. L'action corrective relève du procédé (rouvrir la vanne) et non de la maintenance mécanique.</p>
        </div>
      </div>
    ),
  },
  {
    id: 73,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°7",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Un spectre normal montre un pic à 1X très fin. En utilisant une fenêtre Flat-Top au lieu de Hanning, le pic devient beaucoup plus large à sa base.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Avez-vous créé un défaut ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">Non. La fenêtre Flat-Top sacrifie la résolution fréquentielle (le pic s'élargit) pour garantir une amplitude parfaite (erreur d'amplitude &lt; 0.1%). C'est un artefact de traitement du signal.</p>
        </div>
      </div>
    ),
  },
  {
    id: 74,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°8",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Calcul de Fmax : Vous voulez diagnostiquer l'engrenage d'une boîte de vitesse dont la GMF est de 800 Hz. Quel Fmax minimum devez-vous configurer dans votre collecteur ?</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Donnez la valeur et justifiez.
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">La norme veut qu'on capture au moins jusqu'à 3×GMF pour voir les harmoniques d'engrènement. Fmax min = 3 × 800 = 2400 Hz. (On choisira un réglage standard de 2500 Hz ou 3200 Hz selon l'appareil).</p>
        </div>
      </div>
    ),
  },
  {
    id: 75,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°9",
    visualType: "waveform",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Lors du contrôle d'un moteur, l'amplitude globale RMS a doublé, mais le facteur de crête a diminué.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Que signifie cette évolution contradictoire ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">Le défaut de roulement vient de passer du Stade 3 au Stade 4. Les impacts nets (qui faisaient monter la crête) se sont transformés en un frottement aléatoire continu (qui fait exploser le RMS, mais lisse le signal temporel, réduisant le facteur de crête). Casse imminente.</p>
        </div>
      </div>
    ),
  },
  {
    id: 76,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°10",
    visualType: "vector",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Un ventilateur en porte-à-faux vibre très fort à 1X en Axial, mais le déphasage à travers l'accouplement n'est pas de 180°.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Si ce n'est pas un désalignement, qu'est-ce que c'est ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">Sur un rotor en porte-à-faux (Overhung rotor), le balourd crée un couple de renversement important. Cela génère une force axiale à 1X qui mime le désalignement. Toujours équilibrer un porte-à-faux avant de s'acharner sur l'alignement.</p>
        </div>
      </div>
    ),
  },
  {
    id: 77,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°11",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Vous mesurez un spectre avec un Fmax de 1000 Hz et 800 lignes de résolution. Vous observez un pic à 49 Hz, mais la vitesse de la machine est exactement de 3000 tr/min (50 Hz).</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            S'agit-il du 1X ou d'une autre source ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">La résolution est Δf = Fmax / Nlignes = 1000 / 800 = 1.25 Hz. 
Le pic à 49 Hz et le 1X (50 Hz) sont trop proches pour être séparés nettement, mais s'il s'agit d'un moteur asynchrone, ce 49 Hz (glissement) est très probablement la fréquence de passage des barres rotoriques ou une vibration électrique.</p>
        </div>
      </div>
    ),
  },
  {
    id: 78,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°12",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Le technicien déplace son accéléromètre de sa base magnétique vers une pointe de touche longue pour atteindre un roulement difficile d'accès. L'enveloppe HF disparaît.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Le roulement est-il guéri ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">Non ! La pointe de touche a une fréquence de résonance très basse (≈ 1 kHz) et agit comme un filtre mécanique passe-bas. Elle a physiquement empêché les hautes fréquences (impacts du roulement) d'atteindre le cristal piézoélectrique.</p>
        </div>
      </div>
    ),
  },
  {
    id: 79,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°13",
    visualType: "waveform",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">L'Onde de Contrainte (Spike Energy / SPM) dépasse le seuil d'alarme critique sur une pompe neuve qui vient d'être démarrée.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Le roulement est-il déjà écaillé ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">Probablement pas. Sur une machine neuve, les ondes de contrainte HF explosent si la lubrification est inadéquate (film d'huile absent, cavitation, ou frottement des joints). Graissez le palier et observez si l'énergie chute instantanément.</p>
        </div>
      </div>
    ),
  },
  {
    id: 80,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°14",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Dans un réducteur planétaire, l'analyse vibratoire classique (spectre) est illisible, remplie de centaines de bandes latérales.</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Quelle technique mathématique devez-vous appliquer pour isoler le défaut d'un satellite ?
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">Le Fenêtrage Temporel Synchrone (Time Synchronous Averaging - TSA). En utilisant un tachymètre pour déclencher l'acquisition exactement au même angle de l'arbre porteur, le TSA annule tout le bruit non-synchrone et isole la signature pure du satellite.</p>
        </div>
      </div>
    ),
  },
  {
    id: 81,
    part: "Études de Cas / Exercices",
    title: "Étude de Cas Pratique N°15",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-6 shadow-sm">
          <h4 className="font-bold text-indigo-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">Q</span> Le Scénario
          </h4>
          <p className="text-slate-700 text-[1.1rem] leading-relaxed mb-4">Croissance Thermique : Une turbine à vapeur s'élève de ΔT = 200°C en fonctionnement. Sa hauteur d'axe est L = 1 mètre. (α acier = 0.01 mm/m/°C).</p>
          <div className="bg-white p-4 rounded-xl border border-slate-200 font-medium text-slate-800">
            Calculez l'expansion verticale (Thermal Growth).
          </div>
        </div>
        
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm">
          <h4 className="font-bold text-emerald-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">R</span> Diagnostic Expert
          </h4>
          <p className="text-emerald-800 leading-relaxed font-medium whitespace-pre-line">ΔL = L × α × ΔT 
ΔL = 1 × 0.01 × 200 = 2 mm. 
L'axe de la turbine va monter de 2 millimètres à chaud ! Il faut donc l'aligner à froid 2 mm PLUS BAS que la machine entraînée.</p>
        </div>
      </div>
    ),
  },
  {
    id: 82,
    part: "Fiches Techniques & Références",
    title: "Galerie des Spectres : Balourd",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Galerie des Spectres : Balourd
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Spectre dominé par un pic énorme à 1X. Pas d'harmoniques significatives. L'onde temporelle est une sinusoïde parfaite. Déphasage radial H-V de 90°.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 83,
    part: "Fiches Techniques & Références",
    title: "Galerie des Spectres : Désalignement",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Galerie des Spectres : Désalignement
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Spectre dominé par 1X et 2X (le 2X est souvent plus grand que le 1X). Forte présence d'énergie axiale. L'onde temporelle montre souvent un signal en 'M' ou en 'W'.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 84,
    part: "Fiches Techniques & Références",
    title: "Galerie des Spectres : Jeu Mécanique",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Galerie des Spectres : Jeu Mécanique
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Spectre en 'Peigne' : Harmoniques du 1X multiples (1X, 2X, 3X, 4X... jusqu'à 10X). Le bruit de fond monte. L'onde temporelle est tronquée (clipping) indiquant des chocs erratiques.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 85,
    part: "Fiches Techniques & Références",
    title: "Galerie des Spectres : Défaut de Roulement (Enveloppe)",
    visualType: "spectrum",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Galerie des Spectres : Défaut de Roulement (Enveloppe)
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Le spectre vitesse normal est propre. L'analyse d'enveloppe révèle un "Peigne" de fréquences non-synchrones (ex: 3.14X, 6.28X, 9.42X) prouvant un défaut sur la piste externe (BPFO).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 86,
    part: "Fiches Techniques & Références",
    title: "Galerie des Spectres : Cavitation de Pompe",
    visualType: "waveform",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Galerie des Spectres : Cavitation de Pompe
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Spectre caractérisé par un énorme monticule aléatoire (Haystack) en haute fréquence. L'onde temporelle montre des pointes aléatoires violentes. Le bruit acoustique ressemble à du gravier dans la pompe.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 87,
    part: "Fiches Techniques & Références",
    title: "Fiche Norme ISO 10816 - Machines Fixes",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Fiche Norme ISO 10816 - Machines Fixes
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            La norme classe les machines en 4 catégories selon leur rigidité et leur puissance. Les alarmes se basent sur la VITESSE RMS (10-1000 Hz). Ne détecte PAS les défauts précoces de roulements.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 88,
    part: "Fiches Techniques & Références",
    title: "Fiche Référence : Fenêtrage (Windowing)",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Fiche Référence : Fenêtrage (Windowing)
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Hanning : Par défaut, excellent compromis.
Uniforme : Uniquement pour l'analyse des transitoires (chocs courts).
Flat-Top : Pour l'étalonnage exact des amplitudes.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 89,
    part: "Fiches Techniques & Références",
    title: "Règle Pratique : Temps d'Acquisition",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Règle Pratique : Temps d'Acquisition
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            T = Nlignes / Fmax. 
Exemple : 800 lignes / 1000 Hz = 0.8 secondes d'acquisition par moyenne. 
Pour 4 moyennes (overlap 50%), le temps total est de 2 secondes.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 90,
    part: "Fiches Techniques & Références",
    title: "Fiche Référence : Fréquence d'Échantillonnage",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Fiche Référence : Fréquence d'Échantillonnage
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            F_echantillonnage = 2.56 × Fmax. 
Le filtre anti-repliement (anti-aliasing) coupe tout signal situé au-delà de Fmax pour éviter la création de fréquences fantômes.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 91,
    part: "Fiches Techniques & Références",
    title: "Fiche : Onde de Contrainte (Spike Energy)",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Fiche : Onde de Contrainte (Spike Energy)
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Mesure l'énergie relâchée par la propagation de micro-fissures (Emission Acoustique). C'est le tout premier indicateur de la courbe P-F. Ultra-sensible à la mauvaise lubrification.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 92,
    part: "Fiches Techniques & Références",
    title: "Analyse P-F : Lubrification",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Analyse P-F : Lubrification
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Stade P : Hausse des ondes de contrainte.
Action : Ajouter 2 grammes de graisse. L'énergie chute immédiatement. Si elle ne chute pas, le roulement a commencé à s'écailler.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 93,
    part: "Fiches Techniques & Références",
    title: "Cheat Sheet : Phase d'un Rotor Suspendu",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Cheat Sheet : Phase d'un Rotor Suspendu
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Sur une machine verticale, un balourd donne un déphasage en phase tout autour du palier ? NON ! La phase tourne avec le capteur. C'est une signature circulaire.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 94,
    part: "Fiches Techniques & Références",
    title: "Formule : Résonance (Fréquence Propre)",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Formule : Résonance (Fréquence Propre)
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Fn = (1 / 2π) × √(K / M)
Si on ajoute de la masse (M), la fréquence propre chute. 
Si on augmente la rigidité (K), la fréquence propre monte.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 95,
    part: "Fiches Techniques & Références",
    title: "Checklist : Test d'Impact (Bump Test)",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Checklist : Test d'Impact (Bump Test)
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Machine à l'arrêt. Frapper la structure avec un marteau instrumenté. Le spectre montrera un pic à la fréquence propre Fn. Si Fn ≈ 1X de la machine, danger de résonance.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 96,
    part: "Fiches Techniques & Références",
    title: "Formule : Diagramme de Bode",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Formule : Diagramme de Bode
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Trace l'amplitude et la phase en fonction de la vitesse (au démarrage ou à l'arrêt). La résonance est caractérisée par un pic d'amplitude suivi d'un déphasage net de 90°.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 97,
    part: "Fiches Techniques & Références",
    title: "Cheat Sheet : Bandes Latérales",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Cheat Sheet : Bandes Latérales
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            La source de modulation (l'arbre qui tourne mal) crée les bandes latérales autour de la fréquence porteuse (Engrènement). L'espacement en Hz = Vitesse de l'arbre fautif.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 98,
    part: "Fiches Techniques & Références",
    title: "Cheat Sheet : Unités de Mesure",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Cheat Sheet : Unités de Mesure
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Déplacement (µm) : Basses fréquences (&lt; 10 Hz) (Balourd massif).
Vitesse (mm/s RMS) : Fréquences moyennes (10-1000 Hz) (Désalignement, balourd standard).
Accélération (g) : Hautes fréquences (&gt; 1000 Hz) (Roulements, Engrenages).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 99,
    part: "Fiches Techniques & Références",
    title: "Formulaire Récapitulatif Final",
    visualType: "none",
    content: (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in duration-500">
        <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500">
          <h4 className="font-bold text-emerald-400 mb-6 text-2xl border-b border-slate-700 pb-4">
            Formulaire Récapitulatif Final
          </h4>
          <p className="text-slate-200 text-xl leading-relaxed whitespace-pre-line font-medium">
            Pensez toujours à : 
1. Regarder l'historique (Tendance).
2. Écouter la machine.
3. Ne jamais ignorer un déphasage.
4. Si le RMS est stable mais que le pic monte, c'est un choc (Facteur de crête).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 100,
    part: "Quiz 5",
    title: "Test de Connaissances - Partie V",
    visualType: "quiz",
    quizData: {
      timeLimitSeconds: 200,
      questions: [
        { id: "q1", question: "L'équilibrage sur site (1 plan) utilise la méthode :", options: [
            { id: "a", text: "Des coefficients d'influence avec une masse d'essai", isCorrect: true, explanation: "Correct ! On ajoute une masse pour mesurer la réaction du système." },
            { id: "b", text: "De l'enveloppe spectrale", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q2", question: "Le pied mou (Soft Foot) doit être corrigé :", options: [
            { id: "a", text: "Après l'alignement final", isCorrect: false, explanation: "Faux. Le pied mou faussera toutes vos mesures d'alignement." },
            { id: "b", text: "Avant de commencer tout alignement au laser", isCorrect: true, explanation: "Correct ! C'est la règle d'or." }
        ]},
        { id: "q3", question: "L'expansion thermique d'un carter de pompe à fluide chaud :", options: [
            { id: "a", text: "Oblige à désaligner volontairement les machines à froid (Thermal Targets)", isCorrect: true, explanation: "Correct ! Pour qu'elles soient parfaitement alignées à chaud." },
            { id: "b", text: "N'a aucun impact sur l'alignement.", isCorrect: false, explanation: "Faux." }
        ]},
        { id: "q4", question: "L'équilibrage 2 plans (Dynamique) est nécessaire pour :", options: [
            { id: "a", text: "Les rotors très étroits (poulies fines)", isCorrect: false, explanation: "Faux. 1 plan suffit." },
            { id: "b", text: "Les rotors longs (cylindres, turbines)", isCorrect: true, explanation: "Correct ! Le balourd génère un couple sur l'axe." }
        ]},
        { id: "q5", question: "Pour corriger un désalignement horizontal, on utilise :", options: [
            { id: "a", text: "Des cales (shims) sous les pieds", isCorrect: false, explanation: "Faux. Ça c'est pour le vertical." },
            { id: "b", text: "Des vérins de réglage (Jacking bolts) pour pousser la machine latéralement", isCorrect: true, explanation: "Correct !" }
        ]}
      ]
    },
    content: ( <div className="hidden"></div> ),
  },
  {
    id: 101,
    part: "Évaluations",
    title: "Évaluations et Validation des Acquis",
    visualType: "none",
    isCover: true,
    content: (
      <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <p className="text-xl md:text-2xl font-light text-blue-100/80 leading-relaxed text-center max-w-3xl mt-8">
          Préparez-vous pour l'examen de certification de Niveau 2. 
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl text-left">
           <div className="bg-white/10 backdrop-blur border border-white/20 p-6 rounded-2xl">
             <h4 className="text-white font-bold text-lg mb-2">Exercices</h4>
             <p className="text-blue-100 text-sm">Calculs de fréquence, résolutions, Fmax.</p>
           </div>
           <div className="bg-white/10 backdrop-blur border border-white/20 p-6 rounded-2xl">
             <h4 className="text-white font-bold text-lg mb-2">Cas Réels</h4>
             <p className="text-blue-100 text-sm">Spectres mystères à diagnostiquer avec l'instructeur.</p>
           </div>
           <div className="bg-white/10 backdrop-blur border border-white/20 p-6 rounded-2xl">
             <h4 className="text-white font-bold text-lg mb-2">QCM Général</h4>
             <p className="text-blue-100 text-sm">Questions normatives (ISO) et fondamentaux.</p>
           </div>
        </div>
      </div>
    ),
  },
  {
    id: 102,
    part: "Pratique",
    title: "Pratique Essentiel & Outils OCP MS",
    visualType: "none",
    isCover: true,
    content: (
      <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <p className="text-xl md:text-2xl font-light text-emerald-100/80 leading-relaxed text-center max-w-3xl mt-8">
          Mise en pratique sur vos équipements et plateformes :
        </p>

        <div className="mt-12 space-y-4 text-white text-lg font-medium w-full max-w-2xl text-left">
           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              Collecteur de données : Maîtriser <strong>MobiVib</strong>.
           </div>
           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              Plateforme d'analyse : Utiliser <strong>i-Sense</strong> pour décoder les spectres.
           </div>
           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              Banc d'essai : Provoquer des défauts mécaniques réels.
           </div>
           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
              Rapports : Rédiger un compte-rendu clair et actionnable.
           </div>
        </div>
      </div>
    ),
  },
  {
    id: 103,
    part: "Fin",
    title: "Fin de la présentation Niveau 2",
    visualType: "none",
    isCover: true,
    content: (
      <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-widest drop-shadow-md">Merci.</h2>
        <p className="text-xl font-light text-blue-100/90 leading-relaxed text-center max-w-2xl mt-4">
          OCP Maintenance Solutions — L'excellence de la fiabilité.
        </p>
      </div>
    ),
  }








];