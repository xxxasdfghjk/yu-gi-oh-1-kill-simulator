import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withTurnAtOneceCondition, withTurnAtOneceEffect, withUserSummon, withDelayRecursive } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { hasLevelMonsterFilter } from "@/utils/cardManagement";

export default {
    card_name: "ライトロード・サモナー ルミナス",
    card_type: "モンスター" as const,
    text: "１ターンに１度、手札を１枚捨てる事で自分の墓地に存在するレベル４以下の「ライトロード」と名のついたモンスター１体を自分フィールド上に特殊召喚する。このカードが自分フィールド上に表側表示で存在する限り、自分のエンドフェイズ毎に、自分のデッキの上からカードを３枚墓地に送る。",
    image: "card1002382_1.jpg",
    monster_type: "効果モンスター",
    level: 3,
    element: "光" as const,
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
                    const handCards = new CardSelector(state).hand().get();
                    const lightlordInGrave = new CardSelector(state).graveyard().get()
                        .filter(c => c.card.card_name.includes("ライトロード") && 
                                   hasLevelMonsterFilter(c.card) && c.card.level <= 4);
                    
                    return handCards.length > 0 && lightlordInGrave.length > 0 && card.location === "MonsterField";
                }, "LighlordLuminus_Ignition");
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    const handCards = new CardSelector(state).hand().get();
                    
                    withUserSelectCard(
                        state,
                        card,
                        () => handCards,
                        {
                            select: "single",
                            message: "捨てる手札を選択してください"
                        },
                        (state, card, selected) => {
                            if (selected.length > 0) {
                                sendCard(state, selected[0], "Graveyard");
                                
                                const lightlordInGrave = new CardSelector(state).graveyard().get()
                                    .filter(c => c.card.card_name.includes("ライトロード") && 
                                               hasLevelMonsterFilter(c.card) && c.card.level <= 4);
                                
                                withUserSelectCard(
                                    state,
                                    card,
                                    () => lightlordInGrave,
                                    {
                                        select: "single",
                                        message: "特殊召喚する「ライトロード」モンスターを選択してください"
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
                }, "LighlordLuminus_Ignition");
            }
        },
        onStandbyPhase: (state, card) => {
            if (card.location === "MonsterField" && (card.position === "attack" || card.position === "defense")) {
                // エンドフェイズでデッキの上から3枚墓地に送る効果
                const deckCards = state.deck.slice(0, 3);
                withDelayRecursive(
                    state,
                    card,
                    { delay: 100 },
                    deckCards.length,
                    (state, card, depth) => {
                        if (state.deck.length > 0) {
                            sendCard(state, state.deck[0], "Graveyard");
                        }
                    }
                );
            }
        }
    },
};
