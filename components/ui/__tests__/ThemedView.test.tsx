/**
 * ThemedView Component Tests
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { ThemedView } from "../ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

// Mock the useThemeColor hook
jest.mock("@/hooks/useThemeColor");

describe("ThemedView", () => {
  beforeEach(() => {
    // Reset mock before each test
    jest.clearAllMocks();
    // Default mock implementation
    (useThemeColor as jest.Mock).mockReturnValue("#ffffff");
  });

  it("renders with default props", () => {
    const { getByTestId } = render(
      <ThemedView testID="test-view">
        <></>
      </ThemedView>
    );
    expect(getByTestId("test-view")).toBeTruthy();
  });

  it("applies background color from theme", () => {
    const { getByTestId } = render(
      <ThemedView testID="test-view">
        <></>
      </ThemedView>
    );
    const view = getByTestId("test-view");
    expect(view.props.style).toContainEqual(
      expect.objectContaining({
        backgroundColor: "#ffffff",
      })
    );
  });

  it("applies custom colors when provided", () => {
    const lightColor = "#ffffff";
    const darkColor = "#000000";
    render(
      <ThemedView lightColor={lightColor} darkColor={darkColor}>
        <></>
      </ThemedView>
    );
    expect(useThemeColor).toHaveBeenCalledWith(
      { light: lightColor, dark: darkColor },
      "background"
    );
  });

  it("merges custom styles with theme styles", () => {
    const customStyle = { padding: 20 };
    const { getByTestId } = render(
      <ThemedView testID="test-view" style={customStyle}>
        <></>
      </ThemedView>
    );
    const view = getByTestId("test-view");
    expect(view.props.style).toContainEqual(customStyle);
  });
});
