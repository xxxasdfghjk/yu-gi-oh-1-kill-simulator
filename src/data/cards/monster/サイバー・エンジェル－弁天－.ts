import type { CardInstance, CommonMonster } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { withUserSelectCard } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { GameStore } from "@/store/gameStore";
import { shuffleDeck } from "@/utils/gameUtils";

const card = {
    card_name: "サイバー・エンジェル－弁天－",
    monster_type: "儀式モンスター",
    level: 6,
    element: "光",
    race: "天使",
    attack: 1800,
    defense: 1500,
    text: "「機械天使の儀式」により降臨。①：このカードが戦闘でモンスターを破壊し墓地へ送った場合に発動する。そのモンスターの元々の守備力分のダメージを相手に与える。②：このカードがリリースされた場合に発動できる。デッキから天使族・光属性モンスター１体を手札に加える。",
    image: "card100035806_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false,
    card_type: "モンスター",
    effect: {
        onRelease: (state: GameStore, card: CardInstance) => {
            const target = (state: GameStore) =>
                state.deck.filter((e) => monsterFilter(e.card) && e.card.race === "天使");
            if (target.length === 0) {
                return;
            }
            withUserSelectCard(
                state,
                card,
                target,
                { select: "single", order: 999, message: "天使族・光属性モンスターを選択してください" },
                (state, _card, selected) => {
                    sendCard(state, selected[0], "Hand");
                    shuffleDeck(state);
                }
            );
        },
    },
} satisfies CommonMonster;

export default card;
