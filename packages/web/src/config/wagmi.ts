import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import {
  cookieStorage,
  createStorage
} from 'wagmi'
import { anvil, bscTestnet, bsc } from 'wagmi/chains';
import { QueryClient } from '@tanstack/react-query';

let chains;

switch (process.env.NEXT_PUBLIC_CHAIN_NAME ) {
  case 'mainnet':
    chains = [bsc] as const;
    break;
  case 'testnet':
    chains = [bscTestnet, bsc] as const;
    break;
  case 'local':
  default:
    chains = [anvil, bsc] as const;
    break;
}

// Create wagmi config with RainbowKit
export const config = getDefaultConfig({
  appName: 'CumMillionaire',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694',
  chains,
  // Only create connectors on client-side to avoid SSR issues
  // TODO: update when https://github.com/rainbow-me/rainbowkit/issues/2476 is resolved
  wallets: typeof window === 'undefined' ? [{ groupName: 'Popular', wallets: [injectedWallet] }] : undefined,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export const queryClient = new QueryClient();
