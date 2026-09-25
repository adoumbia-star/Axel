import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLEFILE produit un unique index.html avec le JS, le CSS et le logo embarques,
// afin que la maquette puisse etre ouverte directement depuis le disque en file://
const singleFile = process.env.SINGLEFILE === '1'

export default defineConfig({
  // Chemins relatifs : le build fonctionne aussi bien servi par un hebergeur
  // qu'ouvert depuis un sous-repertoire quelconque
  base: './',
  plugins: singleFile ? [react(), viteSingleFile()] : [react()],
  build: singleFile ? { assetsInlineLimit: 10 * 1024 * 1024 } : {},
})
