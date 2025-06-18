import type { TrapCard } from "@/types/card";
import { withLifeChange } from "@/utils/effectUtils";
import { isMagicCard } from "@/utils/cardManagement";

export default {
    card_name: "マジカル・エクスプロージョン",
    text: "自分の手札が０枚の時に発動する事ができる。自分の墓地に存在する魔法カードの枚数×２００ポイントダメージを相手ライフに与える。",
    image: "card73707890_1.jpg",
    trap_type: "通常罠" as const,
    card_type: "罠",
    effect: {
        onSpell: {
            condition: (state) => {
                // 手札が0枚の時のみ発動可能
                return state.hand.length === 0;
            },
            effect: (state, card, _, resolve) => {
                // 墓地の魔法カードの枚数を数える
                const magicCardsInGraveyard = state.graveyard.filter(c => isMagicCard(c.card)).length;
                
                // ダメージ計算（魔法カード枚数 × 200）
                const damage = magicCardsInGraveyard * 200;
                
                if (damage > 0) {
                    // 相手にダメージを与える
                    withLifeChange(state, card, {
                        target: "opponent",
                        amount: damage,
                        operation: "decrease"
                    });
                }
                resolve?.(state, card);
            }
        }
    },
} satisfies TrapCard;
