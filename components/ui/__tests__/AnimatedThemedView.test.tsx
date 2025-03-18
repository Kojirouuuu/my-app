/**
 * AnimatedThemedView Component Tests
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { AnimatedThemedView } from "../AnimatedThemedView";
import { useFadeIn, useSlideIn, useScale } from "@/hooks/useAnimation";

// Mock the animation hooks
jest.mock("@/hooks/useAnimation");

describe("AnimatedThemedView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock animation values
    (useFadeIn as jest.Mock).mockReturnValue(1);
    (useSlideIn as jest.Mock).mockReturnValue({
      transform: [{ translateX: 0 }],
    });
    (useScale as jest.Mock).mockReturnValue({ transform: [{ scale: 1 }] });
  });

  it("renders with default props", () => {
    const { getByTestId } = render(
      <AnimatedThemedView testID="test-view">
        <></>
      </AnimatedThemedView>
    );
    expect(getByTestId("test-view")).toBeTruthy();
  });

  it("applies fade animation when specified", () => {
    render(
      <AnimatedThemedView animation="fade" testID="test-view">
        <></>
      </AnimatedThemedView>
    );
    expect(useFadeIn).toHaveBeenCalledWith(300, 0);
  });

  it("applies slide animation when specified", () => {
    render(
      <AnimatedThemedView
        animation="slide"
        slideDirection="right"
        testID="test-view"
      >
        <></>
      </AnimatedThemedView>
    );
    expect(useSlideIn).toHaveBeenCalledWith("right", 50, 300, 0);
  });

  it("applies scale animation when specified", () => {
    render(
      <AnimatedThemedView animation="scale" testID="test-view">
        <></>
      </AnimatedThemedView>
    );
    expect(useScale).toHaveBeenCalledWith(0.8, 1, 0);
  });

  it("applies custom animation duration and delay", () => {
    render(
      <AnimatedThemedView
        animation="fade"
        duration={500}
        delay={200}
        testID="test-view"
      >
        <></>
      </AnimatedThemedView>
    );
    expect(useFadeIn).toHaveBeenCalledWith(500, 200);
  });
});
