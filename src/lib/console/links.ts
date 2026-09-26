// Liens de LA CONSOLE — source unique.
// Pour ajouter un lien : l'ajouter dans la bonne section (ou créer une section).
// layout 'funnel' = étapes numérotées dans l'ordre du tableau ;
// offFunnel = page hors parcours (ex. non éligible), affichée sous les étapes.

export interface ConsoleLink {
  label: string
  url: string
  description?: string
  offFunnel?: boolean
}

export interface ConsoleSection {
  id: string
  title: string
  description: string
  tags?: string[]
  layout: 'funnel' | 'grid'
  links: ConsoleLink[]
}

const SITE = 'https://cyga-group.com'

// Les tunnels masterclass ont la même structure, seul le préfixe change
function masterclassTunnel(prefix: string): ConsoleLink[] {
  return [
    { label: 'Opt-in', description: 'Landing + formulaire', url: `${SITE}/${prefix}/opt` },
    { label: 'Masterclass', description: 'Vidéo + parcours + témoignages', url: `${SITE}/${prefix}/masterclass` },
    { label: 'Réservation', description: 'Prise d’appel stratégique', url: `${SITE}/${prefix}/bookingcall` },
    { label: 'Merci', description: 'Confirmation (éligible)', url: `${SITE}/${prefix}/thankyou` },
    { label: 'Non éligible', description: 'Lead non qualifié', url: `${SITE}/${prefix}/pas-eligible`, offFunnel: true },
  ]
}

export const CONSOLE_SECTIONS: ConsoleSection[] = [
  {
    id: 'masterclass-instagram',
    title: 'Masterclass Instagram',
    description: 'Tunnel masterclass · préfixe /insta',
    tags: ['Instagram'],
    layout: 'funnel',
    links: masterclassTunnel('insta'),
  },
  {
    id: 'masterclass-tiktok',
    title: 'Masterclass TikTok',
    description: 'Tunnel masterclass · préfixe /ttk',
    tags: ['TikTok'],
    layout: 'funnel',
    links: masterclassTunnel('ttk'),
  },
  {
    id: 'masterclass-youtube',
    title: 'Masterclass YouTube',
    description: 'Tunnel masterclass · préfixe /ytb',
    tags: ['YouTube'],
    layout: 'funnel',
    links: masterclassTunnel('ytb'),
  },
  {
    id: 'webinaire-canada',
    title: 'Tunnel webinaire Canada',
    description: 'Optin → merci/WhatsApp → booking → thank you page',
    tags: ['Canada'],
    layout: 'funnel',
    links: [
      { label: 'Optin webinaire', description: 'Là où les gens s’inscrivent', url: `${SITE}/conference` },
      { label: 'Merci / WhatsApp', description: 'Confirmation après l’optin : rejoindre le WhatsApp', url: `${SITE}/conference/merci` },
      { label: 'Booking call', description: 'Prise de rendez-vous', url: `${SITE}/conference/bookingcall` },
      { label: 'Thank you page', description: 'Remerciement après la prise de rendez-vous', url: `${SITE}/conference/thanksyoupage` },
    ],
  },
  {
    id: 'lead-magnet-lovable',
    title: 'Lead magnet Prompt Lovable',
    description: 'Parcours YouTube → prompt Lovable',
    tags: ['YouTube'],
    layout: 'funnel',
    links: [
      { label: 'Optin', description: 'Capture prospect, formulaire YouTube', url: `${SITE}/prompt-lovable` },
      { label: 'Générateur de prompt Lovable', description: 'Logo CYGA + préremplissage', url: `${SITE}/prompt-conciergerie` },
      { label: 'Documents légaux', description: 'Marche à suivre pour la mise en ligne', url: `${SITE}/documents-legaux` },
    ],
  },
  {
    id: 'rendez-vous',
    title: 'Rendez-vous & closing',
    description: 'À envoyer aux leads avant l’appel',
    layout: 'grid',
    links: [
      { label: 'Pré-call RDV', description: 'Page pré-call générale, à envoyer sur WhatsApp', url: `${SITE}/precall` },
      { label: 'Brochure CYGA', description: 'Brochure actuelle de l’accompagnement', url: `${SITE}/brochurecygacall` },
    ],
  },
  {
    id: 'lead-magnets',
    title: 'Lead magnets',
    description: 'Ressources gratuites pour capter des leads',
    layout: 'grid',
    links: [
      { label: 'Procédure hôte', description: 'Lead magnet', url: `${SITE}/procedurehote` },
    ],
  },
  {
    id: 'contenu',
    title: 'Contenu',
    description: 'Production et fichiers',
    layout: 'grid',
    links: [
      {
        label: 'Drive ressources contenu',
        description: 'Visuels, templates et fichiers de production',
        url: 'https://drive.google.com/drive/folders/1klZUPPvyGD1KpxmeLrsfeMQVUUXmAZhl',
      },
    ],
  },
]
