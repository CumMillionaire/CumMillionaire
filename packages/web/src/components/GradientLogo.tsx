import { Box } from '@chakra-ui/react';

export function GradientLogo() {
  return (
    <Box
      w={8}
      h={8}
      rounded="xl"
      boxShadow="lg"
      // bgImage="linear-gradient(to-r, {colors.pink.400}, {colors.fuchsia.400}, {colors.purple.500})"
      bgGradient="to-r"
      gradientFrom="pink.500"
      gradientVia="fuchsia.500"
      gradientTo="violet.500"
    />
  );
}
