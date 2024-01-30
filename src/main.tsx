import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Wrapper } from "./app/Wrapper";
import "reshaped/themes/reshaped/theme.css";
import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

const container = document.getElementById("app");
const root = createRoot(container!);
root.render(
  <StrictMode>
    <Wrapper />
  </StrictMode>,
);
