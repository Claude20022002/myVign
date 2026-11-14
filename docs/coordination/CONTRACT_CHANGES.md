# Journal du contrat d'API (`packages/contracts`)

Chaque changement incrémente `CONTRACT_VERSION` (`src/index.ts`) et la `version` du package.
- **Additif** (nouvelle route, nouveau champ facultatif ou nullable, nouvelle valeur d'enum côté réponse) : fusion libre, prévenir l'autre agent ici.
- **Cassant** (champ supprimé ou renommé, champ devenu obligatoire, enum réduite) : accord de l'autre agent dans `STATUS.md` avant fusion.

| Version | Date | Auteur | Type | Changement |
|---|---|---|---|---|
| 1.1.0 | 2026-11-14 | B | Cassant (aucun consommateur encore) | Alignement sur `docs/recherche_formulaires_rdc.md` : souscripteur (type particulier/entreprise, post-nom, profession, pièce d'identité, e-mail facultatif, adresse RDC sans code postal) ; permis (n°, catégorie) ; véhicule (châssis si pas de plaque, puissance fiscale, places, année, carte rose, valeur vénale exigée hors formule tiers) ; antécédents `0/1/2/3+` ; usages commerciaux (taxi, moto-taxi, transport public, location) ; options carte jaune et individuelle occupant, rachat de franchise ; durée courte ; nouveau bloc `declaration` (certification d'exactitude, consentement, CG). Paiement : `afrimoney`, `agency` (+ `agencyReference`), reçu opérateur. Certificat : `kind` provisoire/définitif, assureur + agrément ARCA, adresse et profession du souscripteur, pays couverts. Sinistre : identification par contrat OU plaque, province, conducteur + permis, décès, n° de PV, assureur du tiers, responsabilité 0/50/100 %, type `vol` séparé de `vandalisme`. Ajouts communs : `Province` (26), `AddressCD`, `IdentityDocument`, `Company`, `ChassisNumber`. |
| 1.0.0 | 2026-11-14 | B | Initial | 22 routes `/v1` (catalogue, agences, véhicules, brouillons, devis, paiement, contrats, certificats, sinistres, rappels), client typé, serveur simulé, OpenAPI. |
