/** Les 26 provinces de la RDC (découpage de 2015). Codes stables, utilisés partout (contrat, base, front). */
export const PROVINCE_CODES = [
  'kinshasa',
  'kongo_central',
  'kwango',
  'kwilu',
  'mai_ndombe',
  'kasai',
  'kasai_central',
  'kasai_oriental',
  'lomami',
  'sankuru',
  'maniema',
  'sud_kivu',
  'nord_kivu',
  'ituri',
  'haut_uele',
  'bas_uele',
  'tshopo',
  'nord_ubangi',
  'sud_ubangi',
  'mongala',
  'equateur',
  'tshuapa',
  'tanganyika',
  'haut_lomami',
  'lualaba',
  'haut_katanga',
] as const;

export type ProvinceCode = (typeof PROVINCE_CODES)[number];

export interface ProvinceInfo {
  name: string;
  capital: string;
  /** Fuseau horaire : l'ouest du pays est en UTC+1, l'est en UTC+2. */
  timeZone: 'Africa/Kinshasa' | 'Africa/Lubumbashi';
}

const WEST = 'Africa/Kinshasa' as const;
const EAST = 'Africa/Lubumbashi' as const;

export const PROVINCES: Record<ProvinceCode, ProvinceInfo> = {
  kinshasa: { name: 'Kinshasa', capital: 'Kinshasa', timeZone: WEST },
  kongo_central: { name: 'Kongo-Central', capital: 'Matadi', timeZone: WEST },
  kwango: { name: 'Kwango', capital: 'Kenge', timeZone: WEST },
  kwilu: { name: 'Kwilu', capital: 'Bandundu', timeZone: WEST },
  mai_ndombe: { name: 'Mai-Ndombe', capital: 'Inongo', timeZone: WEST },
  kasai: { name: 'Kasaï', capital: 'Tshikapa', timeZone: EAST },
  kasai_central: { name: 'Kasaï-Central', capital: 'Kananga', timeZone: EAST },
  kasai_oriental: { name: 'Kasaï-Oriental', capital: 'Mbuji-Mayi', timeZone: EAST },
  lomami: { name: 'Lomami', capital: 'Kabinda', timeZone: EAST },
  sankuru: { name: 'Sankuru', capital: 'Lusambo', timeZone: EAST },
  maniema: { name: 'Maniema', capital: 'Kindu', timeZone: EAST },
  sud_kivu: { name: 'Sud-Kivu', capital: 'Bukavu', timeZone: EAST },
  nord_kivu: { name: 'Nord-Kivu', capital: 'Goma', timeZone: EAST },
  ituri: { name: 'Ituri', capital: 'Bunia', timeZone: EAST },
  haut_uele: { name: 'Haut-Uele', capital: 'Isiro', timeZone: EAST },
  bas_uele: { name: 'Bas-Uele', capital: 'Buta', timeZone: EAST },
  tshopo: { name: 'Tshopo', capital: 'Kisangani', timeZone: EAST },
  nord_ubangi: { name: 'Nord-Ubangi', capital: 'Gbadolite', timeZone: WEST },
  sud_ubangi: { name: 'Sud-Ubangi', capital: 'Gemena', timeZone: WEST },
  mongala: { name: 'Mongala', capital: 'Lisala', timeZone: WEST },
  equateur: { name: 'Équateur', capital: 'Mbandaka', timeZone: WEST },
  tshuapa: { name: 'Tshuapa', capital: 'Boende', timeZone: WEST },
  tanganyika: { name: 'Tanganyika', capital: 'Kalemie', timeZone: EAST },
  haut_lomami: { name: 'Haut-Lomami', capital: 'Kamina', timeZone: EAST },
  lualaba: { name: 'Lualaba', capital: 'Kolwezi', timeZone: EAST },
  haut_katanga: { name: 'Haut-Katanga', capital: 'Lubumbashi', timeZone: EAST },
};

/** Les 24 communes de Kinshasa (liste à revérifier en cas de réforme administrative). */
export const KINSHASA_COMMUNES = [
  'Bandalungwa',
  'Barumbu',
  'Bumbu',
  'Gombe',
  'Kalamu',
  'Kasa-Vubu',
  'Kimbanseke',
  'Kinshasa',
  'Kintambo',
  'Kisenso',
  'Lemba',
  'Limete',
  'Lingwala',
  'Makala',
  'Maluku',
  'Masina',
  'Matete',
  'Mont-Ngafula',
  'Ndjili',
  'Ngaba',
  'Ngaliema',
  'Ngiri-Ngiri',
  'Nsele',
  'Selembao',
] as const;
