import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://app.hamabeadsbrasil.com.br';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/editor', '/gallery', '/gallery/*', '/creator/*'],
        disallow: ['/dashboard/*', '/inventory/*', '/orders/*', '/clients/*', '/api/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
