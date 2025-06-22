import { CardSelector } from "@/utils/CardSelector";
import { withUserSummon } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";

export default {
    card_name: "光の創造神 ホルアクティ",
    card_type: "モンスター" as const,
    text: "このカードは通常召喚できない。自分フィールド上の、元々のカード名が「オシリスの天空竜」「オベリスクの巨神兵」「ラーの翼神竜」となるモンスターをそれぞれ１枚ずつリリースした場合のみ特殊召喚できる。このカードの特殊召喚は無効化されない。このカードを特殊召喚したプレイヤーはデュエルに勝利する。",
    image: "card100003456_1.jpg",
    monster_type: "効果モンスター",
    element: "神" as const,
    race: "創造神" as const,
    attack: 0,
    defense: 0,
    level: 12,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    summonLimited: true,
    effect: {
        onSummon: (state) => {
            // ホルアクティが召喚されたらプレイヤーの勝利
            state.gameOver = true;
            state.winner = "player";
            state.winReason = "horakty";
        },
        onIgnition: {
            condition: (state, card) => {
                const fieldMonsters = new CardSelector(state).allMonster().filter().nonNull().get();
                const hasOsiris = fieldMonsters.some((m) => m.card.card_name === "オシリスの天空竜");
                const hasObelisk = fieldMonsters.some((m) => m.card.card_name === "オベリスクの巨神兵");
                const hasRa = fieldMonsters.some((m) => m.card.card_name === "ラーの翼神竜");
                return hasOsiris && hasObelisk && hasRa && card.location === "Hand";
            },
            effect: (state, card) => {
                const fieldMonsters = new CardSelector(state).allMonster().filter().nonNull().get();
                const osiris = fieldMonsters.find((m) => m.card.card_name === "オシリスの天空竜");
                const obelisk = fieldMonsters.find((m) => m.card.card_name === "オベリスクの巨神兵");
                const ra = fieldMonsters.find((m) => m.card.card_name === "ラーの翼神竜");

                if (osiris && obelisk && ra) {
                    // 三幻神をリリース
                    sendCard(state, osiris, "Graveyard");
                    sendCard(state, obelisk, "Graveyard");
                    sendCard(state, ra, "Graveyard");

                    // ホルアクティを特殊召喚
                    withUserSummon(
                        state,
                        card,
                        card,
                        {
                            canSelectPosition: false,
                            optionPosition: ["attack"],
                        },
                        () => {}
                    );
                }
            },
        },
    },
} satisfies LeveledMonsterCard;
