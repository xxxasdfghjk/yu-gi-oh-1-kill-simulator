import type { CommonMonster } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard } from "@/utils/effectUtils";
import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";

export default {
    card_name: "混沌の黒魔術師",
    card_type: "モンスター" as const,
    text: "①：このカードが召喚・特殊召喚に成功した時、自分の墓地の魔法カード１枚を対象として発動できる。そのカードを手札に加える。②：このカードが戦闘で相手モンスターを破壊したダメージ計算後に発動する。その相手モンスターを除外する。③：表側表示のこのカードはフィールドから離れた場合に除外される。",
    image: "card1000630_1.jpg",
    monster_type: "効果モンスター",
    level: 8,
    element: "闇" as const,
    race: "魔法使い" as const,
    attack: 2800,
    defense: 2600,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        // ①：召喚・特殊召喚時効果
        onSummon: (state: GameStore, card: CardInstance) => {
            // 墓地に魔法カードがあるかチェック
            const graveyardMagicCards = new CardSelector(state).graveyard().filter().magic().get();

            if (graveyardMagicCards.length === 0) {
                return;
            }

            // 墓地から魔法カード1枚を選択
            withUserSelectCard(
                state,
                card,
                (state: GameStore) => new CardSelector(state).graveyard().filter().magic().get(),
                {
                    select: "single",
                    message: "墓地から手札に加える魔法カードを1枚選んでください",
                    canCancel: true, // 任意効果なのでキャンセル可能
                },
                (state: GameStore, _card: CardInstance, selected: CardInstance[]) => {
                    if (selected.length > 0) {
                        sendCard(state, selected[0], "Hand");
                    }
                }
            );
        },

        // ③：フィールドから離れた場合に除外
        onLeaveFieldInstead: (state, card) => {
            sendCard(state, card, "Exclusion");
        },
    },
} satisfies CommonMonster;
