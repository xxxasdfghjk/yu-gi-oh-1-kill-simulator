import type { LeveledMonsterCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { withLifeChange, withUserSelectCard, withUserSummon } from "@/utils/effectUtils";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "魔導サイエンティスト",
    card_type: "モンスター" as const,
    text: "１０００ライフポイントを払う事で、融合デッキからレベル６以下の融合モンスター１体を特殊召喚する。この融合モンスターは相手プレイヤーに直接攻撃する事はできず、ターン終了時に融合デッキに戻る。",
    image: "card100011996_1.jpg",
    monster_type: "効果モンスター",
    level: 1,
    element: "闇" as const,
    race: "魔法使い" as const,
    attack: 300,
    defense: 300,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                // Check if this card is on the field and in face-up position
                if (card.location !== "MonsterField") return false;
                if (card.position !== "attack" && card.position !== "defense") return false;

                // Check if player has at least 1000 life points
                if (state.lifePoints <= 1000) return false;

                // Check if there are level 6 or lower fusion monsters in extra deck
                const fusionMonsters = new CardSelector(state).extraDeck().filter().fusionMonster().underLevel(6).get();

                return fusionMonsters.length > 0 && hasEmptyMonsterZone(state);
            },
            effect: (state, card) => {
                if (!hasEmptyMonsterZone(state)) {
                    return;
                }
                // Select a level 6 or lower fusion monster from extra deck
                withUserSelectCard(
                    state,
                    card,
                    (state) => {
                        return new CardSelector(state).extraDeck().filter().fusionMonster().underLevel(6).get();
                    },
                    {
                        select: "single",
                        canCancel: true,
                        message: "レベル6以下の融合モンスターを選択",
                    },
                    (state, card, selected) => {
                        const fusionMonster = selected[0];
                        withLifeChange(
                            state,
                            card,
                            {
                                target: "player",
                                amount: 1000,
                                operation: "decrease",
                            },
                            (state, card) => {
                                withUserSummon(
                                    state,
                                    card,
                                    fusionMonster,
                                    {
                                        canSelectPosition: true,
                                        optionPosition: ["attack", "defense"],
                                    },
                                    () => {}
                                );
                            }
                        );
                    }
                );
            },
        },
    },
} satisfies LeveledMonsterCard;
