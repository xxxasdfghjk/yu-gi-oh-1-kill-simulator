import type { TrapCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { withUserSelectCard, withDelay } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

const card = {
        card_name: "補充要員",
        card_type: "罠" as const,
        trap_type: "通常罠" as const,
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
                effect: (state, _card) => {
                    withUserSelectCard(
                        state,
                        _card,
                        (state) =>
                            state.graveyard.filter(
                                (e) =>
                                    monsterFilter(e.card) &&
                                    e.card.monster_type === "通常モンスター" &&
                                    e.card.attack <= 1500
                            ),
                        {
                            select: "multi",
                            condition: (cards) => cards.length <= 3 && cards.length >= 1,
                            message: "墓地から攻撃力1500以下の通常モンスターを3体まで選択してください",
                        },
                        (state, _card, selectedList) => {
                            for (let i = 0; i < selectedList.length; i++) {
                                withDelay(state, _card, { order: -1, delay: i * 20 }, (state) => {
                                    sendCard(state, selectedList[i], "Hand");
                                });
                            }
                        }
                    );
                },
            },
        },
    } satisfies TrapCard;

export default card;