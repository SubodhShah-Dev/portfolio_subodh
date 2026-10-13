import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Self-hosted fonts — Bricolage Grotesque (display, width axis), Instrument
// Sans (body), IBM Plex Mono (meta); scoped via --font-display / --font-body /
// --font-meta so the admin keeps the system stack.
import "@fontsource-variable/bricolage-grotesque/wdth.css";
import "@fontsource-variable/instrument-sans";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";

import App from "./App";
import { initAppCheck } from "./config/firebase";
import "./index.css";

// App Check off the render path: the reCAPTCHA script + token request must
// not compete with the layout loader and LCP image on first paint.
const scheduleIdle = (task: () => void): void => {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(task);
  } else {
    window.setTimeout(task, 200);
  }
};
scheduleIdle(() => initAppCheck());

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root was not found in the document.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
