import { CardSelector } from "@/utils/CardSelector";
import {
    withNotification,
    withSendToGraveyardFromDeckTop,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withUserSummon,
} from "@/utils/effectUtils";
import type { LeveledMonsterCard } from "@/types/card";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

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
    summonLimited: true,
    effect: {
        onCardEffect: (state, card, context) => {
            if (!withTurnAtOneceCondition(state, card, () => true, card.id, true)) {
                return;
            }
            if (card.id === context?.["effectedById"]) {
                return;
            }
            if (
                !String(context?.["effectedByName"] ?? "").includes("ライトロード") &&
                !String(context?.["effectedByName"] ?? "").includes("光道の龍")
            ) {
                return;
            }

            withNotification(state, card, { message: "自分のデッキの上からカードを４枚墓地へ送る" }, (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        withSendToGraveyardFromDeckTop(state, card, 4, () => {}, { byEffect: true });
                    },
                    card.id,
                    true
                );
            });
        },
        // 特殊召喚効果
        onIgnition: {
            condition: (state, card) => {
                // 手札にあり、除外状態の「ライトロード」モンスターが4種類以上
                if (card.location !== "Hand") return false;

                const banishedLightlords = new CardSelector(state).banished().filter().monster().lightsworn().get();

                // カード名の種類をカウント
                const uniqueLightlordNames = new Set(banishedLightlords.map((c) => c.card.card_name));

                return uniqueLightlordNames.size >= 4 && hasEmptyMonsterZone(state);
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
