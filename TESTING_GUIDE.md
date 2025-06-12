# Yu-Gi-Oh! ゲーム 単体テストガイド

## 概要

このガイドでは、Yu-Gi-Oh!ゲームのコードベースに対する包括的な単体テスト戦略を説明します。現在テストが存在しない状態から、段階的にテストカバレッジを向上させるアプローチを提示します。

## 目次

1. [テスト環境のセットアップ](#テスト環境のセットアップ)
2. [テスト戦略と優先度](#テスト戦略と優先度)
3. [具体的なテスト実装例](#具体的なテスト実装例)
4. [実装計画](#実装計画)
5. [ベストプラクティス](#ベストプラクティス)

---

## テスト環境のセットアップ

### 推奨テストフレームワーク: Vitest + React Testing Library

**選択理由:**
- Viteとの完璧な統合（設定不要）
- Jest互換のAPIで高速動作
- TypeScriptネイティブサポート
- Zustandストアとの相性が良い

### 依存関係の追加

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "vitest": "^1.0.4",
    "jsdom": "^23.0.1",
    "@vitest/ui": "^1.0.4",
    "@vitest/coverage-v8": "^1.0.4"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 設定ファイル

#### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'

// グローバルなモック設定
beforeEach(() => {
  // 各テスト前にグローバル状態をリセット
  vi.clearAllMocks()
})

// Math.randomのモック（シャッフル処理のテスト用）
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn(() => new Uint32Array(10))
  }
})
```

---

## テスト戦略と優先度

### Tier 1: コアゲームロジック（最優先）

#### 1. ゲームユーティリティ (`src/utils/gameUtils.ts`)

**重要な関数:**
- `createCardInstance()` - カード インスタンス生成
- `shuffleDeck()` - デッキシャッフル
- `drawCards()` - ドロー処理
- `checkExodiaWin()` - 勝利条件判定
- `canLinkSummonByMaterials()` - リンク召喚ルール
- 型ガード関数群

**テスト例:**
```typescript
// src/utils/__tests__/gameUtils.test.ts
import { describe, it, expect, vi } from 'vitest'
import { 
  createCardInstance, 
  checkExodiaWin, 
  shuffleDeck,
  drawCards,
  isMonsterCard 
} from '../gameUtils'
import type { Card, CardInstance } from '@/types/card'

describe('gameUtils', () => {
  // モックカードデータ
  const mockMonsterCard: Card = {
    id: '1',
    card_name: 'テストモンスター',
    card_type: '通常モンスター',
    text: 'テスト用のモンスターです',
    limit_status: '',
    errata: '',
    quantity: 1,
    level: 4,
    attribute: '光属性',
    race: '戦士族',
    attack: 1800,
    defense: 1200
  }

  describe('createCardInstance', () => {
    it('正しいデフォルト値でカードインスタンスを作成する', () => {
      const instance = createCardInstance(mockMonsterCard, 'hand')
      
      expect(instance.card).toBe(mockMonsterCard)
      expect(instance.location).toBe('hand')
      expect(instance.materials).toEqual([])
      expect(instance.buf).toEqual({ attack: 0, defense: 0, level: 0 })
      expect(instance.id).toBeDefined()
      expect(instance.id).toMatch(/^[a-f0-9-]+$/) // UUID形式
    })

    it('位置を正しく設定する', () => {
      const instance = createCardInstance(mockMonsterCard, 'field')
      expect(instance.location).toBe('field')
    })
  })

  describe('checkExodiaWin', () => {
    it('全てのエクゾディアパーツが手札にある場合trueを返す', () => {
      const exodiaHand: CardInstance[] = [
        createCardInstance({ card_name: '封印されしエクゾディア' } as Card, 'hand'),
        createCardInstance({ card_name: '封印されし者の右腕' } as Card, 'hand'),
        createCardInstance({ card_name: '封印されし者の左腕' } as Card, 'hand'),
        createCardInstance({ card_name: '封印されし者の右足' } as Card, 'hand'),
        createCardInstance({ card_name: '封印されし者の左足' } as Card, 'hand'),
      ]

      expect(checkExodiaWin(exodiaHand)).toBe(true)
    })

    it('エクゾディアパーツが不足している場合false を返す', () => {
      const incompleteHand: CardInstance[] = [
        createCardInstance({ card_name: '封印されしエクゾディア' } as Card, 'hand'),
        createCardInstance({ card_name: '封印されし者の右腕' } as Card, 'hand'),
        createCardInstance({ card_name: '青眼の白龍' } as Card, 'hand'),
      ]

      expect(checkExodiaWin(incompleteHand)).toBe(false)
    })

    it('空の手札の場合false を返す', () => {
      expect(checkExodiaWin([])).toBe(false)
    })
  })

  describe('shuffleDeck', () => {
    it('デッキの要素数が変わらない', () => {
      const originalDeck = [
        createCardInstance({ card_name: 'カード1' } as Card, 'deck'),
        createCardInstance({ card_name: 'カード2' } as Card, 'deck'),
        createCardInstance({ card_name: 'カード3' } as Card, 'deck'),
      ]
      const deckCopy = [...originalDeck]
      
      const shuffled = shuffleDeck(deckCopy)
      
      expect(shuffled).toHaveLength(originalDeck.length)
      expect(shuffled).toEqual(expect.arrayContaining(originalDeck))
    })

    it('空のデッキでもエラーが発生しない', () => {
      expect(() => shuffleDeck([])).not.toThrow()
      expect(shuffleDeck([])).toEqual([])
    })
  })

  describe('isMonsterCard', () => {
    it('モンスターカードの場合true を返す', () => {
      expect(isMonsterCard(mockMonsterCard)).toBe(true)
    })

    it('魔法カードの場合false を返す', () => {
      const spellCard = { ...mockMonsterCard, card_type: '通常魔法' }
      expect(isMonsterCard(spellCard)).toBe(false)
    })

    it('罠カードの場合false を返す', () => {
      const trapCard = { ...mockMonsterCard, card_type: '通常罠' }
      expect(isMonsterCard(trapCard)).toBe(false)
    })
  })
})
```

#### 2. 召喚ユーティリティ (`src/utils/summonUtils.ts`)

**重要な関数:**
- `canNormalSummon()` - 通常召喚可能判定
- `canActivateSpell()` - 魔法発動可能判定
- カード固有の発動条件関数群

**テスト例:**
```typescript
// src/utils/__tests__/summonUtils.test.ts
import { describe, it, expect } from 'vitest'
import { canNormalSummon, canActivateSpell, canActivateHokyuYoin } from '../summonUtils'
import { createCardInstance } from '../gameUtils'
import type { GameState } from '@/types/game'
import type { Card } from '@/types/card'

describe('summonUtils', () => {
  // モックゲーム状態を作成するヘルパー
  const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
    turn: 1,
    phase: 'main1',
    lifePoints: 8000,
    deck: [],
    hand: [],
    field: {
      monsterZones: Array(5).fill(null),
      spellTrapZones: Array(5).fill(null),
      fieldZone: null,
      extraMonsterZones: [null, null],
    },
    opponentField: {
      monsterZones: Array(5).fill(null),
      spellTrapZones: Array(5).fill(null),
      fieldZone: null,
    },
    graveyard: [],
    banished: [],
    extraDeck: [],
    hasNormalSummoned: false,
    hasSpecialSummoned: false,
    hasDrawnByEffect: false,
    effectQueue: [],
    gameOver: false,
    winner: null,
    ...overrides
  })

  describe('canNormalSummon', () => {
    it('メインフェーズでレベル4モンスターを通常召喚できる', () => {
      const gameState = createMockGameState()
      const level4Monster = createCardInstance({
        card_type: '通常モンスター',
        level: 4,
        attack: 1800,
        defense: 1200
      } as Card, 'hand')

      expect(canNormalSummon(gameState, level4Monster)).toBe(true)
    })

    it('既に通常召喚済みの場合は通常召喚できない', () => {
      const gameState = createMockGameState({ hasNormalSummoned: true })
      const level4Monster = createCardInstance({
        card_type: '通常モンスター',
        level: 4
      } as Card, 'hand')

      expect(canNormalSummon(gameState, level4Monster)).toBe(false)
    })

    it('バトルフェーズ中は通常召喚できない', () => {
      const gameState = createMockGameState({ phase: 'battle' })
      const level4Monster = createCardInstance({
        card_type: '通常モンスター',
        level: 4
      } as Card, 'hand')

      expect(canNormalSummon(gameState, level4Monster)).toBe(false)
    })

    it('モンスターゾーンが満杯の場合は通常召喚できない', () => {
      const fullMonsterZones = Array(5).fill(createCardInstance({
        card_type: '通常モンスター',
        level: 4
      } as Card, 'field'))
      
      const gameState = createMockGameState({
        field: {
          ...createMockGameState().field,
          monsterZones: fullMonsterZones
        }
      })
      
      const monster = createCardInstance({
        card_type: '通常モンスター',
        level: 4
      } as Card, 'hand')

      expect(canNormalSummon(gameState, monster)).toBe(false)
    })
  })

  describe('canActivateHokyuYoin', () => {
    it('墓地に攻撃力1500以下の通常モンスターがある場合発動可能', () => {
      const weakMonster = createCardInstance({
        card_type: '通常モンスター',
        attack: 1000,
        level: 3
      } as Card, 'graveyard')
      
      const gameState = createMockGameState({
        graveyard: [weakMonster]
      })

      expect(canActivateHokyuYoin(gameState)).toBe(true)
    })

    it('墓地にモンスターがない場合発動不可', () => {
      const gameState = createMockGameState()
      expect(canActivateHokyuYoin(gameState)).toBe(false)
    })
  })
})
```

### Tier 2: ゲームストア (`src/store/gameStore.ts`)

**重要な機能:**
- ゲーム初期化
- カード実行処理
- エフェクトキュー処理
- フェーズ管理

**テスト例:**
```typescript
// src/store/__tests__/gameStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    // 各テスト前にストア状態をリセット
    const store = useGameStore.getState()
    store.initializeGame()
  })

  describe('initializeGame', () => {
    it('正しい初期状態で開始する', () => {
      const store = useGameStore.getState()
      
      expect(store.turn).toBe(1)
      expect(store.phase).toBe('main1')
      expect(store.lifePoints).toBe(8000)
      expect(store.hand).toHaveLength(5)
      expect(store.hasNormalSummoned).toBe(false)
      expect(store.field.monsterZones).toHaveLength(5)
      expect(store.field.spellTrapZones).toHaveLength(5)
      expect(store.effectQueue).toEqual([])
    })

    it('デッキが正しくシャッフルされている', () => {
      const store = useGameStore.getState()
      
      // デッキがカードで満たされている
      expect(store.deck.length).toBeGreaterThan(30)
      
      // 各カードに一意のIDが付与されている
      const cardIds = store.deck.map(card => card.id)
      const uniqueIds = new Set(cardIds)
      expect(uniqueIds.size).toBe(cardIds.length)
    })
  })

  describe('drawCard', () => {
    it('指定した枚数のカードをデッキから手札に移動する', () => {
      const store = useGameStore.getState()
      const initialHandSize = store.hand.length
      const initialDeckSize = store.deck.length

      store.drawCard(2)

      expect(store.hand).toHaveLength(initialHandSize + 2)
      expect(store.deck).toHaveLength(initialDeckSize - 2)
    })

    it('デッキが空の場合エラーを発生させない', () => {
      const store = useGameStore.getState()
      
      // デッキを空にする
      store.deck = []
      
      expect(() => store.drawCard(1)).not.toThrow()
    })
  })

  describe('nextPhase', () => {
    it('フェーズが正しく進行する', () => {
      const store = useGameStore.getState()
      
      expect(store.phase).toBe('main1')
      
      store.nextPhase()
      expect(store.phase).toBe('battle')
      
      store.nextPhase()
      expect(store.phase).toBe('main2')
      
      store.nextPhase()
      expect(store.phase).toBe('end')
    })
  })

  describe('playCard', () => {
    it('モンスターカードを手札から選択すると召喚モードになる', () => {
      const store = useGameStore.getState()
      
      // 手札にモンスターカードがあることを確認
      const monsterCard = store.hand.find(card => 
        'level' in card.card || 'rank' in card.card || 'link' in card.card
      )
      
      if (monsterCard) {
        store.playCard(monsterCard.id)
        
        // エフェクトキューに召喚効果が追加されることを確認
        expect(store.effectQueue).toHaveLength(1)
        expect(store.effectQueue[0].type).toBe('summon')
      }
    })
  })
})
```

### Tier 3: カード効果処理

**抽象化前の個別テスト例:**
```typescript
// src/utils/__tests__/cardEffects.test.ts
import { describe, it, expect } from 'vitest'
import { cardEffects, getCardEffect, canActivateEffect } from '../cardEffects'
import { createCardInstance } from '../gameUtils'
import type { GameState } from '@/types/game'
import type { Card } from '@/types/card'

describe('cardEffects', () => {
  const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
    // ... 基本的なゲーム状態
    graveyard: [],
    deck: [],
    hand: [],
    ...overrides
  })

  describe('getCardEffect', () => {
    it('存在するカード名で効果を取得できる', () => {
      const effect = getCardEffect('ワン・フォー・ワン')
      expect(effect).toBeDefined()
      expect(effect?.cardName).toBe('ワン・フォー・ワン')
      expect(effect?.effectType).toBe('activate')
    })

    it('存在しないカード名の場合undefined を返す', () => {
      const effect = getCardEffect('存在しないカード')
      expect(effect).toBeUndefined()
    })
  })

  describe('神聖なる魂', () => {
    it('墓地に光属性モンスターが2体以上ある場合発動可能', () => {
      const lightMonster1 = createCardInstance({
        card_type: '通常モンスター',
        attribute: '光属性',
        race: '天使族'
      } as Card, 'graveyard')
      
      const lightMonster2 = createCardInstance({
        card_type: '効果モンスター',
        attribute: '光属性',
        race: '戦士族'
      } as Card, 'graveyard')

      const gameState = createMockGameState({
        graveyard: [lightMonster1, lightMonster2]
      })

      const sacredSoul = createCardInstance({
        card_name: '神聖なる魂'
      } as Card, 'hand')

      expect(canActivateEffect(gameState, sacredSoul)).toBe(true)
    })

    it('墓地の光属性モンスターが1体以下の場合発動不可', () => {
      const lightMonster = createCardInstance({
        card_type: '通常モンスター',
        attribute: '光属性'
      } as Card, 'graveyard')

      const gameState = createMockGameState({
        graveyard: [lightMonster]
      })

      const sacredSoul = createCardInstance({
        card_name: '神聖なる魂'
      } as Card, 'hand')

      expect(canActivateEffect(gameState, sacredSoul)).toBe(false)
    })
  })
})
```

---

## 抽象化後のテスト例

**抽象化されたシステムのテスト:**
```typescript
// src/utils/__tests__/effectProcessor.test.ts (抽象化後)
import { describe, it, expect } from 'vitest'
import { EffectProcessor } from '../effectProcessor'
import { CardFilters } from '../effectFilters'
import { createCardInstance } from '../gameUtils'

describe('EffectProcessor', () => {
  describe('createEffect', () => {
    it('検索効果を正しく作成する', () => {
      const fafnir = createCardInstance({
        card_name: '竜輝巧－ファフニール'
      } as any, 'hand')

      const effect = EffectProcessor.createEffect('竜輝巧－ファフニール', fafnir)
      
      expect(effect).toBeDefined()
      expect(effect?.type).toBe('select')
      expect(effect?.effectType).toBe('search_deck_to_hand')
      expect(effect?.effectName).toContain('竜輝巧－ファフニール')
    })

    it('未定義のカードの場合null を返す', () => {
      const unknownCard = createCardInstance({
        card_name: '未知のカード'
      } as any, 'hand')

      const effect = EffectProcessor.createEffect('未知のカード', unknownCard)
      
      expect(effect).toBeNull()
    })
  })
})

// src/utils/__tests__/effectFilters.test.ts
describe('CardFilters', () => {
  describe('byAttribute', () => {
    it('指定した属性のモンスターをフィルタする', () => {
      const lightMonster = createCardInstance({
        card_type: '通常モンスター',
        attribute: '光属性'
      } as any, 'graveyard')
      
      const darkMonster = createCardInstance({
        card_type: '通常モンスター',
        attribute: '闇属性'
      } as any, 'graveyard')

      const filter = CardFilters.byAttribute('光属性')
      
      expect(filter(lightMonster)).toBe(true)
      expect(filter(darkMonster)).toBe(false)
    })
  })

  describe('combine', () => {
    it('複数のフィルターを組み合わせる', () => {
      const targetCard = createCardInstance({
        card_type: '通常モンスター',
        attribute: '光属性',
        race: '天使族'
      } as any, 'graveyard')
      
      const wrongAttribute = createCardInstance({
        card_type: '通常モンスター',
        attribute: '闇属性',
        race: '天使族'
      } as any, 'graveyard')

      const combinedFilter = CardFilters.combine(
        CardFilters.byAttribute('光属性'),
        CardFilters.byRace('天使族')
      )
      
      expect(combinedFilter(targetCard)).toBe(true)
      expect(combinedFilter(wrongAttribute)).toBe(false)
    })
  })
})
```

---

## テストユーティリティとモック

### テストヘルパー関数

```typescript
// src/test/utils/testHelpers.ts
import { createCardInstance } from '@/utils/gameUtils'
import type { Card, CardInstance, MonsterCard } from '@/types/card'
import type { GameState } from '@/types/game'

export class TestCardFactory {
  static createMonster(overrides: Partial<MonsterCard> = {}): Card {
    return {
      id: Math.random().toString(),
      card_name: 'テストモンスター',
      card_type: '通常モンスター',
      text: 'テスト用',
      limit_status: '',
      errata: '',
      quantity: 1,
      level: 4,
      attribute: '光属性',
      race: '戦士族',
      attack: 1800,
      defense: 1200,
      ...overrides
    }
  }

  static createSpell(overrides: Partial<Card> = {}): Card {
    return {
      id: Math.random().toString(),
      card_name: 'テスト魔法',
      card_type: '通常魔法',
      text: 'テスト用魔法',
      limit_status: '',
      errata: '',
      quantity: 1,
      ...overrides
    }
  }

  static createDeck(count: number = 40): CardInstance[] {
    return Array.from({ length: count }, (_, i) => 
      createCardInstance(this.createMonster({ card_name: `カード${i}` }), 'deck')
    )
  }
}

export class TestGameStateFactory {
  static createBasicState(overrides: Partial<GameState> = {}): GameState {
    return {
      turn: 1,
      phase: 'main1',
      lifePoints: 8000,
      deck: TestCardFactory.createDeck(35),
      hand: Array.from({ length: 5 }, (_, i) => 
        createCardInstance(TestCardFactory.createMonster({ card_name: `手札${i}` }), 'hand')
      ),
      field: {
        monsterZones: Array(5).fill(null),
        spellTrapZones: Array(5).fill(null),
        fieldZone: null,
        extraMonsterZones: [null, null],
      },
      opponentField: {
        monsterZones: Array(5).fill(null),
        spellTrapZones: Array(5).fill(null),
        fieldZone: null,
      },
      graveyard: [],
      banished: [],
      extraDeck: [],
      hasNormalSummoned: false,
      hasSpecialSummoned: false,
      hasDrawnByEffect: false,
      effectQueue: [],
      gameOver: false,
      winner: null,
      ...overrides
    }
  }

  static withGraveyardMonsters(count: number, attribute = '光属性'): GameState {
    const graveyard = Array.from({ length: count }, (_, i) =>
      createCardInstance(
        TestCardFactory.createMonster({ 
          card_name: `墓地モンスター${i}`,
          attribute 
        }), 
        'graveyard'
      )
    )
    
    return this.createBasicState({ graveyard })
  }
}

export class TestAssertions {
  static expectCardInLocation(cards: CardInstance[], cardName: string, location: string) {
    const card = cards.find(c => c.card.card_name === cardName)
    expect(card).toBeDefined()
    expect(card?.location).toBe(location)
  }

  static expectEffectInQueue(effectQueue: any[], effectType: string) {
    const effect = effectQueue.find(e => e.effectType === effectType)
    expect(effect).toBeDefined()
  }
}
```

---

## 実装計画

### フェーズ1: 基盤構築（1-2週間）

#### 目標
テスト環境のセットアップと基本的なユーティリティ関数のテスト

#### タスク
1. **環境設定**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
   ```

2. **設定ファイル作成**
   - `vitest.config.ts`
   - `src/test/setup.ts`

3. **基本テスト実装**
   - `gameUtils.test.ts`
   - `summonUtils.test.ts`

4. **テストヘルパー作成**
   - `testHelpers.ts`

#### 成果物
- 基本的なテスト環境
- 20-30の基本テストケース
- テストカバレッジ30-40%

### フェーズ2: コアロジックテスト（2-3週間）

#### 目標
ゲームストアと重要なゲームロジックのテスト

#### タスク
1. **ゲームストアテスト**
   - 初期化処理
   - 基本的な状態変更
   - カード実行処理

2. **エフェクト処理テスト**
   - 個別カード効果
   - エフェクトキュー処理

3. **エラーケーステスト**
   - 不正な操作への対応
   - 境界値テスト

#### 成果物
- 包括的なゲームロジックテスト
- エラーケースの網羅
- テストカバレッジ60-70%

### フェーズ3: UIコンポーネントテスト（1-2週間）

#### 目標
重要なReactコンポーネントのテスト

#### タスク
1. **コンポーネントテスト**
   ```typescript
   // src/components/__tests__/GameBoardNew.test.tsx
   import { render, screen } from '@testing-library/react'
   import userEvent from '@testing-library/user-event'
   import { GameBoardNew } from '../GameBoardNew'

   describe('GameBoardNew', () => {
     it('ゲームボードが正しく表示される', () => {
       render(<GameBoardNew />)
       
       expect(screen.getByText('ライフポイント')).toBeInTheDocument()
       expect(screen.getByText('フェーズ')).toBeInTheDocument()
     })
   })
   ```

2. **ユーザーインタラクション**
   - カードクリック
   - ボタン操作
   - モーダル表示

#### 成果物
- UIコンポーネントテスト
- ユーザーインタラクションテスト
- テストカバレッジ80%+

### フェーズ4: 統合テストと最適化（1週間）

#### 目標
統合テストの実装とパフォーマンス最適化

#### タスク
1. **統合テスト**
   ```typescript
   describe('Game Integration', () => {
     it('完全なゲームフローが動作する', () => {
       // ゲーム開始からカード効果発動まで
     })
   })
   ```

2. **パフォーマンステスト**
   - 大量のカード処理
   - 複雑なエフェクトチェーン

#### 成果物
- 統合テストスイート
- パフォーマンステスト
- 最終的なテストカバレッジレポート

---

## ベストプラクティス

### 1. テスト設計の原則

#### AAA パターン
```typescript
it('should do something', () => {
  // Arrange: テストデータの準備
  const gameState = TestGameStateFactory.createBasicState()
  
  // Act: 実行する処理
  const result = someFunction(gameState)
  
  // Assert: 結果の検証
  expect(result).toBe(expectedValue)
})
```

#### 単一責任の原則
```typescript
// ❌ 悪い例: 複数のことをテストしている
it('should handle card effects and update game state', () => {
  // カード効果のテストとゲーム状態更新のテストが混在
})

// ✅ 良い例: 単一の責任をテスト
it('should activate card effect when conditions are met', () => {
  // カード効果の発動のみをテスト
})

it('should update game state after card effect', () => {
  // ゲーム状態更新のみをテスト
})
```

### 2. モックとスタブの使用

#### 外部依存性のモック
```typescript
import { vi } from 'vitest'

// Math.random のモック
vi.spyOn(Math, 'random').mockReturnValue(0.5)

// 時間依存処理のモック
vi.useFakeTimers()
```

#### ストアのモック
```typescript
// Zustandストアのモック
const mockGameStore = {
  initializeGame: vi.fn(),
  drawCard: vi.fn(),
  playCard: vi.fn(),
}

vi.mock('../gameStore', () => ({
  useGameStore: () => mockGameStore
}))
```

### 3. テストデータの管理

#### テストデータの分離
```typescript
// src/test/fixtures/cards.ts
export const MOCK_CARDS = {
  BLUE_EYES: {
    card_name: '青眼の白龍',
    card_type: '通常モンスター',
    attack: 3000,
    defense: 2500,
    level: 8,
    attribute: '光属性',
    race: 'ドラゴン族'
  },
  // ...
}
```

#### データビルダーパターン
```typescript
class GameStateBuilder {
  private state: Partial<GameState> = {}

  withPhase(phase: GamePhase): this {
    this.state.phase = phase
    return this
  }

  withHand(cards: CardInstance[]): this {
    this.state.hand = cards
    return this
  }

  build(): GameState {
    return { ...defaultGameState, ...this.state }
  }
}

// 使用例
const gameState = new GameStateBuilder()
  .withPhase('main1')
  .withHand([blueEyes, darkMagician])
  .build()
```

### 4. エラーテストの書き方

```typescript
describe('error handling', () => {
  it('should throw error for invalid card', () => {
    expect(() => {
      playInvalidCard()
    }).toThrowError('Invalid card')
  })

  it('should handle empty deck gracefully', () => {
    const emptyDeckState = createGameState({ deck: [] })
    
    expect(() => drawCard(emptyDeckState)).not.toThrow()
    expect(emptyDeckState.hand).toHaveLength(5) // 変化なし
  })
})
```

### 5. 非同期処理のテスト

```typescript
describe('async effects', () => {
  it('should process effect queue asynchronously', async () => {
    const store = useGameStore.getState()
    
    store.addEffectToQueue(someEffect)
    
    // 非同期処理の完了を待つ
    await vi.waitFor(() => {
      expect(store.effectQueue).toHaveLength(0)
    })
  })
})
```

---

このテストガイドに従って段階的にテストを実装することで、Yu-Gi-Oh!ゲームの品質と保守性を大幅に向上させることができます。特に複雑なカード効果処理やゲーム状態管理において、テストの価値は非常に高くなります。