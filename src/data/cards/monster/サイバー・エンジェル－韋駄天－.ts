import type { LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { isMagicCard } from "@/utils/cardManagement";
import { withUserSelectCard } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { shuffleDeck } from "@/utils/gameUtils";

const card = {
    card_name: "サイバー・エンジェル－韋駄天－",
    monster_type: "儀式モンスター",
    level: 6,
    element: "光",
    race: "天使",
    attack: 1600,
    defense: 2000,
    text: "「機械天使の儀式」により降臨。①：このカードが儀式召喚に成功した場合に発動できる。自分のデッキ・墓地から儀式魔法カード１枚を選んで手札に加える。②：このカードがリリースされた場合に発動できる。自分フィールドの全ての儀式モンスターの攻撃力・守備力は１０００アップする。",
    image: "card100133121_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false,
    card_type: "モンスター",
    effect: {
        onSummon: (state, card) => {
            const target = (state: GameStore) =>
                [...state.deck, ...state.graveyard].filter(
                    (e) => isMagicCard(e.card) && e.card.magic_type === "儀式魔法"
                );
            if (target(state).length === 0) {
                return;
            }
            withUserSelectCard(
                state,
                card,
                target,
                { select: "single", order: 999, message: "儀式魔法カードを選択してください" },
                (state, _, selected) => {
                    sendCard(state, selected[0], "Hand");
                    shuffleDeck(state);
                }
            );
        },
    },
} satisfies LeveledMonsterCard;

export default card;
