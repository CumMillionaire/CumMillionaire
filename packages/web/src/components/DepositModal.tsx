import {
  useChainId,
  usePublicClient,
  useReadContract,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { useEffect, useState } from 'react';
import { CONTRACTS, CUMMIES_ABI, LOTTERY_ABI } from '@/config/contracts';
import { formatUnits, maxUint256, parseUnits } from 'viem';
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Field,
  HStack,
  Input,
  Link,
  Portal,
  Slider,
  Stack,
  Text,
} from '@chakra-ui/react';
import { parseViemError } from '@/utils/parseViemError';
import { fmt } from '@/utils/formatNumber';

export function DepositModal({
  open,
  onClose,
  address,
  amountText,
  setAmountText,
  onSuccess,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  address?: `0x${string}`;
  amountText: string;
  setAmountText: (n: string) => void;
  onSuccess: (finalAmount: number) => void;
  balance: number;
}) {
  const chainId = useChainId();
  const pc = usePublicClient()!;

  const amount = Number(amountText);

  const [stage, setStage] = useState<'approve' | 'deposit'>('approve');
  const [unlimited, setUnlimited] = useState(false);
  const [method, setMethod] = useState<'approve' | 'permit2'>('permit2');

  const txUrl = (hash?: `0x${string}`) => (!hash ? '#' : `${chainId === 97 ? 'https://testnet.bscscan.com/tx/' : 'https://bscscan.com/tx/'}${hash}`);

  const { data: maxAcceptableGross } = useReadContract({
    address: CONTRACTS.LOTTERY,
    abi: LOTTERY_ABI,
    functionName: 'maxAcceptableGross',
    query: { refetchInterval: 5_000 },
  });
  const maxAcceptableGrossFormatted = maxAcceptableGross
    ? Math.ceil(Number(formatUnits(maxAcceptableGross, 18)) * 100) / 100
    : 0;

  const effectiveMax = Math.min(Math.ceil((balance || 0) * 100) / 100, maxAcceptableGrossFormatted);

  // Amounts & fees
  const FEE_BPS = 250,
    BPS = 10_000;
  const fee = Math.floor(((amount || 0) * FEE_BPS) / BPS);
  const net = Math.max(0, (amount || 0) - fee);
  const parsedAmount: bigint = (() => {
    try {
      return parseUnits(String(amount || 0), 18);
    } catch {
      return 0n;
    }
  })();
  const isZeroAmount = parsedAmount === 0n;

  // --- Approve vers Lottery ---
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.CUMMIES_TOKEN,
    abi: CUMMIES_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.LOTTERY] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });
  const allowanceKnown = typeof allowance === 'bigint';
  const needsApproval = allowanceKnown ? (allowance as bigint) < parsedAmount : true;

  const approveValue = unlimited ? maxUint256 : parsedAmount;

  const [approveSimError, setApproveSimError] = useState<Error | null>(null);
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();
  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveReceiptError,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  async function handleApprove() {
    console.debug('[Approve→Lottery] send', { value: approveValue.toString() });
    try {
      const { request } = await pc.simulateContract({
        address: CONTRACTS.CUMMIES_TOKEN,
        abi: CUMMIES_ABI,
        functionName: 'approve',
        args: [CONTRACTS.LOTTERY, approveValue],
        account: address,
      });
      writeApprove(request);
    } catch (err) {
      console.log(err);
      setApproveSimError(err as Error);
    }
  }

  useEffect(() => {
    if (method === 'approve' && !isApprovePending && !isApproveConfirming && !isApproveSuccess) {
      // if (stage === 'approve' && allowanceKnown && !needsApproval) setStage('deposit');
      if (stage === 'deposit' && allowanceKnown && needsApproval) setStage('approve');
    }
  }, [allowanceKnown, needsApproval, method, stage, isApprovePending, isApproveConfirming, isApproveSuccess, parsedAmount]);

  useEffect(() => {
    if (method === 'approve' && isApproveSuccess) {
      refetchAllowance();
      setStage('deposit');
    }
  }, [isApproveSuccess, method, refetchAllowance]);

  // --- Permit2 flow ---
  const PERMIT2_ADDRESS = CONTRACTS.PERMIT2 as `0x${string}`;

  // 1) one-time approve token → Permit2
  const { data: p2TokenAllowance, refetch: refetchP2Allowance } = useReadContract({
    address: CONTRACTS.CUMMIES_TOKEN,
    abi: CUMMIES_ABI,
    functionName: 'allowance',
    args: address ? [address, PERMIT2_ADDRESS] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });
  const p2TokenAllowanceKnown = typeof p2TokenAllowance === 'bigint';
  const needsPermit2Setup = p2TokenAllowanceKnown ? (p2TokenAllowance as bigint) < parsedAmount : true;

  const [approveP2SimError, setApproveP2SimError] = useState<Error | null>(null);
  const {
    writeContract: writeApproveP2,
    data: approveP2Hash,
    isPending: isApproveP2Pending,
    error: approveP2Error,
  } = useWriteContract();
  const {
    isLoading: isApproveP2Confirming,
    isSuccess: isApproveP2Success,
    error: approveP2ReceiptError,
  } = useWaitForTransactionReceipt({ hash: approveP2Hash });

  async function handleApprovePermit2Unlimited() {
    console.debug('[Approve→Permit2] MAX');
    try {
      const { request } = await pc.simulateContract({
        address: CONTRACTS.CUMMIES_TOKEN,
        abi: CUMMIES_ABI,
        functionName: 'approve',
        args: [PERMIT2_ADDRESS, maxUint256],
        account: address,
      });
      writeApproveP2(request);
    } catch (err) {
      setApproveP2SimError(err as Error);
    }
  }

  // Refetch allowance when approve succeeds to trigger UI update
  useEffect(() => {
    if (method === 'permit2' && isApproveP2Success) {
      console.debug('[Permit2] approve success, refetching allowance');
      refetchP2Allowance();
    }
  }, [isApproveP2Success, method, refetchP2Allowance]);

  // 2) Signature Transfer
  const sigTypes = {
    PermitTransferFrom: [
      { name: 'permitted', type: 'TokenPermissions' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    TokenPermissions: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
  } as const;

  const permitDomain = {
    name: 'Permit2',
    chainId,
    verifyingContract: PERMIT2_ADDRESS,
  } as const;

  function randomNonce(): bigint {
    const a = new Uint8Array(32);
    crypto.getRandomValues(a);
    const hex = [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
    return BigInt('0x' + hex);
  }

  function deadlineFromNow(): bigint {
    const now = Math.floor(Date.now() / 1000);
    return BigInt(now) + 60n * 30n;
  }

  // 3) Sign & call
  const { signTypedDataAsync, isPending: isSigning, error: signError } = useSignTypedData();

  async function handlePermit2Deposit() {
    if (!address) return;
    try {
      const nonce = randomNonce();
      const deadline = deadlineFromNow();

      // a) signer EIP-712 (Signature Transfer)
      const permitForSig = {
        permitted: { token: CONTRACTS.CUMMIES_TOKEN, amount: parsedAmount },
        spender: CONTRACTS.LOTTERY,
        nonce,
        deadline,
      };
      const signature = await signTypedDataAsync({
        domain: permitDomain,
        types: sigTypes,
        primaryType: 'PermitTransferFrom',
        message: permitForSig,
        account: address,
      });

      // b) call contract (struct without `spender`)
      const permitForCall = {
        permitted: { token: CONTRACTS.CUMMIES_TOKEN, amount: parsedAmount },
        nonce,
        deadline,
      };

      try {
        const { request } = await pc.simulateContract({
          address: CONTRACTS.LOTTERY,
          abi: LOTTERY_ABI,
          functionName: 'depositWithPermit2',
          args: [permitForCall, signature as `0x${string}`, parsedAmount],
          account: address,
        });
        writeDeposit(request);
      } catch (err) {
        setDepositSimError(err as Error);
      }
    } catch (e) {
      console.error('[Permit2] sign/deposit failed', e);
    }
  }

  const [depositSimError, setDepositSimError] = useState<Error | null>(null);
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
    error: depositError,
  } = useWriteContract();
  const {
    isLoading: isDepositConfirming,
    isSuccess: isDepositSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: depositHash });

  async function handleDepositStandard() {
    console.debug('[Deposit] standard', { amount: parsedAmount.toString() });
    try {
      const { request } = await pc.simulateContract({
        address: CONTRACTS.LOTTERY,
        abi: LOTTERY_ABI,
        functionName: 'deposit',
        args: [parsedAmount],
        account: address,
      });
      writeDeposit(request);
    } catch (err) {
      setDepositSimError(err as Error);
    }
  }

  useEffect(() => {
    if (isDepositSuccess) {
      console.debug('[Deposit] success', { hash: depositHash });
      onSuccess?.(amount);
    }
  }, [isDepositSuccess]);

  const requiresPrevStep =
    method === 'approve' ? needsApproval
      : method === 'permit2' ? needsPermit2Setup
        : false;

  const prevStepReason =
    method === 'approve'
      ? "Your current allowance is lower than the selected amount."
      : "One-time Permit2 approval is required before using signature deposits.";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose?.();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="560px" rounded="2xl" borderWidth="1px" borderColor="whiteAlpha.200">
            <Dialog.Header>
              <Dialog.Title>Deposit CUMMIES</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={5}>
                <HStack gap={2}>
                  <Badge variant={stage === 'approve' ? 'solid' : 'subtle'}>1. Approve</Badge>
                  <Badge variant={stage === 'deposit' ? 'solid' : 'subtle'}>2. Deposit</Badge>
                </HStack>

                {/* Amount + Max */}
                <Field.Root>
                  <Field.Label color="whiteAlpha.800">Amount</Field.Label>
                  <Input
                    value={amountText}
                    onChange={(e) => {
                      const input = e.target.value;
                      if (input === '' || /^\d*\.?\d*$/.test(input)) {
                        const v = Number(input);
                        if (!isNaN(v) && input !== '') {
                          const value = Math.max(0, Math.min(v, effectiveMax));
                          setAmountText(value === v ? input : value.toString());
                        } else if (input === '') {
                          setAmountText('');
                        }
                      }
                    }}
                    placeholder="0.0"
                    _placeholder={{ color: 'whiteAlpha.500' }}
                    borderColor="whiteAlpha.300"
                  />
                </Field.Root>
                <HStack justify="flex-end">
                  <Button size="xs" variant="outline"
                          onClick={() => setAmountText(Math.min(Math.ceil((balance || 0) * 100) / 100, maxAcceptableGrossFormatted).toString())}>
                    Max ({fmt(Math.min(Math.ceil((balance || 0) * 100) / 100, maxAcceptableGrossFormatted))})
                  </Button>
                </HStack>
                <Slider.Root
                  width="100%"
                  value={[Math.max(0, Math.min(amount || 0, effectiveMax))]}
                  onValueChange={(e) => setAmountText(Math.min(e.value[0], effectiveMax).toString())}
                  min={0}
                  max={Math.ceil(effectiveMax)}
                >
                  <Slider.Control>
                    <Slider.Track bg="whiteAlpha.200">
                      <Slider.Range />
                    </Slider.Track>
                    <Slider.Thumbs />
                  </Slider.Control>
                </Slider.Root>

                {/* Fee breakdown */}
                <Box p={3} rounded="md" bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200">
                  <HStack justify="space-between">
                    <Text>Amount</Text>
                    <Text fontWeight="semibold">{amount}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Protocol fee (2.5%)</Text>
                    <Text>-{fee}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Net added to pool</Text>
                    <Text fontWeight="semibold">{net}</Text>
                  </HStack>
                </Box>

                {stage === 'approve' && (
                  <Stack gap={3}>
                    <Text fontWeight="semibold">Approval method</Text>
                    <HStack>
                      <Button variant={method === 'permit2' ? 'solid' : 'outline'} onClick={() => setMethod('permit2')}>
                        Permit2 (signature)
                      </Button>
                      <Button variant={method === 'approve' ? 'solid' : 'outline'} onClick={() => setMethod('approve')}>
                        Approve tx
                      </Button>
                    </HStack>

                    {method === 'approve' && (
                      <>
                        <HStack>
                          <Button size="sm" variant={unlimited ? 'solid' : 'outline'}
                                  onClick={() => setUnlimited(true)}>
                            Unlimited
                          </Button>
                          <Button size="sm" variant={!unlimited ? 'solid' : 'outline'}
                                  onClick={() => setUnlimited(false)}>
                            Exact amount
                          </Button>
                        </HStack>

                        {needsApproval ? (
                          <>
                            <Button onClick={handleApprove}
                                    disabled={!allowanceKnown || isApprovePending || isApproveConfirming || isZeroAmount}>
                              {unlimited ? 'Approve unlimited' : 'Approve amount'}
                            </Button>
                            {approveHash && (
                              <Link href={txUrl(approveHash)} target="_blank" rel="noreferrer" fontSize="xs">
                                View approval on BscScan
                              </Link>
                            )}
                          </>
                        ) : (
                          <Button onClick={() => {
                            setDepositSimError(null);
                            setStage('deposit');
                          }}>Already approved – continue</Button>
                        )}
                        {approveSimError && (
                          <Text color="red.300" fontSize="sm">
                            {parseViemError(approveSimError).message}
                          </Text>
                        )}
                        {approveError && (
                          <Text color="red.300" fontSize="sm">
                            {String((approveError as any)?.shortMessage || (approveError as any)?.message || 'Approval failed')}
                          </Text>
                        )}
                        {approveReceiptError && (
                          <Text color="red.300" fontSize="sm">
                            {String((approveReceiptError as any)?.shortMessage || (approveReceiptError as any)?.message || 'Approval receipt failed')}
                          </Text>
                        )}
                      </>
                    )}

                    {method === 'permit2' && (
                      <>
                        {!p2TokenAllowanceKnown ? (
                          <Text fontSize="sm" color="whiteAlpha.800">
                            Checking Permit2 setup…
                          </Text>
                        ) : needsPermit2Setup ? (
                          <>
                            <Box p={3} rounded="md" bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200">
                              <Text fontWeight="semibold" mb={1}>
                                One-time setup required
                              </Text>
                              <Text fontSize="sm" color="whiteAlpha.800">
                                Approve CUMMIES to Permit2 once. Then deposits use a signature + 1 tx.
                              </Text>
                            </Box>
                            <Button onClick={handleApprovePermit2Unlimited}
                                    disabled={isApproveP2Pending || isApproveP2Confirming}>
                              Approve Permit2 (unlimited)
                            </Button>
                            {approveP2Hash && (
                              <Link href={txUrl(approveP2Hash)} target="_blank" rel="noreferrer" fontSize="xs">
                                View approval on BscScan
                              </Link>
                            )}
                            {approveP2SimError && (
                              <Text color="red.300" fontSize="sm">
                                {parseViemError(approveP2SimError).message}
                              </Text>
                            )}
                            {approveP2Error && (
                              <Text color="red.300" fontSize="sm">
                                {String((approveP2Error as any)?.shortMessage || (approveP2Error as any)?.message || 'Permit2 approval failed')}
                              </Text>
                            )}
                            {approveP2ReceiptError && (
                              <Text color="red.300" fontSize="sm">
                                {String((approveP2ReceiptError as any)?.shortMessage || (approveP2ReceiptError as any)?.message || 'Permit2 approval receipt failed')}
                              </Text>
                            )}
                          </>
                        ) : (
                          <>
                            {/* EIP-712 recap (what you'll sign) */}
                            <Card.Root variant="outline" borderColor="whiteAlpha.200" bg="whiteAlpha.100">
                              <Card.Body>
                                <Text fontWeight="semibold" mb={2}>
                                  You will sign:
                                </Text>
                                <Text fontSize="sm">
                                  Domain • name: Permit2 • chainId: {chainId} • verifyingContract: {PERMIT2_ADDRESS}
                                </Text>
                                <Text fontSize="sm">Spender: {CONTRACTS.LOTTERY}</Text>
                                <Text fontSize="sm">Token: {CONTRACTS.CUMMIES_TOKEN}</Text>
                                <Text fontSize="sm">Amount: {Number(amount)} CUMMIES</Text>
                                <Text fontSize="sm">Sig deadline: 30 minutes</Text>
                              </Card.Body>
                            </Card.Root>

                            <Button onClick={handlePermit2Deposit}
                                    disabled={!address || isSigning || isZeroAmount || isDepositPending || isDepositConfirming}>
                              Sign & deposit
                            </Button>
                            {signError && (
                              <Text color="red.300" fontSize="sm">
                                {String((signError as any)?.shortMessage || (signError as any)?.message || 'Signature failed')}
                              </Text>
                            )}
                            {depositSimError && (
                              <Text color="red.300" fontSize="sm">
                                {parseViemError(depositSimError).message}
                              </Text>
                            )}
                            {depositError && (
                              <Text color="red.300" fontSize="sm">
                                {String((depositError as any)?.shortMessage || (depositError as any)?.message || 'Deposit failed')}
                              </Text>
                            )}
                            {receiptError && (
                              <Text color="red.300" fontSize="sm">
                                {String((receiptError as any)?.shortMessage || (receiptError as any)?.message || 'Transaction failed')}
                              </Text>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </Stack>
                )}

                {stage === 'deposit' && (
                  <Stack gap={3}>
                    <Text>Ready to deposit {amount} CUMMIES (fee 2.5% applied by the contract).</Text>

                    {requiresPrevStep ? (
                      <>
                        <Box p={3} rounded="md" bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200">
                          <Text fontSize="sm" color="whiteAlpha.800">
                            {prevStepReason}
                          </Text>
                        </Box>
                        <Button
                          variant="outline"
                          onClick={() => setStage('approve')}
                        >
                          Back to approval
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={method === 'permit2' ? handlePermit2Deposit : handleDepositStandard}
                        disabled={isDepositPending || isDepositConfirming || isZeroAmount}
                      >
                        Confirm deposit
                      </Button>
                    )}
                    {depositHash && (
                      <Link href={txUrl(depositHash)} target="_blank" rel="noreferrer" fontSize="xs">
                        View deposit on BscScan
                      </Link>
                    )}
                    {depositSimError && (
                      <Text color="red.300" fontSize="sm">
                        {parseViemError(depositSimError).message}
                      </Text>
                    )}
                    {depositError && (
                      <Text color="red.300" fontSize="sm">
                        {String((depositError as any)?.shortMessage || (depositError as any)?.message || 'Deposit failed')}
                      </Text>
                    )}
                    {receiptError && (
                      <Text color="red.300" fontSize="sm">
                        {String((receiptError as any)?.shortMessage || (receiptError as any)?.message || 'Transaction failed')}
                      </Text>
                    )}
                  </Stack>
                )}
              </Stack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
