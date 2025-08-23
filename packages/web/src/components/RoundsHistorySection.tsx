import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { CONTRACTS, LOTTERY_ABI } from '@/config/contracts';
import { useState } from 'react';
import {
  Badge,
  Box, Button,
  Card,
  Container,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Skeleton,
  Stack,
  Tag,
  Text,
} from '@chakra-ui/react';
import { fmt } from '@/utils/formatNumber';
import { formatUnits } from 'viem';
import { shortAddr } from '@/utils/shortAddr';
import { Trophy } from 'lucide-react';
import { ClaimPrizeButton } from '@/components/ClaimPrizeButton';

export function RoundsHistorySection() {
  const { address } = useAccount();

  // 1) Finished rounds count
  const { data: roundsCountRaw, refetch: refetchCount } = useReadContract({
    address: CONTRACTS.LOTTERY,
    abi: LOTTERY_ABI,
    functionName: 'roundsHistoryCount',
    query: { refetchInterval: 10_000, refetchIntervalInBackground: true },
  });
  const roundsCount = Number(roundsCountRaw || 0n);

  // 2) Simple pagination (latest first)
  const pageSize = 8;
  const [page, setPage] = useState(0);
  const from = Math.max(0, roundsCount - (page + 1) * pageSize);
  const to = Math.max(0, roundsCount - page * pageSize);
  const idsDesc = Array.from({ length: Math.max(0, to - from) }, (_, i) => to - 1 - i);

  // 3) Batch reads (winner, prize, claimed*, your deposit)
  const contracts = [
    ...idsDesc.map((id) => ({ address: CONTRACTS.LOTTERY, abi: LOTTERY_ABI, functionName: 'winnerOf', args: [BigInt(id)] })),
    ...idsDesc.map((id) => ({ address: CONTRACTS.LOTTERY, abi: LOTTERY_ABI, functionName: 'prizeOf', args: [BigInt(id)] })),
    ...idsDesc.map((id) => ({ address: CONTRACTS.LOTTERY, abi: LOTTERY_ABI, functionName: 'rounds', args: [BigInt(id)] })),
    ...(address ? idsDesc.map((id) => ({ address: CONTRACTS.LOTTERY, abi: LOTTERY_ABI, functionName: 'depositOf', args: [BigInt(id), address] })) : []),
  ];

  const { data: batch, isLoading, refetch: refetchBatch } = useReadContracts({
    contracts,
    allowFailure: true,
    query: { refetchInterval: 10_000, refetchIntervalInBackground: true }
  });

  type SimpleResult =
    | { status: 'success'; result: unknown }
    | { status: 'failure'; error: unknown };
  const results = (batch as unknown ?? []) as ReadonlyArray<SimpleResult>;

  const L = idsDesc.length;
  const winners = results.slice(0, L).map((r) => (r.status === 'success' ? (r.result as `0x${string}`) : undefined));
  const prizes  = results.slice(L, 2 * L).map((r) => (r.status === 'success' ? (r.result as bigint) : 0n));
  const roundsMeta = results.slice(2 * L, 3 * L);
  const claimed = roundsMeta.map((r) => (r.status === 'success' ? Boolean((r.result as any)?.[2]) : undefined));
  const yourDeposits = address ? results.slice(3 * L ).map((r) => (r.status === 'success' ? (r.result as bigint) : 0n)) : [];

  function RoundCard({ idx }: { idx: number }) {
    const id = idsDesc[idx];
    const win = winners[idx];
    const prize = prizes[idx];
    const wasYou = !!address && !!win && win.toLowerCase() === address.toLowerCase();
    const isClaimed = claimed[idx];
    const yourNet = yourDeposits[idx] || 0n;

    return (
      <Card.Root variant="outline" borderColor="whiteAlpha.200" bg="whiteAlpha.100">
        <Card.Header>
          <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
            <Flex align="center" gap={3}>
              <Badge>Round #{id}</Badge>
              {isClaimed === true && (
                <Tag.Root size="sm" colorPalette="green">
                  <Tag.Label>Paid</Tag.Label>
                </Tag.Root>
              )}
              {isClaimed === false && (
                <Tag.Root size="sm" colorPalette="yellow">
                  <Tag.Label>Unclaimed</Tag.Label>
                </Tag.Root>
              )}
              {isClaimed === undefined && (
                <Tag.Root size="sm" colorPalette="gray">
                  <Tag.Label>Status unknown</Tag.Label>
                </Tag.Root>
              )}
            </Flex>
            <Text fontSize="sm" color="whiteAlpha.800">
              Prize:&nbsp;<strong>{fmt(Number(formatUnits(prize || 0n, 18)))}</strong>&nbsp;CUMMIES
            </Text>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Box>
              <Text fontSize="sm" color="whiteAlpha.700">Winner</Text>
              <Text fontWeight="semibold">{shortAddr(win)}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="whiteAlpha.700">Your deposit (net)</Text>
              <Text fontWeight="semibold">{fmt(Number(formatUnits(yourNet, 18)))} CUMMIES</Text>
            </Box>
            <Box justifySelf={{ md: 'flex-end' }}>
              {wasYou ? (
                isClaimed === true ? (
                  <Flex
                    maxW="max-content"
                    align="center"
                    borderWidth="1px"
                    borderColor="green.300"
                    borderRadius="md"
                    p={3}
                    bg="green.900/10"
                  >
                    <Trophy size={16} />
                    <Text ml="2" fontWeight="semibold">Prize withdrawn</Text>
                  </Flex>
                ) : (
                  <ClaimPrizeButton
                    roundId={id}
                    disabled={isClaimed}
                    onClaimed={() => {
                      refetchCount();
                      refetchBatch();
                    }}
                  />
                )
              ) : (
                <Text fontSize="sm" color="whiteAlpha.700">You are not the winner for this round.</Text>
              )}
            </Box>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      <Card.Root variant="outline" borderColor="whiteAlpha.200" bg="whiteAlpha.100">
        <Card.Header>
          <Flex align="center" gap={2}>
            <Trophy size={18} />
            <Heading size="sm">Rounds & Winnings</Heading>
          </Flex>
        </Card.Header>
        <Card.Body>
          {roundsCount === 0 ? (
            <Text color="whiteAlpha.800">
              No finished rounds yet, come back after the first draw.
            </Text>
          ) : isLoading ? (
            <Stack gap={3}>
              {Array.from({ length: Math.min(pageSize, roundsCount) }).map((_, i) => (
                <Skeleton key={i} height="92px" rounded="xl" />
              ))}
            </Stack>
          ) : (
            <Stack gap={4}>
              {idsDesc.map((_, i) => (
                <RoundCard key={idsDesc[i]} idx={i} />
              ))}
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="whiteAlpha.700">
                  {roundsCount} total rounds – Page {page + 1}
                </Text>
                <HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => (from > 0 ? p + 1 : p))}
                    disabled={from === 0}
                  >
                    Next
                  </Button>
                </HStack>
              </Flex>
            </Stack>
          )}
        </Card.Body>
      </Card.Root>
    </Container>
  );
}
