import type { ExtraMonster } from "@/types/card";
import { hasLevelMonsterFilter } from "@/utils/cardManagement";
import { withUserSelectCard } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { getLevel } from "@/utils/gameUtils";
import type { CardInstance } from "@/types/card";

const card = {
    card_name: "リンクリボー",
    card_type: "モンスター" as const,
    monster_type: "リンクモンスター" as const,
    link: 1,
    linkDirection: ["下"] as const,
    element: "闇" as const,
    race: "サイバース" as const,
    attack: 300,
    filterAvailableMaterials: (card) => hasLevelMonsterFilter(card.card) && getLevel(card) === 1,
    materialCondition: (card: CardInstance[]) => {
        return !!(card.length === 1 && hasLevelMonsterFilter(card[0].card) && getLevel(card[0]) === 1);
    },
    text: "レベル1モンスター1体\n①このカードがリンク召喚に成功した時に発動できる。デッキからレベル1モンスター1体を墓地へ送る。②このカードが戦闘で破壊された場合に発動できる。手札からレベル1モンスター1体を特殊召喚する。",
    image: "card100358454_1.jpg",
    hasDefense: false as const,
    hasLevel: false as const,
    hasLink: true as const,
    hasRank: false as const,
    canNormalSummon: false,
    effect: {
        onSummon: (state, card) => {
            const canEffect =
                state.deck.filter((e) => hasLevelMonsterFilter(e.card) && getLevel(e) === 1).length > 0;
            if (!canEffect) {
                return;
            }
            withUserSelectCard(
                state,
                card,
                (state) => state.deck.filter((e) => hasLevelMonsterFilter(e.card) && getLevel(e) === 1),
                { select: "single", message: "デッキからレベル1モンスターを1体選んで墓地に送ってください" },
                (state, _, selected) => {
                    sendCard(state, selected[0], "Graveyard");
                }
            );
        },
    },
} satisfies ExtraMonster;

export default card;