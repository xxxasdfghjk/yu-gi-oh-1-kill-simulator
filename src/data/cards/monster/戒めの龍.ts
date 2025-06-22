import { CardSelector } from "@/utils/CardSelector";
import { withUserSummon } from "@/utils/effectUtils";
import { monsterFilter } from "@/utils/cardManagement";
import type { LeveledMonsterCard } from "@/types/card";

export default {
    card_name: "戒めの龍",
    card_type: "モンスター" as const,
    text: "このカードは通常召喚できない。自分の除外状態の「ライトロード」モンスターが４種類以上の場合のみ特殊召喚できる。①：自分・相手ターンに１度、１０００LPを払って発動できる。「ライトロード」モンスター以外の、お互いの墓地・除外状態（表側）のカードを全てデッキに戻す。②：１ターンに１度、自分の「ライトロード」モンスターの効果が発動した場合に発動する。自分のデッキの上からカードを４枚墓地へ送る。",
    image: "card100330647_1.jpg",
    monster_type: "効果モンスター",
    level: 8,
    element: "闇" as const,
    race: "ドラゴン" as const,
    attack: 3000,
    defense: 2600,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        // 特殊召喚効果
        onIgnition: {
            condition: (state, card) => {
                // 手札にあり、除外状態の「ライトロード」モンスターが4種類以上
                if (card.location !== "Hand") return false;

                const banishedLightlords = new CardSelector(state)
                    .banished()
                    .filter()
                    .monster()
                    .get()
                    .filter((c) => c.card.card_name.includes("ライトロード"));

                // カード名の種類をカウント
                const uniqueLightlordNames = new Set(banishedLightlords.map((c) => c.card.card_name));

                return uniqueLightlordNames.size >= 4;
            },
            effect: (state, card) => {
                // 手札から特殊召喚
                withUserSummon(
                    state,
                    card,
                    card,
                    {
                        canSelectPosition: true,
                        optionPosition: ["attack", "defense"],
                    },
                    () => {}
                );
            },
        },

        // ①の効果：1000LP払って墓地・除外のカードをデッキに戻す（TODO）
        // ②の効果：ライトロード効果発動時に4枚墓地送り（TODO）
    },
} satisfies LeveledMonsterCard;
