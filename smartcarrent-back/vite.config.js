import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        react({
            include: [
                /resources\/js\/.*\.[jt]sx?$/,
                /smartcarrent-front\/src\/.*\.[jt]sx?$/,
            ],
        }),
        tailwindcss(),
    ],
    server: {
        fs: {
            allow: [fileURLToPath(new URL('../smartcarrent-front', import.meta.url))],
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
