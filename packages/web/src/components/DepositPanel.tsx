import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';
import { CONTRACTS, LOTTERY_ABI } from '@/config/contracts';
import { formatUnits } from 'viem';
import {
  Box,
  Button,
  Card,
  Field,
  Flex,
  Grid,
  Heading,
  Input,
  Slider,
  Spacer,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ArrowRight, Coins } from 'lucide-react';
import { fmt } from '@/utils/formatNumber';
import { DepositModal } from '@/components/DepositModal';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

export function DepositPanel({ onDeposit, balance }: any) {
  const { address } = useAccount();
  const [amountText, setAmountText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const amount = Number(amountText);

  const { data: maxAcceptableGross } = useReadContract({
    address: CONTRACTS.LOTTERY,
    abi: LOTTERY_ABI,
    functionName: 'maxAcceptableGross',
    query: { refetchInterval: 5_000 },
  });
  const maxAcceptableGrossFormatted = maxAcceptableGross
    ? Math.ceil(Number(formatUnits(maxAcceptableGross, 18)) * 100) /100
    : 0;

  const effectiveMax = Math.min(Math.ceil((balance || 0) * 100) / 100, maxAcceptableGrossFormatted);

  return (
    <>
      <Card.Root variant="outline" borderColor="whiteAlpha.200" bg="whiteAlpha.100" boxShadow="2xl" overflow="hidden">
        <Card.Header>
          <Flex align="center" gap={2}>
            <Coins size={18} />
            <Heading size="sm">Deposit CUMMIES</Heading>
          </Flex>
        </Card.Header>
        <Card.Body>
          {!address ? (
            <Flex direction="column" align="center" justify="center" py={8} textAlign="center" gap={4}>
              <Text color="whiteAlpha.800">Connect your wallet to participate in the lottery.</Text>
              <ConnectWalletButton />
            </Flex>
          ) : (
            <Stack gap={4}>
              <Grid
                templateColumns={{
                  base: '1fr',
                  md: 'minmax(0,2fr) minmax(max-content,1fr)',
                }}
                gap={4}
                alignItems="end"
              >
                <Box minW={0}>
                  <Field.Root>
                    <Field.Label color="whiteAlpha.800">Amount (CUMMIES)</Field.Label>
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
                  <Box mt={4}>
                    <Slider.Root
                      width="100%"
                      value={[Math.max(0, Math.min(amount, effectiveMax))]}
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
                    <Text fontSize="xs" color="whiteAlpha.700" mt={2}>
                      Tip: drag the slider for quick input.
                    </Text>
                  </Box>
                </Box>
                <Stack gap={2} w={{ base: 'full', md: 'max-content' }} minW="full">
                  <Text textStyle="sm" color="whiteAlpha.800">
                    Balance
                  </Text>
                  <Box w="full" p={3} rounded="xl" bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200" color="whiteAlpha.800">
                    <VStack justify="space-between" align="baseline" wrap="nowrap" alignItems="flex-start">
                      <Text lineClamp={1} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" fontSize={{ base: 'md', lg: 'lg' }} fontWeight="semibold" minW="fit-content">
                        {fmt(balance)}
                      </Text>
                      <Text textStyle="xs" color="fg.subtle" flexShrink={0}>
                        CUMMIES
                      </Text>
                    </VStack>
                  </Box>
                  <Button variant="outline" onClick={() => setAmountText(Math.min(Math.ceil((balance || 0) * 100) / 100, maxAcceptableGrossFormatted).toString())} bg="whiteAlpha.100" _hover={{ bg: 'whiteAlpha.200' }}>
                    Max
                  </Button>
                </Stack>
              </Grid>
            </Stack>
          )}
        </Card.Body>
        <Card.Footer justifyItems="space-between" gap={4}>
          <Text fontSize="xs" color="whiteAlpha.700">
            {/* By depositing you accept the terms.  */}Always gamble responsibly.
          </Text>
          <Spacer />
          <Button onClick={() => setIsOpen(true)} disabled={!address || amount <= 0}>
            Deposit <ArrowRight size={16} />
          </Button>
        </Card.Footer>
      </Card.Root>

      {isOpen ? (
        <DepositModal
          open
          onClose={() => setIsOpen(false)}
          address={address}
          amountText={amountText}
          setAmountText={setAmountText}
          onSuccess={(finalAmount) => {
            onDeposit?.(finalAmount);
            setAmountText('0');
            setIsOpen(false);
          }}
          balance={balance}
        />
      ) : null}
    </>
  );
}
