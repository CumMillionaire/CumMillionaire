import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Box, Button, Flex } from '@chakra-ui/react';
import { Wallet } from 'lucide-react';

export function ConnectWalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} bgColor="transparent" color="fg" position="relative" overflow="hidden">
                    <Box
                      position="absolute"
                      inset={0}
                      // bgGradient="linear(to-r, {colors.pink.400}, {colors.fuchsia.400}, {colors.violet.500})"
                      bgGradient="to-r"
                      gradientFrom="pink.500"
                      gradientVia="fuchsia.500"
                      gradientTo="violet.500"
                      opacity={0.7}
                      filter="auto"
                      blur="8px"
                      animation="pulse"
                    />
                    <Flex position="relative" zIndex={1} align="center" gap={2}>
                      <Wallet size={16} />
                      Connect Wallet
                    </Flex>
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button variant="ghost" onClick={openChainModal}>
                    Wrong network
                  </Button>
                );
              }

              return (
                <Button variant="ghost" onClick={openAccountModal}>
                  <Wallet size={16} />
                  {account.displayName}
                  {account.displayBalance ? ` (${account.displayBalance})` : ''}
                </Button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
