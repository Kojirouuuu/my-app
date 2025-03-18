/**
 * Animation Hooks
 *
 * アニメーション用のカスタムフック
 */

import { useRef, useEffect } from "react";
import { Animated, Easing } from "react-native";

/**
 * フェードインアニメーション用のフック
 * @param duration アニメーションの長さ（ミリ秒）
 * @param delay アニメーション開始までの遅延（ミリ秒）
 * @returns アニメーション値
 */
export const useFadeIn = (duration: number = 300, delay: number = 0) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [duration, delay]);

  return fadeAnim;
};

/**
 * スライドインアニメーション用のフック
 * @param direction スライド方向
 * @param distance スライド距離
 * @param duration アニメーションの長さ（ミリ秒）
 * @param delay アニメーション開始までの遅延（ミリ秒）
 * @returns アニメーション値
 */
export const useSlideIn = (
  direction: "left" | "right" | "up" | "down" = "left",
  distance: number = 50,
  duration: number = 300,
  delay: number = 0
) => {
  const slideAnim = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [duration, delay]);

  const getTransform = () => {
    switch (direction) {
      case "left":
        return [{ translateX: slideAnim }];
      case "right":
        return [{ translateX: slideAnim }];
      case "up":
        return [{ translateY: slideAnim }];
      case "down":
        return [{ translateY: slideAnim }];
      default:
        return [{ translateX: slideAnim }];
    }
  };

  return { transform: getTransform() };
};

/**
 * スケールアニメーション用のフック
 * @param initialScale 初期スケール
 * @param finalScale 最終スケール
 * @param delay アニメーション開始までの遅延（ミリ秒）
 * @returns アニメーション値
 */
export const useScale = (
  initialScale: number = 0.8,
  finalScale: number = 1,
  delay: number = 0
) => {
  const scaleAnim = useRef(new Animated.Value(initialScale)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: finalScale,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay]);

  return { transform: [{ scale: scaleAnim }] };
};
