import { createAppKit } from "@reown/appkit/react";
import { mainnet, polygon, arbitrum, base } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";

// 1. Get projectId from environment variable
const projectId =
  typeof window !== "undefined"
    ? (import.meta as any).env?.VITE_REOWN_PROJECT_ID || ""
    : process.env.VITE_REOWN_PROJECT_ID || "";

// 2. Create a metadata object
const metadata = {
  name: "KickOff Rivals",
  description: "The ultimate virtual football betting league.",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://kickoffrivals.com",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// 3. Set the networks
const networks = [mainnet, polygon, arbitrum, base] as any;

// 4. Create Wagmi Adapter - only on client
let wagmiAdapter: WagmiAdapter | null = null;

function getWagmiAdapter() {
  if (!wagmiAdapter && typeof window !== "undefined" && projectId) {
    wagmiAdapter = new WagmiAdapter({
      networks,
      projectId,
      ssr: true, // Enable SSR mode for TanStack Start
    });

    // 5. Create modal
    createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId,
      metadata,
      features: {
        analytics: true,
        email: false,
        socials: false,
      },
      themeMode: "dark",
      themeVariables: {
        "--w3m-accent": "#1d4ed8",
        "--w3m-border-radius-master": "1px",
      },
    });
  }
  return wagmiAdapter;
}

// 6. Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

export { queryClient };

// 7. Export provider wrapper with SSR support
export function AppKitProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [adapter, setAdapter] = useState<WagmiAdapter | null>(null);

  useEffect(() => {
    setMounted(true);
    const wa = getWagmiAdapter();
    setAdapter(wa);
  }, []);

  // During SSR or before hydration, render children without wallet providers
  if (!mounted || !adapter) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <WagmiProvider config={adapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
