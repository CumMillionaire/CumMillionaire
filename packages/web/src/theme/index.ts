import { createSystem, defineConfig, defaultConfig } from '@chakra-ui/react';
import { accordionRecipe } from '@/theme/recipes/accordion';
import { buttonRecipe } from '@/theme/recipes/button';
import { cardRecipe } from '@/theme/recipes/card';

export const config = defineConfig({
  globalCss: {
    'html, body': {
      background: '#0b0c14',
      color: 'var(--chakra-colors-white-alpha-900)',
      margin: 0,
      padding: 0,
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: 'Inter, ui-sans-serif, system-ui, -apple-system' },
        body: { value: 'Inter, ui-sans-serif, system-ui, -apple-system' },
      },
      colors: {
        fuchsia: {
          50: { value: 'oklch(97.7% .017 320.058)' },
          100: { value: 'oklch(95.2% .037 318.852)' },
          200: { value: 'oklch(90.3% .076 319.62)' },
          300: { value: 'oklch(83.3% .145 321.434)' },
          400: { value: 'oklch(74% .238 322.16)' },
          500: { value: 'oklch(66.7% .295 322.15)' },
          600: { value: 'oklch(59.1% .293 322.896)' },
          700: { value: 'oklch(51.8% .253 323.949)' },
          800: { value: 'oklch(45.2% .211 324.591)' },
          900: { value: 'oklch(40.1% .17 325.612)' },
          950: { value: 'oklch(29.3% .136 325.661)' },
        },
        violet: {
          50: { value: 'oklch(96.9% 0.016 293.756)' },
          100: { value: 'oklch(94.3% 0.029 294.588)' },
          200: { value: 'oklch(89.4% 0.057 293.283)' },
          300: { value: 'oklch(81.1% 0.111 293.571)' },
          400: { value: 'oklch(70.2% 0.183 293.541)' },
          500: { value: 'oklch(60.6% 0.25 292.717)' },
          600: { value: 'oklch(54.1% 0.281 293.009)' },
          700: { value: 'oklch(49.1% 0.27 292.581)' },
          800: { value: 'oklch(43.2% 0.232 292.759)' },
          900: { value: 'oklch(38% 0.189 293.745)' },
          950: { value: 'oklch(28.3% 0.141 291.089)' },
        },
      },
      cursor: {
        accordion: { value: 'pointer' },
        checkbox: { value: 'pointer' },
        menuitem: { value: 'pointer' },
        option: { value: 'pointer' },
        radio: { value: 'pointer' },
        select: { value: 'pointer' },
        slider: { value: 'pointer' },
      },
      animations: {
        pulse: { value: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
    slotRecipes: {
      accordion: accordionRecipe,
      card: cardRecipe,
    },
    keyframes: {
      pulse: {
        '50%': { opacity: 0.5 },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
