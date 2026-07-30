import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IssuerProfile from './IssuerProfile';

it('generates stellar keypair', async () => {
  const user = userEvent.setup();

  render(<IssuerProfile />);

  await user.click(
    screen.getByRole('button', {
      name: /generate stellar keypair/i,
    }),
  );

  expect(screen.getByDisplayValue(/^G[A-Z2-7]+$/)).toBeInTheDocument();
});