/**
 * What a category sells. Stored as `folder.type`; drives the category icon in inventory
 * and the product icon on the storefront. Pure data so the server can use it too.
 * general, electronics, clothing, automotive, food, office and other are the original ids.
 */

export interface CategoryKind {
  id: string
  label: string
  group: CategoryKindGroup
  /** Regex sources matched at a word start against category names and product titles. */
  keywords: string[]
}

export type CategoryKindGroup =
  | 'Phones & tech'
  | 'Home & appliances'
  | 'Fashion & beauty'
  | 'Food & drink'
  | 'Health & pharmacy'
  | 'Building & hardware'
  | 'Auto & transport'
  | 'Office, books & school'
  | 'Kids, sports & leisure'
  | 'Farm, pets & garden'
  | 'General'

export const CATEGORY_KIND_GROUPS: CategoryKindGroup[] = [
  'Phones & tech',
  'Home & appliances',
  'Fashion & beauty',
  'Food & drink',
  'Health & pharmacy',
  'Building & hardware',
  'Auto & transport',
  'Office, books & school',
  'Kids, sports & leisure',
  'Farm, pets & garden',
  'General',
]

const kind = (
  id: string,
  label: string,
  group: CategoryKindGroup,
  keywords: string[] = []
): CategoryKind => ({ id, label, group, keywords })

/** Order matters for name matching: earlier kinds win (e.g. "tablet" is a device, not a pill). */
export const CATEGORY_KINDS: CategoryKind[] = [
  kind('phones', 'Phones', 'Phones & tech', [
    'phones?\\b',
    'iphone',
    'android',
    'samsung',
    'pixel',
    'tecno',
    'infinix',
    'itel\\b',
    'xiaomi',
    'redmi',
    'oppo\\b',
    'vivo\\b',
    'mobile',
    'smartphone',
  ]),
  kind('computers', 'Computers & laptops', 'Phones & tech', [
    'laptop',
    'macbook',
    'notebook',
    'computer',
    'pcs?\\b',
    'desktop',
    'imac',
    'chromebook',
  ]),
  kind('tablets', 'Tablets', 'Phones & tech', ['tablets?\\b', 'ipad']),
  kind('wearables', 'Watches & wearables', 'Phones & tech', [
    'watch',
    'smartwatch',
    'wearable',
    'fitbit',
  ]),
  kind('audio', 'Audio & headphones', 'Phones & tech', [
    'audio',
    'headphone',
    'headset',
    'earbud',
    'airpod',
    'earphone',
    'speaker',
    'sound',
  ]),
  kind('tv', 'TVs & displays', 'Phones & tech', [
    'tvs?\\b',
    'television',
    'monitor',
    'projector',
    'display',
  ]),
  kind('cameras', 'Cameras & photo', 'Phones & tech', ['camera', 'lens', 'photo', 'drone', 'cctv']),
  kind('gaming', 'Gaming', 'Phones & tech', [
    'game',
    'gaming',
    'playstation',
    'ps[45]\\b',
    'xbox',
    'nintendo',
    'console',
  ]),
  kind('accessories', 'Phone & tech accessories', 'Phones & tech', [
    'charger',
    'cable',
    'power ?bank',
    'adapter',
    '(?:i?phone|ipad|airpods?) cases?',
    'screen guard',
    'screen protector',
    'accessor',
  ]),
  kind('networking', 'Networking & components', 'Phones & tech', [
    'router',
    'modem',
    'wi-?fi',
    'network',
    'ssd\\b',
    'hard drive',
    'flash drive',
    'memory card',
    'component',
  ]),
  kind('solar', 'Solar & power', 'Phones & tech', [
    'solar',
    'inverter',
    'batter',
    'generator',
    'ups\\b',
    'stabili[sz]er',
  ]),
  kind('electronics', 'Electronics', 'Phones & tech', ['electronic', 'gadget']),

  kind('appliances', 'Home appliances', 'Home & appliances', [
    'appliance',
    'fridge',
    'refrigerator',
    'freezer',
    'washing machine',
    'microwave',
    'blender',
    'air ?condition',
    'ac\\b',
    'fans?\\b',
    'cooker',
    'pressing iron',
  ]),
  kind('furniture', 'Furniture', 'Home & appliances', [
    'furniture',
    'sofa',
    'chairs?\\b',
    'tables?\\b',
    'wardrobe',
    'mattress',
    'shelf',
    'shelves',
  ]),
  kind('kitchen', 'Kitchen & dining', 'Home & appliances', [
    'kitchen',
    'cookware',
    'pots?\\b',
    'plates?\\b',
    'cutlery',
    'utensil',
    'dining',
  ]),
  kind('decor', 'Decor & lighting', 'Home & appliances', [
    'decor',
    'lamp',
    'lighting',
    'curtain',
    'rugs?\\b',
    'carpet',
    'frames?\\b',
    'vase',
  ]),
  kind('bedding', 'Bedding & bath', 'Home & appliances', [
    'bedding',
    'bedsheet',
    'duvet',
    'pillow',
    'towel',
    'bath',
  ]),
  kind('cleaning', 'Cleaning & household', 'Home & appliances', [
    'cleaning',
    'detergent',
    'soap',
    'household',
    'toiletr',
    'tissue',
    'disinfect',
  ]),

  kind('clothing', 'Clothing & apparel', 'Fashion & beauty', [
    'cloth',
    'shirt',
    'dress',
    'wear',
    'fashion',
    'gown',
    'trouser',
    'jeans?\\b',
    'kaftan',
    'agbada',
    'abaya',
    'suits?\\b',
    'apparel',
    'underwear',
    'lingerie',
    'jersey',
  ]),
  kind('shoes', 'Shoes', 'Fashion & beauty', [
    'footwear',
    'shoe',
    'sneaker',
    'sandal',
    'slipper',
    'boots?\\b',
    'heels?\\b',
  ]),
  kind('bags', 'Bags & luggage', 'Fashion & beauty', [
    'bags?\\b',
    'handbag',
    'purse',
    'wallet',
    'luggage',
    'backpack',
    'suitcase',
  ]),
  kind('jewelry', 'Jewellery', 'Fashion & beauty', [
    'jewel',
    'rings?\\b',
    'necklace',
    'bracelet',
    'earring',
    'gold\\b',
    'beads?\\b',
  ]),
  kind('fragrance', 'Perfumes & fragrance', 'Fashion & beauty', [
    'perfume',
    'fragrance',
    'cologne',
    'scent',
    'oud\\b',
    'body spray',
    'mist',
  ]),
  kind('beauty', 'Beauty & cosmetics', 'Fashion & beauty', [
    'beauty',
    'makeup',
    'make-up',
    'cosmetic',
    'skin',
    'lotion',
    'cream',
    'lipstick',
    'nail polish',
  ]),
  kind('hair', 'Hair & wigs', 'Fashion & beauty', [
    'hair',
    'wigs?\\b',
    'braid',
    'weave',
    'salon',
    'barber',
  ]),
  kind('fabrics', 'Fabrics & textiles', 'Fashion & beauty', [
    'fabric',
    'textile',
    'ankara',
    'lace',
    'aso[ -]?oke',
    'george',
    'sewing',
    'tailor',
  ]),
  kind('eyewear', 'Eyewear', 'Fashion & beauty', [
    'glasses',
    'eyewear',
    'sunglass',
    'spectacle',
    'optic',
  ]),

  kind('food', 'Groceries & provisions', 'Food & drink', [
    'food',
    'grocer',
    'provision',
    'rice',
    'beans',
    'spice',
    'pasta',
    'spaghetti',
    'noodle',
    'cereal',
    'flour',
    'garri',
    'supermarket',
  ]),
  kind('produce', 'Fruits & vegetables', 'Food & drink', [
    'fruit',
    'vegetable',
    'produce',
    'tomato',
    'pepper',
    'yams?\\b',
    'plantain',
    'onion',
  ]),
  kind('meat', 'Meat, fish & poultry', 'Food & drink', [
    'meat',
    'beef',
    'chicken',
    'fish',
    'seafood',
    'poultry',
    'turkey',
    'goat',
  ]),
  kind('bakery', 'Bakery & pastries', 'Food & drink', [
    'baker',
    'bread',
    'cakes?\\b',
    'pastr',
    'cookie',
    'biscuit',
    'doughnut',
    'donut',
  ]),
  kind('snacks', 'Snacks & sweets', 'Food & drink', [
    'snack',
    'sweets?\\b',
    'chocolate',
    'candy',
    'chips',
    'chin ?chin',
  ]),
  kind('dairy', 'Dairy & eggs', 'Food & drink', [
    'dairy',
    'milk',
    'yog[h]?urt',
    'cheese',
    'eggs?\\b',
    'butter',
  ]),
  kind('drinks', 'Drinks & beverages', 'Food & drink', [
    'drink',
    'juice',
    'beverage',
    'table water',
    'water(?!\\s*tanks?)',
    'soda',
    'soft drink',
    'malt',
  ]),
  kind('alcohol', 'Wines & spirits', 'Food & drink', [
    'wine',
    'beer',
    'spirit',
    'liquor',
    'whisk',
    'vodka',
    'gin\\b',
    'champagne',
    'cognac',
  ]),
  kind('coffee', 'Coffee & tea', 'Food & drink', ['coffee', 'tea\\b', 'teas\\b', 'cocoa']),
  kind('meals', 'Restaurant & meals', 'Food & drink', [
    'meals?\\b',
    'menu',
    'restaurant',
    'dish',
    'swallow',
    'small chops',
    'pizza',
    'burger',
    'shawarma',
  ]),
  kind('frozen', 'Frozen foods', 'Food & drink', ['frozen', 'ice ?cream']),

  kind('pharmacy', 'Pharmacy & medicines', 'Health & pharmacy', [
    'pharma',
    'drugs?\\b',
    'medicine',
    'syrup',
    'antibiotic',
    'capsule',
    'analgesic',
  ]),
  kind('medical', 'Medical supplies', 'Health & pharmacy', [
    'medical',
    'clinic',
    'hospital',
    'gloves?\\b',
    'syringe',
    'test kit',
    'surgical',
  ]),
  kind('wellness', 'Supplements & wellness', 'Health & pharmacy', [
    'supplement',
    'vitamin',
    'wellness',
    'herbal',
    'protein',
    'health',
  ]),

  kind('building', 'Building materials', 'Building & hardware', [
    'cement',
    'blocks?\\b',
    'bricks?\\b',
    'sand\\b',
    'granite',
    'rods?\\b',
    'roofing',
    'tiles?\\b',
    'building',
    'construction',
  ]),
  kind('tools', 'Tools & hardware', 'Building & hardware', [
    'tool',
    'hardware',
    'screws?\\b',
    'bolts?\\b',
    'drill',
    'hammer',
  ]),
  kind('electrical', 'Electrical supplies', 'Building & hardware', [
    'electrical',
    'wires?\\b',
    'wiring',
    'switch',
    'socket',
    'bulbs?\\b',
  ]),
  kind('plumbing', 'Plumbing & sanitary', 'Building & hardware', [
    'plumb',
    'pipes?\\b',
    'sanitary',
    'taps?\\b',
    'toilet',
    'sinks?\\b',
    'water tank',
  ]),
  kind('paint', 'Paints & finishes', 'Building & hardware', [
    'paint',
    'varnish',
    'coating',
    'emulsion',
  ]),
  kind('industrial', 'Industrial & machinery', 'Building & hardware', [
    'industrial',
    'machine',
    'equipment',
  ]),

  kind('vehicles', 'Vehicles', 'Auto & transport', [
    'cars?\\b',
    'vehicle',
    'toyota',
    'honda',
    'lexus',
    'benz',
    'suvs?\\b',
    'trucks?\\b',
  ]),
  kind('automotive', 'Auto parts & accessories', 'Auto & transport', [
    'auto\\b',
    'automotive',
    'spare parts?',
    'tyres?\\b',
    'tires?\\b',
    'brakes?\\b',
    'engine',
  ]),
  kind('motorcycles', 'Motorcycles & bicycles', 'Auto & transport', [
    'motorcycle',
    'motorbike',
    'okada',
    'bikes?\\b',
    'bicycle',
    'scooter',
    'keke',
    'tricycle',
  ]),
  kind('fuel', 'Fuel, gas & lubricants', 'Auto & transport', [
    'fuel',
    'lubricant',
    'engine oil',
    'diesel',
    'petrol',
    'lpg\\b',
    'cooking gas',
    'gas\\b',
  ]),

  kind('office', 'Office supplies', 'Office, books & school', [
    'office',
    'paper',
    'toner',
    'ink\\b',
    'stapl',
    'files?\\b',
  ]),
  kind('books', 'Books', 'Office, books & school', ['book', 'novel', 'bible', 'quran', 'magazine']),
  kind('stationery', 'Stationery', 'Office, books & school', [
    'stationer',
    'pens?\\b',
    'pencil',
    'markers?\\b',
  ]),
  kind('printing', 'Printing & branding', 'Office, books & school', [
    'print',
    'branding',
    'banner',
    'sticker',
    'signage',
  ]),
  kind('school', 'School supplies & uniforms', 'Office, books & school', [
    'school',
    'uniform',
    'education',
  ]),

  kind('baby', 'Baby & kids', 'Kids, sports & leisure', [
    'baby',
    'kids?\\b',
    'child',
    'diaper',
    'infant',
  ]),
  kind('toys', 'Toys & games', 'Kids, sports & leisure', ['toy', 'lego', 'puzzle', 'board game']),
  kind('sports', 'Sports & fitness', 'Kids, sports & leisure', [
    'sport',
    'gym',
    'fitness',
    'balls?\\b',
    'football',
  ]),
  kind('outdoor', 'Outdoor & camping', 'Kids, sports & leisure', [
    'outdoor',
    'camping',
    'tents?\\b',
  ]),
  kind('music', 'Musical instruments', 'Kids, sports & leisure', [
    'music',
    'instrument',
    'guitar',
    'piano',
    'drums?\\b',
  ]),
  kind('arts', 'Arts & crafts', 'Kids, sports & leisure', ['arts?\\b', 'craft', 'canvas']),
  kind('gifts', 'Gifts & party', 'Kids, sports & leisure', [
    'gift',
    'souvenir',
    'party',
    'balloon',
    'hamper',
  ]),

  kind('agriculture', 'Farm & agro supplies', 'Farm, pets & garden', [
    'farm',
    'agro',
    'agric',
    'fertili',
    'seeds?\\b',
    'feeds?\\b',
    'pesticide',
    'livestock',
  ]),
  kind('pets', 'Pet supplies', 'Farm, pets & garden', [
    '(?:dog|cat|pet) food',
    'pets?\\b',
    'dogs?\\b',
    'cats?\\b',
    'aquarium',
  ]),
  kind('garden', 'Garden & plants', 'Farm, pets & garden', ['garden', 'plants?\\b', 'flower']),

  kind('general', 'General merchandise', 'General'),
  kind('wholesale', 'Wholesale & bulk', 'General', ['wholesale', 'bulk', 'cartons?\\b', 'pallet']),
  kind('services', 'Services', 'General', ['service', 'repair', 'installation']),
  kind('other', 'Other', 'General'),
]

export const DEFAULT_CATEGORY_KIND = 'general'

const BY_ID = new Map(CATEGORY_KINDS.map((k) => [k.id, k]))

/** Kinds that say nothing about the products, so the name decides the icon instead. */
const VAGUE_KINDS = new Set(['', 'general', 'other'])

const PATTERNS: Array<[string, RegExp]> = CATEGORY_KINDS.flatMap((k) =>
  k.keywords.map((word): [string, RegExp] => [k.id, new RegExp(`\\b(?:${word})`, 'i')])
)

export function getCategoryKind(id: string | null | undefined): CategoryKind | undefined {
  return BY_ID.get(String(id || ''))
}

/** A known kind that says what the products are (not general/other). */
export function isSpecificCategoryKind(id: string | null | undefined): boolean {
  const value = String(id || '')
  return BY_ID.has(value) && !VAGUE_KINDS.has(value)
}

export function categoryKindLabel(id: string | null | undefined): string {
  return getCategoryKind(id)?.label ?? ''
}

/**
 * Kind for the first label that matches anything. The longest matched words win, so
 * "dog food" is pets and "iPhone chargers" is accessories; ties go to the earlier kind.
 */
export function inferCategoryKind(...labels: Array<string | null | undefined>): string | null {
  for (const label of labels) {
    const text = String(label || '').trim()
    if (!text) continue
    let best: { id: string; length: number } | null = null
    for (const [id, pattern] of PATTERNS) {
      const length = pattern.exec(text)?.[0].length ?? 0
      if (length > (best?.length ?? 0)) best = { id, length }
    }
    if (best) return best.id
  }
  return null
}

/**
 * The chosen kind when it is specific; otherwise guess from the names (category, parent,
 * product title), falling back to the chosen vague kind or "general".
 */
export function resolveCategoryKind(
  type: string | null | undefined,
  ...labels: Array<string | null | undefined>
): string {
  const chosen = String(type || '')
  if (BY_ID.has(chosen) && !VAGUE_KINDS.has(chosen)) return chosen
  return (
    inferCategoryKind(...labels) ?? (BY_ID.has(chosen) && chosen ? chosen : DEFAULT_CATEGORY_KIND)
  )
}

export function searchCategoryKinds(query: string): CategoryKind[] {
  const q = query.trim().toLowerCase()
  if (!q) return CATEGORY_KINDS
  const inferred = inferCategoryKind(q)
  return CATEGORY_KINDS.filter(
    (k) =>
      k.id === inferred || k.label.toLowerCase().includes(q) || k.group.toLowerCase().includes(q)
  )
}
