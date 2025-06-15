import { defineConfig } from 'vitest/config';
import type { UserConfig } from 'vitest/config';

export default defineConfig(async () => {
  const [react, tsconfigPaths] = await Promise.all([
    import('@vitejs/plugin-react'),
    import('vite-tsconfig-paths'),
  ]);

  return {
    plugins: [
      react.default(),
      tsconfigPaths.default(),
    ],
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
      testTimeout: 60000,
      hookTimeout: 60000,
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
      deps: {
        inline: [/@testing-library\/react/],
      },
      environmentOptions: {
        jsdom: {
          resources: 'usable',
        },
      },
    },
  } as UserConfig;
});
