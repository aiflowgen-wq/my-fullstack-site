import { defineConfig } from 'vite';

// 开发服务器上把 /thanks 映射到 thanks.html,与 Cloudflare Pages 的「干净 URL」行为一致
const thanksCleanUrl = () => ({
  name: 'thanks-clean-url',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/thanks') req.url = '/thanks.html';
      next();
    });
  },
});

export default defineConfig({
  plugins: [thanksCleanUrl()],
  server: {
    // 把 /api 转发给 wrangler pages dev(8788),这样 5173 上也能测支付。
    // changeOrigin 必须为 false:保留原始 Host,服务端的同源校验才能通过
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: false,
      },
    },
  },
  build: {
    rollupOptions: {
      // 多页面:首页 + 感谢页
      input: {
        main: 'index.html',
        thanks: 'thanks.html',
      },
    },
  },
});
