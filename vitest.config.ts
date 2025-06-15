import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const [react, tsconfigPaths] = await Promise.all([
    import('@vitejs/plugin-react').then(mod => mod.default),
    import('vite-tsconfig-paths').then(mod => mod.default),
  ]);

  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      watch: false,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.tsx'],
      globals: true,
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.config.*',
        '**/*.spec.{ts,tsx}',
        'tests/e2e/**'
      ],
      threads: false,
      reporters: ['verbose'],
      testTimeout: 30000,
      hookTimeout: 30000,
      sequence: {
        shuffle: false,
        concurrent: false,
      },
      logHeapUsage: true,
      silent: false,
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
        ],
      },
    },
  };
});
