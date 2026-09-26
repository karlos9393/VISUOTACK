// Liens de LA CONSOLE — source unique.
// Pour ajouter un lien : l'ajouter dans la bonne section (ou créer une section).
// layout 'funnel' = étapes numérotées dans l'ordre du tableau.

export interface ConsoleLink {
  label: string
  url: string
  description?: string
}

export interface ConsoleSection {
  id: string
  title: string
  description: string
  tags?: string[]
  layout: 'funnel' | 'grid'
  links: ConsoleLink[]
}

export const CONSOLE_SECTIONS: ConsoleSection[] = [
  {
    id: 'masterclass',
    title: 'Masterclass',
    description: 'Tunnel webinaire, de l’inscription au rendez-vous',
    tags: ['Instagram', 'TikTok'],
    layout: 'funnel',
    links: [
      {
        label: 'Optin webinaire',
        description: 'Là où les gens s’inscrivent',
        url: 'https://cyga-group.com/conference',
      },
      {
        label: 'Confirmation optin',
        description: 'Après l’inscription : rejoindre le WhatsApp',
        url: 'https://cyga-group.com/conference/merci',
      },
      {
        label: 'Booking call',
        description: 'Prise de rendez-vous',
        url: 'https://cyga-group.com/conference/bookingcall',
      },
      {
        label: 'Merci RDV',
        description: 'Remerciement après la prise de rendez-vous',
        url: 'https://cyga-group.com/conference/thanksyoupage',
      },
    ],
  },
  {
    id: 'rendez-vous',
    title: 'Rendez-vous & closing',
    description: 'À envoyer aux leads avant l’appel',
    layout: 'grid',
    links: [
      {
        label: 'Pré-call RDV',
        description: 'Page pré-call à envoyer sur WhatsApp',
        url: 'https://cyga-group.com/precall',
      },
      {
        label: 'Brochure CYGA',
        description: 'Brochure actuelle de l’accompagnement',
        url: 'https://cyga-group.com/brochurecygacall',
      },
    ],
  },
  {
    id: 'lead-magnets',
    title: 'Lead magnets',
    description: 'Ressources gratuites pour capter des leads',
    layout: 'grid',
    links: [
      {
        label: 'Procédure hôte',
        description: 'Lead magnet',
        url: 'https://cyga-group.com/procedurehote',
      },
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
