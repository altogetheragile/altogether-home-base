import type { Meta, StoryObj } from '@storybook/react';
import { colors, fonts } from './tokens';

const meta: Meta = { title: 'Foundations/Tokens' };
export default meta;
type Story = StoryObj;

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, fontFamily: fonts.sans }}>
      {Object.entries(colors).map(([name, hex]) => (
        <div key={name} style={{ border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ background: hex, height: 64 }} />
          <div style={{ padding: '8px 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{hex}</div>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div>
      <p style={{ fontFamily: fonts.serif, fontSize: 40, color: colors.deepTeal, margin: '0 0 8px' }}>DM Serif Display</p>
      <p style={{ fontFamily: fonts.sans, fontSize: 18, color: colors.body }}>DM Sans — body and UI text.</p>
    </div>
  ),
};
