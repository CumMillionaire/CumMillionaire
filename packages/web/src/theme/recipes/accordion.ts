import { defineSlotRecipe } from '@chakra-ui/react';
import { accordionAnatomy } from '@chakra-ui/react/anatomy';

export const accordionRecipe = defineSlotRecipe({
  slots: accordionAnatomy.keys(),
  base: {
    itemTrigger: {
      cursor: 'accordion',
    },
  },
});
