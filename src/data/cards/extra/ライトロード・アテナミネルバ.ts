import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withDelayRecursive, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "ライトロード・アテナミネルバ",
    card_type: "モンスター" as const,
    text: "レベル３モンスター×３ このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：このカードがＸ召喚に成功した場合に発動する。自分のデッキの上からカードを３枚墓地へ送る。②：このカードのＸ素材を１つ取り除いて発動できる。自分の墓地の「ライトロード」モンスター１体を手札に加える。",
    image: "card100230017_1.jpg",
    monster_type: "エクシーズ・効果モンスター",
    rank: 3,
    element: "光" as const,
    race: "天使族" as const,
    attack: 1000,
    defense: 2000,
    hasDefense: true as const,
    hasLevel: false as const,
    hasRank: true as const,
    hasLink: false as const,
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
            }, "LightlordMinerva_XyzSummon");
        },
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(state, card, (state, card) => {
                    const lightlordInGraveyard = new CardSelector(state).graveyard().filter().monster().get()
                        .filter(c => c.card.card_name.includes("ライトロード"));
                    return card.materials.length > 0 && lightlordInGraveyard.length > 0;
                }, "LightlordMinerva_Ignition");
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    // X素材を1つ取り除く
                    if (card.materials.length > 0) {
                        const material = card.materials[0];
                        card.materials = card.materials.slice(1);
                        sendCard(state, material, "Graveyard");
                        
                        const lightlordInGraveyard = new CardSelector(state).graveyard().filter().monster().get()
                            .filter(c => c.card.card_name.includes("ライトロード"));
                        
                        withUserSelectCard(
                            state,
                            card,
                            () => lightlordInGraveyard,
                            {
                                select: "single",
                                message: "手札に加える「ライトロード」モンスターを選択してください"
                            },
                            (state, card, selected) => {
                                if (selected.length > 0) {
                                    sendCard(state, selected[0], "Hand");
                                }
                            }
                        );
                    }
                }, "LightlordMinerva_Ignition");
            }
        }
    },
};