import type { ExtraMonster } from "@/types/card";
import {
    sumLevel,
    monsterFilter,
    isMagicCard,
    isRitualMonster,
} from "@/utils/cardManagement";
import {
    withUserConfirm,
    withUserSelectCard,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { CardInstance } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

// Define extra monsters as literal objects with proper typing

const card = {
        card_name: "虹光の宣告者",
        card_type: "モンスター" as const,
        monster_type: "シンクロモンスター" as const,
        level: 4,
        element: "光" as const,
        race: "天使" as const,
        attack: 600,
        defense: 1000,
        filterAvailableMaterials: () => true,
        materialCondition: (card: CardInstance[]) => {
            return !!(
                sumLevel(card) === 4 &&
                card.find((e) => monsterFilter(e.card) && e.card.hasTuner) &&
                card.find((e) => monsterFilter(e.card) && !e.card.hasTuner)
            );
        },
        text: "チューナー＋チューナー以外のモンスター１体以上\n(1)：このカードがモンスターゾーンに存在する限り、お互いの手札・デッキから墓地へ送られるモンスターは墓地へは行かず除外される。\n(2)：モンスターの効果・魔法・罠カードが発動した時、このカードをリリースして発動できる。その発動を無効にし破壊する。\n(3)：このカードが墓地へ送られた場合に発動できる。デッキから儀式モンスター１体または儀式魔法カード１枚を手札に加える。",
        image: "card100179270_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasLink: false as const,
        hasRank: false as const,
        canNormalSummon: false,
        effect: {
            onIgnition: {
                condition: (gameState: GameStore, cardInstance: CardInstance) => {
                    return (
                        cardInstance.location === "MonsterField" &&
                        gameState.effectQueue.some(
                            (effect) =>
                                effect.effectType?.includes("monster") ||
                                effect.effectType?.includes("magic") ||
                                effect.effectType?.includes("trap")
                        )
                    );
                },
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    withUserConfirm(
                        gameState,
                        cardInstance,
                        { message: "発動を無効にし破壊しますか？" },
                        (state, card) => {
                            sendCard(state, card, "Graveyard");
                        }
                    );
                },
            },
            onAnywhereToGraveyard: (gameState: GameStore, cardInstance: CardInstance) => {
                const ritualCards = (gameState: GameStore) =>
                    gameState.deck.filter((card) => {
                        if (isMagicCard(card.card) && card.card.magic_type === "儀式魔法") return true;
                        if (isRitualMonster(card.card)) {
                            return true;
                        }
                        return false;
                    });

                if (ritualCards(gameState).length === 0) return;

                withUserSelectCard(
                    gameState,
                    cardInstance,
                    ritualCards,
                    { select: "single", message: "デッキから儀式モンスターまたは儀式魔法カードを1枚選んでください" },
                    (gameState, _card, selected) => {
                        sendCard(gameState, selected[0], "Hand");
                    }
                );
            },
        },
    } satisfies ExtraMonster;

export default card;
