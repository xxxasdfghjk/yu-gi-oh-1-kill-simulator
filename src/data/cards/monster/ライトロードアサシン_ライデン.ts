import type { LeveledMonsterCard } from "@/types/card";
import { withTurnAtOneceCondition, withTurnAtOneceEffect, withDelayRecursive } from "@/utils/effectUtils";
import { sendCard, addBuf } from "@/utils/cardMovement";

export default {
    card_name: "ライトロード・アサシン ライデン",
    card_type: "モンスター" as const,
    text: "自分のメインフェイズ時に発動できる。 自分のデッキの上からカードを２枚墓地へ送る。 この効果で墓地へ送ったカードの中に「ライトロード」と名のついたモンスターがあった場合、このカードの攻撃力は相手のエンドフェイズ時まで２００ポイントアップする。 「ライトロード・アサシン ライデン」のこの効果は１ターンに１度しか使用できない。 また、自分のエンドフェイズ毎に発動する。 自分のデッキの上からカードを２枚墓地へ送る。",
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
                return withTurnAtOneceCondition(state, card, (state, card) => {
                    return state.deck.length >= 2 && card.location === "MonsterField" && state.phase === "main1";
                }, "LightlordRaiden_Ignition");
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    const sentCards: typeof state.deck = [];
                    
                    withDelayRecursive(
                        state,
                        card,
                        { delay: 100 },
                        2,
                        (state, card, depth) => {
                            if (state.deck.length > 0) {
                                const topCard = state.deck[0];
                                sentCards.push(topCard);
                                sendCard(state, topCard, "Graveyard");
                            }
                        },
                        (state, card) => {
                            // 送ったカードの中にライトロードモンスターがあるかチェック
                            const hasLightlord = sentCards.some(c => 
                                c.card.card_name.includes("ライトロード") && c.card.card_type === "モンスター"
                            );
                            
                            if (hasLightlord) {
                                addBuf(state, card, { attack: 200, defense: 0, level: 0 });
                            }
                        }
                    );
                }, "LightlordRaiden_Ignition");
            }
        },
        onStandbyPhase: (state, card) => {
            if (card.location === "MonsterField" && (card.position === "attack" || card.position === "defense")) {
                // エンドフェイズでデッキの上から2枚墓地に送る効果
                withDelayRecursive(
                    state,
                    card,
                    { delay: 100 },
                    2,
                    (state, card, depth) => {
                        if (state.deck.length > 0) {
                            sendCard(state, state.deck[0], "Graveyard");
                        }
                    }
                );
            }
        }
    },
} satisfies LeveledMonsterCard;
