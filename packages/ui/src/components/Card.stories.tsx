import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { colors } from '../tokens';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  argTypes: { raised: { control: 'boolean' } },
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  args: { raised: true },
  render: (args) => (
    <Card {...args} style={{ padding: 24, maxWidth: 320 }}>
      <Badge tone="neutral">Course</Badge>
      <h3 style={{ color: colors.deepTeal, fontSize: 18, fontWeight: 700, margin: '12px 0 8px' }}>AgilePM Foundation</h3>
      <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
        The entry point to APMG&apos;s agile project management certification.
      </p>
      <Button size="sm">Find out more →</Button>
    </Card>
  ),
};
