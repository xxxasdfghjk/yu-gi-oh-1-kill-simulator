import type { CardInstance, MonsterCard } from '@/types/card';
import type { GameState } from '@/types/game';

export interface CardEffect {
  cardName: string;
  effectType: 'summon' | 'activate' | 'graveyard' | 'continuous' | 'trigger';
  canActivate: (gameState: GameState, card: CardInstance) => boolean;
  execute: (gameState: GameState, card: CardInstance) => Partial<GameState>;
}

// カード効果の定義
export const cardEffects: CardEffect[] = [
  // ワン・フォー・ワン
  {
    cardName: 'ワン・フォー・ワン',
    effectType: 'activate',
    canActivate: (gameState) => {
      // 手札にモンスターがあり、デッキまたは手札にレベル1モンスターがある
      const hasMonsterInHand = gameState.hand.some(card => 
        'level' in card.card || 'rank' in card.card || 'link' in card.card
      );
      const hasLevel1InDeckOrHand = [...gameState.deck, ...gameState.hand].some(card => {
        const monsterCard = card.card as MonsterCard;
        return monsterCard.level === 1;
      });
      return hasMonsterInHand && hasLevel1InDeckOrHand;
    },
    execute: () => {
      // TODO: 実装
      return {};
    }
  },

  // おろかな埋葬
  {
    cardName: 'おろかな埋葬',
    effectType: 'activate',
    canActivate: (gameState) => gameState.deck.length > 0,
    execute: () => {
      // TODO: 実装
      return {};
    }
  },

  // ジャック・イン・ザ・ハンド
  {
    cardName: 'ジャック・イン・ザ・ハンド',
    effectType: 'activate',
    canActivate: (gameState) => {
      // デッキに3体以上のレベル1モンスターがある
      const level1Monsters = gameState.deck.filter(card => {
        const monsterCard = card.card as MonsterCard;
        return monsterCard.level === 1;
      });
      const uniqueLevel1Names = new Set(level1Monsters.map(c => c.card.card_name));
      return uniqueLevel1Names.size >= 3;
    },
    execute: () => {
      // TODO: 実装
      return {};
    }
  },

  // エマージェンシー・サイバー
  {
    cardName: 'エマージェンシー・サイバー',
    effectType: 'activate',
    canActivate: (gameState) => {
      // デッキに対象となるモンスターがある
      return gameState.deck.some(card => {
        const monsterCard = card.card as MonsterCard;
        return (monsterCard.attribute === '光属性' && monsterCard.race === '機械族' && 
               card.card.card_type === '特殊召喚・効果モンスター') ||
               card.card.card_name.includes('サイバー・ドラゴン');
      });
    },
    execute: () => {
      // TODO: 実装
      return {};
    }
  },

  // クリッター
  {
    cardName: 'クリッター',
    effectType: 'graveyard',
    canActivate: (_gameState, card) => {
      // フィールドから墓地へ送られた場合
      return card.location === 'graveyard';
    },
    execute: () => {
      // TODO: 実装
      return {};
    }
  },

  // 宣告者の神巫
  {
    cardName: '宣告者の神巫',
    effectType: 'summon',
    canActivate: () => true,
    execute: () => {
      // TODO: 実装
      return {};
    }
  },

  // 神聖なる魂
  {
    cardName: '神聖なる魂',
    effectType: 'summon',
    canActivate: (gameState) => {
      // 墓地に光属性モンスターが2体以上いる
      const lightMonsters = gameState.graveyard.filter(card => {
        if (!('level' in card.card || 'rank' in card.card || 'link' in card.card)) return false;
        const monsterCard = card.card as MonsterCard;
        return monsterCard.attribute === '光属性';
      });
      return lightMonsters.length >= 2;
    },
    execute: () => {
      // TODO: 実装 - 墓地から光属性モンスター2体を除外して特殊召喚
      return {};
    }
  },
];

export const getCardEffect = (cardName: string): CardEffect | undefined => {
  return cardEffects.find(effect => effect.cardName === cardName);
};

export const canActivateEffect = (_gameState: GameState, card: CardInstance): boolean => {
  const effect = getCardEffect(card.card.card_name);
  if (!effect) return false;
  return effect.canActivate(_gameState, card);
};