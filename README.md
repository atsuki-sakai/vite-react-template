# React + Vite + Hono + Cloudflare Workers + D1 + Workflows

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/vite-react-template)

このテンプレートは、React、TypeScript、Vite、Cloudflare D1データベース、Cloudflare Workflows、shadcn/ui、そしてDify API統合を使用した包括的なフルスタックセットアップを提供します。型安全なスキーマ、ランタイム検証、永続的ワークフロー、そしてモダンなUI コンポーネントを特徴とした本番対応のアーキテクチャです。

![React + TypeScript + Vite + Cloudflare Workers](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fc7b4b62-442b-4769-641b-ad4422d74300/public)

<!-- dash-content-start -->

🚀 この強力なスタックでWebアプリケーション開発を加速させましょう：

### 🎯 核心テクノロジー
- [**React 19**](https://react.dev/) - 最新のReact機能とConcurrent Featuresを活用
- [**Vite 6**](https://vite.dev/) - 最速のビルドツールと開発サーバー
- [**Hono**](https://hono.dev/) - エッジ最適化された超軽量バックエンドフレームワーク
- [**TypeScript**](https://www.typescriptlang.org/) - 型安全性とDX向上のため完全統合

### ⚡ Cloudflareプラットフォーム
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - エッジコンピューティングとグローバルデプロイメント
- [**Cloudflare D1**](https://developers.cloudflare.com/d1/) - エッジ最適化されたサーバーレスSQLiteデータベース
- [**Cloudflare Workflows**](https://developers.cloudflare.com/workflows/) - 複雑な多段階操作の永続実行エンジン

### 🛠️ 開発効率化ツール
- [**Drizzle ORM**](https://orm.drizzle.team/) - 型安全なデータベース操作とマイグレーション
- [**Zod**](https://zod.dev/) - ランタイム型検証と共有スキーマ定義
- [**shadcn/ui**](https://ui.shadcn.com/) - モダンでアクセシブルなUIコンポーネントライブラリ
- [**TailwindCSS 4**](https://tailwindcss.com/) - ユーティリティファーストCSSフレームワーク

### 🔗 統合・サービス
- [**Dify API**](https://dify.ai/) - AI/チャット機能統合
- [**LINE Messaging API**](https://developers.line.biz/) - LINEチャットボット統合
- [**React Query (TanStack Query)**](https://tanstack.com/query/latest) - サーバー状態管理とキャッシング

### ✨ 主要機能

- 🔥 **高速開発体験**: HMRとConcurrent開発サーバー（フロント・ワーカー同時実行）
- 📦 **完全TypeScript統合**: すべてのレイヤーで型安全性を保証
- 🛡️ **ランタイム検証**: Zodスキーマによる完全なAPIバリデーション
- 🗄️ **型安全データベース**: Drizzle ORMとD1による自動マイグレーション
- ⚙️ **永続ワークフロー**: 複雑なビジネスロジックの堅牢な実行
- 🎨 **モダンUI**: shadcn/uiとTailwindCSSによる美しいインターフェース
- 🔄 **シームレス統合**: フロントエンドとバックエンドで共有される型とスキーマ
- 📱 **レスポンシブ対応**: モバイルファーストの設計とコンポーネント
- 🚀 **本番対応**: ゼロ設定デプロイメントと可観測性

企業レベルのWebアプリケーション、AI統合プラットフォーム、リアルタイムチャットシステム、そしてデータ集約型のSaaSプロダクトの構築に最適です。

<!-- dash-content-end -->

## はじめに

### クイックスタート（新規プロジェクト）

このテンプレートで新しいプロジェクトを開始するには、以下を実行してください：

```bash
npm create cloudflare@latest my-app -- --template=cloudflare/templates/vite-react-template
cd my-app
```

### 手動セットアップ（リポジトリのクローン）

このリポジトリを直接クローンする場合は、以下の詳細なセットアップ手順に従ってください：

#### 1. クローンと依存関係のインストール

```bash
git clone <repository-url>
cd vite-react-template
npm install
```

#### 2. Cloudflare認証

Cloudflareにログインしてwranglerを認証します：

```bash
npx wrangler login
```

#### 3. D1データベースの作成

プロジェクト用の新しいD1データベースを作成します：

```bash
# データベースを作成
npx wrangler d1 create line-messages-db

# 以下のようなデータベース情報が出力されます：
# database_name = "line-messages-db" 
# database_id = "your-database-id"
```

`wrangler.json`をデータベース詳細で更新します：

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "line-messages-db",
      "database_id": "your-database-id-here",
      "migrations_dir": "migrations"
    }
  ]
}
```

#### 4. データベースマイグレーションの適用

初期データベーススキーマを適用します：

```bash
# 本番/リモートデータベース用
npx wrangler d1 migrations apply line-messages-db --remote

# ローカル開発用（オプション）
npx wrangler d1 migrations apply line-messages-db --local
```

**⚠️ 重要**: 上記のコマンドが動作しない場合は、マイグレーションを直接実行してください：

```bash
npx wrangler d1 execute line-messages-db --remote --file=./migrations/0001_init.sql
```

#### 5. 環境変数の設定

Drizzle設定用の`.env`ファイルを作成します（開発用にオプション）：

```bash
# .env（Drizzle操作のみ用）
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=your-database-id
CLOUDFLARE_D1_TOKEN=your-d1-token
```

#### 6. ワークフローの作成

Cloudflare Workflowは既に`wrangler.json`で設定済みです。ワークフロー名をカスタマイズしたい場合を除き、追加のセットアップは不要です。

## 開発

開発サーバーを起動します：

```bash
npm run dev
```

アプリケーションは [http://localhost:5173](http://localhost:5173) で利用できます。

### 💻 利用可能なスクリプト

```bash
# 🚀 開発サーバー
npm run dev              # Viteフロントエンド開発サーバー (http://localhost:5173)
npm run dev:worker       # Cloudflare Workers開発サーバー (Wrangler)
npm run dev:full         # フロントエンド＋ワーカー同時起動 (推奨)

# 🏗️ ビルド & デプロイメント
npm run build            # 本番用ビルド (TypeScript + Vite)
npm run preview          # 本番ビルドのローカルプレビュー
npm run deploy           # Cloudflare Workersにデプロイ
npm run check            # 完全検証 (型チェック + ビルド + ドライラン)

# 🛠️ 開発ツール
npm run lint             # ESLintによるコード品質チェック
npm run cf-typegen       # Cloudflare Worker型定義生成

# 🗄️ データベース操作 (D1)
npm run d1:remote        # 本番データベースにマイグレーション適用
npm run d1:local         # ローカルデータベースにマイグレーション適用
```

## データベース操作

### データベーステーブルの表示

```bash
# リモートデータベースの全テーブルを一覧表示
npx wrangler d1 execute line-messages-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# line_messagesテーブル構造を表示
npx wrangler d1 execute line-messages-db --remote --command="PRAGMA table_info(line_messages);"

# データをクエリ
npx wrangler d1 execute line-messages-db --remote --command="SELECT * FROM line_messages LIMIT 10;"
```

### 新しいマイグレーションの作成

```bash
# スキーマ変更からマイグレーションを生成
npx drizzle-kit generate

# 新しいマイグレーションを適用
npx wrangler d1 migrations apply line-messages-db --remote
```

## 本番デプロイメント

### 1. 設定の確認

`wrangler.json`に正しいデータベース設定があることを確認してください：

```json
{
  "name": "your-app-name",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "line-messages-db",
      "database_id": "your-production-database-id"
    }
  ],
  "workflows": [
    {
      "binding": "LINE_MESSAGE_WORKFLOW",
      "name": "line-message-workflow",
      "class_name": "LineMessageWorkflow"
    }
  ]
}
```

### 2. アプリケーションのデプロイ

```bash
# ビルド付きフルデプロイメント
npm run build && npm run deploy
```

### 3. デプロイメントの確認

デプロイ後、アプリケーションが動作していることを確認してください：
- データベーステーブルが存在することを確認
- APIエンドポイントのテスト
- Cloudflareダッシュボードでワークフロー実行を監視

## よくある問題とトラブルシューティング

### ❌ "D1_ERROR: no such table: line_messages"

**問題**: 本番データベースにデータベースマイグレーションが適用されていません。

**解決方法**:
```bash
# リモートデータベースにマイグレーションを適用
npx wrangler d1 migrations apply line-messages-db --remote

# 上記が動作しない場合は、SQLを直接実行：
npx wrangler d1 execute line-messages-db --remote --file=./migrations/0001_init.sql
```

### ❌ "Database binding 'DB' not found"

**問題**: `wrangler.json`でD1データベース設定が欠落しているか、または間違っています。

**解決方法**: 
1. `wrangler.json`で`d1_databases`配列が適切に設定されていることを確認
2. データベースIDが実際のD1データベースと一致することを確認
3. 設定変更後に再デプロイ

### ❌ "Workflow binding not found"

**問題**: ワークフローが適切に設定またはデプロイされていません。

**解決方法**:
1. `wrangler.json`の`workflows`設定をチェック
2. ワークフロークラスが正しくエクスポートされていることを確認
3. ワークフローの変更を適用するために再デプロイ

### ❌ "Cannot read properties of undefined"

**問題**: 環境変数が欠落しているか、バインディング設定が間違っています。

**解決方法**:
1. 必要なすべてのバインディングが`wrangler.json`で定義されていることを確認
2. 環境変数が正しく設定されていることをチェック
3. ローカルテスト用に`wrangler dev`を使用

### 💡 開発のヒント

- **ローカルデータベース**: 開発時にはD1コマンドで`--local`フラグを使用
- **データベース検査**: ビジュアルなデータベース管理にはDrizzle Studioを使用
- **型安全性**: wrangler.json変更後は常に`npm run cf-typegen`を実行
- **ホットリロード**: フロントエンドとワーカーの両方の開発には`npm run dev:full`を使用
- **デプロイメントテスト**: 本番デプロイ前に`npm run check`を使用

## 📁 プロジェクト構造

```
vite-react-template/
├── 🎨 src/react-app/              # Reactフロントエンドアプリケーション
│   ├── components/                # UIコンポーネント
│   │   ├── ui/                   # shadcn/ui コンポーネント
│   │   ├── HomePage.tsx          # メインページ
│   │   ├── DifyDatasetManager.tsx # Dify API統合コンポーネント
│   │   ├── ChatHistory.tsx       # チャット履歴表示
│   │   └── ...                   # その他アプリケーションコンポーネント
│   ├── lib/utils.ts              # ユーティリティ関数
│   ├── main.tsx                  # Reactアプリエントリーポイント
│   └── App.tsx                   # メインアプリコンポーネント
│
├── ⚙️ src/worker/                  # Cloudflare Workerバックエンド
│   ├── workflows/                # Cloudflare Workflows
│   │   └── lineMessageWorkflow.ts # LINE メッセージ処理ワークフロー
│   ├── index.ts                  # Workerメインハンドラー
│   └── types.ts                  # Worker型定義
│
├── 🔧 src/services/               # ビジネスロジックサービス層
│   ├── DifyService.ts            # Dify API統合サービス
│   ├── ChatService.ts            # チャット機能サービス
│   ├── LineWebhookService.ts     # LINE Webhook処理
│   └── constant.ts               # サービス定数
│
├── 📦 src/shared/                 # フロント・バック共有コード
│   ├── schemas/                  # Zod型定義・バリデーション
│   │   ├── dify/                # Dify API スキーマ
│   │   ├── line/                # LINE API スキーマ
│   │   ├── chat/                # チャット関連スキーマ
│   │   └── validations/         # バリデーションルール
│   ├── hooks/                   # React カスタムフック
│   │   ├── useDifyApi.ts        # Dify API フック
│   │   └── useChatHistory.ts    # チャット履歴フック
│   └── index.ts                 # 共有エクスポート
│
├── 🗄️ src/db/                     # データベース層
│   ├── schema.ts                # Drizzle ORM スキーマ定義
│   └── index.ts                 # データベースユーティリティ
│
├── 📊 migrations/                 # D1 データベースマイグレーション
│   └── 0001_init.sql            # 初期スキーマ
│
├── 🏗️ ビルド・設定ファイル
│   ├── wrangler.json            # Cloudflare Workers設定
│   ├── drizzle.config.ts        # Drizzle ORM設定
│   ├── vite.config.ts           # Vite ビルド設定
│   ├── tailwind.config.js       # TailwindCSS設定
│   ├── components.json          # shadcn/ui設定
│   └── tsconfig.*.json          # TypeScript設定
│
└── 📤 dist/                      # ビルド出力ディレクトリ
```

### 🏗️ アーキテクチャの特徴

- **🔄 デュアルビルドシステム**: フロントエンド（Vite）とバックエンド（Workers）が独立
- **📝 型安全性**: Zodスキーマからの型推論で完全なエンドツーエンド型安全性
- **🎨 コンポーネント設計**: shadcn/uiベースのモダンなUIコンポーネント
- **🗄️ データ層**: Drizzle ORMによる型安全なデータベース操作
- **⚡ パフォーマンス**: エッジコンピューティングとグローバル分散
- **🔧 開発体験**: ホットリロード、型チェック、リアルタイム開発

## 📚 追加リソース

### 🎯 コアテクノロジー
- [React 19 ドキュメント](https://react.dev/) - 最新のReact機能とConcurrent Features
- [Vite 6 ドキュメント](https://vitejs.dev/guide/) - 超高速ビルドツールとモジュールバンドラー
- [TypeScript ドキュメント](https://www.typescriptlang.org/docs/) - 型安全性とスケーラビリティ
- [Hono ドキュメント](https://hono.dev/) - エッジ最適化されたWebフレームワーク

### ⚡ Cloudflareプラットフォーム
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/) - エッジコンピューティングプラットフォーム
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/) - サーバーレスSQLiteデータベース
- [Cloudflare Workflows ドキュメント](https://developers.cloudflare.com/workflows/) - 永続実行エンジン
- [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare開発・デプロイツール

### 🛠️ 開発ツール・ライブラリ
- [Drizzle ORM ドキュメント](https://orm.drizzle.team/) - 型安全なデータベースORM
- [Zod ドキュメント](https://zod.dev/) - ランタイム型検証ライブラリ
- [shadcn/ui ドキュメント](https://ui.shadcn.com/) - モダンなUIコンポーネントライブラリ
- [TailwindCSS 4 ドキュメント](https://tailwindcss.com/docs) - ユーティリティファーストCSS
- [React Query ドキュメント](https://tanstack.com/query/latest) - サーバー状態管理ライブラリ

### 🔗 統合API・サービス
- [Dify API ドキュメント](https://docs.dify.ai/guides/application-orchestration/app-api) - AI/チャット機能統合
- [LINE Messaging API ドキュメント](https://developers.line.biz/en/docs/messaging-api/) - LINEチャットボット統合
- [Lucide React アイコン](https://lucide.dev/) - モダンなアイコンライブラリ

### 🚀 学習・チュートリアル
- [Cloudflare Workers チュートリアル](https://developers.cloudflare.com/workers/tutorials/)
- [React + TypeScript ベストプラクティス](https://react-typescript-cheatsheet.netlify.app/)
- [Drizzle ORM チュートリアル](https://orm.drizzle.team/docs/tutorials)
- [Zod + TypeScript 実践ガイド](https://zod.dev/?id=table-of-contents)
