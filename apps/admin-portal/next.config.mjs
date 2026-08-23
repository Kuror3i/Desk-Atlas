/** @type {import("next").NextConfig} */
const nextConfig = {
  agentRules: false,
  transpilePackages: ["@deskatlas/domain", "@deskatlas/ui"],
};

export default nextConfig;
