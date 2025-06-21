import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withTurnAtOneceCondition, withTurnAtOneceEffect, withUserSummon } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "トワイライトロード・シャーマン ルミナス",
    card_type: "モンスター" as const,
    text: "①：１ターンに１度、自分の手札・墓地から「ライトロード」モンスター１体を除外し、「トワイライトロード・シャーマン ルミナス」以外の除外されている自分の「ライトロード」モンスター１体を対象として発動できる。そのモンスターを特殊召喚する。②：１ターンに１度、このカード以外の自分の「ライトロード」モンスターの効果が発動した場合に発動する。自分のデッキの上からカードを３枚墓地へ送る。",
    image: "card100051664_1.jpg",
    monster_type: "効果モンスター",
    level: 3,
    element: "闇" as const,
    race: "魔法使い族" as const,
    attack: 1000,
    defense: 1000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(state, card, (state, card) => {
                    const lightroadInHandGrave = [
                        ...new CardSelector(state).hand().get(),
                        ...new CardSelector(state).graveyard().get()
                    ].filter(c => c.card.card_name.includes("ライトロード"));
                    
                    const banishedLightroad = new CardSelector(state).banished().get()
                        .filter(c => c.card.card_name.includes("ライトロード") && c.card.card_name !== "トワイライトロード・シャーマン ルミナス");
                    
                    return lightroadInHandGrave.length > 0 && banishedLightroad.length > 0 && card.location === "MonsterField";
                }, "TwilightLuminus_Ignition");
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    const lightroadInHandGrave = [
                        ...new CardSelector(state).hand().get(),
                        ...new CardSelector(state).graveyard().get()
                    ].filter(c => c.card.card_name.includes("ライトロード"));
                    
                    withUserSelectCard(
                        state,
                        card,
                        () => lightroadInHandGrave,
                        {
                            select: "single",
                            message: "除外する「ライトロード」モンスターを選択してください"
                        },
                        (state, card, selected) => {
                            if (selected.length > 0) {
                                sendCard(state, selected[0], "Exclusion");
                                
                                const banishedLightroad = new CardSelector(state).banished().get()
                                    .filter(c => c.card.card_name.includes("ライトロード") && c.card.card_name !== "トワイライトロード・シャーマン ルミナス");
                                
                                withUserSelectCard(
                                    state,
                                    card,
                                    () => banishedLightroad,
                                    {
                                        select: "single",
                                        message: "特殊召喚する除外されている「ライトロード」モンスターを選択してください"
                                    },
                                    (state, card, selected2) => {
                                        if (selected2.length > 0) {
                                            withUserSummon(
                                                state,
                                                card,
                                                selected2[0],
                                                {
                                                    canSelectPosition: true,
                                                    optionPosition: ["attack", "defense"]
                                                },
                                                () => {}
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }, "TwilightLuminus_Ignition");
            }
        }
    },
};
