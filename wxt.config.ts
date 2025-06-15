import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    side_panel: {
      default_path: "sidepanel.html"
    },
    permissions: [
      "sidePanel",
      "storage",
      "activeTab",
      "tabs",
      "scripting"
    ],
    action: {
      default_title: "Super Emma - AI Assistant",
      default_popup: "popup.html"
    }
  },
  vite: () => ({
    css: {
      postcss: './postcss.config.js',
    },
  }),
});
