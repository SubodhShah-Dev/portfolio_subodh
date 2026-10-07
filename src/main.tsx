import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Self-hosted variable fonts — scoped to the public shell via --font-body /
// --font-display / --font-meta; the admin keeps the system stack.
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";

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
