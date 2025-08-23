import { Box, Card, Flex, Heading, Text } from '@chakra-ui/react';

export function Stat({ label, value, hint, right = null }: any) {
  return (
    <Card.Root variant="outline" borderColor="whiteAlpha.200" bg="whiteAlpha.50">
      <Card.Header pb={2}>
        <Text fontSize="sm" color="whiteAlpha.700">
          {label}
        </Text>
      </Card.Header>
      <Card.Body pt={0}>
        <Flex align="flex-end" justify="space-between" gap={4}>
          <Box>
            <Heading size="3xl">{value}</Heading>
            {hint && (
              <Text fontSize="xs" color="whiteAlpha.700" mt={1}>
                {hint}
              </Text>
            )}
          </Box>
          {right}
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
