import { defineRecipe } from '@chakra-ui/react';

export const buttonRecipe = defineRecipe({
  base: {
    _active: {
      cursor: 'buttonActive'
    }
  },
  variants: {
    size: {
      lg: {},
    },
  },
  defaultVariants: { size: 'lg' },
});
