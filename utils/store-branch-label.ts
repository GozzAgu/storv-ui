import { citiesByRegion } from '~/utils/region-cities'

/** Known cities, longest first so multi-word names match before shorter prefixes. */
const ALL_CITIES = [...new Set(Object.values(citiesByRegion).flat())].sort(
  (a, b) => b.length - a.length
)

/** Three-letter branch codes for compact top-nav display (e.g. Lagos → LAG, Abuja → ABJ). */
export const cityCodeByName: Record<string, string> = {
  // Nigeria
  Lagos: 'LAG',
  Abuja: 'ABJ',
  Kano: 'KAN',
  Ibadan: 'IBD',
  'Port Harcourt': 'PHC',
  'Benin City': 'BEN',
  Kaduna: 'KAD',
  Enugu: 'ENU',
  Aba: 'ABA',
  Onitsha: 'ONI',
  Jos: 'JOS',
  Ilorin: 'ILR',
  Warri: 'WAR',
  Calabar: 'CAL',
  Uyo: 'UYO',
  Abeokuta: 'ABE',
  Owerri: 'OWR',
  Sokoto: 'SKO',
  Maiduguri: 'MIU',
  Akure: 'AKR',
  // Ghana
  Accra: 'ACC',
  Kumasi: 'KMS',
  Tamale: 'TML',
  Takoradi: 'TKD',
  'Cape Coast': 'CCT',
  Tema: 'TEM',
  Sunyani: 'SUN',
  Ho: 'HOH',
  Koforidua: 'KOF',
  Wa: 'WAA',
  Bolgatanga: 'BOL',
  // Kenya
  Nairobi: 'NBO',
  Mombasa: 'MBA',
  Kisumu: 'KIS',
  Nakuru: 'NUU',
  Eldoret: 'EDL',
  Thika: 'THK',
  Malindi: 'MYD',
  Kitale: 'KTL',
  Garissa: 'GAS',
  Nyeri: 'NYR',
  // South Africa
  Johannesburg: 'JNB',
  'Cape Town': 'CPT',
  Durban: 'DUR',
  Pretoria: 'PRY',
  'Port Elizabeth': 'PLZ',
  Bloemfontein: 'BFN',
  'East London': 'ELS',
  Polokwane: 'PTG',
  Nelspruit: 'NLP',
  Kimberley: 'KIM',
  // US (common metro codes)
  'New York': 'NYC',
  'Los Angeles': 'LAX',
  Chicago: 'CHI',
  Houston: 'HOU',
  Phoenix: 'PHX',
  Philadelphia: 'PHL',
  'San Antonio': 'SAT',
  'San Diego': 'SAN',
  Dallas: 'DFW',
  'San Jose': 'SJC',
  Austin: 'AUS',
  Jacksonville: 'JAX',
  'San Francisco': 'SFO',
  Columbus: 'CMH',
  Charlotte: 'CLT',
  Indianapolis: 'IND',
  Seattle: 'SEA',
  Denver: 'DEN',
  Boston: 'BOS',
  Nashville: 'BNA',
  Detroit: 'DTW',
  Portland: 'PDX',
  'Las Vegas': 'LAS',
  Miami: 'MIA',
  Atlanta: 'ATL',
  // UK
  London: 'LON',
  Birmingham: 'BHX',
  Manchester: 'MAN',
  Glasgow: 'GLA',
  Leeds: 'LDS',
  Liverpool: 'LPL',
  Sheffield: 'SHF',
  Edinburgh: 'EDI',
  Bristol: 'BRS',
  Leicester: 'LEI',
  Coventry: 'CVT',
  Nottingham: 'NOT',
  'Newcastle upon Tyne': 'NCL',
  Southampton: 'SOU',
  Brighton: 'BSH',
  Cardiff: 'CWL',
  Belfast: 'BFS',
  // Canada
  Toronto: 'YYZ',
  Montreal: 'YUL',
  Vancouver: 'YVR',
  Calgary: 'YYC',
  Edmonton: 'YEG',
  Ottawa: 'YOW',
  Winnipeg: 'YWG',
  'Quebec City': 'YQB',
  Hamilton: 'YHM',
  Kitchener: 'YKF',
  Halifax: 'YHZ',
  Victoria: 'YYJ',
  Saskatoon: 'YXE',
  Regina: 'YQR',
  // Australia
  Sydney: 'SYD',
  Melbourne: 'MEL',
  Brisbane: 'BNE',
  Perth: 'PER',
  Adelaide: 'ADL',
  'Gold Coast': 'OOL',
  Canberra: 'CBR',
  Newcastle: 'NTL',
  Wollongong: 'WOL',
  Hobart: 'HBA',
  Geelong: 'GEX',
  Townsville: 'TSV',
  Cairns: 'CNS',
  Darwin: 'DRW',
  // EU highlights
  Paris: 'PAR',
  Berlin: 'BER',
  Madrid: 'MAD',
  Rome: 'ROM',
  Amsterdam: 'AMS',
  Brussels: 'BRU',
  Vienna: 'VIE',
  Dublin: 'DUB',
  Lisbon: 'LIS',
  Prague: 'PRG',
  Warsaw: 'WAW',
  Stockholm: 'ARN',
  Copenhagen: 'CPH',
  Helsinki: 'HEL',
  Athens: 'ATH',
  Budapest: 'BUD',
  Zurich: 'ZRH',
  Munich: 'MUC',
  Barcelona: 'BCN',
  Milan: 'MXP',
  // Asia
  Tokyo: 'TYO',
  Yokohama: 'YOK',
  Osaka: 'OSA',
  Nagoya: 'NGO',
  Sapporo: 'SPK',
  Fukuoka: 'FUK',
  Kobe: 'UKB',
  Kyoto: 'UKY',
  Kawasaki: 'KWS',
  Hiroshima: 'HIJ',
  Sendai: 'SDJ',
  Shanghai: 'SHA',
  Beijing: 'BJS',
  Guangzhou: 'CAN',
  Shenzhen: 'SZX',
  Chengdu: 'CTU',
  Hangzhou: 'HGH',
  Wuhan: 'WUH',
  "Xi'an": 'XIY',
  Nanjing: 'NKG',
  Tianjin: 'TSN',
  Chongqing: 'CKG',
  Suzhou: 'SZV',
  Mumbai: 'BOM',
  Delhi: 'DEL',
  Bangalore: 'BLR',
  Hyderabad: 'HYD',
  Chennai: 'MAA',
  Kolkata: 'CCU',
  Pune: 'PNQ',
  Ahmedabad: 'AMD',
  Jaipur: 'JAI',
  Surat: 'STV',
  Lucknow: 'LKO',
  Kanpur: 'KNU',
  Nagpur: 'NAG',
  Indore: 'IDR',
}

function extractCityFromBranchName(branchName: string): string {
  const name = branchName.trim()
  if (!name) return ''

  const lower = name.toLowerCase()
  for (const city of ALL_CITIES) {
    const cityLower = city.toLowerCase()
    if (lower === cityLower) return city
    if (lower.startsWith(cityLower)) {
      const next = name[city.length]
      if (!next || /[\s,|–—\-(/]/.test(next)) return city
    }
  }

  return name.split(/\s*[,|–—\-]\s*/)[0]?.trim() || name
}

/**
 * City-style branch label for sidebar and lists (e.g. "Port Harcourt, GRA" → "Port Harcourt").
 */
export function getStoreBranchShortLabel(branchName: string | null | undefined): string {
  const name = branchName?.trim()
  if (!name) return ''
  return extractCityFromBranchName(name)
}

function generateCityCode(city: string): string {
  const words = city.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const initials = words.map((word) => word[0] ?? '').join('')
    if (initials.length >= 3) return initials.slice(0, 3).toUpperCase()
    const padded = initials + (words.at(-1)?.slice(1, 3) ?? '')
    return padded.slice(0, 3).toUpperCase()
  }
  return city.slice(0, 3).toUpperCase()
}

/**
 * Compact three-letter code for top-nav store switcher (e.g. Lagos → LAG, Abuja → ABJ).
 */
export function getStoreBranchCodeLabel(branchName: string | null | undefined): string {
  const city = getStoreBranchShortLabel(branchName)
  if (!city) return ''
  return cityCodeByName[city] ?? generateCityCode(city)
}
