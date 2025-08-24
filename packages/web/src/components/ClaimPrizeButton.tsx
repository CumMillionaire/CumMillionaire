import { useAccount, useChainId, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { useEffect, useState } from 'react';
import { CONTRACTS, LOTTERY_ABI } from '@/config/contracts';
import { useCoolMode } from '@/hooks/useCoolMode';
import { Button, Link, Stack, Text } from '@chakra-ui/react';
import { parseViemError } from '@/utils/parseViemError';
import { txScanUrl } from '@/utils/scanUrl';

export function ClaimPrizeButton({ roundId, disabled, onClaimed }: { roundId: number; disabled?: boolean; onClaimed?: () => void }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const pc = usePublicClient()!;
  const { writeContract, data: hash, isPending, error: writeErr } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptErr } = useWaitForTransactionReceipt({ hash });
  const [simErr, setSimErr] = useState<Error | null>(null);

  useEffect(() => {
    if (isSuccess) onClaimed?.();
  }, [isSuccess, onClaimed]);

  async function claim() {
    try {
      const { request } = await pc.simulateContract({
        address: CONTRACTS.LOTTERY,
        abi: LOTTERY_ABI,
        functionName: 'claimPrize',
        args: [BigInt(roundId)],
        account: address,
      });
      writeContract(request);
    } catch (e) {
      setSimErr(e as Error);
    }
  }

  const coolCumRef = useCoolMode('/cum.svg', true, {
    meanAngleDeg: -90,
    spreadDeg: 20,
    minSpeed: 12,
    maxSpeed: 18,
    gravity: 0.15,
    drag: 0.01,
    alignWithVelocity: true,
    headingOffsetDeg: 90,

    burstCount: 30,            // total per burst
    burstIntervalSec: 0.5,     // time between burst starts
    burstDurationSec: 0.18,    // <-- spread emission of the 30 over 180ms
    burstJitterSec: 0.03,      // small randomness on interval (optional)
    initialBurstDelaySec: 0,

    maxParticles: 220,
  });

  return (
    <Stack gap={2} align="flex-start">
      <Button
        ref={coolCumRef as React.Ref<HTMLButtonElement>}
        onClick={claim}
        disabled={disabled}
        loading={isConfirming || isPending}
        border={0}
        bgGradient="to-r"
        gradientFrom="pink.500"
        gradientVia="fuchsia.500"
        gradientTo="violet.500"
        color="white"
        _active={{
          filter: 'brightness(0.95)',
          boxShadow: '0 6px 16px -6px rgba(217, 70, 239, 0.5)'
        }}
        _hover={{
          '&:not(:active)': {
            // bgPos: '100% 0%',                // décale le gradient → effet subtil
            filter: 'brightness(1.05)',
            boxShadow: '0 12px 28px -10px rgba(217, 70, 239, 0.65)'
          },
        }}
        _focusVisible={{
          outline: 'none',
          boxShadow: '0 0 0 3px var(--chakra-colors-fuchsia-300), 0 10px 24px -10px rgba(217, 70, 239, 0.6)'
        }}
      >
        Withdraw my winnings
      </Button>
      {hash && (
        <Link href={txScanUrl(hash, chainId)} target="_blank" rel="noreferrer" fontSize="xs">
          View transaction
        </Link>
      )}
      {(simErr || writeErr || receiptErr) && (
        <Text color="red.300" fontSize="sm">
          {parseViemError((simErr || writeErr || receiptErr) as Error).message}
        </Text>
      )}
    </Stack>
  );
}
