import { Text } from '@chakra-ui/react';

export function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <Text
      as="span"
      // bgGradient="linear(to-r, pink.400, fuchsia.400, purple.500)"
      bgGradient="to-r"
      gradientFrom="pink.500"
      gradientVia="fuchsia.500"
      gradientTo="violet.500"
      bgClip="text"
    >
      {children}
    </Text>
  );
}
