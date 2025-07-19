import type { ExtraMonster } from "@/types/card";
import { hasLevelMonsterFilter } from "@/utils/cardManagement";
import { withUserSelectCard, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { CardInstance } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { getLevel } from "@/utils/gameUtils";

// Define extra monsters as literal objects with proper typing

const card = {
    card_name: "永遠の淑女 ベアトリーチェ",
    card_type: "モンスター" as const,
    monster_type: "エクシーズモンスター" as const,
    rank: 6,
    element: "光" as const,
    race: "天使" as const,
    attack: 2500,
    defense: 2800,
    filterAvailableMaterials: (card) => hasLevelMonsterFilter(card.card) && getLevel(card) === 6,
    materialCondition: (card: CardInstance[]) => {
        return !!(card.length === 2 && card.every((e) => hasLevelMonsterFilter(e.card) && getLevel(e) === 6));
    },
    text: "①1ターンに1度、このカードのX素材を1つ取り除いて発動できる。デッキからカード1枚を選んで墓地へ送る。この効果は相手ターンでも発動できる。②このカードが相手によって破壊され墓地へ送られた場合に発動できる。EXデッキから「彼岸」モンスター1体を召喚条件を無視して特殊召喚する。",
    image: "card100330938_1.jpg",
    hasDefense: true as const,
    hasLevel: false as const,
    hasLink: false as const,
    hasRank: true as const,
    canNormalSummon: false,
    effect: {
        onIgnition: {
            condition: (gameState: GameStore, cardInstance: CardInstance) => {
                if (!withTurnAtOneceCondition(gameState, cardInstance, () => true, "永遠の淑女 ベアトリーチェ", true))
                    return false;
                return cardInstance.materials && cardInstance.materials.length > 0 && gameState.deck.length > 0;
            },
            effect: (gameState: GameStore, cardInstance: CardInstance) => {
                withTurnAtOneceEffect(
                    gameState,
                    cardInstance,
                    (state, card) => {
                        withUserSelectCard(
                            state,
                            card,
                            () => card.materials,
                            { select: "single", message: "X素材を1つ選んでください" },
                            (state, card, selected) => {
                                sendCard(state, selected[0], "Graveyard");
                                withUserSelectCard(
                                    state,
                                    card,
                                    (state) => state.deck,
                                    { select: "single", message: "デッキからカードを1枚選んで墓地に送ってください" },
                                    (state, _card, selected) => {
                                        sendCard(state, selected[0], "Graveyard");
                                    }
                                );
                            }
                        );
                    },
                    "永遠の淑女 ベアトリーチェ",
                    true
                );
            },
        },
    },
} satisfies ExtraMonster;

export default card;
