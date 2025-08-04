# React + Vite + Hono + Cloudflare Workers + D1 + Workflows

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/vite-react-template)

このテンプレートは、React、TypeScript、Vite、D1データベース、Cloudflare Workflowsを使用した包括的なフルスタックセットアップを提供します。ホットモジュールリプレースメント、ESLint統合、データベースマイグレーション、永続的ワークフロー、そしてWorkersデプロイメントの柔軟性を特徴としています。

![React + TypeScript + Vite + Cloudflare Workers](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fc7b4b62-442b-4769-641b-ad4422d74300/public)

<!-- dash-content-start -->

🚀 この強力なスタックでWebベロプメントを加速させましょう：

- [**React**](https://react.dev/) - インタラクティブなインターフェースを構築するモダンなUIライブラリ
- [**Vite**](https://vite.dev/) - 超高速ビルドツールと開発サーバー
- [**Hono**](https://hono.dev/) - 超軽量でモダンなバックエンドフレームワーク
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - グローバルデプロイメント用エッジコンピューティングプラットフォーム
- [**Cloudflare D1**](https://developers.cloudflare.com/d1/) - エッジでのサーバーレスSQLiteデータベース
- [**Cloudflare Workflows**](https://developers.cloudflare.com/workflows/) - 複雑な操作のための永続実行エンジン
- [**Drizzle ORM**](https://orm.drizzle.team/) - 型安全なデータベース操作
- [**Zod**](https://zod.dev/) - ランタイム型検証とスキーマ定義

### ✨ 主要機能

- 🔥 迅速な開発のためのホットモジュールリプレースメント（HMR）
- 📦 TypeScriptサポートが標準装備
- 🛠️ ESLint設定を含む
- ⚡ Cloudflareのグローバルネットワークへのゼロ設定デプロイメント
- 🎯 Honoのエレガントなルーティングを使ったAPIルート
- 🔄 フルスタック開発セットアップ
- 🗄️ **自動マイグレーション付きD1 SQLiteデータベース**
- ⚙️ **複雑で多段階操作のための永続ワークフロー**
- 🛡️ **Drizzle ORMによる型安全なデータベース操作**
- 🔍 **Zodスキーマによるランタイム検証**
- 🚀 **可観測性を備えた本番対応アーキテクチャ**

ローカル開発で数分で開始するか、Cloudflareダッシュボード経由で直接デプロイできます。永続的なデータストレージと複雑なビジネスロジックを持つモダンで高性能なWebアプリケーションの構築に最適です。

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

### 利用可能なスクリプト

```bash
# 開発
npm run dev              # Vite開発サーバーを起動
npm run dev:worker       # Wrangler開発サーバーを起動
npm run dev:full         # ViteとWranglerの両方を起動（並行実行）

# ビルド & デプロイ
npm run build            # 本番用ビルド
npm run preview          # 本番ビルドをローカルでプレビュー
npm run deploy           # Cloudflare Workersにデプロイ
npm run check            # フル検証（TypeScript + ビルド + デプロイのドライラン）

# リンティング & 型
npm run lint             # ESLintを実行
npm run cf-typegen       # Cloudflare Worker型を生成

# データベース（D1）
npm run d1:remote        # リモートデータベースにマイグレーションを適用
npm run d1:local         # ローカルデータベースにマイグレーションを適用
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

## プロジェクト構造

```
├── src/
│   ├── react-app/          # Reactフロントエンドアプリケーション
│   ├── worker/              # Cloudflare Workerバックエンド
│   │   ├── workflows/       # Cloudflare Workflows
│   │   └── index.ts         # Workerエントリーポイント
│   ├── services/           # ビジネスロジックサービス
│   ├── shared/             # 共有型とユーティリティ
│   └── db/                 # データベーススキーマとユーティリティ
├── migrations/             # D1データベースマイグレーション
├── dist/                   # ビルド出力
├── wrangler.json          # Cloudflare設定
├── drizzle.config.ts      # Drizzle ORM設定
└── vite.config.ts         # Viteビルド設定
```

## 追加リソース

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [Cloudflare Workflows ドキュメント](https://developers.cloudflare.com/workflows/)
- [Drizzle ORM ドキュメント](https://orm.drizzle.team/)
- [Vite ドキュメント](https://vitejs.dev/guide/)
- [React ドキュメント](https://reactjs.org/)
- [Hono ドキュメント](https://hono.dev/)
- [Zod ドキュメント](https://zod.dev/)
