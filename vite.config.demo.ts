import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite 配置 - 演示页面构建
 * 用于构建可以在 GitHub Pages 上展示的测试页面
 */
export default defineConfig({
  // 应用模式（不是库模式）
  // 构建配置
  build: {
    // 输出目录（GitHub Pages 部署目录）
    outDir: 'dist-demo',
    // 生成 sourcemap（生产环境可以关闭）
    sourcemap: process.env.NODE_ENV !== 'production',
    // 压缩代码
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    // 清空输出目录
    emptyOutDir: true,
    // 目标环境（浏览器）
    target: 'es2020',
    // Rollup 配置
    rollupOptions: {
      // 入口文件
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      // 输出配置
      output: {
        // 资源文件命名
        assetFileNames: (assetInfo) => {
          // 图片文件保持原路径
          if (assetInfo.name && /\.(jpg|jpeg|png|gif|svg|webp)$/.test(assetInfo.name)) {
            return 'imgs/[name][extname]';
          }
          // 其他资源文件
          return 'assets/[name].[hash][extname]';
        },
        // JS 文件命名
        chunkFileNames: 'assets/[name].[hash].js',
        // 入口文件命名
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
  // 解析配置
  resolve: {
    // 别名配置
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
  // 插件配置
  plugins: [],
  // 公共基础路径（GitHub Pages 需要）
  // 可以通过环境变量 BASE_PATH 来设置，默认为 '/metaflac-browser-js/'
  base: process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/metaflac-browser-js/' : '/'),
  // 公共资源目录
  publicDir: 'public',
});

