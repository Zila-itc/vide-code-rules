import { defineConfig } from 'vite';
import baseConfig from './vite.config.js';

// Development-specific configuration with hot reload optimizations
export default defineConfig({
  ...baseConfig,
  
  build: {
    ...baseConfig.build,
    
    // Faster builds in development
    minify: false,
    sourcemap: 'inline',
    
    // Faster incremental builds
    watch: {
      // Watch for changes in these directories
      include: ['src/**'],
      exclude: ['node_modules/**', 'dist/**']
    }
  },
  
  // Hot Module Replacement for faster development
  server: {
    hmr: {
      port: 3001
    }
  },
  
  // Optimized dependencies for faster cold starts
  optimizeDeps: {
    include: ['fs-extra', 'glob'],
    exclude: ['vscode']
  },
  
  // Development-specific environment variables
  define: {
    ...baseConfig.define,
    __DEV__: true,
    __PROD__: false
  }
});