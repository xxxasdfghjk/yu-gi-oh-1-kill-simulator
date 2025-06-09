# Yu-Gi-Oh! Game Codebase Refactoring Report

## 概要

このレポートは、Yu-Gi-Oh!ゲームのコードベースの現状分析と、カード効果処理の抽象化を中心とした改善提案をまとめたものです。

## 目次

1. [現状分析](#現状分析)
2. [改善すべき問題点](#改善すべき問題点)
3. [カード効果抽象化の提案](#カード効果抽象化の提案)
4. [実装計画](#実装計画)
5. [期待される効果](#期待される効果)

---

## 現状分析

### コードベース規模
- **主要ファイル**: `gameStore.ts` (2,131行), `gameStoreHelper.ts`, `cardEffects.ts`
- **総カード効果実装**: 50+ カード
- **エフェクトキュー処理**: 1,200行の巨大switch文
- **テストファイル**: 0個

### アーキテクチャの特徴
- **状態管理**: Zustand + Immer
- **エフェクト処理**: キューベースの非同期処理
- **型システム**: TypeScript（部分的に型安全性に問題）

---

## 改善すべき問題点

### 🔴 高優先度の問題

#### 1. アーキテクチャの問題
**問題**: `gameStore.ts`が2,131行の巨大ファイル
```typescript
// 現状: 全てが一つのファイルに混在
export interface GameStore extends GameState {
    // UI状態
    selectedCard: string | null;
    
    // ゲームロジック
    initializeGame: () => void;
    drawCard: (count?: number) => void;
    
    // カード個別効果
    activateDreitrons: (card: CardInstance) => void;
    activateBeatriceEffect: (card: CardInstance) => void;
    // ... 20+個の個別メソッド
}
```

**影響**: 
- 責任分離ができていない
- テストが困難
- 新機能追加時の影響範囲が不明確

#### 2. 型安全性の問題
**問題**: `any`型の使用と安全でない型アサーション
```typescript
// ❌ 問題のあるコード例
onConfirm: (data: any) => void;  // any型の使用

// 型アサーション（チェックなし）
const monster = card.card as MonsterCard;
monster.attack; // undefinedの可能性
```

**影響**:
- 実行時エラーの原因
- IDE支援の制限
- リファクタリング時の安全性低下

#### 3. 重複コードの問題
**問題**: 同一パターンの繰り返し（20回以上）
```typescript
// ❌ 重複パターン例
state.hand = state.hand.filter((c) => c.id !== cardId);
state.deck = state.deck.filter((c) => c.id !== cardId);
state.graveyard = state.graveyard.filter((c) => c.id !== cardId);

// 類似の処理が各カード効果で重複
getAvailableCards: (state: GameStore) => {
    return state.deck.filter((c) => {
        const isSpellOrTrap = c.card.card_type.includes("魔法");
        const isDrytron = c.card.card_name.includes("竜輝巧");
        return isSpellOrTrap && isDrytron;
    });
}
```

### 🟡 中優先度の問題

#### 4. エラーハンドリング不足
```typescript
// ❌ 境界チェックなし
state.field.monsterZones[zoneIndex] = null; // 配列外アクセスの可能性

// ❌ null チェックなし
if (beatriceOnField.materials.length > 0) { // materialsがundefinedの可能性
```

#### 5. パフォーマンス問題
- O(n²)の複雑度を持つ処理
- 線形検索の多用
- 不必要な再レンダリング

#### 6. テストの欠如
- ユニットテストが存在しない
- 複雑なカードインタラクションが未テスト
- 回帰テストの仕組みがない

---

## カード効果抽象化の提案

### 現在の問題：ハードコーディングされた効果

各カード効果が個別に実装されており、同じパターンが繰り返されています：

```typescript
// ❌ 現在の実装（重複が多い）
case "竜輝巧－ファフニール": {
    state.effectQueue.unshift({
        id: "",
        type: "select",
        effectName: "竜輝巧－ファフニール（ドライトロン魔法・罠カード選択）",
        cardInstance: currentEffect.cardInstance,
        getAvailableCards: (state: GameStore) => {
            return state.deck.filter((c): c is CardInstance => {
                const isSpellOrTrap = c.card.card_type.includes("魔法") || c.card.card_type.includes("罠");
                const isDrytron = c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
                const isNotFafnir = c.card.card_name !== "竜輝巧－ファフニール";
                return isSpellOrTrap && isDrytron && isNotFafnir;
            });
        },
        condition: (cards: CardInstance[]) => cards.length === 1,
        effectType: "add_to_hand_from_deck",
        canCancel: true,
    });
    break;
}

case "おろかな埋葬": {
    state.effectQueue.unshift({
        id: "",
        type: "select",
        effectName: "おろかな埋葬（墓地送り対象選択）",
        cardInstance: currentEffect.cardInstance,
        getAvailableCards: (state: GameStore) => {
            return state.deck.filter((c): c is CardInstance => {
                return isMonsterCard(c.card);
            });
        },
        condition: (cards: CardInstance[]) => cards.length === 1,
        effectType: "send_to_graveyard",
        canCancel: true,
    });
    break;
}
```

### 抽象化の段階的アプローチ

#### フェーズ1: 基本コンポーネントの作成

```typescript
// src/utils/effectFilters.ts
export class CardFilters {
    static byAttribute = (attribute: string): CardFilter => (card: CardInstance) => {
        if (!isMonsterCard(card.card)) return false;
        return (card.card as MonsterCard).attribute === attribute;
    };
    
    static byRace = (race: string): CardFilter => (card: CardInstance) => {
        if (!isMonsterCard(card.card)) return false;
        return (card.card as MonsterCard).race === race;
    };
    
    static byArchetype = (archetype: string): CardFilter => (card: CardInstance) => 
        card.card.card_name.includes(archetype);
    
    static byCardType = (cardType: string): CardFilter => (card: CardInstance) =>
        card.card.card_type.includes(cardType);
    
    static byAttackRange = (min: number, max: number = Infinity): CardFilter => (card: CardInstance) => {
        if (!isMonsterCard(card.card)) return false;
        const attack = (card.card as MonsterCard).attack || 0;
        return attack >= min && attack <= max;
    };
    
    static combine = (...filters: CardFilter[]): CardFilter => (card: CardInstance) =>
        filters.every(filter => filter(card));
    
    static exclude = (cardName: string): CardFilter => (card: CardInstance) =>
        card.card.card_name !== cardName;
}
```

```typescript
// src/utils/effectTemplates.ts
export class EffectTemplates {
    static search(config: SearchConfig): EffectQueueItem {
        return {
            id: "",
            type: config.count === 1 ? "select" : "multiselect",
            effectName: `${config.cardName}（検索対象選択）`,
            cardInstance: config.cardInstance,
            getAvailableCards: (state: GameStore) => state[config.from].filter(config.filter),
            condition: (cards: CardInstance[]) => cards.length === config.count,
            effectType: `search_${config.from}_to_${config.to}`,
            canCancel: config.optional || false,
        };
    }
    
    static specialSummon(config: SpecialSummonConfig): EffectQueueItem {
        return {
            id: "",
            type: "select",
            effectName: `${config.cardName}（特殊召喚対象選択）`,
            cardInstance: config.cardInstance,
            getAvailableCards: (state: GameStore) => state[config.from].filter(config.filter),
            condition: (cards: CardInstance[]) => cards.length === 1,
            effectType: "special_summon",
            canCancel: false,
        };
    }
    
    static sendToGraveyard(config: SendToGraveyardConfig): EffectQueueItem {
        return {
            id: "",
            type: config.count === 1 ? "select" : "multiselect",
            effectName: `${config.cardName}（墓地送り対象選択）`,
            cardInstance: config.cardInstance,
            getAvailableCards: (state: GameStore) => state[config.from].filter(config.filter),
            condition: (cards: CardInstance[]) => cards.length === config.count,
            effectType: "send_to_graveyard",
            canCancel: config.optional || false,
        };
    }
    
    static withCost<T extends EffectQueueItem>(effect: T, cost: CostConfig): EffectQueueItem {
        return {
            ...effect,
            effectType: `cost_${cost.type}_then_${effect.effectType}`,
        };
    }
}
```

#### フェーズ2: カード効果定義の簡素化

```typescript
// src/data/cardEffectDefinitions.ts
export const cardEffectDefinitions = {
    "竜輝巧－ファフニール": {
        type: "search" as const,
        config: {
            from: "deck" as const,
            to: "hand" as const,
            filter: CardFilters.combine(
                CardFilters.byCardType("魔法"),
                CardFilters.byArchetype("竜輝巧"),
                CardFilters.exclude("竜輝巧－ファフニール")
            ),
            count: 1,
            optional: true,
        }
    },
    
    "神聖なる魂": {
        type: "special_summon_with_cost" as const,
        config: {
            cost: {
                type: "banish_from_graveyard" as const,
                filter: CardFilters.byAttribute("光属性"),
                count: 2,
            },
            summon: {
                target: "self" as const,
                positions: ["attack", "defense"] as const,
            }
        }
    },
    
    "おろかな埋葬": {
        type: "send_to_graveyard" as const,
        config: {
            from: "deck" as const,
            filter: CardFilters.byCardType("モンスター"),
            count: 1,
            optional: true,
        }
    },
    
    "ワン・フォー・ワン": {
        type: "search_with_cost" as const,
        config: {
            cost: {
                type: "send_to_graveyard_from_hand" as const,
                filter: CardFilters.byCardType("モンスター"),
                count: 1,
            },
            search: {
                from: "deck" as const,
                to: "field" as const,
                filter: CardFilters.combine(
                    CardFilters.byCardType("モンスター"),
                    (card) => isMonsterCard(card.card) && (card.card as MonsterCard).level === 1
                ),
                count: 1,
                summonType: "special" as const,
            }
        }
    }
} as const;

// 型定義
interface SearchConfig {
    from: "deck" | "graveyard" | "banished";
    to: "hand" | "field";
    filter: CardFilter;
    count: number;
    optional?: boolean;
    cardName: string;
    cardInstance: CardInstance;
}

interface SpecialSummonConfig {
    from: "hand" | "deck" | "graveyard";
    filter: CardFilter;
    positions?: ("attack" | "defense")[];
    cardName: string;
    cardInstance: CardInstance;
}

interface CostConfig {
    type: "banish_from_graveyard" | "send_to_graveyard_from_hand" | "release_from_field";
    filter: CardFilter;
    count: number;
}

type CardFilter = (card: CardInstance) => boolean;
```

#### フェーズ3: 統一エフェクトプロセッサー

```typescript
// src/utils/effectProcessor.ts
export class EffectProcessor {
    static createEffect(cardName: string, cardInstance: CardInstance): EffectQueueItem | null {
        const definition = cardEffectDefinitions[cardName];
        if (!definition) return null;
        
        const config = { ...definition.config, cardName, cardInstance };
        
        switch (definition.type) {
            case "search":
                return EffectTemplates.search(config);
                
            case "special_summon_with_cost":
                return this.createCostBasedEffect(config, cardName, cardInstance);
                
            case "send_to_graveyard":
                return EffectTemplates.sendToGraveyard(config);
                
            case "search_with_cost":
                return this.createSearchWithCost(config, cardName, cardInstance);
                
            default:
                console.warn(`Unknown effect type: ${definition.type} for card: ${cardName}`);
                return null;
        }
    }
    
    static processEffect(effectType: string, selectedCards: CardInstance[], state: GameStore, currentEffect: EffectQueueItem) {
        switch (effectType) {
            case "search_deck_to_hand":
                selectedCards.forEach(card => {
                    helper.toHandFromAnywhere(state, card);
                });
                break;
                
            case "search_deck_to_field":
                state.effectQueue.unshift({
                    type: "summon",
                    cardInstance: selectedCards[0],
                    effectType: "special_summon",
                    optionPosition: ["attack", "defense"],
                    canSelectPosition: true,
                });
                break;
                
            case "special_summon":
                state.effectQueue.unshift({
                    type: "summon",
                    cardInstance: selectedCards[0],
                    effectType: "",
                    optionPosition: ["attack", "defense"],
                    canSelectPosition: true,
                });
                break;
                
            case "send_to_graveyard":
                selectedCards.forEach(card => {
                    helper.sendCardToGraveyardFromAnywhere(state, card);
                });
                break;
                
            case "cost_banish_from_graveyard_then_special_summon":
                // コスト処理: 墓地から除外
                selectedCards.forEach(card => {
                    helper.banishCardFromGraveyard(state, card);
                });
                // メイン効果: 特殊召喚
                state.effectQueue.unshift({
                    type: "summon",
                    cardInstance: currentEffect.cardInstance,
                    effectType: "",
                    optionPosition: ["attack", "defense"],
                    canSelectPosition: true,
                });
                break;
                
            default:
                console.warn(`Unknown effect type: ${effectType}`);
        }
    }
    
    private static createCostBasedEffect(config: any, cardName: string, cardInstance: CardInstance): EffectQueueItem {
        const costEffect = EffectTemplates.search({
            from: config.cost.type === "banish_from_graveyard" ? "graveyard" : "hand",
            to: "banished",
            filter: config.cost.filter,
            count: config.cost.count,
            cardName,
            cardInstance,
        });
        
        return {
            ...costEffect,
            effectType: `cost_${config.cost.type}_then_special_summon`,
            effectName: `${cardName}（コスト対象選択）`,
        };
    }
    
    private static createSearchWithCost(config: any, cardName: string, cardInstance: CardInstance): EffectQueueItem {
        const costEffect = EffectTemplates.sendToGraveyard({
            from: "hand",
            filter: config.cost.filter,
            count: config.cost.count,
            cardName,
            cardInstance,
        });
        
        return {
            ...costEffect,
            effectType: `cost_${config.cost.type}_then_search_${config.search.from}_to_${config.search.to}`,
            effectName: `${cardName}（コスト対象選択）`,
        };
    }
}
```

### 使用例：既存コードの変換

#### 変換前（現在）
```typescript
case "竜輝巧－ファフニール": {
    state.effectQueue.unshift({
        id: "",
        type: "select",
        effectName: "竜輝巧－ファフニール（ドライトロン魔法・罠カード選択）",
        cardInstance: currentEffect.cardInstance,
        getAvailableCards: (state: GameStore) => {
            return state.deck.filter((c) => {
                const isSpellOrTrap = c.card.card_type.includes("魔法") || c.card.card_type.includes("罠");
                const isDrytron = c.card.card_name.includes("竜輝巧");
                const isNotFafnir = c.card.card_name !== "竜輝巧－ファフニール";
                return isSpellOrTrap && isDrytron && isNotFafnir;
            });
        },
        condition: (cards: CardInstance[]) => cards.length === 1,
        effectType: "add_to_hand_from_deck",
        canCancel: true,
    });
    break;
}
```

#### 変換後（抽象化）
```typescript
// カード効果の発動
case "竜輝巧－ファフニール": {
    const effect = EffectProcessor.createEffect("竜輝巧－ファフニール", currentEffect.cardInstance);
    if (effect) {
        state.effectQueue.unshift(effect);
    }
    break;
}

// または、さらにシンプルに
default: {
    const effect = EffectProcessor.createEffect(currentEffect.cardInstance.card.card_name, currentEffect.cardInstance);
    if (effect) {
        state.effectQueue.unshift(effect);
    }
    break;
}
```

---

## 実装計画

### フェーズ1: 基盤の構築（1-2週間）

#### 目標
- 抽象化の基盤となるクラスとインターフェースの実装
- 既存コードとの互換性確保

#### タスク
1. **型定義の整備**
   ```typescript
   // src/types/effects.ts
   interface CardFilter { ... }
   interface EffectConfig { ... }
   interface CostConfig { ... }
   ```

2. **CardFiltersクラスの実装**
   - 基本的なフィルター関数
   - 組み合わせロジック
   - テストケース作成

3. **EffectTemplatesクラスの実装**
   - search, specialSummon, sendToGraveyard テンプレート
   - 基本的なバリデーション

4. **既存コードの影響調査**
   - 変更が必要な箇所の特定
   - 互換性レイヤーの設計

#### 成果物
- `src/utils/effectFilters.ts`
- `src/utils/effectTemplates.ts`
- `src/types/effects.ts`
- 基本テストケース

### フェーズ2: 部分的移行（2-3週間）

#### 目標
- 簡単なエフェクトから段階的に移行
- 動作確認とバグ修正

#### タスク
1. **シンプルなカード効果の移行**
   - 検索系効果（ファフニール、テラフォーミング等）
   - 墓地送り系効果（おろかな埋葬等）

2. **EffectProcessorの実装**
   - 基本的な効果処理ロジック
   - エラーハンドリング

3. **テスト環境の整備**
   ```typescript
   // src/__tests__/effectProcessor.test.ts
   describe('EffectProcessor', () => {
     test('should create search effect for Fafnir', () => { ... });
   });
   ```

4. **既存機能の動作確認**
   - E2Eテストの実行
   - 回帰テストの実施

#### 成果物
- 5-10カードの効果移行完了
- 包括的テストスイート
- 動作確認レポート

### フェーズ3: 完全移行（4-6週間）

#### 目標
- 全カード効果の抽象化完了
- パフォーマンス最適化

#### タスク
1. **複雑なエフェクトの移行**
   - コスト付き効果（ドライトロン系）
   - チェーン効果（コンボ系）
   - 条件付き効果

2. **パフォーマンス最適化**
   ```typescript
   // フィルターのメモ化
   class MemoizedFilters {
     private static cache = new Map();
     static get(key: string, factory: () => CardFilter): CardFilter { ... }
   }
   ```

3. **レガシーコードの削除**
   - 古いswitch文の除去
   - 未使用コードの清理
   - コードレビュー

4. **ドキュメント整備**
   - APIドキュメント
   - 移行ガイド
   - 新カード追加手順

#### 成果物
- 全カード効果の抽象化完了
- 最適化されたパフォーマンス
- 完全なドキュメント

### フェーズ4: 品質向上（2-3週間）

#### 目標
- コード品質の向上
- 保守性の確保

#### タスク
1. **エラーハンドリングの強化**
   ```typescript
   class EffectValidator {
     static validateConfig(config: EffectConfig): ValidationResult { ... }
     static validateGameState(state: GameState): ValidationResult { ... }
   }
   ```

2. **型安全性の向上**
   - strictモードの有効化
   - any型の完全排除
   - 型ガードの追加

3. **パフォーマンス監視**
   - 処理時間の計測
   - メモリ使用量の監視
   - ボトルネックの特定

---

## 期待される効果

### 即時効果

#### コード量の大幅削減
- **現在**: 2,000+ 行のエフェクト処理
- **削減後**: 500行程度の抽象化されたコード
- **削減率**: 約75%

#### 新カード追加の簡素化
```typescript
// 現在: 50-100行のコード記述が必要
case "新カード名": {
    state.effectQueue.unshift({
        // 長大な設定...
    });
    break;
}

// 改善後: 数行の定義のみ
"新カード名": {
    type: "search",
    config: {
        from: "deck",
        filter: CardFilters.byAttribute("光属性"),
        count: 1,
    }
}
```

### 中長期効果

#### 保守性の向上
- **統一された処理**: 同じロジックでの一貫した動作
- **バグ減少**: 共通コンポーネントでのバグ修正が全体に適用
- **テスト容易性**: 抽象化されたコンポーネントの単体テスト

#### 開発効率の向上
- **新機能実装**: 既存コンポーネントの組み合わせで実現
- **デバッグ効率**: 問題の原因箇所の特定が容易
- **コードレビュー**: レビュー対象が明確で効率的

#### スケーラビリティの確保
- **新カードタイプ**: 新しい効果タイプの追加が容易
- **複雑な効果**: 既存コンポーネントの組み合わせで実現
- **パフォーマンス**: 最適化された共通処理

### 定量的な改善目標

| 指標 | 現在 | 目標 | 改善率 |
|------|------|------|--------|
| コード行数 | 2,000+ | 500 | -75% |
| 新カード実装時間 | 2-4時間 | 10-30分 | -80% |
| バグ発生率 | 高 | 低 | -60% |
| テストカバレッジ | 0% | 80%+ | +80% |
| コードレビュー時間 | 1-2時間 | 20-30分 | -70% |

---

## 追加提案

### 1. 開発プロセスの改善

#### コードレビューのガイドライン
```markdown
## カード効果実装のチェックリスト
- [ ] cardEffectDefinitions.ts に定義が追加されている
- [ ] 既存のフィルターで実現可能か確認
- [ ] 新しいエフェクトタイプが必要な場合は適切に抽象化されている
- [ ] テストケースが追加されている
- [ ] エラーハンドリングが適切に実装されている
```

#### 新カード追加の標準プロセス
1. カード効果の分析
2. 既存パターンとの照合
3. 必要に応じて新しい抽象化の実装
4. 定義の追加
5. テストケース作成
6. 動作確認

### 2. 品質保証の強化

#### 自動テスト戦略
```typescript
// 各エフェクトタイプの網羅的テスト
describe('Card Effects Integration', () => {
    Object.keys(cardEffectDefinitions).forEach(cardName => {
        test(`${cardName} should work correctly`, () => {
            // 自動生成されたテストケース
        });
    });
});
```

#### 継続的インテグレーション
- プルリクエスト時の自動テスト実行
- カバレッジレポートの生成
- パフォーマンス回帰テスト

### 3. 長期的な技術戦略

#### マイクロサービス化への準備
- エフェクト処理の独立性確保
- APIの標準化
- 状態管理の分離

#### 拡張性の確保
- プラグインシステムの検討
- 外部データソースとの連携
- リアルタイム対戦への対応

---

## 結論

このリファクタリング計画により、Yu-Gi-Oh!ゲームのコードベースは以下の点で大幅に改善されます：

1. **保守性**: 抽象化により統一された処理で保守が容易
2. **拡張性**: 新カードの追加が数分で完了
3. **品質**: テスト可能な設計でバグの大幅減少
4. **パフォーマンス**: 最適化された共通処理
5. **開発効率**: 標準化されたプロセスで開発速度向上

段階的な移行により、既存機能への影響を最小限に抑えながら、持続可能で拡張性の高いコードベースを構築できます。

---

*作成日: 2025年1月*  
*バージョン: 1.0*