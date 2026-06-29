import type { Preview } from '@storybook/react';
import { colors, fonts } from '../src/tokens';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'white',
      values: [
        { name: 'white', value: colors.white },
        { name: 'skyTeal', value: colors.skyTeal },
        { name: 'deepTeal', value: colors.deepTeal },
      ],
    },
  },
  decorators: [
    (Story) => {
      if (typeof document !== 'undefined') document.body.style.fontFamily = fonts.sans;
      return Story();
    },
  ],
};

export default preview;
