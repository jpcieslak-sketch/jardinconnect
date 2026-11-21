export interface GardenTip {
  title: string;
  text: string;
  source: string;
}

export const TIPS: GardenTip[] = [
  {
    title: "La coccinelle, votre alliée anti-pucerons",
    text: "Une seule coccinelle mange jusqu'à 100 pucerons par jour. Ne la tuez jamais et évitez tout traitement : semez des fleurs riches en pollen (achillée, marguerite) pour l'attirer et la faire rester au jardin.",
    source: "Institut national de recherche agronomique (INRAE), biologie des auxiliaires",
  },
  {
    title: "L'hôtel à insectes : utile, bien placé",
    text: "Un hôtel à insectes abrite chrysopes et abeilles solitaires (pollinisateurs). Placez-le au soleil du matin, à l'abri du vent, à moins d'1 m du sol. Sans fleurs autour, il reste vide : plantez d'abord des fleurs comestibles pour eux.",
    source: "Insectes auxiliaires du jardin, références techniques en jardinage biologique",
  },
  {
    title: "Arroser le soir, en profondeur",
    text: "Arrosez le soir, longuement, au pied des plantes et jamais sur les feuilles : l'eau pénètre avant le soleil, les feuilles sèchent vite (moins de mildiou), les racines poussent en profondeur et résistent mieux à la sécheresse.",
    source: "Bases agronomiques de l'irrigation en maraîchage",
  },
  {
    title: "L'olla, l'arrosage d'autrefois",
    text: "Une olla est une jardinière en terre cuite enterrée, remplie d'eau : elle suinte lentement à la racine (0 à 5 L par semaine selon la taille). Le sol reste frais, aucune perte au vent ni par évaporation : 50 à 70 % d'eau économisée.",
    source: "Technique ancestrale, documentée par les réseaux d'irrigation en maraîchage",
  },
  {
    title: "Le paillage de tontes séchées",
    text: "Après une tonte, laissez sécher l'herbe 1 jour puis étalez 5 cm au pied des légumes. Attention : jamais plus de 3 cm frais d'un coup (elle chauffe et pourrit), toujours sur sol humide et jamais contre la tige.",
    source: "Bases du mulching en maraîchage",
  },
  {
    title: "La phacélie : plante mange-nitrate",
    text: "Semée sur une parcelle vide (toute l'année hors gel), la phacélie capte l'azote du sol, l'empêche de lessiver vers les nappes, nourrit les pollinisateurs et se coupe sans être enfouie : la fauche suffit, tout reste au sol comme fertilisant.",
    source: "Bases d'agronomie des engrais verts, Chambre d'agriculture",
  },
  {
    title: "Le compost bien démarré",
    text: "Alternez toujours couches sèches (carton, feuilles, paille) et couches humides (épluchures, tontes). Trop d'épluchures seules : ça pue et ça stagne. Retournez tous les mois : 3 à 4 mois suffisent pour un compost utilisable.",
    source: "Guide du compostage domestique, ADEME",
  },
  {
    title: "L'ortie en arrosage fortifiant",
    text: "Le purin d'ortie n'est pas un insecticide : c'est un fortifiant (azote + fer). Diluez 1 L de purin dans 10 L d'eau, arrosez au pied une fois par mois. Pour tuer les pucerons, c'est le savon noir qu'il faut.",
    source: "Bien utiliser le purin d'ortie, références en jardinage biologique",
  },
  {
    title: "La capucine piège à pucerons",
    text: "Semez des capucines au pied ou à proximité de vos courgettes, haricots et choux : les pucerons les préfèrent et s'y installent. Vos légumes sont épargnés et les coccinelles viennent faire le ménage.",
    source: "Compagnonnage des plantes, références de jardinage en permaculture",
  },
  {
    title: "Les carottes aiment l'oignon",
    text: "Alternez rangs de carottes et rangs d'oignons ou de poireaux : l'odeur de l'allium brouille la mouche de la carotte, et réciproquement. C'est le compagnonnage le plus simple du potager.",
    source: "Associations de cultures, bases de jardinage biologique",
  },
  {
    title: "Ne jamais laisser la terre nue",
    text: "Un sol nu se dégrade sous la pluie (battance), sèche et se vide de sa vie. Sur toute parcelle libre : paillis, engrais vert ou culture. Même un carton sous paille protège les vers de terre qui aèrent le sol gratuitement.",
    source: "Bases de permaculture, Ferme du Bec-Hellouin (P. et C. Hervé-Gruyer)",
  },
  {
    title: "Les vers de terre : mesure de votre santé",
    text: "Retournez la terre en mars : plus de 5 vers de bêche dans une zone de la taille de votre pelle = sol vivant. Aucun ? Paillez plus, compostez, et stoppez le bêchage profond qui les traumatise.",
    source: "Lombricompostage et biologie du sol, références scientifiques",
  },
  {
    title: "La consoude : le potassium des fruits",
    text: "Une feuille de consoude coupée et enterrée au pied des tomates libère du potassium (le pot 'confort des fruits'). Son purin dilué à 10 % remplace une fumure complète d'appoint en été.",
    source: "Purins et décoctions de plantes, références en jardinage biologique",
  },
  {
    title: "L'eau de cuisson des légumes et du riz",
    text: "Une fois refroidie (jamais salée !), l'eau de cuisson des légumes est un mini-engrais : minéraux libérés légèrement. Arrosez au pied, dehors, hors période de gel. Économie + apport doux pour les jeunes plants.",
    source: "Bases du jardinage écologique",
  },
  {
    title: "Les saints de glace, feu ou vérité ?",
    text: "Mamert, Pancrace, Servais (11-13 mai) : statistiquement les dernières gelées en France au nord de la Loire. Règle d'or : ne pas planter tomates et courgettes avant le 14 mai (hors climates doux), et garder un voile d'hivernage au repos.",
    source: "Climatologie de Météo-France",
  },
  {
    title: "L'œillet d'Inde contre les nématodes",
    text: "Semez des œillets d'Inde là où vous mettez des tomates : leurs racines libèrent des substances qui chassent les nématodes (vers microscopiques qui pincent la productivité). Bonus : fleurs lumineuses toute la saison.",
    source: "Associations de cultures, références en jardinage biologique",
  },
  {
    title: "Le bicarbonate contre l'oïdium",
    text: "5 g de bicarbonate de soude + 1 cuillerée à soupe de savon noir dans 1 L d'eau, pulvérisés sur les feuilles blanchies (courgettes, concombres) : le bicarbonate rend le milieu défavorable au champignon. Renouvelez 10 jours après.",
    source: "Traitements bio documentés en jardinage biologique",
  },
  {
    title: "L'arrosoir compte en litres",
    text: "Un arrosoir standard = 10 L. Pour arroser 1 m² de potager correctement, il faut environ 10 mm d'eau = 10 L (1 arrosoir). Comptez vos plantations en m² et vous saurez toujours combien de déplacements à la cuve il vous faudra.",
    source: "Bases d'irrigation (1 mm sur 1 m² = 1 L)",
  },
  {
    title: "L'ombre amie des salades",
    text: "Semez vos salades d'été entre rangs de tomates ou de maïs : l'ombre légère les empêche de monter en graine trop vite et les feuilles restent tendres. En plein soleil de juillet, une laitue boltée est drôlement amère.",
    source: "Compagnonnage et microclimats au potager",
  },
  {
    title: "La rotation, c'est l'espace ET le temps",
    text: "La meilleure défense du sol et du jardin contre les maladies du sol (par exemple la hernie du chou) est de ne pas cultiver la même famille au même endroit deux années de suite. Changer la parcelle change aussi la vie du sol.",
    source: "Rotations des cultures, bases d'agronomie biologique",
  },
  {
    title: "La mésange, alliée n°1 du jardinier",
    text: "Une mésange peut avaler des centaines d'insectes par jour : chenilles, pucerons et vers surtout. Installez des nichoirs en bois avec un trou de 28 à 32 mm, face à l'est, à l'abri du vent et de la pluie, et installez-les dès l'automne : les mésanges choisissent leur logis bien avant la saison.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "Le souci protège la tomate",
    text: "Plantez des soucis entre les rangs de tomates : leur odeur brouille les pistes des insectes ravageurs et leurs racines freinent certains vers du sol. En bonus, ils fleurissent tout l'été et attirent quantité d'abeilles et de syrphes.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "L'achillée, tonique du jardin",
    text: "L'achillée millefeuille est une compagne précieuse : elle attire les prédateurs des ravageurs (coccinelles, syrphes, chrysopes) et, jetée dans le compost, elle active la fermentation. Une poignée de feuilles dans le tas vaut mieux qu'un activateur acheté en sac.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "La consoude, riche en potassium",
    text: "Étendez des feuilles de consoude en couverture au pied de vos tomates : en se décomposant, elles rendent du potassium, exactement ce que la tomate demande pour faire des fruits. Glissées dans le compost, elles le rendent aussi plus riche.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "Le lierre, hôtel des syrphes",
    text: "Ne supprimez pas tout le lierre de vos murs et haies : sa floraison tardive (octobre-novembre) nourrit les syrphes et les abeilles au moment où presque plus rien ne fleurit, et son feuillage les abrite tout l'hiver. Un seul pied suffit.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "Gardez un coin d'orties",
    text: "L'ortie héberge les coccinelles et leurs larves, qui dévorent ensuite les pucerons de votre potager. Gardez une touffe dans un coin discret, loin du compost, et vous aurez des alliées toute la saison — en plus de la matière première du purin.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "Un petit tas de pierres et de bois",
    text: "Amassez des pierres et quelques branches dans un coin du jardin : carabes, staphylins et bourdons viendront s'y réfugier la nuit et pendant l'hiver. Ce petit désordre organisé est un gîte de choix pour les insectes utiles qui chassent les ravageurs.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "N'écrasez pas votre sol !",
    text: "Un sol piétiné perd son air et son eau : les racines étouffent et les vers s'en vont. Prévoyez des allées permanentes et des pas japonais (des dalles ou planches espacées) pour intervenir au potager sans tasser les planches de culture.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "Votre sol pèse lourd (en vie)",
    text: "Dans un sol vivant et couvert, on estime la biomasse de vers, champignons, bactéries et insectes à environ 10 tonnes par hectare — davantage que le bétail nourri sur la même surface. Chaque feuille que vous laissez au sol nourrit cette mécanique.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "Un sol couvert garde son eau",
    text: "La meilleure réserve d'eau du jardin, c'est le sol lui-même. Un sol protégé par un paillage ou un engrais vert emmagasine la pluie comme une éponge et la restitue aux plantes ; le même sol laissé nu la perd par évaporation avant même que les racines en profitent.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "Un toit, c'est une cuve géante",
    text: "Un toit de 100 m² recueille environ 50 m³ d'eau de pluie par an (1 mm de pluie sur 1 m² donne 1 litre). Même un petit hangar ou une serre alimente une cuve : calculez la surface de vos toits avant de choisir la taille de vos cuves.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
  {
    title: "La haie brise-vent",
    text: "Le vent dessèche le potager autant qu'un coup de chaleur. Une haie libre (cotoneaster, charme, noisetier...) placée perpendiculairement aux vents dominants ralentit le vent, garde l'humidité et héberge les oiseaux et insectes utiles — au contraire d'un mur plein qui les rejette.",
    source: "Planche pédagogique JardinConnect (J.-P. Cieslak)",
  },
];

export function tipOfTheDay(): GardenTip {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return TIPS[dayOfYear % TIPS.length];
}
