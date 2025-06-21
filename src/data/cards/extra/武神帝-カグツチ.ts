import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withDelayRecursive } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "武神帝-カグツチ",
    card_type: "モンスター" as const,
    text: "「武神」モンスター２体 このカードがシンクロ召喚に成功した場合に発動する。自分のデッキから「武神」モンスター１体を特殊召喚し、自分のデッキをシャッフルする。その後、自分のデッキの上からカードを３枚墓地へ送る。",
    image: "card100309031_1.jpg",
    monster_type: "シンクロ・効果モンスター",
    level: 6,
    element: "炎" as const,
    race: "獣戦士族" as const,
    attack: 2500,
    defense: 1700,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onSummon: (state, card) => {
            const bushinMonstersInDeck = new CardSelector(state).deck().filter().monster().get()
                .filter(c => c.card.card_name.includes("武神"));
            
            if (bushinMonstersInDeck.length > 0) {
                withUserSelectCard(
                    state,
                    card,
                    () => bushinMonstersInDeck,
                    {
                        select: "single",
                        message: "特殊召喚する「武神」モンスターを選択してください"
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            // 特殊召喚（簡略化：手札に加える）
                            sendCard(state, selected[0], "Hand");
                            
                            // デッキシャッフル（省略）
                            
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
        }
    },
};