import type { MagicCard, TrapCard } from "../cards";
import { monsterFilter, sendCard, withUserSelectCard } from "../cards";

const createTrapCard = (property: Omit<TrapCard, "card_type">): TrapCard => {
    return {
        card_type: "罠",
        ...property,
    };
};

const COMMON_MONSTERS = [
    createTrapCard({
        card_name: "補充要員",
        trap_type: "通常罠",
        text: "自分の墓地にモンスターが５体以上存在する場合に発動する事ができる。自分の墓地に存在する効果モンスター以外の攻撃力１５００以下のモンスターを３体まで選択して手札に加える。",
        image: "card100350003_1.jpg",
        effect: {
            onSpell: {
                condition: (state) =>
                    state.graveyard.filter((e) => monsterFilter(e.card)).length >= 0 &&
                    state.graveyard.filter(
                        (e) =>
                            monsterFilter(e.card) && e.card.monster_type === "通常モンスター" && e.card.attack <= 1500
                    ).length > 0,
                effect: (state, card) => {
                    withUserSelectCard(
                        state,
                        card,
                        state.graveyard.filter(
                            (e) =>
                                monsterFilter(e.card) &&
                                e.card.monster_type === "通常モンスター" &&
                                e.card.attack <= 1500
                        ),
                        { select: "multi", condition: (card) => card.length <= 3 && card.length >= 1 },
                        (state, card, selectedList) => {
                            for (const selected of selectedList) {
                                sendCard(state, selected, "Hand");
                            }
                        }
                    );
                },
            },
        },
    }),
] satisfies TrapCard[];
