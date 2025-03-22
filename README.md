# 冷蔵庫管理アプリ 🧊

このアプリは、ユーザーの冷蔵庫の内容を管理し、レシピ提案を行うための Expo アプリケーションです。

## 主な機能

- ユーザープロフィール管理

  - プロフィール画像のアップロード
  - ユーザー情報の編集（表示名、自己紹介、お気に入りの食材など）
  - 冷蔵庫メーカーの設定

- AWS Amplify との連携
  - S3 を使用したプロフィール画像の保存
  - S3 を使用したプロフィールデータの保存
  - ユーザー認証

## 技術スタック

- [Expo](https://expo.dev)
- [React Native](https://reactnative.dev)
- [AWS Amplify](https://aws.amazon.com/amplify/)
- [Expo Router](https://docs.expo.dev/router/introduction)

## セットアップ方法

1. 依存関係のインストール

   ```bash
   npm install
   ```

2. アプリの起動

   ```bash
   npx expo start
   ```

出力に表示されるオプションから、以下のいずれかの方法でアプリを開くことができます：

- [開発用ビルド](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android エミュレータ](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS シミュレータ](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)（Expo のサンドボックス環境）

## 開発方法

アプリの開発は`app`ディレクトリ内のファイルを編集することで行えます。このプロジェクトは[ファイルベースのルーティング](https://docs.expo.dev/router/introduction)を使用しています。

## プロジェクトのリセット

新しいプロジェクトとして始めたい場合は、以下のコマンドを実行してください：

```bash
npm run reset-project
```

このコマンドは、スターターコードを`app-example`ディレクトリに移動し、新しい`app`ディレクトリを作成します。

## 参考リンク

- [Expo ドキュメント](https://docs.expo.dev/): 基本的な概念や高度なトピックについて学ぶ
- [Expo チュートリアル](https://docs.expo.dev/tutorial/introduction/): Android、iOS、Web で動作するプロジェクトの作成方法を学ぶ

## コミュニティ

- [Expo on GitHub](https://github.com/expo/expo): オープンソースプラットフォームの閲覧と貢献
- [Discord community](https://chat.expo.dev): Expo ユーザーとのチャットや質問
# hackathon-app
# hackathon-app
