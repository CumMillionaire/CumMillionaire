import { defineSlotRecipe } from '@chakra-ui/react';
import { sliderAnatomy } from '@chakra-ui/react/anatomy';

export const sliderRecipe = defineSlotRecipe({
  slots: sliderAnatomy.keys(),
  base: {
    thumb: {
      cursor: 'slider',
      _dragging: {
        cursor: 'sliderActive',
      },
    },
  },
});
