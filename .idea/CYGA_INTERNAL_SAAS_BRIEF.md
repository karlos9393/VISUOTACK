# CYGA Dashboard — Brief technique complet

> Stack : Next.js 14 (App Router) + Supabase + Resend (emails) + Vercel (deploy)  
> Rôles : 3 utilisateurs — `admin` (Yann), `manager` (Yassine), `setter`  
> Objectif : dashboard interne pour tracker le pipeline Instagram, le contenu, et le revenue — sans friction

---

## 1. Architecture générale

```
/app
  /(auth)
    /login                  → page de connexion
  /(dashboard)
    /layout.tsx             → sidebar + topbar partagés
    /page.tsx               → vue d'accueil (résumé hebdo)
    /pipeline               → module 1 & 2 (log setter + funnel)
    /contenu                → module 3 & 4 (calendrier + perf)
    /revenue                → module 5 (CA + rapport)
    /admin                  → gestion utilisateurs (admin only)
/components
  /ui                       → boutons, badges, cards, inputs
  /pipeline                 → composants spécifiques pipeline
  /contenu                  → composants spécifiques contenu
  /revenue                  → composants spécifiques revenue
/lib
  /supabase                 → client browser + client server
  /actions                  → server actions Next.js
  /automations              → cron jobs et triggers
/api
  /cron                     → endpoints pour les automatisations planifiées
```

---

## 2. Base de données Supabase

### Table `users`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
email         text UNIQUE NOT NULL
full_name     text
role          text CHECK (role IN ('admin','manager','setter')) DEFAULT 'setter'
avatar_url    text
created_at    timestamptz DEFAULT now()
```

### Table `setter_logs`
> Remplie chaque soir par le setter via le formulaire daily
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES users(id)
date            date NOT NULL
conversations   int DEFAULT 0     -- DMs actives dans la journée
qualified       int DEFAULT 0     -- profils qualifiés
links_sent      int DEFAULT 0     -- liens de booking envoyés
calls_booked    int DEFAULT 0     -- calls bookés
calls_shown     int DEFAULT 0     -- calls honorés (show rate)
closes          int DEFAULT 0     -- closes
no_close_budget    int DEFAULT 0  -- raison : pas le budget
no_close_think     int DEFAULT 0  -- raison : besoin de réfléchir
no_close_trust     int DEFAULT 0  -- raison : pas convaincu
no_close_competitor int DEFAULT 0 -- raison : concurrent
notes           text              -- champ libre optionnel
created_at      timestamptz DEFAULT now()
UNIQUE(user_id, date)             -- un seul log par setter par jour
```

### Table `content_posts`
> Calendrier éditorial et tracking publication
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_by    uuid REFERENCES users(id)
title         text NOT NULL
platform      text CHECK (platform IN ('instagram','youtube','tiktok'))
format        text CHECK (format IN ('reel','carrousel','story','video','short'))
status        text CHECK (status IN ('idee','en_prod','planifie','publie')) DEFAULT 'idee'
scheduled_at  date                -- date de publication prévue
published_at  timestamptz         -- date réelle de publication
views         int DEFAULT 0       -- vues (rempli manuellement le dimanche)
likes         int DEFAULT 0
comments      int DEFAULT 0
followers_gained int DEFAULT 0    -- abonnés gagnés via ce post
notes         text
created_at    timestamptz DEFAULT now()
```

### Table `content_weekly_snapshots`
> Snapshot automatique chaque dimanche à 00h
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
week_start      date NOT NULL UNIQUE  -- lundi de la semaine
posts_published int DEFAULT 0
total_views     int DEFAULT 0
followers_start int DEFAULT 0
followers_end   int DEFAULT 0
followers_gained int DEFAULT 0
best_post_id    uuid REFERENCES content_posts(id)
created_at      timestamptz DEFAULT now()
```

### Table `revenue_entries`
> Saisie manuelle à chaque vente
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_by    uuid REFERENCES users(id)
date          date NOT NULL
amount        numeric(10,2) NOT NULL
offer         text CHECK (offer IN ('formation','accompagnement','dfy'))
client_name   text
payment_type  text CHECK (payment_type IN ('complet','acompte','solde')) DEFAULT 'complet'
notes         text
created_at    timestamptz DEFAULT now()
```

### Table `weekly_reports`
> Rapport auto généré chaque lundi matin
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
week_start        date NOT NULL UNIQUE
-- pipeline
total_conversations int
total_qualified    int
total_links        int
total_booked       int
total_shown        int
total_closes       int
close_rate         numeric(5,2)
show_rate          numeric(5,2)
-- contenu
posts_published    int
total_views        int
followers_gained   int
best_post_id       uuid REFERENCES content_posts(id)
-- revenue
ca_total           numeric(10,2)
ca_formation       numeric(10,2)
ca_accompagnement  numeric(10,2)
ca_dfy             numeric(10,2)
-- meta
generated_at       timestamptz DEFAULT now()
sent_at            timestamptz   -- quand l'email a été envoyé
```

### Row Level Security (RLS)

```sql
-- setter : peut seulement lire/écrire ses propres logs
CREATE POLICY "setter_own_logs" ON setter_logs
  FOR ALL USING (user_id = auth.uid());

-- manager et admin : accès lecture total
CREATE POLICY "manager_read_all" ON setter_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

-- revenue et weekly_reports : admin et manager seulement
CREATE POLICY "revenue_restricted" ON revenue_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

-- content_posts : tous les rôles peuvent lire, manager et admin peuvent écrire
CREATE POLICY "content_read_all" ON content_posts FOR SELECT USING (true);
CREATE POLICY "content_write_manager" ON content_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );
```

---

## 3. Modules — fonctionnalités détaillées

---

### Module 1 — Log daily setter (`/pipeline/log`)

**Accessible à : setter, manager, admin**

Interface ultra-simple : une page, un formulaire, un bouton. Le setter l'ouvre le soir, remplit ses chiffres, soumet.

**Comportements :**
- Si un log existe déjà pour aujourd'hui → pré-remplir le formulaire avec les valeurs existantes (mode update)
- Validation : `calls_shown <= calls_booked`, `closes <= calls_shown`, etc.
- Après submit → toast de confirmation "Log enregistré pour aujourd'hui ✓"
- Champ notes optionnel pour signaler un cas particulier

**Champs du formulaire :**
```
Conversations actives    [number input]
Profils qualifiés        [number input]
Liens de booking envoyés [number input]
Calls bookés             [number input]
Calls honorés            [number input]
Closes                   [number input]
─── Raisons de non-close ───
Pas le budget            [number input]
Besoin de réfléchir      [number input]
Pas convaincu            [number input]
Concurrent               [number input]
─── Optionnel ───
Notes                    [textarea]
```

---

### Module 2 — Vue Pipeline (`/pipeline`)

**Accessible à : manager, admin**

**Section 1 — Funnel de la semaine**
- Navigation semaine (← semaine précédente / semaine courante →)
- 6 étapes du funnel : Conversations → Qualifiés → Liens → Bookés → Honorés → Closes
- Taux de conversion entre chaque étape avec code couleur :
  - Vert : ≥ 50%
  - Orange : 30–49%
  - Rouge : < 30%

**Section 2 — Log quotidien (tableau)**
- Une ligne par jour de la semaine
- Colonnes : Jour / Conv. / Qualifiés / Liens / Bookés / Honorés / Closes
- Ligne "TOTAL semaine" en bas en gras
- Badge rouge si le setter n'a pas rempli son log pour un jour donné

**Section 3 — Raisons de non-close**
- Barres horizontales par raison
- KPIs clés : taux de close, show rate, CA de la semaine

**Section 4 — Tendance 4 semaines (graphique)**
- Ligne : nombre de closes par semaine
- Ligne : liens envoyés par semaine
- Permet de voir si le volume setter monte ou descend

---

### Module 3 — Calendrier éditorial (`/contenu/calendrier`)

**Accessible à : manager, admin**

**Vue principale : grille semaine (lun → dim)**
- Chaque colonne = un jour
- Chaque carte = un post avec : titre, plateforme (badge IG/YT/TK), format, statut (couleur)
- Statuts avec couleurs :
  - Idée → gris
  - En prod → amber
  - Planifié → bleu
  - Publié → vert

**Actions :**
- Clic sur une carte → modal d'édition (titre, plateforme, format, date, statut, notes)
- Bouton "+ Nouveau post" → modal de création
- Drag & drop entre jours pour changer la date planifiée (optionnel v2)
- Filtre par plateforme (IG / YT / TikTok / Tous)

**Vue liste :** toggle entre vue calendrier et vue liste pour voir tous les posts à venir

---

### Module 4 — Performance contenu (`/contenu/performance`)

**Accessible à : manager, admin**

**Section 1 — Snapshot hebdo**
- Navigation par semaine
- KPIs : Posts publiés / Vues totales / Abonnés gagnés / Meilleur post
- Comparaison vs semaine précédente (flèche + % de variation)

**Section 2 — Tableau des posts publiés**
- Colonnes : Titre / Plateforme / Format / Vues / Likes / Commentaires / Abonnés gagnés
- Tri par vues (décroissant par défaut)
- Saisie des stats en ligne (inline edit) pour remplir les chiffres manuellement

**Section 3 — Graphique 8 semaines**
- Barres : vues totales par semaine
- Ligne : abonnés gagnés par semaine
- Permet de voir si le contenu performe mieux ou moins bien dans le temps

**Règle du snapshot dominical :**
- Chaque dimanche, une bannière apparaît en haut du module :
  "📊 C'est dimanche — as-tu rempli les stats de la semaine ?"
- Lien direct vers la saisie des vues des posts publiés cette semaine

---

### Module 5 — Revenue + Rapport hebdo (`/revenue`)

**Accessible à : admin uniquement**

**Section 1 — Saisir une vente**
- Formulaire rapide : date / montant / offre (Formation/Accompagnement/DFY) / nom client / type paiement
- Historique des 10 dernières entrées sous le formulaire

**Section 2 — Dashboard CA**
- KPIs : CA semaine / CA mois / CA total / Nombre de closes
- Répartition par offre (barres ou camembert)
- Coût d'acquisition (si budget pub saisi) : CA / closes = valeur d'un close

**Section 3 — Rapport lundi matin**
- Aperçu du rapport auto de la semaine passée
- Bouton "Renvoyer le rapport par email"

---

## 4. Automatisations

> Toutes les automatisations sont des API routes Next.js appelées via des cron jobs Vercel

---

### Automatisation 1 — Rappel setter (quotidien, 20h00 Dubai = 16h00 UTC)

**Déclencheur :** `/api/cron/setter-reminder` — tous les jours à 16h UTC

**Logique :**
```
1. Récupérer tous les users avec role = 'setter'
2. Pour chaque setter, vérifier si setter_logs contient une entrée pour today
3. Si NON → envoyer un email de rappel via Resend
4. Si OUI → ne rien faire
```

**Email de rappel :**
```
Sujet : ⏰ Log du jour à remplir — CYGA
Corps  : Bonsoir [Prénom], n'oublie pas de remplir ton log du jour avant de dormir.
         [Bouton → Remplir mon log] → lien direct vers /pipeline/log
```

---

### Automatisation 2 — Snapshot contenu (dimanche, 23h00 Dubai = 19h00 UTC)

**Déclencheur :** `/api/cron/content-snapshot` — chaque dimanche à 19h UTC

**Logique :**
```
1. Calculer le lundi de la semaine courante (week_start)
2. Vérifier si un snapshot existe déjà pour cette semaine → skip si oui
3. Agréger depuis content_posts :
   - posts WHERE status = 'publie' AND published_at BETWEEN week_start AND week_start+6j
   - SUM(views), SUM(followers_gained)
   - Meilleur post = MAX(views)
4. Insérer dans content_weekly_snapshots
```

---

### Automatisation 3 — Génération rapport hebdo (lundi, 06h00 Dubai = 02h00 UTC)

**Déclencheur :** `/api/cron/weekly-report` — chaque lundi à 02h UTC

**Logique :**
```
1. Calculer week_start = lundi précédent
2. Agréger setter_logs sur la semaine :
   - SUM de chaque colonne
   - Calculer close_rate = closes / calls_shown * 100
   - Calculer show_rate = calls_shown / calls_booked * 100
3. Récupérer content_weekly_snapshots pour la semaine
4. Agréger revenue_entries pour la semaine
5. Insérer dans weekly_reports
6. Envoyer l'email de rapport à admin et manager
```

**Template email rapport lundi :**
```
Sujet : 📊 Rapport CYGA — Semaine du [date]

─── PIPELINE ───
Conversations   : [n]
Closes          : [n]  (taux de close : [n]%)
Show rate       : [n]%
CA semaine      : [n]€

─── CONTENU ───
Posts publiés   : [n]
Vues totales    : [n]
Abonnés gagnés  : [n]
Meilleur post   : [titre]

─── POINT D'ATTENTION ───
[logique automatique — voir ci-dessous]

[Bouton → Voir le rapport complet]
```

**Logique "Point d'attention" automatique :**
```
SI close_rate < 30% → "Taux de close faible cette semaine — revoir le pitch de closing"
SI show_rate < 50%  → "Show rate bas — relancer les no-shows avant le call"
SI total_links < 10 → "Peu de liens envoyés — vérifier l'activité setter"
SI followers_gained < 100 → "Croissance faible en abonnés — analyser le contenu"
SINON               → "Bonne semaine — continuer sur cette lancée"
```

---

### Automatisation 4 — Alerte setter inactif (quotidien, 22h00 Dubai = 18h00 UTC)

**Déclencheur :** `/api/cron/setter-inactive-alert` — tous les jours à 18h UTC

**Logique :**
```
1. Vérifier si setter_logs a une entrée pour today
2. Si conversations = 0 ET links_sent = 0 → envoyer alerte à admin
3. Email : "Attention — le setter n'a eu aucune activité aujourd'hui"
```

---

## 5. Navigation et accès par rôle

| Page | admin | manager | setter |
|------|-------|---------|--------|
| `/` (accueil résumé) | ✓ | ✓ | ✓ |
| `/pipeline/log` (formulaire daily) | ✓ | ✓ | ✓ |
| `/pipeline` (funnel complet) | ✓ | ✓ | ✗ |
| `/contenu/calendrier` | ✓ | ✓ | lecture seule |
| `/contenu/performance` | ✓ | ✓ | ✗ |
| `/revenue` | ✓ | ✗ | ✗ |
| `/admin` (gestion users) | ✓ | ✗ | ✗ |

**Règle de redirection :**
- Si setter tente d'accéder à `/pipeline` → redirect vers `/pipeline/log`
- Si manager tente d'accéder à `/revenue` → 403 page

---

## 6. Page d'accueil — Vue résumé (`/`)

Affiche un résumé de la semaine courante adapté au rôle :

**Pour admin et manager :**
- 4 KPI cards : Closes semaine / CA semaine / Posts publiés / Abonnés gagnés
- Dernier rapport hebdo (aperçu 3 lignes)
- Alerte si setter n'a pas rempli son log aujourd'hui (badge rouge)

**Pour setter :**
- Statut du log du jour : "Rempli ✓" ou "À remplir !"
- Ses stats de la semaine : conversations / liens / closes
- Bouton direct "Remplir mon log"

---

## 7. Stack et configuration

### Dépendances principales
```json
{
  "dependencies": {
    "next": "14.x",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "latest",
    "resend": "^3",
    "date-fns": "^3",
    "recharts": "^2",
    "zod": "^3",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3"
  }
}
```

### Variables d'environnement
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # pour les cron jobs (accès total)
RESEND_API_KEY=
CRON_SECRET=                     # token secret pour sécuriser les endpoints /api/cron
ADMIN_EMAIL=yann@cyga.co         # destinataire des rapports
MANAGER_EMAIL=yassine@cyga.co
```

### Cron jobs Vercel (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/setter-reminder",
      "schedule": "0 16 * * *"
    },
    {
      "path": "/api/cron/setter-inactive-alert",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/cron/content-snapshot",
      "schedule": "0 19 * * 0"
    },
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 2 * * 1"
    }
  ]
}
```

### Sécurisation des endpoints cron
```typescript
// Chaque endpoint /api/cron/* doit vérifier le header Authorization
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... logique du cron
}
```

---

## 8. Ordre de développement recommandé

```
Phase 1 — Base (2-3 jours)
  ✓ Setup Next.js + Supabase + Auth
  ✓ Schéma SQL complet + RLS
  ✓ Layout dashboard + sidebar + routing par rôle
  ✓ Page login

Phase 2 — Pipeline (2 jours)
  ✓ Formulaire log setter (/pipeline/log)
  ✓ Vue funnel hebdo (/pipeline)
  ✓ Tableau log quotidien
  ✓ Raisons de non-close

Phase 3 — Contenu (2 jours)
  ✓ Calendrier éditorial (/contenu/calendrier)
  ✓ Vue performance + saisie stats (/contenu/performance)
  ✓ Snapshot dominical (logique + bannière)

Phase 4 — Revenue (1 jour)
  ✓ Formulaire saisie vente
  ✓ Dashboard CA + répartition offres

Phase 5 — Automatisations (1-2 jours)
  ✓ Rappel setter quotidien (email Resend)
  ✓ Snapshot contenu dimanche (cron)
  ✓ Rapport hebdo lundi (cron + email)
  ✓ Alerte setter inactif (cron)

Phase 6 — Polish (1 jour)
  ✓ Page d'accueil résumé par rôle
  ✓ Graphiques tendance 4-8 semaines (Recharts)
  ✓ Responsive mobile (setter utilise son tel)
```

---

## 9. Notes importantes pour Claude Code

- **Auth** : utiliser `@supabase/ssr` avec les cookies Next.js — ne pas utiliser le client browser pour les server components
- **Server Actions** : toutes les mutations (INSERT, UPDATE) passent par des server actions Next.js, pas d'appels Supabase côté client
- **Formulaire setter** : doit être 100% fonctionnel sur mobile — le setter log depuis son téléphone
- **Emails Resend** : créer des templates React Email propres, ne pas utiliser du HTML inline brut
- **Cron jobs** : tester en local avec un appel manuel à l'endpoint avant de déployer
- **Pas de connexion Meta ou GHL** : tout est saisi manuellement pour la v1 — les intégrations API viennent en v2
- **Graphiques** : utiliser Recharts uniquement, pas de Chart.js — cohérence avec l'écosystème React

---

*Brief généré pour CYGA Dashboard — v1.0*  
*Stack : Next.js 14 + Supabase + Resend + Vercel*
