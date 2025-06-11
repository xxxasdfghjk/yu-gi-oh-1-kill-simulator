このファイルは本プロジェクトのコーディング規約及び設定を記載した「ルール」または「ルールファイル」です。

### 最重要ルール - 新しいルールの追加プロセス

ユーザーから今回限りでなく常に対応が必要だと思われる指示を受けた場合：

1. 「これを標準のルールにしますか？」と質問する
2. YES の回答を得た場合、CLAUDE.md に追加ルールとして記載する
3. 移行は標準ルールとして常に適用する

このプロセスにより、プロジェクトのルールを継続的に改善していきます。

### プロジェクト概要

このプロジェクトは１ターンのみプレイできる遊戯王シミュレータです。React + TypeScript + Vite + Tailwind CSS で構築されており、zustand でグローバル状態管理を行っています。

## アーキテクチャ概要

### 状態管理（zustand + immer）

-   `src/store/gameStore.ts`：メインのゲーム状態管理
-   `src/store/hoveredCardAtom.ts`：ホバー中のカード状態（jotai）
-   `src/store/graveyardModalAtom.ts`：墓地モーダル状態（jotai）
-   `src/store/fieldCenterAtom.ts`：フィールド中心座標（jotai）

### カードデータ構造

-   `src/data/cards/`：カード定義
    -   `monsters/`：モンスターカード（common.ts, extra.ts）
    -   `spells/`：魔法カード（index.ts）
    -   `traps/`：罠カード（index.ts）
    -   `tokens/`：トークン（index.ts）

### コンポーネント設計

-   `src/components/`
    -   `GameBoard.tsx`：メインゲーム画面
    -   `Card.tsx`：カード表示コンポーネント
    -   `FieldZone.tsx`：フィールドゾーン（枠組み）
    -   `AnimationWrapper.tsx`：カードアニメーション
    -   `PlayerField.tsx`：プレイヤーフィールド
    -   `ExtraMonsterZones.tsx`：エクストラモンスターゾーン
    -   `HandArea.tsx`：手札エリア

## カード効果システム

### 効果の種類と実装パターン

カードの effect オブジェクトで効果を定義します：

```typescript
effect: {
    onSummon?: EffectCallback;           // 召喚時効果
    onIgnition?: {                       // 起動効果
        condition: ConditionCallback;
        effect: EffectCallback;
    };
    onSpell?: {                          // 魔法・罠カード効果
        condition: ConditionCallback;
        effect: EffectCallback;
    };
    onRelease?: EffectCallback;          // リリース時効果
    onFieldToGraveyard?: EffectCallback; // フィールド→墓地時効果
    onAnywhereToGraveyard?: EffectCallback; // どこからでも→墓地時効果
    onDestroyByBattle?: EffectCallback;  // 戦闘破壊時効果（未使用）
    onDestroyByEffect?: EffectCallback;  // 効果破壊時効果（未実装）
}
```

### 効果処理キューシステム

効果処理は `GameStore.effectQueue` で管理されます：

```typescript
type EffectQueueItem = {
    id: string;
    type: "search" | "select" | "multiselect" | "summon" | "confirm" | "option" | "notify" | "delay";
    cardInstance: CardInstance;
    effectType: string;
    // ... その他の型固有プロパティ
};
```

効果処理の流れ：

1. `pushQueue()` でキューに効果を追加
2. UI が `EffectQueueModal` でユーザー入力を受け取り
3. `processQueueTop()` で効果を実行
4. 完了後、次の効果へ自動進行

### 効果ユーティリティ関数（`src/utils/effectUtils.ts`）

-   `withUserSelectCard()`：カード選択 UI
-   `withOption()`：選択肢表示 UI
-   `withUserSummon()`：召喚位置選択 UI
-   `withDelay()`：遅延実行（アニメーション用）
-   `withTurnAtOneceCondition()`/`withTurnAtOneceEffect()`：1 ターン 1 度制限

### カード移動システム（`src/utils/cardMovement.ts`）

-   `sendCard()`：カードの移動処理
-   `summon()`：モンスター召喚
-   `excludeFromAnywhere()`：任意の場所からカードを除外
-   `destroyByBattle()`/`destroyByEffect()`：破壊処理

**重要：**トークンの墓地送りは特別処理され、`"TokenRemove"` ロケーションでフェードアウトアニメーションが実行されます。

## アニメーションシステム

### 座標計算とアニメーション

アニメーションは以下の流れで動作します：

1. **座標基準**：`src/store/fieldCenterAtom.ts` でフィールド中心座標を管理
2. **相対座標計算**：`src/const/card.ts` の `getFieldCoodrinateAbsolute()` で各ゾーンの絶対座標を取得
3. **アニメーション実行**：`GameStore.currentFrom`/`currentTo` で移動情報を管理
4. **framer-motion**：`AnimationWrapper` でスムーズなカード移動を実現

### 座標系とロケーション

```typescript
type Location =
    | "Deck"
    | "Hand"
    | "MonsterField"
    | "SpellField"
    | "ExtraDeck"
    | "Exclusion"
    | "Graveyard"
    | "FieldZone"
    | "OpponentField"
    | "Material"
    | "TokenRemove"; // トークンフェードアウト用
```

### アニメーション制御

-   `withDelay()`：複数カードの順次アニメーション

## 型定義

### コアタイプ（`src/types/card.ts`）

```typescript
interface CardInstance {
    id: string;
    card: Card;
    location: Location;
    position: Position;
    equipment: CardInstance[];
    summonedBy: SummonedBy;
    buf: { level: number; attack: number; defense: number };
    materials: CardInstance[];
    isToken?: boolean;
    setTurn?: number;
    isDummy?: true;
}
```

### モンスターカード階層

```typescript
MonsterCard
├── DefensableMonsterCard (defense値あり)
│   ├── LeveledMonsterCard (level値あり)
│   └── XyzMonsterCard (rank値あり)
├── LinkMonsterCard (link値あり、defense無し)
├── FusionMonsterCard (融合モンスター)
└── SynchroMonsterCard (シンクロモンスター)
```

## 開発ルール

### カードデータ編集ルール

-   攻撃力・守備力・レベルなどの基本情報は変更禁止
-   effect オブジェクトのみ編集可能
-   新効果カテゴリ追加時は必ず型定義も更新

### アニメーション実装ルール

-   カード移動時は必ず `GameStore.currentFrom`/`currentTo` を設定
-   トークンの削除は `"TokenRemove"` ロケーション使用
-   複数カード同時処理時は `withDelay()` で順次実行

### コミット時の処理

「コミットして」の指示時：

1. ステージングされていないファイルを `git add`
2. 適切なコミットメッセージでコミット実行

### エラー処理とデバッグ

-   Immer 使用時：非同期処理（setTimeout 等）は避け、effectQueue を活用
-   型エラー発生時：必ず戻り値の型注釈を明示
-   アニメーション不具合時：`currentFrom`/`currentTo`とキー値の確認必須
