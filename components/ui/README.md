# UI Components

このディレクトリには、アプリケーション全体で使用される基本的な UI コンポーネントが含まれています。

## ThemedText

テーマに応じて自動的に色が変更されるテキストコンポーネントです。

### 使用方法

```tsx
import { ThemedText } from '@/components/ui/ThemedText';

// 基本的な使用方法
<ThemedText>通常のテキスト</ThemedText>

// タイトルスタイル
<ThemedText type="title">タイトルテキスト</ThemedText>

// カスタムカラー
<ThemedText lightColor="#000000" darkColor="#ffffff">
  カスタムカラーテキスト
</ThemedText>

// リンクスタイル
<ThemedText type="link">リンクテキスト</ThemedText>
```

### Props

| Prop       | 型                                                                | デフォルト値 | 説明                           |
| ---------- | ----------------------------------------------------------------- | ------------ | ------------------------------ |
| type       | 'default' \| 'title' \| 'defaultSemiBold' \| 'subtitle' \| 'link' | 'default'    | テキストのスタイルタイプ       |
| lightColor | string                                                            | undefined    | ライトテーマでのカスタムカラー |
| darkColor  | string                                                            | undefined    | ダークテーマでのカスタムカラー |

## ThemedView

テーマに応じて自動的に背景色が変更されるビューコンポーネントです。

### 使用方法

```tsx
import { ThemedView } from '@/components/ui/ThemedView';

// 基本的な使用方法
<ThemedView>
  <ThemedText>コンテンツ</ThemedText>
</ThemedView>

// カスタムカラー
<ThemedView lightColor="#ffffff" darkColor="#000000">
  <ThemedText>カスタムカラーの背景</ThemedText>
</ThemedView>

// カスタムスタイル
<ThemedView style={{ padding: 20 }}>
  <ThemedText>カスタムスタイルの背景</ThemedText>
</ThemedView>
```

### Props

| Prop       | 型     | デフォルト値 | 説明                           |
| ---------- | ------ | ------------ | ------------------------------ |
| lightColor | string | undefined    | ライトテーマでのカスタム背景色 |
| darkColor  | string | undefined    | ダークテーマでのカスタム背景色 |

## AnimatedThemedView

アニメーション効果付きの ThemedView コンポーネントです。

### 使用方法

```tsx
import { AnimatedThemedView } from '@/components/ui/AnimatedThemedView';

// フェードインアニメーション
<AnimatedThemedView animation="fade">
  <ThemedText>フェードインするコンテンツ</ThemedText>
</AnimatedThemedView>

// スライドインアニメーション
<AnimatedThemedView animation="slide" slideDirection="right">
  <ThemedText>右からスライドインするコンテンツ</ThemedText>
</AnimatedThemedView>

// スケールアニメーション
<AnimatedThemedView animation="scale">
  <ThemedText>スケールアニメーションするコンテンツ</ThemedText>
</AnimatedThemedView>

// カスタムアニメーション設定
<AnimatedThemedView
  animation="fade"
  duration={500}
  delay={200}
>
  <ThemedText>カスタム設定のアニメーション</ThemedText>
</AnimatedThemedView>
```

### Props

| Prop           | 型                                     | デフォルト値 | 説明                           |
| -------------- | -------------------------------------- | ------------ | ------------------------------ |
| animation      | 'fade' \| 'slide' \| 'scale' \| 'none' | 'none'       | アニメーションの種類           |
| slideDirection | 'left' \| 'right' \| 'up' \| 'down'    | 'left'       | スライドアニメーションの方向   |
| delay          | number                                 | 0            | アニメーション開始までの遅延   |
| duration       | number                                 | 300          | アニメーションの長さ           |
| lightColor     | string                                 | undefined    | ライトテーマでのカスタム背景色 |
| darkColor      | string                                 | undefined    | ダークテーマでのカスタム背景色 |

## スタイリング

コンポーネントのスタイリングには、`constants/styles.ts`で定義された共通のスタイルを使用することをお勧めします：

```tsx
import { spacing, borderRadius, shadows, layout } from "@/constants/styles";

// 使用例
<ThemedView style={[layout.container, shadows.md]}>
  <ThemedText style={{ marginBottom: spacing.md }}>
    スタイリングされたコンテンツ
  </ThemedText>
</ThemedView>;
```

## テーマ

テーマの設定は`types/theme.ts`で定義されています。カスタムテーマを作成する場合は、`ThemeConfig`インターフェースに従ってください：

```tsx
import { ThemeConfig } from "@/types/theme";

const customTheme: ThemeConfig = {
  mode: "light",
  colors: {
    text: "#000000",
    background: "#ffffff",
    tint: "#0a7ea4",
    tabIconDefault: "#cccccc",
    tabIconSelected: "#0a7ea4",
  },
};
```
