import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it("shows the text risk label instead of relying only on colour", () => {
    render(<RiskBadge level="HIGH" />);
    expect(screen.getByText("HIGH RISK")).toBeInTheDocument();
    expect(screen.getByLabelText("AI risk level: HIGH")).toBeInTheDocument();
  });
});
