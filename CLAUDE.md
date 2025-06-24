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

-   `src/data/deck/`：デッキごとのカード定義
    -   各デッキフォルダ内に `deck.ts`（デッキ構成）と `cards/` ディレクトリ
    -   `cards/monster/`：モンスターカード
    -   `cards/magic/`：魔法カード  
    -   `cards/trap/`：罠カード
    -   `cards/extra/`：エクストラデッキモンスター
    -   `cards/token/`：トークン

### コンポーネント設計

-   `src/components/`
    -   `GameBoard.tsx`：メインゲーム画面
    -   `Card.tsx`：カード表示コンポーネント
    -   `FieldZone.tsx`：フィールドゾーン（枠組み）
    -   `AnimationWrapper.tsx`：カードアニメーション
    -   `PlayerField.tsx`：プレイヤーフィールド
    -   `ExtraMonsterZones.tsx`：エクストラモンスターゾーン
    -   `HandArea.tsx`：手札エリア
    -   `DeckSelectionModal.tsx`：デッキ選択モーダル

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
    onHandToGraveyard?: EffectCallback;  // 手札→墓地時効果
    onCardToGraveyardByEffect?: EffectCallback; // 効果によって墓地送り時（効果を送ったカード情報がcontextに含まれる）
    onAnywhereToGraveyardByEffect?: EffectCallback; // 効果によってどこからでも墓地送り時
    onCardEffect?: EffectCallback;       // 他のカードの効果発動時（ライトロード用）
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
-   `withUserSummon()`：召喚位置選択 UI（自動召喚モード対応）
-   `withDelay()`：遅延実行（アニメーション用）
-   `withDelayRecursive()`：再帰的遅延実行（連続アニメーション用）
-   `withTurnAtOneceCondition()`/`withTurnAtOneceEffect()`：1 ターン 1 度制限
-   `withSendDeckBottom()`：カードをデッキの下に送る
-   `withSendToGraveyardFromDeckTop()`：デッキトップから墓地送り
-   `withDraw()`：ドロー処理
-   `withNotification()`：通知バナー表示
-   `withLifeChange()`：ライフポイント変更

### カード移動システム（`src/utils/cardMovement.ts`）

-   `sendCard()`：カードの移動処理
-   `summon()`：モンスター召喚
-   `excludeFromAnywhere()`：任意の場所からカードを除外
-   `destroyByBattle()`/`destroyByEffect()`：破壊処理

**重要：**トークンの墓地送りは特別処理され、`"TokenRemove"` ロケーションでフェードアウトアニメーションが実行されます。

### デッキシャッフルシステム（`src/utils/gameUtils.ts`）

-   `shuffleDeck()`：デッキをシャッフルする
-   **重要：**デッキからカードをサーチした後は必ず `shuffleDeck()` を呼び出す

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

-   `withDelay()`：単一の遅延実行
-   `withDelayRecursive()`：再帰的な遅延実行（詳細は後述）

## ユーティリティクラス

### CardSelector（`src/utils/CardSelector.ts`）

ゲーム状態からカードを簡潔に検索・フィルタリングするためのクラス：

```typescript
// 使用例
const monsters = new CardSelector(state)
    .allMonster()      // モンスターゾーンのカードを取得
    .filter()          // フィルターチェーンを開始
    .nonNull()         // nullを除外
    .get();            // 結果を取得

// 利用可能なメソッド
.monster()          // 通常モンスターゾーン
.exMonster()        // エクストラモンスターゾーン
.allMonster()       // 全モンスターゾーン
.spellTrap()        // 魔法・罠ゾーン
.deck()             // デッキ
.hand()             // 手札
.graveyard()        // 墓地
.field()            // フィールドゾーン
.banished()         // 除外ゾーン（exclusion）
.allFieldSpellTrap() // フィールド上の魔法・罠と継続カード
```

### CardInstanceFilter（`src/utils/CardInstanceFilter.ts`）

CardSelectorから取得したカードリストをフィルタリングするクラス：

```typescript
// 使用例
const attackMonsters = new CardSelector(state)
    .allMonster()
    .filter()
    .nonNull()
    .hasPosition("attack")  // 攻撃表示のモンスターのみ
    .get();

// 利用可能なフィルター
.nonNull()              // nullを除外
.hasPosition(position)  // 特定の表示形式
.excludeId(id)          // 特定のIDを除外
.monster()              // モンスターカードのみ
.magic()                // 魔法カードのみ
.trap()                 // 罠カードのみ
.race(race)             // 特定の種族
.element(element)       // 特定の属性
.hasLevel()             // レベルを持つモンスター
.underLevel(level)      // 指定レベル以下
.overLevel(level)       // 指定レベル以上
.lightsworn()           // ライトロード関連カード
.include(str)           // カード名に特定文字列を含む
.exclude(str)           // カード名に特定文字列を含まない
.noSummonLimited()      // 特殊召喚制限なし
```

## デッキ管理システム

### デッキ構造

各デッキは以下の構造で管理されます：

```
src/data/deck/{deck_name}/
├── deck.ts              # デッキ構成ファイル
└── cards/
    ├── monster/         # 通常モンスター
    ├── extra/           # エクストラデッキ
    ├── magic/           # 魔法カード
    ├── trap/            # 罠カード
    └── token/           # トークン
```

### デッキ登録

新しいデッキは `src/data/deck/` に配置すると自動的に `deckList.ts` で認識され、ゲーム開始時の選択肢に追加されます。

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

### 自動召喚システム

-   `state.autoSummon`：自動召喚モードのON/OFF
-   自動召喚モードでは `withUserSummon()` で最適な位置に自動配置
-   `placementPriority()`：空きゾーンの優先順位を決定
-   リンクモンスターなど特殊な条件がある場合は手動選択にフォールバック

### コミット時の処理

「コミットして」の指示時：

1. ステージングされていないファイルを `git add`
2. 適切なコミットメッセージでコミット実行

### エラー処理とデバッグ

-   Immer 使用時：非同期処理（setTimeout 等）は避け、effectQueue を活用
-   型エラー発生時：必ず戻り値の型注釈を明示
-   アニメーション不具合時：`currentFrom`/`currentTo`とキー値の確認必須
-   **プロキシエラー対策**：`withDelay`内では新しい`CardSelector`を作らず、事前にIDを取得してから使用

### コンテキスト（context）付きコールバック

一部のコールバック（`onCardToGraveyardByEffect`、`onCardEffect`など）では第3引数にcontextが渡されます：

```typescript
onCardToGraveyardByEffect: (state, card, context) => {
    // context?.["effectedByName"] - 効果を発動したカード名
    // context?.["effectedById"] - 効果を発動したカードID
    // context?.["effectedByField"] - 効果を発動したカードの位置
}
```

### Immerプロキシエラーの回避方法

```typescript
// ❌ 悪い例：withDelay内でCardSelectorを使用
withDelay(state, card, { delay: 500 }, (state) => {
    const cards = new CardSelector(state).hand().get(); // プロキシエラー
});

// ✅ 良い例：事前にIDを取得
const cardIds = new CardSelector(state).hand().get().map(c => c.id);
withDelay(state, card, { delay: 500 }, (state) => {
    const cards = cardIds.map(id => state.hand.find(c => c.id === id));
});
```

### withDelayRecursiveの使い方

再帰的に遅延実行を行い、連続的なアニメーションを実現する関数：

```typescript
withDelayRecursive(
    state: GameStore,
    card: CardInstance,
    options: { delay?: number; order?: number },
    depth: number,
    callback: (state: GameStore, card: CardInstance, currentDepth: number) => void,
    finalCallback?: (state: GameStore, card: CardInstance) => void
)
```

**使用例：**

```typescript
// 手札を1枚ずつ墓地に送る
const handCards = new CardSelector(state).hand().get();
withDelayRecursive(
    state,
    card,
    { delay: 100 },  // 各実行間の遅延
    handCards.length,  // 実行回数
    (state, card, depth) => {
        // depth は現在の深さ（handCards.length から 1 まで降順）
        const targetCard = handCards[depth - 1];
        sendCard(state, targetCard, "Graveyard");
    },
    (state, card) => {
        // すべての処理完了後の処理
        console.log("すべてのカードを墓地に送りました");
    }
);
```

**実装の注意点：**
- `depth`は指定した数から1まで降順でコールバックに渡される
- 各段階で100ms（optionsで指定）の遅延が発生
- `finalCallback`はオプショナルで、すべての再帰処理完了後に実行される
