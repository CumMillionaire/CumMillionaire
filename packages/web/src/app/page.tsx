'use client';

import { useState } from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Icon,
  Link,
  Progress,
  SimpleGrid,
  Span,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  Copy,
  ExternalLink,
  Info,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTimeoutFn } from 'react-use';
import { CONTRACTS, CUMMIES_ABI, LOTTERY_ABI, CONTRACT_URL } from '@/config/contracts';
import { StatusBadge } from '@/components/StatusBadge';
import { GradientLogo } from '@/components/GradientLogo';
import { GradientText } from '@/components/GradientText';
import { Stat } from '@/components/Stat';
import { Step } from '@/components/Step';
import { DrawLotteryButton } from '@/components/DrawLotteryButton';
import { DepositPanel } from '@/components/DepositPanel';
import { RoundsHistorySection } from '@/components/RoundsHistorySection';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { Tooltip } from '@/components/ui/tooltip';
import { fmt } from '@/utils/formatNumber';
import { readContractScanUrl } from '@/utils/scanUrl';
import { copyText } from '@/utils/copyText';

const MotionBox = motion.create(Box);

export default function Home() {
  const { address } = useAccount();
  const chainId = useChainId();

  const { data: cummiesBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.CUMMIES_TOKEN,
    abi: CUMMIES_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5_000,
      refetchIntervalInBackground: true,
    },
  });
  const balance = cummiesBalance ? Number(formatUnits(cummiesBalance, 18)) : 0;

  // Real lottery contract data
  const { data: targetPoolRaw } = useReadContract({
    address: CONTRACTS.LOTTERY,
    abi: LOTTERY_ABI,
    functionName: 'TARGET_POOL',
    query: { refetchInterval: 30_000 }
  });
  
  const { data: totalDepositsRaw } = useReadContract({
    address: CONTRACTS.LOTTERY,
    abi: LOTTERY_ABI,
    functionName: 'totalDeposits',
    query: { refetchInterval: 10_000 }
  });
  
  const { data: isRoundActive } = useReadContract({
    address: CONTRACTS.LOTTERY,
    abi: LOTTERY_ABI,
    functionName: 'currentRoundActive',
    query: { refetchInterval: 10_000 }
  });
  
  const { data: acceptingDeposits } = useReadContract({
    address: CONTRACTS.LOTTERY,
    abi: LOTTERY_ABI,
    functionName: 'acceptingDeposits',
    query: { refetchInterval: 10_000 }
  });

  const target = Number(formatUnits(targetPoolRaw || 0n, 18));
  const total = Number(formatUnits(totalDepositsRaw || 0n, 18));
  const progress = Math.min(100, target > 0 ? (total / target) * 100 : 0);
  
  // Determine status based on contract state
  const status = progress >= 100 ? 'FINISHED' : 
                 (isRoundActive && acceptingDeposits) ? 'LIVE' : 
                 total > 0 ? 'PAUSED' : 'IDLE';

  const [copied, setCopied] = useState(false);

  useTimeoutFn(
    () => {
      setCopied(false);
    },
    copied ? 1200 : undefined,
  );

  return (
    <Box minH="100vh" position="relative" overflow="hidden">
      {/* Background decor */}
      <Box pointerEvents="none" position="fixed" inset={0} zIndex={0}>
        <Box position="absolute" top={-24} left={-24} w={80} h={80} rounded="full" filter="blur(80px)" opacity={0.3} bg="pink.500" />
        <Box position="absolute" bottom={-24} right={-24} w={96} h={96} rounded="full" filter="blur(90px)" opacity={0.3} bg="purple.600" />
        <Box position="absolute" inset={0} bgImage="radial-gradient({colors.whiteAlpha.200}, transparent 60%)" />
      </Box>

      {/* Navbar */}
      <Container maxW="7xl" py={5}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={3}>
            <GradientLogo />
            <Text fontWeight="semibold" fontSize="lg">
              <GradientText>CumMillionaire</GradientText>
            </Text>
            <Badge ml={3} border="1px solid {colors.whiteAlpha.950/10}" borderRadius="full">
              {chainId === 56 && 'BNB Chain'}
              {chainId === 97 && 'BNB Chain Testnet'}
            </Badge>
          </Flex>
          <Flex align="center" gap={3}>
            {/* <Button variant="ghost" size="sm" colorScheme="whiteAlpha">
              <Bell size={16} style={{ marginRight: 6 }} /> Alerts
            </Button> */}
            <ConnectWalletButton />
          </Flex>
        </Flex>
      </Container>

      {/* Hero */}
      <Container maxW="7xl" pt={2} pb={8}>
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6} alignItems="stretch">
          <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} gridColumn={{ lg: 'span 2' }}>
            <Card.Root variant="outline" borderColor="whiteAlpha.200" bg="whiteAlpha.100" overflow="hidden">
              <Card.Header pb={0}>
                <Badge w="fit-content" mb={3} bg="whiteAlpha.300" borderRadius="full">
                  Decentralized & Fair
                </Badge>
                <Heading size={{ base: '2xl', md: '4xl' }}>
                  Deposit your <GradientText>CUMMIES</GradientText> tokens & win the jackpot when the pool reaches <GradientText>1,000,000</GradientText>
                </Heading>
              </Card.Header>
              <Card.Body pt={4}>
                <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
                  <Box gridColumn={{ md: 'span 2' }}>
                    <Stat label="Total CUMMIES" value={fmt(total)} hint="In the prize pool" />
                  </Box>
                  <Stack gap={4} gridColumn={{ md: 'span 2' }}>
                    <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" variant="outline">
                      <Card.Body>
                        <Flex align="center" justify="space-between" fontSize="sm" color="whiteAlpha.800" mb={2}>
                          <Text>Progress to 1M</Text>
                          <Text>{fmt(progress)}%</Text>
                        </Flex>
                        <Progress.Root maxW="240px" value={progress}>
                          <Progress.Track h={2} bg="whiteAlpha.200" borderRadius="md">
                            <Progress.Range bg="bg.muted" />
                          </Progress.Track>
                        </Progress.Root>
                      </Card.Body>
                    </Card.Root>
                    <Flex align="center" gap={3}>
                      <StatusBadge status={status} />
                      <Text color="whiteAlpha.800" fontSize="sm">
                        Target: {fmt(target)} CUMMIES
                      </Text>
                    </Flex>
                  </Stack>

                  {/* Draw Lottery Button - Only show when target is reached */}
                  {progress >= 100 && (
                    <MotionBox gridColumn={{ md: 'span 4' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                      <Card.Root variant="outline" borderColor="pink.300" bg="whiteAlpha.50">
                        <Card.Header pb={2}>
                          <Heading size="md" color="pink.300">
                            <Icon verticalAlign="text-bottom" mr="2"><Trophy size={20} /></Icon>
                            Target Reached! 🎉
                          </Heading>
                        </Card.Header>
                        <Card.Body pt={2}>
                          <Text color="whiteAlpha.700" fontSize="sm" mb={4}>
                            The lottery pool has reached its target of {fmt(target)} CUMMIES.
                            Launch the draw to select the winner using Chainlink VRF!
                          </Text>
                          <DrawLotteryButton />
                        </Card.Body>
                      </Card.Root>
                    </MotionBox>
                  )}
                </SimpleGrid>
              </Card.Body>
              <Card.Footer>
                <Stack direction={{ base: 'column', sm: 'row' }} gap={3}>
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      unstyled
                      href={CONTRACT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Info size={16} /> View contract
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      unstyled
                      href={readContractScanUrl(CONTRACTS.LOTTERY, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={16} /> BscScan
                    </Link>
                  </Button>
                  <Tooltip
                    content="Copied !"
                    showArrow
                    open={copied}
                    openDelay={0}
                    closeDelay={0}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const success = await copyText(CONTRACTS.LOTTERY);
                        if (success) setCopied(true);
                      }}
                    >
                      <Copy size={16} /> Copy address
                    </Button>
                  </Tooltip>
                </Stack>
              </Card.Footer>
            </Card.Root>
          </MotionBox>

          <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}>
            <DepositPanel
              balance={balance}
              onDeposit={(_amt: string) => {
                // Real-time data will auto-refresh from contract
                refetchBalance();
              }}
            />
          </MotionBox>
        </SimpleGrid>
      </Container>

      {/* How it works */}
      <Container maxW="7xl" py={8}>
        <Card.Root variant="outline" borderColor="whiteAlpha.200" bg="whiteAlpha.100">
          <Card.Header>
            <Flex align="center" gap={2}>
              <Sparkles size={18} />
              <Heading size="sm">How it works</Heading>
            </Flex>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
              <Step icon={Ticket} title="1 · Deposit" text="Connect your wallet and deposit any amount of CUMMIES to join the lottery." />
              <Step icon={ShieldCheck} title="2 · Provably fair" text="Smart contracts hold funds and automatically pick a winner when the pool hits 1M." />
              <Step icon={Trophy} title="3 · Win" text="If you're the lucky one, withdraw the entire jackpot to your wallet." />
            </SimpleGrid>
          </Card.Body>
        </Card.Root>
      </Container>

      {/* Rounds & Gains */}
      <RoundsHistorySection />

      {/* Extras */}
      <Container maxW="7xl" pt={8} pb={12}>
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
          <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" variant="outline">
            <Card.Header>
              <Heading size="sm">Why you&apos;ll love it</Heading>
            </Card.Header>
            <Card.Body color="whiteAlpha.800" fontSize="sm" display="grid" gap={2}>
              <Text>• Non-custodial – your wallet, your keys.</Text>
              <Text>• Transparent rules baked into code.</Text>
              <Text>• Cute, playful vibes that match CumRocket.</Text>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" variant="outline">
            <Card.Header>
              <Heading size="sm">FAQs</Heading>
            </Card.Header>
            <Card.Body>
              <Accordion.Root collapsible>
                <Accordion.Item value="funds">
                  <Accordion.ItemTrigger>
                    <Span flex="1">Where do the funds live?</Span>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent color="whiteAlpha.800">Funds are held in the lottery smart contract on BNB Chain until the jackpot condition is met.</Accordion.ItemContent>
                </Accordion.Item>
                <Accordion.Item value="winner">
                  <Accordion.ItemTrigger>
                    <Span flex="1">How is the winner picked?</Span>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent color="whiteAlpha.800">The contract uses an on-chain randomness source (Chainlink VRF) to select a winner fairly.</Accordion.ItemContent>
                </Accordion.Item>
                <Accordion.Item value="fees">
                  <Accordion.ItemTrigger>
                    <Span flex="1">What are the fees?</Span>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent color="whiteAlpha.800">A tiny protocol fee may apply to cover gas and maintenance. Exact numbers will be disclosed before you deposit.</Accordion.ItemContent>
                </Accordion.Item>
              </Accordion.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" variant="outline">
            <Card.Header>
              <Heading size="sm">Stay safe</Heading>
            </Card.Header>
            <Card.Body color="whiteAlpha.800" fontSize="sm" display="grid" gap={2}>
              <Text>• Only interact with the official contract address.</Text>
              <Text>• Double‑check the domain and never share your seed phrase.</Text>
              <Text>• Gamble responsibly – set limits and take breaks.</Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Container>

      {/* Footer */}
      <Box borderTop="1px solid" borderColor="whiteAlpha.200">
        <Container maxW="7xl" py={8}>
          <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={3} color="whiteAlpha.800" fontSize="sm">
            <Text> {new Date().getFullYear()} CumMillionaire. Built on BNB Chain.</Text>
            <Flex gap={4}>
              <Link href="#" _hover={{ color: 'white' }}>
                Terms
              </Link>
              <Link href="#" _hover={{ color: 'white' }}>
                Privacy
              </Link>
              <Text color="whiteAlpha.600">Always gamble responsibly.</Text>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
