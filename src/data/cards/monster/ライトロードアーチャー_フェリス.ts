import { withUserSummon } from "@/utils/effectUtils";
import type { LeveledMonsterCard } from "@/types/card";

export default {
    card_name: "ライトロード・アーチャー フェリス",
    card_type: "モンスター" as const,
    text: "このカードは通常召喚できず、カードの効果でのみ特殊召喚できる。①：このカードがモンスターの効果でデッキから墓地へ送られた場合に発動する。このカードを特殊召喚する。②：このカードをリリースし、相手フィールドのモンスター１体を対象として発動できる。その相手モンスターを破壊する。その後、自分のデッキの上からカードを３枚墓地へ送る。",
    image: "card100180215_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "獣戦士族" as const,
    attack: 1100,
    defense: 2000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onDeckToGraveyard: (state, card) => {
            // TODO
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
} satisfies LeveledMonsterCard;
