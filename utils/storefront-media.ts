/** Icons for storefront items without photos. */

export type StorefrontIconKey =
  | 'phone'
  | 'laptop'
  | 'tablet'
  | 'watch'
  | 'audio'
  | 'tv'
  | 'camera'
  | 'gaming'
  | 'charger'
  | 'fragrance'
  | 'beauty'
  | 'clothing'
  | 'shoes'
  | 'bag'
  | 'jewelry'
  | 'food'
  | 'drink'
  | 'book'
  | 'home'
  | 'baby'
  | 'car'
  | 'tools'
  | 'health'
  | 'package'

const ICON_KEYWORDS: Array<[StorefrontIconKey, string[]]> = [
  [
    'phone',
    ['phone', 'iphone', 'android', 'samsung', 'pixel', 'tecno', 'infinix', 'mobile', 'smartphone'],
  ],
  ['laptop', ['laptop', 'macbook', 'notebook', 'computer', 'pcs?\\b', 'desktop']],
  ['tablet', ['tablet', 'ipad']],
  ['watch', ['watch', 'smartwatch']],
  ['audio', ['audio', 'headphone', 'earbud', 'airpod', 'speaker', 'earphone', 'sound']],
  ['tv', ['tvs?\\b', 'television', 'monitor']],
  ['camera', ['camera', 'lens', 'photo']],
  ['gaming', ['game', 'gaming', 'playstation', 'ps5', 'xbox', 'nintendo', 'console']],
  ['charger', ['charger', 'cable', 'power bank', 'powerbank', 'battery', 'adapter', 'accessor']],
  ['fragrance', ['perfume', 'fragrance', 'cologne', 'scent', 'oud']],
  ['beauty', ['beauty', 'makeup', 'cosmetic', 'skin', 'hair', 'lotion', 'cream']],
  ['clothing', ['cloth', 'shirt', 'dress', 'wear', 'fashion', 'gown', 'trouser', 'jean', 'kaftan']],
  ['shoes', ['shoe', 'sneaker', 'sandal', 'slipper', 'boot', 'heel']],
  ['bag', ['bag', 'purse', 'wallet', 'luggage', 'backpack']],
  ['jewelry', ['jewel', 'rings?\\b', 'necklace', 'bracelet', 'earring', 'gold\\b']],
  ['food', ['food', 'snack', 'grocer', 'rice', 'spice', 'provision']],
  ['drink', ['drink', 'wine', 'juice', 'beverage', 'water', 'beer']],
  ['book', ['book', 'stationer', 'novel']],
  ['home', ['home', 'furniture', 'kitchen', 'decor', 'appliance']],
  ['baby', ['baby', 'kid', 'toy', 'child']],
  ['car', ['cars?\\b', 'auto\\b', 'automotive', 'vehicle', 'tyre', 'tire\\b', 'tires\\b']],
  ['tools', ['tool', 'hardware', 'electrical']],
  ['health', ['health', 'pharma', 'drug', 'medic', 'supplement', 'vitamin']],
]

/** Keywords match at a word start; entries are regex sources so short words can require a word end. */
const ICON_PATTERNS: Array<[StorefrontIconKey, RegExp]> = ICON_KEYWORDS.map(([key, words]) => [
  key,
  new RegExp(`\\b(?:${words.join('|')})`, 'i'),
])

/** Icon for an item without a photo, picked from its category (then title) keywords. */
export function storefrontIconKey(...labels: Array<string | null | undefined>): StorefrontIconKey {
  for (const label of labels) {
    const text = String(label || '')
    if (!text) continue
    for (const [key, pattern] of ICON_PATTERNS) {
      if (pattern.test(text)) return key
    }
  }
  return 'package'
}
