import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import Alert from './Alert';

const meta = {
  title: 'component/Alert',
  component: Alert,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: { isAlert: { control: false }, setAlert: { control: false } },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FraudAlert: Story = {
  args: { alertData: '의심거래 발생' } as Story['args'],
  render: (args) => {
    const [isAlert, setAlert] = useState<boolean>(false);

    useEffect(() => {
      setTimeout(() => {
        setAlert(true);
      }, 3000);
    }, []);

    return <Alert {...args} isAlert={isAlert} setAlert={setAlert} />;
  },
};
