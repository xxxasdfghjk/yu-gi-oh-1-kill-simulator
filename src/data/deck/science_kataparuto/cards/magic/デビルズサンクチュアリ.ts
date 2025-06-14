import type { MagicCard } from "@/types/card";
import { createCardInstance } from "@/utils/cardManagement";
import { summon } from "@/utils/cardMovement";
import { getPrioritySetMonsterZoneIndex } from "@/utils/gameUtils";
import { CardSelector } from "@/utils/CardSelector";
import type { GameStore } from "@/store/gameStore";
import METAL_DEVIL_TOKEN from "../token/メタルデビル・トークン";

export default {
    card_name: "デビルズ・サンクチュアリ",
    card_type: "魔法" as const,
    text: "「メタルデビル・トークン」（悪魔族・闇・星１・攻／守０）を自分のフィールド上に１体特殊召喚する。このトークンは攻撃をする事ができない。「メタルデビル・トークン」の戦闘によるコントローラーへの超過ダメージは、かわりに相手プレイヤーが受ける。自分のスタンバイフェイズ毎に１０００ライフポイントを払う。払わなければ、「メタルデビル・トークン」を破壊する。",
    image: "card100036862_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state: GameStore) => {
                // CardSelectorを使用してモンスターゾーンの空きをチェック
                console.log(new CardSelector(state).monster().filter().null().len());
                return new CardSelector(state).monster().filter().null().len() > 0;
            },
            effect: (state: GameStore) => {
                // メタルデビル・トークンを作成
                const metalDevilToken = createCardInstance(METAL_DEVIL_TOKEN, "MonsterField", true);

                // 適切なモンスターゾーンを取得
                const zoneIndex = getPrioritySetMonsterZoneIndex(state, false);

                if (zoneIndex !== -1) {
                    // トークンを攻撃表示で召喚
                    summon(state, metalDevilToken, zoneIndex, "attack");
                }
            },
        },
    },
} satisfies MagicCard;
