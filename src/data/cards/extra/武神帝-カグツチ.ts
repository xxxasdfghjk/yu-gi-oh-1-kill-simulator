import { withDelayRecursive } from "@/utils/effectUtils";
import { sendCard, addBuf } from "@/utils/cardMovement";
import { getLevel } from "@/utils/gameUtils";
import { monsterFilter } from "@/utils/cardManagement";
import { CardInstanceFilter } from "@/utils/CardInstanceFilter";
import type { XyzMonsterCard } from "@/types/card";

export default {
    card_name: "武神帝-カグツチ",
    card_type: "モンスター" as const,
    text: "獣戦士族レベル４モンスター×２\nこのカードがエクシーズ召喚に成功した時、自分のデッキの上からカードを５枚墓地へ送る。このカードの攻撃力は、この効果で墓地へ送った「武神」と名のついたカードの数×１００ポイントアップする。また、自分フィールド上の「武神」と名のついた獣戦士族モンスターが戦闘またはカードの効果によって破壊される場合、その破壊されるモンスター１体の代わりにこのカードのエクシーズ素材を１つ取り除く事ができる。「武神帝－カグツチ」は自分フィールド上に１体しか表側表示で存在できない。",
    image: "card100014015_1.jpg",
    monster_type: "エクシーズモンスター",
    element: "光" as const,
    race: "獣戦士" as const,
    attack: 2500,
    defense: 2000,
    hasDefense: true as const,
    hasLevel: false as const,
    hasRank: true as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    rank: 4,
    effect: {
        onSummon: (state, card) => {
            console.log(card.summonedBy);
            if (card.summonedBy === "Xyz") {
                withDelayRecursive(state, card, { delay: 100 }, 5, (state) => {
                    if (state.deck.length > 0) {
                        const topCard = state.deck[0];
                        sendCard(state, topCard, "Graveyard");
                    }
                });
            }
        },
    },
    filterAvailableMaterials: (card) => {
        return monsterFilter(card.card) && card.card.hasLevel && getLevel(card) === 4 && card.card.race === "獣戦士";
    },
    materialCondition: (cards) => {
        return cards.length === 2 && new CardInstanceFilter(cards).level(4).race("獣戦士").len() === 2;
    },
} satisfies XyzMonsterCard;
