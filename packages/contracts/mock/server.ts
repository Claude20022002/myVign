import { serve } from '@hono/node-server';
import { createMockApp } from './app';

const port = Number(process.env.MOCK_PORT ?? 4010);

const app = createMockApp({
  latencyMs: Number(process.env.MOCK_LATENCY_MS ?? 300),
  paymentDelayMs: Number(process.env.MOCK_PAYMENT_DELAY_MS ?? 5000),
  publicUrl: process.env.MOCK_PUBLIC_URL ?? `http://localhost:${port}`,
  webUrl: process.env.MOCK_WEB_URL ?? 'http://localhost:3000',
  usdCdfRate: Number(process.env.MOCK_USD_CDF_RATE ?? 2850),
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API simulée myVign prête sur http://localhost:${info.port}/v1/health`);
});
