# Cahier des Charges Technique 3D (Spécifications Dimensionnelles)

Ce document est le guide technique **étape par étape** pour modéliser les assets 3D de l'application VibLab PRO. Les dimensions fournies correspondent **exactement** au code de simulation physique. Un non-respect de ces dimensions entraînera un décalage (chevauchement) lors de l'intégration web.

> **Règle d'or :** 1 Unité Blender = 1 Mètre dans l'application. Appliquez toujours l'échelle (Ctrl+A > Scale) avant l'export.

---

## Étape 1 : Le Système Global (Moteur + Pompe + Embase)

Créez un nouveau fichier Blender. Ce fichier contiendra l'ensemble de la machine sur son embase.

### 1.1 L'Embase (Baseplate)
- **Dimensions :** Longueur (X) = 6.5m | Hauteur (Y) = 0.3m | Profondeur (Z) = 3.2m
- **Position de l'objet (Origine globale) :** X = 0, Y = -1.35, Z = 0
- **Détails :** Bloc métallique massif avec des chanfreins.
- **Nom du Mesh :** `Baseplate`

### 1.2 Le Moteur (Carcasse)
- **Forme de base :** Cylindre horizontal le long de l'axe X.
- **Dimensions :** Diamètre = 1.8m (Rayon = 0.9m) | Longueur (X) = 2.0m
- **Position de l'origine (Pivot) :** X = -1.8, Y = -0.4, Z = 0
- **Détails :** Ajoutez des ailettes de refroidissement, une boîte à bornes sur le dessus, des anneaux de levage. Ne modélisez PAS l'arbre ici.
- **Nom du Mesh :** `Motor_Casing`

### 1.3 Les Pieds du Moteur (Important pour l'animation de desserrage)
Modélisez 4 pieds séparés de la carcasse.
- **Dimensions de chaque pied :** X = 0.3m | Y = 0.4m | Z = 1.0m
- **Positions relatives (par rapport à l'origine du moteur X=-1.8, Y=-0.4) :**
  - Pied Avant Gauche : `X = 0.6, Y = -0.6, Z = 0.6`
  - Pied Avant Droit : `X = 0.6, Y = -0.6, Z = -0.6`
  - Pied Arrière Gauche : `X = -0.6, Y = -0.6, Z = 0.6`
  - Pied Arrière Droit : `X = -0.6, Y = -0.6, Z = -0.6`
- **Noms des Meshes :** `Motor_Foot_FL`, `Motor_Foot_FR`, `Motor_Foot_RL`, `Motor_Foot_RR`

### 1.4 Les Boulons (Fixations)
Pour chaque pied, modélisez un boulon détaillé (Tige, Rondelle Plate, Rondelle Grover fendue, Écrou).
- **Position :** Placés exactement sur le bord des pieds (ex: local Z=0.9 par rapport au moteur).
- **Règle stricte :** Pour le pied Avant Gauche (`Motor_Foot_FL`), **SÉPAREZ l'écrou et la rondelle** du reste de la tige. Nommez-les `Bolt_Nut_Loose` et `Bolt_Washer_Loose`. Le développeur va les animer (les faire trembler et monter).

---

## Étape 2 : L'Arbre de Transmission & Accouplement (Pièces Rotatives)

**TRÈS IMPORTANT :** Tous ces éléments tournent. Leur point d'origine doit être exactement sur la ligne d'axe central (`Y = -0.4, Z = 0`).

### 2.1 L'Arbre Moteur (Motor Shaft)
- **Dimensions :** Diamètre = 0.22m (Rayon = 0.11m) | Longueur (X) = 4.0m
- **Position de l'origine :** X = -1.67, Y = -0.4, Z = 0
- **Détails :** Cylindre lisse, ajoutez une rainure de clavette pour le réalisme.
- **Nom du Mesh :** `Motor_Shaft`

### 2.2 L'Accouplement (Flanges)
Composé de deux moitiés distinctes.
- **Moitié Moteur :** Disque de Diamètre 0.96m, Épaisseur 0.12m. **Position :** X = 0.33, Y = -0.4, Z = 0.
- **Moitié Pompe :** Disque de Diamètre 0.96m, Épaisseur 0.12m. **Position :** X = 0.47, Y = -0.4, Z = 0.
- **Détails :** Modélisez les boulons qui relient les deux brides.
- **Noms des Meshes :** `Coupling_MotorSide`, `Coupling_PumpSide`

---

## Étape 3 : La Pompe Centrifuge

### 3.1 Corps de Pompe (Volute)
- **Forme :** Type "Escargot" (Tore évolutif). 
- **Centre de la pompe :** X = 1.8, Y = -0.4, Z = 0
- **Tuyau d'aspiration (Inlet) :** Cylindre axial vers la droite. Bride à X = 2.75.
- **Tuyau de refoulement (Outlet) :** Cylindre vertical vers le haut. Bride à Y = 0.5.
- **Nom du Mesh :** `Pump_Casing`

### 3.2 Pieds de la Pompe
- **Dimensions :** Supportent la volute jusqu'à l'embase. Base à Y = -1.35.
- **Nom du Mesh :** `Pump_Feet`

### 3.3 Arbre de la Pompe (Pump Shaft)
- **Dimensions :** Diamètre = 0.22m | Longueur = 1.8m
- **Position de l'origine :** X = 1.37, Y = -0.4, Z = 0
- **Nom du Mesh :** `Pump_Shaft`

### 3.4 Turbine (Impeller)
- **Emplacement :** À l'intérieur de la volute de la pompe.
- **Position de l'origine :** X = 1.8, Y = -0.4, Z = 0. (Doit tourner parfaitement rond).
- **Détails :** 7 pales incurvées soudées sur un flasque de Diamètre 0.48m.
- **Nom du Mesh :** `Pump_Impeller`

---

## Étape 4 : Règles d'Exportation pour Three.js

Une fois la scène de la machine terminée :

1. **Hiérarchie :** Laissez les objets "à plat" dans Blender (sans parentage complexe), le code se chargera de recréer les groupes de rotation (`Group` Three.js).
2. **Appliquer les transformations :** Sélectionnez tout > `Ctrl + A` > `All Transforms`.
3. **Format :** Fichier > Exporter > glTF 2.0 (`.glb`).
4. **Options critiques :**
   - Geometry : Cocher `Apply Modifiers`.
   - Transform : Cocher `+Y Up` (Sinon la machine sera couchée sur le côté dans le navigateur).
   - Materials : Assurez-vous que les textures sont packées (exportées dans le `.glb`).

---

## Étape 5 : Le Roulement à Billes (Bearing)

Ce composant sera visualisé en gros plan et de manière isolée. L'axe de rotation est l'**Axe Z**.

### 5.1 Séparation des pièces
- `Outer_Ring` : Bague extérieure (Fixe).
- `Inner_Ring` : Bague intérieure (Tourne).
- `Cage` : La cage qui maintient les billes (Tourne).
- `Ball_01` à `Ball_08` : **Huit billes séparées**. (Crucial : le code anime chaque bille indépendamment pour simuler le passage sur un défaut).
- `Defect_Outer`, `Defect_Inner` : Petits éclats/fissures (le code gérera leur opacité).

### 5.2 Origines et Alignement
- **Origine Globale (0,0,0) :** Au centre exact du roulement.
- **Axe de rotation :** Axe Z.
- **Origine des billes :** Chaque bille `Ball_XX` doit avoir son point d'origine en son **propre centre géométrique** (pour pouvoir tourner sur elle-même).

---

## Étape 6 : Le Système d'Engrenages (Gears)

Deux roues dentées (engrenage cylindrique à denture droite). L'axe de rotation est l'**Axe Z**. Les centres des roues sont alignés sur l'**Axe X**.

### 6.1 Pièces et Dimensions relatives
- `Gear_Driver` (Pignon) : Ex. 18 dents. Denture involute réaliste. Origine en son centre.
- `Gear_Driven` (Roue menée) : Ex. 36 dents. Origine en son centre.
- **Placement :** 
  - Placer `Gear_Driver` à `X = -Entraxe/2, Y = 0, Z = 0`.
  - Placer `Gear_Driven` à `X = Entraxe/2, Y = 0, Z = 0`.
  - Les dents doivent s'emboîter parfaitement à `X = 0`.

---

## Étape 7 : Le Module d'Équilibrage (Unbalance Rotor)

Un banc d'essai pour le balourd. L'axe de rotation est l'**Axe X**.

### 7.1 Pièces
- `Baseplate_Unbalance` : Embase.
- `Bearing_Block_Left`, `Bearing_Block_Right` : Les deux paliers (statiques).
- `Rotor_Shaft` : Arbre central. **Axe X**.
- `Balance_Disk_Left`, `Balance_Disk_Right` : Plateaux d'équilibrage fixés sur l'arbre.
  - **Détail critique :** Modéliser ou texturer des repères angulaires (trous taraudés tous les 15° ou 30°) sur la face externe des plateaux.
- `Trial_Mass_01` (Vis de pression), `Trial_Mass_02` (Contrepoids) : Modélisez 2 ou 3 types de masses de formes différentes. Placez-les à l'origine `(0,0,0)`. Le développeur les déplacera dynamiquement sur les disques.

---

## Étape 8 : Le Ventilateur Industriel (Fan)

Un gros ventilateur centrifuge (soufflerie). L'axe de rotation est l'**Axe Z**.

### 8.1 Pièces
- `Fan_Base` : Embase du ventilateur.
- `Fan_Casing` : Volute (escargot) avec aspiration axiale (vers Z) et refoulement tangentiel.
- `Fan_Shaft` : Arbre d'entraînement. **Axe Z**.
- `Fan_Impeller` : Roue à aubes (rotor du ventilateur). 
  - **Détails :** Modélisez les pales avec un niveau de détail élevé (soudures, usure, poussière asymétrique) pour que la rotation soit visuellement évidente. **Origine au centre de rotation (0,0,0)**.
