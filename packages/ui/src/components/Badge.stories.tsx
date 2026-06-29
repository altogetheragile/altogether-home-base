import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'AgilePM' },
  argTypes: { tone: { control: 'select', options: ['teal', 'orange', 'neutral'] } },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Teal: Story = { args: { tone: 'teal' } };
export const Orange: Story = { args: { tone: 'orange', children: 'Featured' } };
export const Neutral: Story = { args: { tone: 'neutral', children: 'Course' } };

export const AllTones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Badge tone="teal">AgilePM</Badge>
      <Badge tone="orange">Featured</Badge>
      <Badge tone="neutral">Course</Badge>
    </div>
  ),
};
