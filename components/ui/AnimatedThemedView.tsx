/**
 * AnimatedThemedView Component
 *
 * アニメーション効果付きのThemedViewコンポーネント
 */

import React from "react";
import { Animated } from "react-native";
import { ThemedView, type ThemedViewProps } from "./ThemedView";
import { useFadeIn, useSlideIn, useScale } from "@/hooks/useAnimation";

export type AnimatedThemedViewProps = ThemedViewProps & {
  /**
   * アニメーションの種類
   */
  animation?: "fade" | "slide" | "scale" | "none";
  /**
   * スライドアニメーションの方向（animation='slide'の場合のみ有効）
   */
  slideDirection?: "left" | "right" | "up" | "down";
  /**
   * アニメーションの遅延時間（ミリ秒）
   */
  delay?: number;
  /**
   * アニメーションの長さ（ミリ秒）
   */
  duration?: number;
};

/**
 * アニメーション効果付きのThemedViewコンポーネント
 */
export function AnimatedThemedView({
  animation = "none",
  slideDirection = "left",
  delay = 0,
  duration = 300,
  style,
  ...props
}: AnimatedThemedViewProps) {
  const fadeAnim = useFadeIn(duration, delay);
  const slideAnim = useSlideIn(slideDirection, 50, duration, delay);
  const scaleAnim = useScale(0.8, 1, delay);

  const getAnimatedStyle = () => {
    switch (animation) {
      case "fade":
        return { opacity: fadeAnim };
      case "slide":
        return slideAnim;
      case "scale":
        return scaleAnim;
      default:
        return {};
    }
  };

  return (
    <Animated.View style={getAnimatedStyle()}>
      <ThemedView style={style} {...props} />
    </Animated.View>
  );
}
