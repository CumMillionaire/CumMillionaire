'use client';

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config, queryClient } from '@/config/wagmi';
import { config as themeConfig } from '@/theme';
import { ColorModeProvider } from '@/components/ui/color-mode';
// import { EmotionCacheProvider } from '@/components/EmotionCacheProvider';

const theme = createSystem(defaultConfig, themeConfig);

export function Providers({ children, cookies }: { children: React.ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(config, cookies);

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} locale="en">
          {/* <EmotionCacheProvider> */}
          <ChakraProvider value={theme}>
            <ColorModeProvider forcedTheme="dark">
              {children}
            </ColorModeProvider>
          </ChakraProvider>
          {/* </EmotionCacheProvider> */}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
