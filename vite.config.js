import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        product: resolve(__dirname, 'product.html'),
        samples: resolve(__dirname, 'samples.html'),
        artworks: resolve(__dirname, 'artworks.html'),
        artwork: resolve(__dirname, 'artwork.html'),
        custom: resolve(__dirname, 'custom.html'),
        privacy: resolve(__dirname, 'privacy.html')
      }
    }
  }
});
