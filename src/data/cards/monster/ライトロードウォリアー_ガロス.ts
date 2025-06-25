import { withDelay, withDraw, withNotification, withSendToGraveyardFromDeckTop } from "@/utils/effectUtils";
import type { LeveledMonsterCard } from "@/types/card";
import { CardInstanceFilter } from "@/utils/CardInstanceFilter";

export default {
    card_name: "ライトロード・ウォリアー ガロス",
    card_type: "モンスター" as const,
    text: "「ライトロード・ウォリアー ガロス」以外の自分フィールド上の「ライトロード」と名のついたモンスターの効果によって自分のデッキからカードが墓地へ送られた場合、自分のデッキの上からカードを２枚墓地へ送る。その後、この効果で墓地へ送られた「ライトロード」と名のついたモンスターの数だけデッキからカードをドローする。",
    image: "card1002381_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "戦士" as const,
    attack: 1850,
    defense: 1300,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onCardToGraveyardByEffect: (state, card, context) => {
            if (
                (context?.["effectedByName"]?.toString() ?? "")?.includes("ライトロード") &&
                (context?.["effectedByName"]?.toString() ?? "") !== "ライトロード・ウォリアー ガロス" &&
                (context?.["effectedByField"] ?? "").toString() === "MonsterField"
            ) {
                withDelay(state, card, {}, (state, card) => {
                    withNotification(state, card, { message: "ガロスの効果発動" }, (state, card) => {
                        if (state.deck.length >= 2) {
                            const drawNum = new CardInstanceFilter(state.deck.slice(0, 2)).monster().lightsworn().len();
                            withSendToGraveyardFromDeckTop(
                                state,
                                card,
                                2,
                                (state, card) => {
                                    withDraw(state, card, { count: drawNum }, () => {});
                                },
                                { byEffect: true }
                            );
                        } else if (state.deck.length === 1) {
                            const drawNum = new CardInstanceFilter(state.deck.slice(0, 1)).lightsworn().len();
                            withSendToGraveyardFromDeckTop(
                                state,
                                card,
                                1,
                                (state, card) => {
                                    withDraw(state, card, { count: drawNum }, () => {});
                                },
                                { byEffect: true }
                            );
                        }
                    });
                });
            }
        },
    },
} satisfies LeveledMonsterCard;
