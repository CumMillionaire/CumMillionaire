import { Box, Flex, Text } from '@chakra-ui/react';

export function Step({ icon: IconComp, title, text }: any) {
  return (
    <Flex align="flex-start" gap={4}>
      <Flex
        minW={10}
        h={10}
        // shrink="0"
        rounded="2xl"
        align="center"
        justify="center"
        boxShadow="lg"
        bgGradient="to-r"
        gradientFrom="pink.500"
        gradientVia="fuchsia.500"
        gradientTo="violet.500"
      >
        <IconComp size={18} />
      </Flex>
      <Box>
        <Text fontWeight="semibold">{title}</Text>
        <Text fontSize="sm" color="whiteAlpha.800">
          {text}
        </Text>
      </Box>
    </Flex>
  );
}
