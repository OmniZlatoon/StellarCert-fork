import { vi } from 'vitest';
import * as endpoints from './endpoints';

describe('frontend api endpoints', () => {
  it('does not expose a runtime toggleDummyData helper', () => {
    expect((endpoints as Record<string, unknown>).toggleDummyData).toBeUndefined();
  });

  it('fetches certificate history and maps audit log items to ActivityItem', async () => {
    const mockResponse = [
      {
        id: 'audit-1',
        action: 'Certificate verified',
        description: 'Verified certificate',
        timestamp: Date.now().toString(),
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    }) as unknown as typeof global.fetch;

    const history = await endpoints.auditApi.getCertificateHistory('cert-1');

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      type: 'verify',
      description: 'Verified certificate',
    });
  });
});
