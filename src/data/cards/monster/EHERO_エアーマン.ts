import type { LeveledMonsterCard } from "@/types/card";
import { withDelayRecursive, withOption, withUserSelectCard } from "@/utils/effectUtils";
import { sendCard, sendCardById } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "E・HERO エアーマン",
    card_type: "モンスター" as const,
    text: "このカードの召喚・特殊召喚に成功した時、次の効果から１つを選択して発動する事ができる。●自分フィールド上に存在するこのカードを除く「ＨＥＲＯ」と名のついたモンスターの数まで、フィールド上の魔法または罠カードを破壊する事ができる。●自分のデッキから「ＨＥＲＯ」と名のついたモンスター１体を選択して手札に加える。",
    image: "card100137045_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "風" as const,
    race: "戦士" as const,
    attack: 1800,
    defense: 300,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onSummon: (state, card) => {
            // 効果を使用するか確認
            withOption(
                state,
                card,
                [
                    {
                        name: "魔法・罠カードを破壊",
                        condition: (state, card) => {
                            // 自分フィールドのこのカードを除くHEROの数を数える
                            const heroCount = new CardSelector(state)
                                .allMonster()
                                .filter()
                                .nonNull()
                                .excludeId(card.id)
                                .get()
                                .filter((c) => c.card.card_name.includes("HERO")).length;

                            const spellTraps = new CardSelector(state).allFieldSpellTrap().getNonNull().length;
                            return heroCount > 0 && spellTraps > 0;
                        },
                    },
                    {
                        name: "デッキからHEROをサーチ",
                        condition: (state) => {
                            // デッキにHEROモンスターが存在するかチェック
                            const heroInDeck = new CardSelector(state)
                                .deck()
                                .filter()
                                .nonNull()
                                .monster()
                                .get()
                                .filter((c) => c.card.card_name.includes("HERO"));
                            return heroInDeck.length > 0;
                        },
                    },
                ],
                (state, card, option) => {
                    if (option === "魔法・罠カードを破壊") {
                        // 自分フィールドのこのカードを除くHEROの数を数える
                        const cardId = card.id;
                        const heroCount = new CardSelector(state)
                            .allMonster()
                            .filter()
                            .nonNull()
                            .excludeId(cardId)
                            .get()
                            .filter((c) => c.card.card_name.includes("HERO")).length;

                        if (heroCount > 0) {
                            const spellTraps = (state: GameStore) =>
                                new CardSelector(state).allFieldSpellTrap().getNonNull();

                            withUserSelectCard(
                                state,
                                card,
                                spellTraps,
                                {
                                    select: "multi",
                                    condition: (selected) => selected.length > 0 && selected.length <= heroCount,
                                    message: `相手の魔法・罠カードを最大${heroCount}枚まで選んでください`,
                                    canCancel: true,
                                },
                                (state, _, selected) => {
                                    // 選択されたカードを破壊
                                    const selectedIds = selected.map((c) => c.id);
                                    withDelayRecursive(state, card, {}, selected.length, (state, _, depth) => {
                                        sendCardById(state, selectedIds[depth - 1], "Graveyard");
                                    });
                                }
                            );
                        }
                    } else if (option === "デッキからHEROをサーチ") {
                        // デッキからHEROモンスターをサーチ
                        const heroMonsters = (state: GameStore) =>
                            new CardSelector(state)
                                .deck()
                                .filter()
                                .nonNull()
                                .monster()
                                .get()
                                .filter((c) => c.card.card_name.includes("HERO"));

                        withUserSelectCard(
                            state,
                            card,
                            heroMonsters,
                            {
                                select: "single",
                                condition: (selected) => selected.length === 1,
                                message: "デッキから「HERO」と名のついたモンスターを1体選んでください",
                                canCancel: true,
                            },
                            (state, _, selected) => {
                                if (selected.length > 0) {
                                    sendCard(state, selected[0], "Hand");
                                }
                            }
                        );
                    }
                }
            );
        },
    },
} satisfies LeveledMonsterCard;
