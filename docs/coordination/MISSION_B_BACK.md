# Mission B : domaine et plateforme

> Lire aussi [CLAUDE.md](../../CLAUDE.md) et [STATUS.md](STATUS.md).

## Périmètre
`apps/api` · `apps/worker` · `packages/*` (dont `domain`, `db`, `integrations`, `config`) · `infra/` · fichiers racine et CI. `packages/contracts` est partagé (procédure de changement).

## Pile
| Brique | Choix |
|---|---|
| API | NestJS (adaptateur Fastify), monolithe modulaire : catalog, quoting, subscription, payments, certificates, claims, customers, callbacks, agencies, notifications, identity, audit |
| Tâches asynchrones | BullMQ + Redis (worker séparé) : statut des paiements, PDF, SMS, SNECA, relances J-30 (CA 22), purge des brouillons, antivirus |
| Données | PostgreSQL 17 + Drizzle ; montants en entiers + devise |
| Auth | Better Auth : OTP SMS pour les clients (phase 5), e-mail + mot de passe + TOTP + rôles pour les agents (phase 6) |
| Fichiers | S3 compatible, URL signées, ClamAV (phase 3) |
| Intégrations | Ports + adaptateurs `mock`/`live` (`INTEGRATIONS_MODE`) : PaymentProvider (agrégateur RDC : FlexPay, SerdiPay, EasyPay, Maxicash à évaluer), CertificateIssuer (SNECA), SmsGateway, VehicleLookup, CoreInsuranceSystem |
| Infra | Docker ; AWS af-south-1 (ECS Fargate, RDS, ElastiCache, S3, CloudFront, WAF) en OpenTofu ; portable vers un datacenter en RDC |
| Qualité | Vitest, Testcontainers, tests de contrat (réponses validées par les schémas Zod), OpenTelemetry + Sentry, CodeQL, Trivy, ZAP |
| Langage | TypeScript 6.0 (le 7, réécriture native, n'est pas encore garanti compatible avec NestJS et le plugin Next) |

## Règles métier à porter dans `packages/domain`
Couverture après paiement confirmé seulement (CA 16) ; certificat provisoire immédiat puis définitif SNECA sous 10 jours (CA 120) ; mentions obligatoires du certificat (CA 121-122) ; réponses de déclaration horodatées (CA 13-15) ; sinistre jamais bloqué pour retard (CA 19) ; offre d'indemnité sous 3 mois (CA 21) ; avis d'échéance J-30 (CA 22) ; sous-assurance habitation > 33 % signalée (CA 215).

## Phases
| Phase | Ma part | État |
|---|---|---|
| 0 | Monorepo, contrat v1.2 (formulaire minimal, change, provinces), `packages/geo`, serveur simulé, CI, docker-compose, coordination | **Fait** |
| 1 | `packages/db` + `apps/api` (catalog, agencies, provinces, exchange-rate), récupération quotidienne du taux BCC (worker) avec saisie manuelle de secours, géocodage précis des agences (le nettoyage et la province sont faits dans `packages/geo`), staging | À faire |
| 2 | Tarification auto (`packages/domain`), brouillons, paiement (adaptateur mock), certificat PDF + QR | À faire |
| 3 | Sinistres, stockage S3, ClamAV, notifications | À faire |
| 4 | Tarification habitation | À faire |
| 5 | Auth OTP, contrats, renouvellements | À faire |
| 6 | Rôles, files de dossiers, audit, tableaux de bord | À faire |
| 7 | Configuration des autres branches | À faire |
| 8 | Intégrations réelles, sécurité, charge, reprise d'activité | À faire |
