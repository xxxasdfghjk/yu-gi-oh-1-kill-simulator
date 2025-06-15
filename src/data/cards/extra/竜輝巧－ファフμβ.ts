import type { ExtraMonster } from "@/types/card";
import {
    hasLevelMonsterFilter,
} from "@/utils/cardManagement";
import {
    withUserSelectCard,
    withTurnAtOneceEffect,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { CardInstance } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { getLevel } from "@/utils/gameUtils";

// Define extra monsters as literal objects with proper typing

const card = {
        card_name: "竜輝巧－ファフμβ'",
        card_type: "モンスター" as const,
        monster_type: "エクシーズモンスター" as const,
        rank: 1,
        element: "光" as const,
        race: "機械" as const,
        attack: 2000,
        defense: 0,
        filterAvailableMaterials: (card) => hasLevelMonsterFilter(card.card) && getLevel(card) === 1,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length >= 2 && card.every((e) => hasLevelMonsterFilter(e.card) && getLevel(e) === 1));
        },
        text: "レベル１モンスター×２体以上\nこのカード名の①③の効果はそれぞれ１ターンに１度しか使用できない。\n①：このカードがX召喚した場合に発動できる。デッキから「ドライトロン」カード１枚を墓地へ送る。\n②：自分が儀式召喚を行う場合、そのリリースするモンスターを、このカードのX素材から取り除く事もできる。\n③：自分フィールドに機械族の儀式モンスターが存在し、相手が魔法・罠カードを発動した時、このカードのX素材を１つ取り除いて発動できる。その発動を無効にし破壊する。",
        image: "card100221516_1.jpg",
        hasDefense: true as const,
        hasLevel: false as const,
        hasLink: false as const,
        hasRank: true as const,
        canNormalSummon: false,
        effect: {
            onSummon: (gameState: GameStore, cardInstance: CardInstance) => {
                const draitronCards = (gameState: GameStore) =>
                    gameState.deck.filter((card) => {
                        return card.card.card_name.includes("竜輝巧");
                    });

                if (draitronCards(gameState).length === 0) return;
                withTurnAtOneceEffect(
                    gameState,
                    cardInstance,
                    (state, card) => {
                        withUserSelectCard(
                            state,
                            card,
                            (gameState: GameStore) =>
                                gameState.deck.filter((card) => {
                                    return card.card.card_name.includes("竜輝巧");
                                }),
                            { select: "single", message: "デッキから竜輝巧カードを1枚選んで墓地に送ってください" },
                            (selectState, _card, selected) => {
                                sendCard(selectState, selected[0], "Graveyard");
                            }
                        );
                    },
                    "ファフμβ'_effect1"
                );
            },
        },
        canUseMaterilForRitualSummon: true,
    } satisfies ExtraMonster;

export default card;
