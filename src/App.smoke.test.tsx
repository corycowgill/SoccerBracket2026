// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { createElement } from "react";
import App from "./App";

// Stub fetch so the mount-time refresh resolves without real network.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("no network in test"))),
  );
  localStorage.clear();
});

describe("App mounts", () => {
  it("renders the header without throwing", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(App));
    });
    expect(container.textContent).toContain("World Cup 2026");
    expect(container.querySelector("header")).not.toBeNull();
    root.unmount();
  });
});
