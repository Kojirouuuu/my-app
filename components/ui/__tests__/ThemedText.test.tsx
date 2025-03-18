/**
 * ThemedText Component Tests
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { ThemedText } from "../ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

// Mock the useThemeColor hook
jest.mock("@/hooks/useThemeColor");

describe("ThemedText", () => {
  beforeEach(() => {
    // Reset mock before each test
    jest.clearAllMocks();
    // Default mock implementation
    (useThemeColor as jest.Mock).mockReturnValue("#000000");
  });

  it("renders with default props", () => {
    const { getByText } = render(<ThemedText>Test Text</ThemedText>);
    expect(getByText("Test Text")).toBeTruthy();
  });

  it("applies correct style based on type prop", () => {
    const { getByText } = render(
      <ThemedText type="title">Title Text</ThemedText>
    );
    const text = getByText("Title Text");
    expect(text.props.style).toContainEqual(
      expect.objectContaining({
        fontSize: 32,
        fontWeight: "bold",
        lineHeight: 32,
      })
    );
  });

  it("applies custom colors when provided", () => {
    const lightColor = "#ffffff";
    const darkColor = "#000000";
    render(
      <ThemedText lightColor={lightColor} darkColor={darkColor}>
        Custom Color Text
      </ThemedText>
    );
    expect(useThemeColor).toHaveBeenCalledWith(
      { light: lightColor, dark: darkColor },
      "text"
    );
  });

  it("merges custom styles with default styles", () => {
    const customStyle = { fontSize: 20 };
    const { getByText } = render(
      <ThemedText style={customStyle}>Styled Text</ThemedText>
    );
    const text = getByText("Styled Text");
    expect(text.props.style).toContainEqual(customStyle);
  });
});
