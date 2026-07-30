/**
 * The card treatment every top-level section wears.
 *
 * A string rather than a component because the sections it dresses are not
 * structurally alike — some are `<section aria-label>`, one is a `<button>`
 * that collapses, one carries an `id` for an anchor — and a wrapper component
 * would have to grow an `as` prop and a props passthrough to serve them. What
 * they need to share is the treatment, so that is what is shared.
 *
 * **It exists because a page grew two visual languages without anyone
 * deciding it should.** Settings had bare `mt-8` sections until the profile
 * work added card-styled ones beside them; their contents then started 21px
 * apart, so headings jogged left halfway down the page. Nobody's mistake in
 * isolation, and invisible in a diff — which is the argument for one name
 * instead of eight copies of the same class string.
 */
export const CARD_SECTION = 'mt-8 rounded-card border border-border bg-surface p-5'
