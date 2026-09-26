/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Le calendrier a été remplacé par La console
      { source: '/contenu/calendrier', destination: '/console', permanent: true },
    ];
  },
};

export default nextConfig;
