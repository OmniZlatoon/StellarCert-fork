import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { toast } from 'react-hot-toast';
import IssueCertificate from './IssueCertificate';

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('IssueCertificate', () => {
  it('shows success toast after issuance', async () => {
    const user = userEvent.setup();

    render(<IssueCertificate />);

    await user.click(
      screen.getByText(/confirm/i),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining(
          'Certificate issued successfully',
        ),
      );
    });
  });
});