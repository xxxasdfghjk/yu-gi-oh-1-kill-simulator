import { withDelayRecursive } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { XyzMonsterCard } from "@/types/card";

export default {
    card_name: "No.60 刻不知のデュガレス",
    card_type: "モンスター" as const,
    text: "レベル４モンスター×２ このカード名の効果は１ターンに１度しか使用できない。①：このカードのX素材を２つ取り除き、以下の効果から１つを選択して発動できる。 ●自分はデッキから２枚ドローし、その後手札を１枚選んで捨てる。次の自分ドローフェイズをスキップする。 ●自分の墓地からモンスター１体を選んで守備表示で特殊召喚する。次の自分メインフェイズ１をスキップする。 ●自分フィールドのモンスター１体を選び、その攻撃力をターン終了時まで倍にする。次の自分ターンのバトルフェイズをスキップする。",
    image: "card100322907_1.jpg",
    monster_type: "エクシーズモンスター",
    rank: 4,
    element: "炎" as const,
    race: "悪魔" as const,
    attack: 1200,
    defense: 1200,
    hasDefense: true as const,
    hasLevel: false as const,
    hasRank: true as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onSummon: (state, card) => {
            // デッキの上から2枚墓地に送る
            withDelayRecursive(state, card, { delay: 100 }, 2, (state, card, depth) => {
                if (state.deck.length > 0) {
                    sendCard(state, state.deck[0], "Graveyard");
                }
            });
        },
        onIgnition: {
            condition: (state, card) => {
                return card.materials.length > 0;
            },
            effect: (state, card) => {
                // X素材を1つ取り除く
                if (card.materials.length > 0) {
                    const material = card.materials[0];
                    card.materials = card.materials.slice(1);
                    sendCard(state, material, "Graveyard");

                    // 相手フィールドのカードを破壊（省略 - 相手フィールド情報が不完全）
                    // 実装時は相手フィールドから選択して破壊処理
                }
            },
        },
    },
} satisfies XyzMonsterCard;
