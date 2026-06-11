// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act, createElement } from "react";
import TeamChip from "./TeamChip";

describe("TeamChip", () => {
  it("renders the FIFA rank badge next to the team name", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(async () => {
      createRoot(container).render(createElement(TeamChip, { team: "France" }));
    });
    expect(container.textContent).toContain("France");
    expect(container.textContent).toContain("#1");
  });

  it("omits the badge when showRank is false", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(async () => {
      createRoot(container).render(createElement(TeamChip, { team: "Brazil", showRank: false }));
    });
    expect(container.textContent).toContain("Brazil");
    expect(container.textContent).not.toContain("#6");
  });
});
