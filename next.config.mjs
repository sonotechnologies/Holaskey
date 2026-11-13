const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname;
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/**' }]
      : [],
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    // Files the link-preview image route reads at runtime.
    outputFileTracingIncludes: {
      '/og': ['./lib/og-fonts/**', './public/img/**', './public/wordmark-bone.png', './public/signature.png'],
    },
  },
};

export default nextConfig;
