// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    // 拡張子を省略する際にViteが探す拡張子のリスト
    // デフォルト値: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    extensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.json'], // 例：.vueファイルを省略したい場合
  },
});
