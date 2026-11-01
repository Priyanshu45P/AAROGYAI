import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("shows the label, value and optional detail", () => {
    render(<MetricCard label="Blood glucose" value="126 mg/dL" detail="Latest reading" />);
    expect(screen.getByText("Blood glucose")).toBeInTheDocument();
    expect(screen.getByText("126 mg/dL")).toBeInTheDocument();
    expect(screen.getByText("Latest reading")).toBeInTheDocument();
  });
});
