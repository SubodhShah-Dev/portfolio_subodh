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

initAppCheck();

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root was not found in the document.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
