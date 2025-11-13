import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite 配置
 * 开发模式：应用模式，支持直接调试 TypeScript 源文件
 * 构建模式：库模式，生成发布包
 */
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';

  // 开发模式：应用模式，用于调试
  if (isDev) {
    return {
      // 开发服务器配置
      server: {
        port: 3000,
        open: true,
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
      // 构建配置（开发模式下不使用库模式）
      build: {
        sourcemap: true,
      },
    };
  }

  // 构建模式：库模式
  return {
    build: {
      // 库模式配置
      lib: {
        // 入口文件
        entry: resolve(__dirname, 'src/index.ts'),
        // 库名称（用于 UMD 格式的全局变量）
        name: 'Metaflac',
        // 输出格式：ES 模块和 UMD
        formats: ['es', 'umd'],
        // 文件名格式函数
        fileName: (format) => {
          if (format === 'es') {
            return 'metaflac-browser-js.esm.js';
          }
          if (format === 'umd') {
            return 'metaflac-browser-js.js';
          }
          return `metaflac-browser-js.${format}.js`;
        },
      },
      // 输出目录
      outDir: 'dist',
      // 生成 sourcemap
      sourcemap: true,
      // 构建选项
      rollupOptions: {
        // 外部依赖（这里为空，因为所有依赖都在 lib/ 中）
        external: [],
        // 输出配置（Vite 会根据 lib.formats 自动创建多个输出）
        output: {
          // 自动检测导出方式（支持默认导出和命名导出）
          exports: 'default',
        },
      },
      // 不压缩代码（开发时可能需要）
      minify: false,
      // 清空输出目录
      emptyOutDir: true,
      // 目标环境（浏览器）
      target: 'es2020',
    },
    // 解析配置
    resolve: {
      // 别名配置（如果需要）
      alias: {
        '@': resolve(__dirname, './'),
      },
    },
    // 插件配置
    plugins: [
      // Vite 会自动处理 CommonJS 转换
      // 如果需要更多控制，可以添加插件
    ],
  };
});

