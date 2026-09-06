function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderStorefrontOgHtml(params: {
  title: string
  description: string
  url: string
  imageUrl?: string | null
  siteName?: string
}): string {
  const title = escapeHtml(params.title)
  const description = escapeHtml(params.description)
  const url = escapeHtml(params.url)
  const image = params.imageUrl ? escapeHtml(params.imageUrl) : ''
  const siteName = escapeHtml(params.siteName || 'Storvv')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${url}" />
  ${image ? `<meta property="og:image" content="${image}" />` : ''}
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  ${image ? `<meta name="twitter:image" content="${image}" />` : ''}
</head>
<body>
  <p><a href="${url}">${title}</a></p>
  <p>${description}</p>
</body>
</html>`
}
