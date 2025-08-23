import { useAccount, useChainId, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { useState } from 'react';
import { CONTRACTS, LOTTERY_ABI } from '@/config/contracts';
import { Button, Link, Stack, Text } from '@chakra-ui/react';
import { Zap } from 'lucide-react';
import { parseViemError } from '@/utils/parseViemError';
import { txUrlFor } from '@/utils/txUrlFor';

export function DrawLotteryButton({ disabled }: { disabled?: boolean; }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const pc = usePublicClient()!;
  const { writeContract, data: hash, isPending, error: writeErr } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptErr } = useWaitForTransactionReceipt({ hash });
  const [simErr, setSimErr] = useState<Error | null>(null);

  // useEffect(() => {
  //   if (isSuccess) onDrawStarted?.();
  // }, [isSuccess, onDrawStarted]);

  async function requestDraw() {
    try {
      const { request } = await pc.simulateContract({
        address: CONTRACTS.LOTTERY,
        abi: LOTTERY_ABI,
        functionName: 'requestRandomness',
        account: address,
      });
      writeContract(request);
    } catch (e) {
      setSimErr(e as Error);
    }
  }

  return (
    <Stack gap={2} align="flex-start">
      <Button
        onClick={requestDraw}
        disabled={disabled || !address}
        loading={isConfirming || isPending}
        border={0}
        bgGradient="to-r"
        gradientFrom="pink.500"
        gradientVia="fuchsia.500"
        gradientTo="violet.500"
        color="white"
        _hover={{
          transform: 'translateY(-1px)',
          boxShadow: 'lg'
        }}
      >
        <Zap size={16} />
        Launch lottery draw
      </Button>
      {hash && (
        <Link href={txUrlFor(hash, chainId)} target="_blank" rel="noreferrer" fontSize="xs">
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
