import { defineSlotRecipe } from '@chakra-ui/react';
import { cardAnatomy } from '@chakra-ui/react/anatomy';

export const cardRecipe = defineSlotRecipe({
  slots: cardAnatomy.keys(),
  variants: {
    variant: {
      outline: {
        root: {
          // backdropFilter: 'blur(8px)',
          // background: 'whiteAlpha.100',
          // borderColor: 'whiteAlpha.200',
          // color: 'fg',
        },
      },
    },
  },
})
