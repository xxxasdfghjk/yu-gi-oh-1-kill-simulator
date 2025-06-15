# チェーンシステム拡張設計書

## 概要

本文書は、遊戯王シミュレータにおけるチェーンシステムの拡張設計をまとめたものです。現在の速攻魔法による通常魔法へのチェーン実装を基盤として、モンスター効果・罠カードを含む包括的なチェーンシステムの設計を提案します。

## 現在の実装状況

### 実装済み機能
- 通常魔法発動時の速攻魔法チェーン
- チェーン状態の管理（`state.cardChain`）
- チェーン確認UI（`withCheckChain`）
- 基本的な2段階チェーン処理

### 主要な型定義
```typescript
// gameStore.ts
cardChain: CardInstance[]

// types/card.ts
onChain?: {
    condition: ChainConditionCallback;
};

type ChainConditionCallback = (
    gameState: GameStore,
    cardInstance: CardInstance,
    chainCardList: CardInstance[]
) => boolean;
```

### 現在の処理フロー
1. `playCardInternal()` - 魔法カード発動時
2. `state.cardChain.unshift(card)` - チェーンに追加
3. `withCheckChain()` - チェーン可能カード確認
4. ユーザー選択 → チェーン実行 or スキップ
5. 効果解決後、`cardChain`から削除

## 設計コンセプト：「長さ1チェーン」アプローチ

### 基本思想
すべての効果発動を「長さ1のチェーン」として捉え、チェーン構築フェーズと解決フェーズを明確に分離します。これにより、現在の`EffectQueue`システムと完全に整合した拡張が可能になります。

### 設計の優位性

#### 1. 概念的明確性
- **統一的処理：** 通常魔法も速攻魔法もモンスター効果も全て「チェーンリンク1」から開始
- **ルール準拠：** 遊戯王の実際のチェーンルールと完全一致
- **予測可能性：** 開発者が理解しやすい一貫した処理流れ

#### 2. 既存システムとの親和性
- **EffectQueue活用：** 現在のキューシステムをそのまま拡張
- **段階的実装：** 既存の速攻魔法チェーンを壊さずに拡張可能
- **後方互換性：** 現在のカード定義に影響なし

## 拡張設計詳細

### 1. 新しい型定義

```typescript
// チェーン関連の型定義拡張
type SpellSpeed = 1 | 2 | 3;

interface ChainLink {
    card: CardInstance;
    chainLinkNumber: number;
    spellSpeed: SpellSpeed;
    effectType: "spell" | "trap" | "monster_ignition" | "monster_trigger";
}

interface ChainState {
    links: ChainLink[];
    isBuilding: boolean;
    currentLinkNumber: number;
    canAddLink: boolean;
}

// EffectQueueItem拡張
type ExtendedEffectQueueItem = EffectQueueItem | {
    id: string;
    type: "chain_build";
    cardInstance: CardInstance;
    effectType: string;
    spellSpeed: SpellSpeed;
    chainState: ChainState;
    callback?: (state: GameStore, cardInstance: CardInstance, chainComplete: boolean) => void;
};
```

### 2. チェーン構築システム

```typescript
// 新しいユーティリティ関数
export const withChainBuild = (
    state: GameStore,
    card: CardInstance,
    options: {
        spellSpeed: SpellSpeed;
        effectType: "spell" | "trap" | "monster_ignition" | "monster_trigger";
        order?: number;
    },
    effectCallback: (state: GameStore, cardInstance: CardInstance) => void
) => {
    // チェーン構築開始
    const chainState: ChainState = {
        links: [{ 
            card, 
            chainLinkNumber: 1, 
            spellSpeed: options.spellSpeed,
            effectType: options.effectType 
        }],
        isBuilding: true,
        currentLinkNumber: 1,
        canAddLink: true
    };

    // チェーン構築をキューに追加
    pushQueue(state, {
        id: uuidv4(),
        order: options.order ?? 1,
        type: "chain_build",
        cardInstance: card,
        effectType: "chain_building",
        spellSpeed: options.spellSpeed,
        chainState,
        callback: (state, card, chainComplete) => {
            if (chainComplete) {
                // チェーン解決フェーズ
                resolveChain(state, chainState);
            } else {
                // チェーン継続
                continueChainBuild(state, chainState);
            }
        }
    });
};
```

### 3. スペルスピードシステム

```typescript
// スペルスピードベースの判定
const canChainToSpellSpeed = (
    chainCard: CardInstance, 
    targetSpellSpeed: SpellSpeed
): boolean => {
    const cardSpellSpeed = getCardSpellSpeed(chainCard);
    return cardSpellSpeed >= targetSpellSpeed;
};

const getCardSpellSpeed = (card: CardInstance): SpellSpeed => {
    if (isMagicCard(card.card)) {
        switch (card.card.magic_type) {
            case "通常魔法":
            case "儀式魔法":
            case "永続魔法":
            case "装備魔法":
            case "フィールド魔法":
                return 1;
            case "速攻魔法":
                return 2;
        }
    }
    if (isTrapCard(card.card)) {
        return card.card.trap_type === "カウンター罠" ? 3 : 2;
    }
    if (card.card.effect?.onIgnition) return 1;  // 起動効果
    if (card.card.effect?.onTrigger) return 2;   // 誘発効果（将来実装）
    return 1;
};
```

### 4. 拡張された効果タイプ

```typescript
type ExtendedEffectType = EffectType & {
    onTrigger?: {  // 誘発効果（新規）
        condition: ConditionCallback;
        timing: "summon" | "destroy" | "damage" | "draw";
        effect: EffectCallback;
        spellSpeed: 2;
    };
    onCounterTrap?: {  // カウンター罠（新規）
        condition: ChainConditionCallback;
        targetSpellSpeed: SpellSpeed;
        effect: EffectCallback;
        spellSpeed: 3;
    };
    onIgnition?: {  // 起動効果（拡張）
        condition: ConditionCallback;
        effect: EffectCallback;
        spellSpeed: 1;
    };
};
```

### 5. チェーン解決システム

```typescript
const resolveChain = (state: GameStore, chainState: ChainState) => {
    // チェーンリンクを逆順で解決（最後に追加されたものから）
    const reversedLinks = [...chainState.links].reverse();
    
    withDelayRecursive(
        state,
        chainState.links[0].card,
        { delay: 300 },
        reversedLinks.length,
        (state, _, depth) => {
            const currentLink = reversedLinks[depth - 1];
            
            // 各チェーンリンクの効果を実行
            resolveChainLink(state, currentLink);
            
            // チェーンリンク解決アニメーション
            withNotification(state, currentLink.card, {
                message: `チェーンリンク${currentLink.chainLinkNumber}解決`,
                duration: 500
            });
        },
        (state) => {
            // チェーン解決完了
            state.cardChain = [];
            state.isProcessing = false;
        }
    );
};
```

## 実装フェーズ計画

### フェーズ1：基盤整備
1. 新しい型定義の追加
2. `withChainBuild`関数の実装  
3. スペルスピード判定システム
4. 既存`withCheckChain`の拡張

### フェーズ2：カード種別対応
1. 罠カードのチェーン対応
2. モンスター起動効果のチェーン対応
3. 既存速攻魔法との統合テスト

### フェーズ3：高度な機能
1. 誘発効果システム
2. カウンター罠システム
3. 複雑なタイミング調整
4. 優先権システム

## 技術的利点

### 1. 保守性
- **一貫した処理：** すべてのチェーンが同じパターンで処理
- **デバッグ容易性：** チェーン状態が明確に管理される
- **拡張性：** 新しい効果タイプの追加が簡単

### 2. ユーザビリティ  
- **予測可能：** 遊戯王プレイヤーにとって自然な動作
- **視覚的明確性：** チェーン構築過程が分かりやすい
- **操作性：** 段階的な選択でストレスが少ない

### 3. 技術的優位性
- **EffectQueue活用：** 既存システムの長所を維持
- **型安全性：** TypeScriptの恩恵を最大化
- **テスタビリティ：** 各段階を独立してテスト可能

## カード種別別の対応方針

### 魔法カード
- **通常魔法：** スペルスピード1、チェーンリンク1として開始
- **速攻魔法：** スペルスピード2、既存実装を拡張
- **永続魔法：** スペルスピード1、フィールド残存
- **フィールド魔法：** スペルスピード1、フィールドゾーン専用

### 罠カード
- **通常罠：** スペルスピード2、セットターン制限
- **カウンター罠：** スペルスピード3、特殊チェーンルール
- **永続罠：** スペルスピード2、フィールド残存

### モンスター効果
- **起動効果：** スペルスピード1、メインフェーズのみ
- **誘発効果：** スペルスピード2、条件満了時自動発動
- **誘発即時効果：** スペルスピード2、任意タイミング

## まとめ

本設計により、現在のシステムを壊すことなく、遊戯王のチェーンシステムを段階的かつ完全に実装できます。「長さ1チェーン」アプローチと既存の`EffectQueue`システムの組み合わせにより、保守性と拡張性を両立した堅牢な実装が可能となります。