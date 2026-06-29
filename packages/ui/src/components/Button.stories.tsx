import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Browse Events' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'deep', 'ghost', 'outline'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Deep: Story = { args: { variant: 'deep', children: 'Browse Events' } };
export const Outline: Story = { args: { variant: 'outline', children: 'Enquire' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Knowledge Base →' } };
export const Small: Story = { args: { size: 'sm', children: 'View all →' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="deep">Deep</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost →</Button>
    </div>
  ),
};
