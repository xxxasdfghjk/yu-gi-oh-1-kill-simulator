import type { LeveledMonsterCard } from "@/types/card";
import { withTurnAtOneceCondition, withTurnAtOneceEffect, withDelayRecursive } from "@/utils/effectUtils";
import { addBuf, sendCardToGraveyardByEffect } from "@/utils/cardMovement";

export default {
    card_name: "ライトロード・アサシン ライデン",
    card_type: "モンスター" as const,
    text: "このカード名の①の効果は１ターンに１度しか使用できない。①：自分メインフェイズに発動できる。自分のデッキの上からカードを２枚墓地へ送る。その中に「ライトロード」モンスターがあった場合、さらにこのカードの攻撃力は相手ターン終了時まで２００アップする。②：自分エンドフェイズに発動する。自分のデッキの上からカードを２枚墓地へ送る。",
    image: "card100161030_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "戦士" as const,
    attack: 1700,
    defense: 1000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    hasTuner: true as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        return state.deck.length >= 2 && card.location === "MonsterField" && state.phase === "main1";
                    },
                    "LightlordRaiden_Ignition"
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        const includeLightLoad =
                            state.deck.slice(0, 2).filter((e) => e.card.card_name.includes("ライトロード")).length > 0;

                        withDelayRecursive(
                            state,
                            card,
                            { delay: 100 },
                            2,
                            (state, card) => {
                                if (state.deck.length > 0) {
                                    const topCard = state.deck[0];
                                    sendCardToGraveyardByEffect(state, topCard, card);
                                }
                            },
                            (state, card) => {
                                if (includeLightLoad) {
                                    addBuf(state, card, { attack: 200, defense: 0, level: 0 });
                                }
                            }
                        );
                    },
                    "LightlordRaiden_Ignition"
                );
            },
        },
    },
} satisfies LeveledMonsterCard;
