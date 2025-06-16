import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Build configuration for VS Code extension
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Target Node.js environment (VS Code extensions run in Node)
    target: 'node18',
    
    // Library mode for extension
    lib: {
      entry: resolve(__dirname, 'src/extension.ts'),
      name: 'extension',
      fileName: 'extension',
      formats: ['cjs'] // CommonJS format for VS Code
    },
    
    // Rollup options
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      external: [
        'vscode', // VS Code API
        'fs',
        'path',
        'os',
        'crypto',
        'util',
        'events',
        'stream',
        'buffer',
        'child_process'
      ],
      
      output: {
        // Ensure CommonJS format
        format: 'cjs',
        exports: 'named',
        
        // External globals
        globals: {
          vscode: 'vscode'
        }
      }
    },
    
    // Build optimizations
    minify: process.env.NODE_ENV === 'production',
    
    // Clear output directory before build
    emptyOutDir: true,
    
    // Copy files
    copyPublicDir: false
  },
  
  // Development server (not used for extensions, but good to have)
  server: {
    port: 3000
  },
  
  // TypeScript configuration
  esbuild: {
    target: 'node18',
    platform: 'node',
    format: 'cjs'
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  // Define environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  
  // Plugin configuration
  plugins: [
    // Custom plugin to handle VS Code extension specifics
    {
      name: 'vscode-extension',
      config(config, { command }) {
        if (command === 'build') {
          // Ensure proper externals for production build
          config.build.rollupOptions.external = [
            'vscode',
            'fs-extra',
            'glob',
            ...config.build.rollupOptions.external || []
          ];
        }
      }
    }
  ]
});