import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "../stores/auth";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ token: null, user: null });
  });

  it("redirects an anonymous user to login", () => {
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route
            path="/private"
            element={
              <ProtectedRoute roles={["PATIENT"]}>
                <div>Private content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("allows a user with the required role", () => {
    useAuthStore.setState({
      token: "test-token",
      user: {
        id: "u1",
        firstName: "Test",
        lastName: "Patient",
        email: "patient@test.local",
        role: "PATIENT",
        patientProfileId: "p1",
      },
    });

    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute roles={["PATIENT"]}>
                <div>Private content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Private content")).toBeInTheDocument();
  });
});
