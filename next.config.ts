// next.config.mjs (or next.config.js)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add the following webpack configuration
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Exclude `node:fs` module from client-side bundle
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            // Required for @electric-sql/pglite
            // net: false,
            // tls: false,
        }
    }

    // Add rule to handle WASM files
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true }; // enable WASM imports
    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm'

    // Ensure WASM files are correctly handled by file-loader
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'javascript/auto', // Correct type for WASM handling with asyncWebAssembly
      // Or for older webpack versions / specific needs:
      // type: 'webassembly/async',
    });


    return config;
  },
};

export default nextConfig; // Use 'module.exports = nextConfig;' if using .js file