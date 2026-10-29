import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rolldownOptions: {
      // Prefix-only builtin: Vite does not list it as a Node builtin and stubs it out unless it is external.
      external: ['node:sqlite'],
    },
  },
});
