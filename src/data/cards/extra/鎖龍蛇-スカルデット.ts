import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withDelayRecursive } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "鎖龍蛇-スカルデット",
    card_type: "モンスター" as const,
    text: "リンク２以上のモンスター２体 ①：このカードがリンク召喚に成功した場合に発動する。自分のデッキの上からカードを２枚墓地へ送る。②：このカードがモンスターゾーンに存在する限り、お互いのプレイヤーはデッキからカードを２枚以上同時にドローできない。",
    image: "card100405007_1.jpg",
    monster_type: "リンク・効果モンスター",
    link: 4,
    element: "闇" as const,
    race: "アンデット族" as const,
    attack: 2000,
    hasDefense: false as const,
    hasLevel: false as const,
    hasRank: false as const,
    hasLink: true as const,
    canNormalSummon: false as const,
    effect: {
        onSummon: (state, card) => {
            // デッキの上から2枚墓地に送る
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
        // ②の効果は継続的効果なので省略（実装が複雑）
    },
};