/**
 * ThemedView Component
 *
 * A container component that automatically adapts its background color to the app's theme.
 * Extends the basic React Native View component with theme support.
 *
 * @component
 * @example
 * <ThemedView style={styles.container}>
 *   <ThemedText>Content</ThemedText>
 * </ThemedView>
 */

import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

/**
 * Props for the ThemedView component
 * @property {string} [lightColor] - Custom background color for light theme
 * @property {string} [darkColor] - Custom background color for dark theme
 */
export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

/**
 * ThemedView component that adapts to the current theme
 * @param {ThemedViewProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
