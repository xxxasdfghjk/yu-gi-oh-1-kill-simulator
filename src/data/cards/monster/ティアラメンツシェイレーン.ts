import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withUserSummon, withDelayRecursive, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "ティアラメンツ・シェイレーン",
    card_type: "モンスター" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。 ①：自分メインフェイズに発動できる。 このカードを手札から特殊召喚し、自分の手札からモンスター１体を選んで墓地へ送る。 その後、自分のデッキの上からカードを３枚墓地へ送る。 ②：このカードが効果で墓地へ送られた場合に発動できる。 融合モンスターカードによって決められた、墓地のこのカードを含む融合素材モンスターを自分の手札・フィールド・墓地から好きな順番で持ち主のデッキの下に戻し、その融合モンスター１体をＥＸデッキから融合召喚する。",
    image: "card100260390_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "闇" as const,
    race: "水族" as const,
    attack: 1800,
    defense: 1300,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(state, card, (state, card) => {
                    const handMonsters = new CardSelector(state).hand().filter().monster().get()
                        .filter(c => c.id !== card.id);
                    return handMonsters.length > 0 && card.location === "Hand" && state.phase === "main1";
                }, "TearlamentScheiren_HandEffect");
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    // 手札から特殊召喚
                    withUserSummon(
                        state,
                        card,
                        card,
                        {
                            canSelectPosition: true,
                            optionPosition: ["attack", "defense"]
                        },
                        (state, card) => {
                            const handMonsters = new CardSelector(state).hand().filter().monster().get();
                            
                            withUserSelectCard(
                                state,
                                card,
                                () => handMonsters,
                                {
                                    select: "single",
                                    message: "墓地に送るモンスターを選択してください"
                                },
                                (state, card, selected) => {
                                    if (selected.length > 0) {
                                        sendCard(state, selected[0], "Graveyard");
                                        
                                        // デッキの上から3枚墓地に送る
                                        withDelayRecursive(
                                            state,
                                            card,
                                            { delay: 100 },
                                            3,
                                            (state, card, depth) => {
                                                if (state.deck.length > 0) {
                                                    sendCard(state, state.deck[0], "Graveyard");
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    );
                }, "TearlamentScheiren_HandEffect");
            }
        },
        onAnywhereToGraveyard: (state, card) => {
            // 効果で墓地に送られた場合の融合召喚効果（簡略化：デッキの上から3枚墓地に送るのみ）
            withDelayRecursive(
                state,
                card,
                { delay: 100 },
                3,
                (state, card, depth) => {
                    if (state.deck.length > 0) {
                        sendCard(state, state.deck[0], "Graveyard");
                    }
                }
            );
        }
    },
};
