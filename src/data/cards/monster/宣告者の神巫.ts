import type { GameStore } from "@/store/gameStore";
import type { CardInstance, LeveledMonsterCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { sendCard, addBuf } from "@/utils/cardMovement";
import { withUserSelectCard } from "@/utils/effectUtils";

export default {
    card_name: "宣告者の神巫",
    card_type: "モンスター" as const,
    monster_type: "効果モンスター" as const,
    level: 2,
    element: "光" as const,
    race: "天使" as const,
    attack: 500,
    defense: 300,
    text: "このカード名の(1)(2)の効果はそれぞれ１ターンに１度しか使用できない。\n(1)：このカードが召喚・特殊召喚に成功した場合に発動できる。デッキ・ＥＸデッキから天使族モンスター１体を墓地へ送る。このカードのレベルはターン終了時まで、そのモンスターのレベル分だけ上がる。(2)：このカードがリリースされた場合に発動できる。手札・デッキから「宣告者の神巫」以外のレベル２以下の天使族モンスター１体を特殊召喚する。",
    image: "card100186167_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true,
    effect: {
        onSummon: (gameState: GameStore, cardInstance: CardInstance) => {
            // Search for a ritual monster
            const ritualMonsters = (state: GameStore) => {
                return [...state.extraDeck, ...state.deck].filter(
                    (card) => monsterFilter(card.card) && card.card.race === "天使"
                );
            };

            if (ritualMonsters(gameState).length > 0) {
                withUserSelectCard(
                    gameState,
                    cardInstance,
                    ritualMonsters,
                    { select: "single", message: "墓地に送る天使族モンスターを選択してください" },
                    (state, card, selected) => {
                        const targetCard = selected[0].card as LeveledMonsterCard;
                        sendCard(state, selected[0], "Graveyard");
                        addBuf(state, card, { attack: 0, defense: 0, level: targetCard.level });
                    }
                );
            }
        },
    },
};
