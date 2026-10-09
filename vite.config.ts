import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Vendor chunks are long-lived and hash-addressed; Firestore alone sits
    // just under 600 kB, so the default 500 kB line would warn forever.
    chunkSizeWarningLimit: 650,
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks: React and Firebase change far less often
        // than app code, so browsers can cache them across deploys (§66).
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
            {
              name: "vendor-firebase",
              test: /node_modules[\\/](firebase|@firebase)[\\/]/,
            },
            {
              // Lazy-only deps: keep them out of the eager vendor chunk so
              // their consumers (⌘K palette, success confetti) pull them in.
              name: "vendor-lazy",
              test: /node_modules[\\/](cmdk|canvas-confetti)[\\/]/,
            },
            {
              name: "vendor",
              test: /node_modules[\\/]/,
            },
          ],
        },
      },
    },
  },
});
