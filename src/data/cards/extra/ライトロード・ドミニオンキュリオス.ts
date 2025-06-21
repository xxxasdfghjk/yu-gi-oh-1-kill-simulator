import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withDelayRecursive, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "ライトロード・ドミニオンキュリオス",
    card_type: "モンスター" as const,
    text: "「ライトロード」モンスター２体 このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：このカードがリンク召喚に成功した場合に発動する。自分のデッキの上からカードを４枚墓地へ送る。②：自分のメインフェイズに発動できる。自分の墓地の「ライトロード」モンスター１体を対象として発動する。そのモンスターを特殊召喚する。",
    image: "card100230019_1.jpg",
    monster_type: "リンク・効果モンスター",
    link: 2,
    element: "光" as const,
    race: "天使族" as const,
    attack: 1000,
    hasDefense: false as const,
    hasLevel: false as const,
    hasRank: false as const,
    hasLink: true as const,
    canNormalSummon: false as const,
    effect: {
        onSummon: (state, card) => {
            withTurnAtOneceEffect(state, card, (state, card) => {
                // デッキの上から4枚墓地に送る
                withDelayRecursive(
                    state,
                    card,
                    { delay: 100 },
                    4,
                    (state, card, depth) => {
                        if (state.deck.length > 0) {
                            sendCard(state, state.deck[0], "Graveyard");
                        }
                    }
                );
            }, "LightlordCurious_LinkSummon");
        },
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(state, card, (state, card) => {
                    const lightlordMonstersInGraveyard = new CardSelector(state).graveyard().filter().monster().get()
                        .filter(c => c.card.card_name.includes("ライトロード"));
                    return (state.phase === "main1" || state.phase === "main2") && lightlordMonstersInGraveyard.length > 0;
                }, "LightlordCurious_Ignition");
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    const lightlordMonstersInGraveyard = new CardSelector(state).graveyard().filter().monster().get()
                        .filter(c => c.card.card_name.includes("ライトロード"));
                    
                    withUserSelectCard(
                        state,
                        card,
                        () => lightlordMonstersInGraveyard,
                        {
                            select: "single",
                            message: "特殊召喚する「ライトロード」モンスターを選択してください"
                        },
                        (state, card, selected) => {
                            if (selected.length > 0) {
                                // 特殊召喚（簡略化：手札に加える）
                                sendCard(state, selected[0], "Hand");
                            }
                        }
                    );
                }, "LightlordCurious_Ignition");
            }
        }
    },
};