import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import CertificateTable from './CertificateTable';
import { certificateApi } from '../api';
import type { Certificate } from '../api';

vi.mock('../api', () => ({
  certificateApi: {
    list: vi.fn(),
    bulkExport: vi.fn(),
    bulkExportAll: vi.fn(),
    bulkRevoke: vi.fn(),
    freeze: vi.fn(),
    unfreeze: vi.fn(),
    transfer: { initiate: vi.fn() },
  },
  auditApi: {
    getCertificateHistory: vi.fn().mockResolvedValue([]),
  },
}));

const certificate = (overrides: Partial<Certificate> = {}): Certificate =>
  ({
    id: 'cert-1',
    serialNumber: 'SC-0001',
    recipientName: 'Ada Lovelace',
    recipientEmail: 'ada@example.com',
    title: 'Advanced Analytical Engines',
    courseName: 'Computing 101',
    issuerName: 'Royal Society',
    issueDate: '2026-01-15T00:00:00.000Z',
    status: 'active',
    ...overrides,
  }) as Certificate;

const listResolvesWith = (certificates: Certificate[]) => {
  vi.mocked(certificateApi.list).mockResolvedValue({
    data: certificates,
    total: certificates.length,
    totalPages: 1,
    page: 1,
    limit: 10,
  } as never);
};

const renderTable = async (certificates: Certificate[] = [certificate()]) => {
  listResolvesWith(certificates);
  render(<CertificateTable />);
  await waitFor(() => expect(certificateApi.list).toHaveBeenCalled());
};

const openDetails = async (serialNumber = 'SC-0001') => {
  const button = await screen.findByRole('button', {
    name: `View certificate ${serialNumber}`,
  });
  await userEvent.click(button);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CertificateTable "View Certificate" action', () => {
  // The button rendered enabled with no onClick, so clicking it did nothing
  // and the user had no way to tell it was not meant to work.
  it('opens the certificate details dialog', async () => {
    await renderTable();

    expect(screen.queryByRole('dialog', { name: /certificate details/i })).not.toBeInTheDocument();

    await openDetails();

    expect(screen.getByRole('dialog', { name: /certificate details/i })).toBeInTheDocument();
  });

  it('shows the certificate the row belongs to', async () => {
    await renderTable([
      certificate(),
      certificate({ id: 'cert-2', serialNumber: 'SC-0002', recipientName: 'Grace Hopper' }),
    ]);

    await openDetails('SC-0002');

    const dialog = screen.getByRole('dialog', { name: /certificate details/i });
    expect(dialog).toHaveTextContent('SC-0002');
    expect(dialog).toHaveTextContent('Grace Hopper');
    expect(dialog).not.toHaveTextContent('Ada Lovelace');
  });

  it('shows the certificate fields', async () => {
    await renderTable();
    await openDetails();

    const dialog = screen.getByRole('dialog', { name: /certificate details/i });
    expect(dialog).toHaveTextContent('Ada Lovelace');
    expect(dialog).toHaveTextContent('ada@example.com');
    expect(dialog).toHaveTextContent('Advanced Analytical Engines');
    expect(dialog).toHaveTextContent('Computing 101');
    expect(dialog).toHaveTextContent('Royal Society');
  });

  it('reads the details straight from the row, without a second request', async () => {
    await renderTable();
    const callsBefore = vi.mocked(certificateApi.list).mock.calls.length;

    await openDetails();

    expect(vi.mocked(certificateApi.list).mock.calls).toHaveLength(callsBefore);
  });

  it('says so when the certificate has no expiry', async () => {
    await renderTable();
    await openDetails();

    expect(screen.getByRole('dialog', { name: /certificate details/i })).toHaveTextContent(
      'No expiry',
    );
  });

  it('shows the expiry date when there is one', async () => {
    await renderTable([certificate({ expiryDate: '2027-01-15T00:00:00.000Z' })]);
    await openDetails();

    const dialog = screen.getByRole('dialog', { name: /certificate details/i });
    expect(dialog).toHaveTextContent(new Date('2027-01-15T00:00:00.000Z').toLocaleDateString());
  });

  it('shows the transaction hash and IPFS CID when present', async () => {
    await renderTable([certificate({ txHash: 'abc123def456', cid: 'bafyfakecid' })]);
    await openDetails();

    const dialog = screen.getByRole('dialog', { name: /certificate details/i });
    expect(dialog).toHaveTextContent('abc123def456');
    expect(dialog).toHaveTextContent('bafyfakecid');
  });

  it('omits the chain fields when the certificate has none', async () => {
    await renderTable();
    await openDetails();

    const dialog = screen.getByRole('dialog', { name: /certificate details/i });
    expect(dialog).not.toHaveTextContent(/Transaction Hash/i);
    expect(dialog).not.toHaveTextContent(/IPFS CID/i);
  });

  it('explains why a frozen certificate is frozen', async () => {
    await renderTable([
      certificate({ status: 'frozen', freezeReason: 'Pending accreditation review' }),
    ]);
    await openDetails();

    expect(screen.getByRole('dialog', { name: /certificate details/i })).toHaveTextContent(
      'Pending accreditation review',
    );
  });

  it('links to the certificate file when one exists', async () => {
    await renderTable([certificate({ pdfUrl: 'https://files.example.com/cert-1.pdf' })]);
    await openDetails();

    const link = screen.getByRole('link', { name: /open certificate file/i });
    expect(link).toHaveAttribute('href', 'https://files.example.com/cert-1.pdf');
    // A cross-origin target="_blank" without this leaks window.opener.
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('offers no file link when the certificate has no file', async () => {
    await renderTable();
    await openDetails();

    expect(screen.queryByRole('link', { name: /open certificate file/i })).not.toBeInTheDocument();
  });

  it('closes from the close button', async () => {
    await renderTable();
    await openDetails();

    await userEvent.click(screen.getByRole('button', { name: /close certificate details/i }));

    expect(screen.queryByRole('dialog', { name: /certificate details/i })).not.toBeInTheDocument();
  });

  it('closes from the footer button', async () => {
    await renderTable();
    await openDetails();

    const dialog = screen.getByRole('dialog', { name: /certificate details/i });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog', { name: /certificate details/i })).not.toBeInTheDocument();
  });

  it('reopens with a different certificate after closing', async () => {
    await renderTable([
      certificate(),
      certificate({ id: 'cert-2', serialNumber: 'SC-0002', recipientName: 'Grace Hopper' }),
    ]);

    await openDetails('SC-0001');
    await userEvent.click(screen.getByRole('button', { name: /close certificate details/i }));
    await openDetails('SC-0002');

    expect(screen.getByRole('dialog', { name: /certificate details/i })).toHaveTextContent(
      'Grace Hopper',
    );
  });

  it('does not trigger a revoke or freeze when viewing', async () => {
    await renderTable();
    await openDetails();

    expect(certificateApi.freeze).not.toHaveBeenCalled();
    expect(certificateApi.bulkRevoke).not.toHaveBeenCalled();
  });
});
