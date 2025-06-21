import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withDelayRecursive, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "ライトロード・セイントミネルバ",
    card_type: "モンスター" as const,
    text: "「ライトロード」モンスター２体以上 このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：このカードがリンク召喚に成功した場合に発動する。自分のデッキの上からカードを３枚墓地へ送る。②：自分のメインフェイズに発動できる。自分の墓地の「ライトロード」カード３枚を除外して発動する。自分のデッキからカード１枚を手札に加える。",
    image: "card100230018_1.jpg",
    monster_type: "リンク・効果モンスター",
    link: 3,
    element: "光" as const,
    race: "天使族" as const,
    attack: 2600,
    hasDefense: false as const,
    hasLevel: false as const,
    hasRank: false as const,
    hasLink: true as const,
    canNormalSummon: false as const,
    effect: {
        onSummon: (state, card) => {
            withTurnAtOneceEffect(state, card, (state, card) => {
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
            }, "LightlordSaintMinerva_LinkSummon");
        },
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(state, card, (state, card) => {
                    const lightlordInGraveyard = new CardSelector(state).graveyard().get()
                        .filter(c => c.card.card_name.includes("ライトロード"));
                    return (state.phase === "main1" || state.phase === "main2") && lightlordInGraveyard.length >= 3;
                }, "LightlordSaintMinerva_Ignition");
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    const lightlordInGraveyard = new CardSelector(state).graveyard().get()
                        .filter(c => c.card.card_name.includes("ライトロード"));
                    
                    withUserSelectCard(
                        state,
                        card,
                        () => lightlordInGraveyard,
                        {
                            select: "multi",
                            selectCount: 3,
                            message: "除外する「ライトロード」カード3枚を選択してください"
                        },
                        (state, card, selected) => {
                            if (selected.length === 3) {
                                // 3枚除外
                                selected.forEach(c => sendCard(state, c, "Exclusion"));
                                
                                // デッキから1枚手札に加える
                                if (state.deck.length > 0) {
                                    withUserSelectCard(
                                        state,
                                        card,
                                        () => state.deck,
                                        {
                                            select: "single",
                                            message: "手札に加えるカードを選択してください"
                                        },
                                        (state, card, selected) => {
                                            if (selected.length > 0) {
                                                sendCard(state, selected[0], "Hand");
                                            }
                                        }
                                    );
                                }
                            }
                        }
                    );
                }, "LightlordSaintMinerva_Ignition");
            }
        }
    },
};