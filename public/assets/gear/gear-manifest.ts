/**
 * GEAR — manifeste du matériel réel d'Anass (généré depuis public/assets/gear/).
 *
 * - `views` : vues réellement photographiées, détourées (PNG alpha, détourage sans retouche générative).
 *   L'ordre suit les fichiers ; ce n'est PAS un 360° : n'utiliser que ces angles, n'en fabriquer aucun.
 * - `originalOnly` : photos conservées telles quelles (vue d'ensemble, objet non isolable proprement).
 * - `modelConfirmed: false` : le modèle exact n'est pas certain — ne pas l'afficher plus précisément.
 * - `GEAR_SETUP` : photos d'ensemble + vidéo panoramique, pour la composition générale de la section.
 */

export type GearView = {
  /** Angle tel que nommé dans le fichier (ex. "vue-face", "trois-quarts-arriere-droit"). */
  view: string;
  label: string;
  /** Photo d'origine, intacte. */
  original: string;
  /** PNG détouré (fond transparent). */
  src: string;
  width: number;
  height: number;
};

export type GearOriginalView = { view: string; label: string; original: string };

export type GearManifestItem = {
  id: string;
  name: string;
  category: string;
  modelConfirmed: boolean;
  /** Raccourci : chemins des PNG détourés, dans l'ordre des vues. */
  images: string[];
  views: GearView[];
  originalOnly: GearOriginalView[];
};

export const GEAR_MANIFEST: GearManifestItem[] = [
  {
    "id": "canon-eos-r6-mark-ii",
    "name": "Canon EOS R6 Mark II",
    "category": "Boîtier photo / vidéo",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/canon-eos-r6-mark-ii-trois-quarts-avant-transparent.png",
      "/assets/gear/transparent/canon-eos-r6-mark-ii-vue-arriere-transparent.png",
      "/assets/gear/transparent/canon-eos-r6-mark-ii-vue-dessus-transparent.png",
      "/assets/gear/transparent/canon-eos-r6-mark-ii-vue-face-transparent.png"
    ],
    "views": [
      {
        "view": "trois-quarts-avant",
        "label": "Trois-quarts avant",
        "original": "/assets/gear/originals/canon-eos-r6-mark-ii-trois-quarts-avant.jpg",
        "src": "/assets/gear/transparent/canon-eos-r6-mark-ii-trois-quarts-avant-transparent.png",
        "width": 2300,
        "height": 1849
      },
      {
        "view": "vue-arriere",
        "label": "Arrière",
        "original": "/assets/gear/originals/canon-eos-r6-mark-ii-vue-arriere.jpg",
        "src": "/assets/gear/transparent/canon-eos-r6-mark-ii-vue-arriere-transparent.png",
        "width": 2203,
        "height": 1666
      },
      {
        "view": "vue-dessus",
        "label": "Dessus",
        "original": "/assets/gear/originals/canon-eos-r6-mark-ii-vue-dessus.jpg",
        "src": "/assets/gear/transparent/canon-eos-r6-mark-ii-vue-dessus-transparent.png",
        "width": 1319,
        "height": 1945
      },
      {
        "view": "vue-face",
        "label": "Face",
        "original": "/assets/gear/originals/canon-eos-r6-mark-ii-vue-face.jpg",
        "src": "/assets/gear/transparent/canon-eos-r6-mark-ii-vue-face-transparent.png",
        "width": 2395,
        "height": 1842
      }
    ],
    "originalOnly": []
  },
  {
    "id": "canon-rf-70-200mm-f2-8-l-is-usm",
    "name": "Canon RF 70-200mm F2.8 L IS USM",
    "category": "Objectif",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/canon-rf-70-200mm-f2-8-l-is-usm-trois-quarts-arriere-transparent.png",
      "/assets/gear/transparent/canon-rf-70-200mm-f2-8-l-is-usm-trois-quarts-avant-transparent.png",
      "/assets/gear/transparent/canon-rf-70-200mm-f2-8-l-is-usm-vue-dessus-transparent.png"
    ],
    "views": [
      {
        "view": "trois-quarts-arriere",
        "label": "Trois-quarts arrière",
        "original": "/assets/gear/originals/canon-rf-70-200mm-f2-8-l-is-usm-trois-quarts-arriere.jpg",
        "src": "/assets/gear/transparent/canon-rf-70-200mm-f2-8-l-is-usm-trois-quarts-arriere-transparent.png",
        "width": 2649,
        "height": 1951
      },
      {
        "view": "trois-quarts-avant",
        "label": "Trois-quarts avant",
        "original": "/assets/gear/originals/canon-rf-70-200mm-f2-8-l-is-usm-trois-quarts-avant.jpg",
        "src": "/assets/gear/transparent/canon-rf-70-200mm-f2-8-l-is-usm-trois-quarts-avant-transparent.png",
        "width": 2376,
        "height": 2210
      },
      {
        "view": "vue-dessus",
        "label": "Dessus",
        "original": "/assets/gear/originals/canon-rf-70-200mm-f2-8-l-is-usm-vue-dessus.jpg",
        "src": "/assets/gear/transparent/canon-rf-70-200mm-f2-8-l-is-usm-vue-dessus-transparent.png",
        "width": 1332,
        "height": 2917
      }
    ],
    "originalOnly": []
  },
  {
    "id": "canon-ef-24-70mm-f2-8-l-ii-usm",
    "name": "Canon EF 24-70mm f/2.8L II USM",
    "category": "Objectif",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/canon-ef-24-70mm-f2-8-l-ii-usm-vue-dessus-transparent.png",
      "/assets/gear/transparent/canon-ef-24-70mm-f2-8-l-ii-usm-vue-face-avec-pare-soleil-transparent.png",
      "/assets/gear/transparent/canon-ef-24-70mm-f2-8-l-ii-usm-vue-laterale-transparent.png",
      "/assets/gear/transparent/canon-ef-24-70mm-f2-8-l-ii-usm-vue-optique-face-transparent.png"
    ],
    "views": [
      {
        "view": "vue-dessus",
        "label": "Dessus",
        "original": "/assets/gear/originals/canon-ef-24-70mm-f2-8-l-ii-usm-vue-dessus.jpg",
        "src": "/assets/gear/transparent/canon-ef-24-70mm-f2-8-l-ii-usm-vue-dessus-transparent.png",
        "width": 1470,
        "height": 3000
      },
      {
        "view": "vue-face-avec-pare-soleil",
        "label": "Face, pare-soleil",
        "original": "/assets/gear/originals/canon-ef-24-70mm-f2-8-l-ii-usm-vue-face-avec-pare-soleil.jpg",
        "src": "/assets/gear/transparent/canon-ef-24-70mm-f2-8-l-ii-usm-vue-face-avec-pare-soleil-transparent.png",
        "width": 1507,
        "height": 3000
      },
      {
        "view": "vue-laterale",
        "label": "Latérale",
        "original": "/assets/gear/originals/canon-ef-24-70mm-f2-8-l-ii-usm-vue-laterale.jpg",
        "src": "/assets/gear/transparent/canon-ef-24-70mm-f2-8-l-ii-usm-vue-laterale-transparent.png",
        "width": 2922,
        "height": 1725
      },
      {
        "view": "vue-optique-face",
        "label": "Optique, face",
        "original": "/assets/gear/originals/canon-ef-24-70mm-f2-8-l-ii-usm-vue-optique-face.jpg",
        "src": "/assets/gear/transparent/canon-ef-24-70mm-f2-8-l-ii-usm-vue-optique-face-transparent.png",
        "width": 1850,
        "height": 1700
      }
    ],
    "originalOnly": []
  },
  {
    "id": "canon-rf-50mm-f1-8-stm",
    "name": "Canon RF 50mm F1.8 STM",
    "category": "Objectif",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/canon-rf-50mm-f1-8-stm-trois-quarts-dessus-transparent.png",
      "/assets/gear/transparent/canon-rf-50mm-f1-8-stm-vue-face-transparent.png"
    ],
    "views": [
      {
        "view": "trois-quarts-dessus",
        "label": "Trois-quarts dessus",
        "original": "/assets/gear/originals/canon-rf-50mm-f1-8-stm-trois-quarts-dessus.jpg",
        "src": "/assets/gear/transparent/canon-rf-50mm-f1-8-stm-trois-quarts-dessus-transparent.png",
        "width": 1910,
        "height": 2077
      },
      {
        "view": "vue-face",
        "label": "Face",
        "original": "/assets/gear/originals/canon-rf-50mm-f1-8-stm-vue-face.jpg",
        "src": "/assets/gear/transparent/canon-rf-50mm-f1-8-stm-vue-face-transparent.png",
        "width": 1655,
        "height": 1630
      }
    ],
    "originalOnly": []
  },
  {
    "id": "canon-batteries-chargeur",
    "name": "Batteries et chargeur Canon",
    "category": "Alimentation",
    "modelConfirmed": false,
    "images": [
      "/assets/gear/transparent/canon-batteries-chargeur-vue-trois-quarts-transparent.png"
    ],
    "views": [
      {
        "view": "vue-trois-quarts",
        "label": "Trois-quarts",
        "original": "/assets/gear/originals/canon-batteries-chargeur-vue-trois-quarts.jpg",
        "src": "/assets/gear/transparent/canon-batteries-chargeur-vue-trois-quarts-transparent.png",
        "width": 1687,
        "height": 1526
      }
    ],
    "originalOnly": []
  },
  {
    "id": "dji-avata-2",
    "name": "DJI Avata 2",
    "category": "Drone FPV",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/dji-avata-2-trois-quarts-arriere-droit-transparent.png",
      "/assets/gear/transparent/dji-avata-2-trois-quarts-arriere-gauche-transparent.png",
      "/assets/gear/transparent/dji-avata-2-vue-dessous-transparent.png",
      "/assets/gear/transparent/dji-avata-2-vue-dessus-transparent.png",
      "/assets/gear/transparent/dji-avata-2-vue-face-transparent.png"
    ],
    "views": [
      {
        "view": "trois-quarts-arriere-droit",
        "label": "Trois-quarts arrière droit",
        "original": "/assets/gear/originals/dji-avata-2-trois-quarts-arriere-droit.jpg",
        "src": "/assets/gear/transparent/dji-avata-2-trois-quarts-arriere-droit-transparent.png",
        "width": 3000,
        "height": 1299
      },
      {
        "view": "trois-quarts-arriere-gauche",
        "label": "Trois-quarts arrière gauche",
        "original": "/assets/gear/originals/dji-avata-2-trois-quarts-arriere-gauche.jpg",
        "src": "/assets/gear/transparent/dji-avata-2-trois-quarts-arriere-gauche-transparent.png",
        "width": 3000,
        "height": 1272
      },
      {
        "view": "vue-dessous",
        "label": "Dessous",
        "original": "/assets/gear/originals/dji-avata-2-vue-dessous.jpg",
        "src": "/assets/gear/transparent/dji-avata-2-vue-dessous-transparent.png",
        "width": 2939,
        "height": 2601
      },
      {
        "view": "vue-dessus",
        "label": "Dessus",
        "original": "/assets/gear/originals/dji-avata-2-vue-dessus.jpg",
        "src": "/assets/gear/transparent/dji-avata-2-vue-dessus-transparent.png",
        "width": 2573,
        "height": 2342
      },
      {
        "view": "vue-face",
        "label": "Face",
        "original": "/assets/gear/originals/dji-avata-2-vue-face.jpg",
        "src": "/assets/gear/transparent/dji-avata-2-vue-face-transparent.png",
        "width": 3000,
        "height": 1070
      }
    ],
    "originalOnly": []
  },
  {
    "id": "dji-goggles-3",
    "name": "DJI Goggles 3",
    "category": "Drone FPV",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/dji-goggles-3-trois-quarts-droit-transparent.png",
      "/assets/gear/transparent/dji-goggles-3-trois-quarts-gauche-transparent.png",
      "/assets/gear/transparent/dji-goggles-3-vue-arriere-dessus-transparent.png",
      "/assets/gear/transparent/dji-goggles-3-vue-interieure-lentilles-transparent.png"
    ],
    "views": [
      {
        "view": "trois-quarts-droit",
        "label": "Trois-quarts droit",
        "original": "/assets/gear/originals/dji-goggles-3-trois-quarts-droit.jpg",
        "src": "/assets/gear/transparent/dji-goggles-3-trois-quarts-droit-transparent.png",
        "width": 2926,
        "height": 1708
      },
      {
        "view": "trois-quarts-gauche",
        "label": "Trois-quarts gauche",
        "original": "/assets/gear/originals/dji-goggles-3-trois-quarts-gauche.jpg",
        "src": "/assets/gear/transparent/dji-goggles-3-trois-quarts-gauche-transparent.png",
        "width": 2781,
        "height": 1765
      },
      {
        "view": "vue-arriere-dessus",
        "label": "Arrière, dessus",
        "original": "/assets/gear/originals/dji-goggles-3-vue-arriere-dessus.jpg",
        "src": "/assets/gear/transparent/dji-goggles-3-vue-arriere-dessus-transparent.png",
        "width": 3000,
        "height": 2831
      },
      {
        "view": "vue-interieure-lentilles",
        "label": "Intérieur, lentilles",
        "original": "/assets/gear/originals/dji-goggles-3-vue-interieure-lentilles.jpg",
        "src": "/assets/gear/transparent/dji-goggles-3-vue-interieure-lentilles-transparent.png",
        "width": 3000,
        "height": 2626
      }
    ],
    "originalOnly": []
  },
  {
    "id": "dji-fpv-remote-controller-3",
    "name": "DJI FPV Remote Controller 3",
    "category": "Drone FPV",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/dji-fpv-remote-controller-3-trois-quarts-droit-transparent.png",
      "/assets/gear/transparent/dji-fpv-remote-controller-3-trois-quarts-gauche-transparent.png",
      "/assets/gear/transparent/dji-fpv-remote-controller-3-vue-dessus-transparent.png"
    ],
    "views": [
      {
        "view": "trois-quarts-droit",
        "label": "Trois-quarts droit",
        "original": "/assets/gear/originals/dji-fpv-remote-controller-3-trois-quarts-droit.jpg",
        "src": "/assets/gear/transparent/dji-fpv-remote-controller-3-trois-quarts-droit-transparent.png",
        "width": 2766,
        "height": 1607
      },
      {
        "view": "trois-quarts-gauche",
        "label": "Trois-quarts gauche",
        "original": "/assets/gear/originals/dji-fpv-remote-controller-3-trois-quarts-gauche.jpg",
        "src": "/assets/gear/transparent/dji-fpv-remote-controller-3-trois-quarts-gauche-transparent.png",
        "width": 2966,
        "height": 1691
      },
      {
        "view": "vue-dessus",
        "label": "Dessus",
        "original": "/assets/gear/originals/dji-fpv-remote-controller-3-vue-dessus.jpg",
        "src": "/assets/gear/transparent/dji-fpv-remote-controller-3-vue-dessus-transparent.png",
        "width": 1945,
        "height": 2629
      }
    ],
    "originalOnly": []
  },
  {
    "id": "dji-rs4-gimbal",
    "name": "DJI RS 4",
    "category": "Stabilisateur",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/dji-rs4-gimbal-trois-quarts-arriere-transparent.png",
      "/assets/gear/transparent/dji-rs4-gimbal-trois-quarts-avant-transparent.png",
      "/assets/gear/transparent/dji-rs4-gimbal-vue-dessus-1-transparent.png",
      "/assets/gear/transparent/dji-rs4-gimbal-vue-dessus-2-transparent.png"
    ],
    "views": [
      {
        "view": "trois-quarts-arriere",
        "label": "Trois-quarts arrière",
        "original": "/assets/gear/originals/dji-rs4-gimbal-trois-quarts-arriere.jpg",
        "src": "/assets/gear/transparent/dji-rs4-gimbal-trois-quarts-arriere-transparent.png",
        "width": 1820,
        "height": 3000
      },
      {
        "view": "trois-quarts-avant",
        "label": "Trois-quarts avant",
        "original": "/assets/gear/originals/dji-rs4-gimbal-trois-quarts-avant.jpg",
        "src": "/assets/gear/transparent/dji-rs4-gimbal-trois-quarts-avant-transparent.png",
        "width": 1920,
        "height": 3000
      },
      {
        "view": "vue-dessus-1",
        "label": "Dessus (1)",
        "original": "/assets/gear/originals/dji-rs4-gimbal-vue-dessus-1.jpg",
        "src": "/assets/gear/transparent/dji-rs4-gimbal-vue-dessus-1-transparent.png",
        "width": 2029,
        "height": 3000
      },
      {
        "view": "vue-dessus-2",
        "label": "Dessus (2)",
        "original": "/assets/gear/originals/dji-rs4-gimbal-vue-dessus-2.jpg",
        "src": "/assets/gear/transparent/dji-rs4-gimbal-vue-dessus-2-transparent.png",
        "width": 2003,
        "height": 3000
      }
    ],
    "originalOnly": []
  },
  {
    "id": "dji-mic-3",
    "name": "DJI Mic 3",
    "category": "Son",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/dji-mic-3-boitier-charge-ferme-vue-dessus-transparent.png",
      "/assets/gear/transparent/dji-mic-3-boitier-charge-ouvert-trois-quarts-transparent.png",
      "/assets/gear/transparent/dji-mic-3-boitier-charge-ouvert-vue-face-transparent.png"
    ],
    "views": [
      {
        "view": "boitier-charge-ferme-vue-dessus",
        "label": "Boîtier de charge fermé, dessus",
        "original": "/assets/gear/originals/dji-mic-3-boitier-charge-ferme-vue-dessus.jpg",
        "src": "/assets/gear/transparent/dji-mic-3-boitier-charge-ferme-vue-dessus-transparent.png",
        "width": 757,
        "height": 1737
      },
      {
        "view": "boitier-charge-ouvert-trois-quarts",
        "label": "Boîtier de charge ouvert, trois-quarts",
        "original": "/assets/gear/originals/dji-mic-3-boitier-charge-ouvert-trois-quarts.jpg",
        "src": "/assets/gear/transparent/dji-mic-3-boitier-charge-ouvert-trois-quarts-transparent.png",
        "width": 2653,
        "height": 2677
      },
      {
        "view": "boitier-charge-ouvert-vue-face",
        "label": "Boîtier de charge ouvert, face",
        "original": "/assets/gear/originals/dji-mic-3-boitier-charge-ouvert-vue-face.jpg",
        "src": "/assets/gear/transparent/dji-mic-3-boitier-charge-ouvert-vue-face-transparent.png",
        "width": 1724,
        "height": 1308
      }
    ],
    "originalOnly": []
  },
  {
    "id": "rode-micro-camera",
    "name": "Micro caméra RØDE",
    "category": "Son",
    "modelConfirmed": false,
    "images": [
      "/assets/gear/transparent/rode-micro-camera-trois-quarts-transparent.png",
      "/assets/gear/transparent/rode-micro-camera-vue-dessus-transparent.png"
    ],
    "views": [
      {
        "view": "trois-quarts",
        "label": "trois-quarts",
        "original": "/assets/gear/originals/rode-micro-camera-trois-quarts.jpg",
        "src": "/assets/gear/transparent/rode-micro-camera-trois-quarts-transparent.png",
        "width": 2179,
        "height": 2749
      },
      {
        "view": "vue-dessus",
        "label": "Dessus",
        "original": "/assets/gear/originals/rode-micro-camera-vue-dessus.jpg",
        "src": "/assets/gear/transparent/rode-micro-camera-vue-dessus-transparent.png",
        "width": 1302,
        "height": 2495
      }
    ],
    "originalOnly": []
  },
  {
    "id": "sandisk-extreme-portable-ssd-2tb",
    "name": "SanDisk Extreme Portable SSD 2 To",
    "category": "Stockage",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/sandisk-extreme-portable-ssd-2tb-vue-arriere-transparent.png",
      "/assets/gear/transparent/sandisk-extreme-portable-ssd-2tb-vue-face-transparent.png"
    ],
    "views": [
      {
        "view": "vue-arriere",
        "label": "Arrière",
        "original": "/assets/gear/originals/sandisk-extreme-portable-ssd-2tb-vue-arriere.jpg",
        "src": "/assets/gear/transparent/sandisk-extreme-portable-ssd-2tb-vue-arriere-transparent.png",
        "width": 895,
        "height": 1634
      },
      {
        "view": "vue-face",
        "label": "Face",
        "original": "/assets/gear/originals/sandisk-extreme-portable-ssd-2tb-vue-face.jpg",
        "src": "/assets/gear/transparent/sandisk-extreme-portable-ssd-2tb-vue-face-transparent.png",
        "width": 1135,
        "height": 2025
      }
    ],
    "originalOnly": []
  },
  {
    "id": "macbook-pro",
    "name": "MacBook Pro",
    "category": "Montage",
    "modelConfirmed": false,
    "images": [
      "/assets/gear/transparent/macbook-pro-trois-quarts-ouvert-transparent.png",
      "/assets/gear/transparent/macbook-pro-vue-dessus-ferme-transparent.png"
    ],
    "views": [
      {
        "view": "trois-quarts-ouvert",
        "label": "Ouvert, trois-quarts",
        "original": "/assets/gear/originals/macbook-pro-trois-quarts-ouvert.jpg",
        "src": "/assets/gear/transparent/macbook-pro-trois-quarts-ouvert-transparent.png",
        "width": 2000,
        "height": 3000
      },
      {
        "view": "vue-dessus-ferme",
        "label": "Fermé, dessus",
        "original": "/assets/gear/originals/macbook-pro-vue-dessus-ferme.jpg",
        "src": "/assets/gear/transparent/macbook-pro-vue-dessus-ferme-transparent.png",
        "width": 3000,
        "height": 2139
      }
    ],
    "originalOnly": []
  },
  {
    "id": "ray-ban-meta",
    "name": "Ray-Ban Meta",
    "category": "Captation POV",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/ray-ban-meta-etui-vue-dessus-transparent.png",
      "/assets/gear/transparent/ray-ban-meta-lunettes-trois-quarts-transparent.png"
    ],
    "views": [
      {
        "view": "etui-vue-dessus",
        "label": "Étui, dessus",
        "original": "/assets/gear/originals/ray-ban-meta-etui-vue-dessus.jpg",
        "src": "/assets/gear/transparent/ray-ban-meta-etui-vue-dessus-transparent.png",
        "width": 2295,
        "height": 1736
      },
      {
        "view": "lunettes-trois-quarts",
        "label": "Lunettes, trois-quarts",
        "original": "/assets/gear/originals/ray-ban-meta-lunettes-trois-quarts.jpg",
        "src": "/assets/gear/transparent/ray-ban-meta-lunettes-trois-quarts-transparent.png",
        "width": 3000,
        "height": 1187
      }
    ],
    "originalOnly": []
  },
  {
    "id": "canon-selphy-cp1500",
    "name": "Canon SELPHY CP1500",
    "category": "Impression",
    "modelConfirmed": true,
    "images": [
      "/assets/gear/transparent/canon-selphy-cp1500-vue-dessus-impression-transparent.png"
    ],
    "views": [
      {
        "view": "vue-dessus-impression",
        "label": "Dessus, impression",
        "original": "/assets/gear/originals/canon-selphy-cp1500-vue-dessus-impression.jpg",
        "src": "/assets/gear/transparent/canon-selphy-cp1500-vue-dessus-impression-transparent.png",
        "width": 1905,
        "height": 3000
      }
    ],
    "originalOnly": []
  },
  {
    "id": "accessoires-rig-smallrig-xssive",
    "name": "Accessoires de rig (SmallRig, XSSIVE)",
    "category": "Accessoires",
    "modelConfirmed": false,
    "images": [],
    "views": [],
    "originalOnly": [
      {
        "view": "vue-dessus",
        "label": "Dessus",
        "original": "/assets/gear/originals/accessoires-rig-smallrig-xssive-vue-dessus.jpg"
      }
    ]
  },
  {
    "id": "fgen-softbox-studio",
    "name": "Softbox FGEN",
    "category": "Éclairage",
    "modelConfirmed": false,
    "images": [],
    "views": [],
    "originalOnly": [
      {
        "view": "vue-ensemble-allumee",
        "label": "Ensemble, allumée",
        "original": "/assets/gear/originals/fgen-softbox-studio-vue-ensemble-allumee.jpg"
      },
      {
        "view": "vue-ensemble-eteinte",
        "label": "Ensemble, éteinte",
        "original": "/assets/gear/originals/fgen-softbox-studio-vue-ensemble-eteinte.jpg"
      }
    ]
  },
  {
    "id": "trepieds-video-photo-duo",
    "name": "Trépieds vidéo et photo",
    "category": "Supports",
    "modelConfirmed": false,
    "images": [
      "/assets/gear/transparent/trepieds-video-photo-duo-vue-ensemble-transparent.png"
    ],
    "views": [
      {
        "view": "vue-ensemble",
        "label": "Ensemble",
        "original": "/assets/gear/originals/trepieds-video-photo-duo-vue-ensemble.jpg",
        "src": "/assets/gear/transparent/trepieds-video-photo-duo-vue-ensemble-transparent.png",
        "width": 1486,
        "height": 3000
      }
    ],
    "originalOnly": []
  }
];

export const GEAR_SETUP = {
  "photos": [
    {
      "view": "trois-quarts",
      "label": "Setup complet, trois-quarts",
      "original": "/assets/gear/originals/setup-materiel-complet-trois-quarts.jpg"
    },
    {
      "view": "vue-dessus",
      "label": "Setup complet, vue de dessus",
      "original": "/assets/gear/originals/setup-materiel-complet-vue-dessus.jpg"
    }
  ],
  "video": "/assets/gear/originals/setup-materiel-complet-video-panorama.mov"
} as const;
