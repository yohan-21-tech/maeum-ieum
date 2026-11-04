import type { NextConfig } from 'next';
const nextConfig: NextConfig = { reactStrictMode: true, poweredByHeader: false,distDir:process.env.NODE_ENV==='development'?'.next-dev':'.next',
 async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]},{source:'/api/:path*',headers:[{key:'Cache-Control',value:'private, no-store'}]}];}
};
export default nextConfig;
