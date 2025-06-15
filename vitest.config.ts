import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const [react, tsconfigPaths] = await Promise.all([
    import('@vitejs/plugin-react').then(mod => mod.default),
    import('vite-tsconfig-paths').then(mod => mod.default),
  ]);

  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
    },
  };
});
