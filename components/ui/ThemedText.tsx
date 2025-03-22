/**
 * ThemedText Component
 *
 * A customizable text component that automatically adapts to the app's theme.
 * Supports different text styles and colors based on the current theme.
 *
 * @component
 * @example
 * <ThemedText type="title">Hello World</ThemedText>
 * <ThemedText type="link" lightColor="#000" darkColor="#fff">Click me</ThemedText>
 */

import { Text, type TextProps, StyleSheet } from "react-native";

import { useThemeColor } from "@/../hooks/useThemeColor";

/**
 * Props for the ThemedText component
 * @property {string} [lightColor] - Custom color for light theme
 * @property {string} [darkColor] - Custom color for dark theme
 * @property {'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link'} [type='default'] - Text style type
 */
export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

/**
 * ThemedText component that adapts to the current theme
 * @param {ThemedTextProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

/**
 * Styles for different text types
 */
const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});
