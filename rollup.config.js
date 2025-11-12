import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'index.js',
    output: {
        file: 'dist/metaflac-browser-js.js',
        format: 'umd',
        name: 'Metaflac',
        exports: 'default',
        sourcemap: true,
    },
    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: false,
        }),
        commonjs({
            transformMixedEsModules: true,
            strictRequires: true,
        }),
    ],
    // 确保不打包任何外部依赖（因为所有依赖都在 lib/ 中）
    external: [],
};

