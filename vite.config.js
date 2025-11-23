import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true,
    allowedHosts: [
      'codegen-playground-app.orangefield-9820aa17.eastus.azurecontainerapps.io'
    ]
  }
})
