// safelinkme-shortcode-redirect
// Handles safelinkme.net/* — checks if path is a valid shortcode.
// If yes -> redirect to verify.safelinkme.net
// If no  -> forward request to the safelinkme-pages Pages project
//           (so signin/signup/statis/etc keep working untouched)

const PAGES_HOSTNAME = 'safelinkme-pages.pages.dev';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Root path ("/") is the landing page -> always forward to Pages
    if (path !== '/') {
      const code = path.slice(1).split('/')[0];

      // Only treat as shortcode if it looks like one (avoid pointless
      // DB hits for obvious static assets / multi-segment paths)
      if (code && !code.includes('.')) {
        const link = await env.DB.prepare(
          'SELECT code, status, deleted_at FROM links WHERE code = ?'
        ).bind(code).first();

        if (link && link.status === 'active' && !link.deleted_at) {
          return Response.redirect(
            `https://verify.safelinkme.net/?code=${encodeURIComponent(code)}`,
            302
          );
        }
      }
    }

    // Not a valid/active shortcode -> forward untouched to Pages project
    const pagesUrl = new URL(request.url);
    pagesUrl.hostname = PAGES_HOSTNAME;

    return fetch(pagesUrl.toString(), request);
  }
};
