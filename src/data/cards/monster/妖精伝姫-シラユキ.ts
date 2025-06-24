import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withUserSummon, withExclusionMonsters } from "@/utils/effectUtils";
import type { LeveledMonsterCard } from "@/types/card";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "妖精伝姫-シラユキ",
    card_type: "モンスター" as const,
    text: "①：このカードが召喚・特殊召喚した場合、相手フィールドの表側表示モンスター１体を対象として発動できる。そのモンスターを裏側守備表示にする。②：自分・相手ターンに、このカードが墓地に存在する場合、自分の手札・フィールド・墓地からこのカード以外のカード７枚を除外して発動できる。このカードを特殊召喚する。",
    image: "card100065252_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "魔法使い" as const,
    attack: 1850,
    defense: 1000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return (
                    new CardSelector(state)
                        .hand()
                        .allMonster()
                        .graveyard()
                        .allFieldSpellTrap()
                        .filter()
                        .excludeId(card.id)
                        .len() >= 7 &&
                    card.location === "Graveyard" &&
                    hasEmptyMonsterZone(state)
                );
            },

            effect: (state, card) => {
                withUserSelectCard(
                    state,
                    card,
                    (state) =>
                        new CardSelector(state)
                            .hand()
                            .allMonster()
                            .allFieldSpellTrap()
                            .graveyard()
                            .filter()
                            .excludeId(card.id)
                            .get(),
                    {
                        select: "multi",
                        condition: (selected) => selected.length === 7,
                        message: "除外するカードを7枚選択してください",
                        canCancel: true,
                    },
                    (state, card, selected) => {
                        withExclusionMonsters(state, card, { cardIdList: selected.map((e) => e.id) }, (state, card) => {
                            withUserSummon(state, card, card, {}, () => {});
                        });
                    }
                );
            },
        },
    },
} satisfies LeveledMonsterCard;
