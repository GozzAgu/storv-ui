/**
 * What real Storvv customers say, shown on the home page. The section stays hidden while this
 * list is empty. Only add quotes customers have agreed to share, in their own words.
 *
 * Example:
 * {
 *   quote: 'We stopped losing track of phones between our two branches.',
 *   name: 'Ada Okafor',
 *   role: 'Owner',
 *   business: 'Ada Gadgets, Ikeja',
 * }
 */
export interface Testimonial {
  quote: string
  name: string
  role: string
  business: string
  /** Optional square photo or logo in /public, e.g. '/marketing/people/ada.webp'. */
  photo?: string
}

export const TESTIMONIALS: Testimonial[] = []
