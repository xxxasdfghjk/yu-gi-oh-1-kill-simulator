import type { Card, CardInstance, MonsterCard } from "@/types/card";
import type { GameState } from "@/types/game";
import { isMonsterCard } from "./gameUtils";

export const canNormalSummon = (gameState: GameState, card: CardInstance): boolean => {
    if (!isMonsterCard(card.card)) return false;
    if (gameState.hasNormalSummoned) return false;
    if (gameState.phase !== "main1" && gameState.phase !== "main2") return false;

    const monsterCard = card.card as MonsterCard;

    // 特殊召喚モンスターは通常召喚できない
    if (card.card.card_type === "特殊召喚・効果モンスター") return false;

    // 儀式モンスターは通常召喚できない
    if (card.card.card_type === "儀式・効果モンスター") return false;

    // 融合・シンクロ・エクシーズ・リンクモンスターは通常召喚できない
    if (
        card.card.card_type === "融合モンスター" ||
        card.card.card_type === "シンクロモンスター" ||
        card.card.card_type === "エクシーズモンスター" ||
        card.card.card_type === "リンクモンスター"
    )
        return false;

    // レベル5以上はリリースが必要
    if (monsterCard.level && monsterCard.level >= 5) {
        const requiredTributes = monsterCard.level >= 7 ? 2 : 1;
        const availableTributes = gameState.field.monsterZones.filter((m) => m !== null).length;
        return availableTributes >= requiredTributes;
    }

    return true;
};

export const getRequiredTributes = (card: Card): number => {
    if (!isMonsterCard(card)) return 0;
    const monsterCard = card as MonsterCard;

    if (!monsterCard.level) return 0;
    if (monsterCard.level >= 7) return 2;
    if (monsterCard.level >= 5) return 1;
    return 0;
};

export const findEmptyMonsterZone = (gameState: GameState): number => {
    // 通常のモンスターゾーン（0-4）で空いているゾーンを探す
    for (let i = 0; i < 5; i++) {
        if (gameState.field.monsterZones[i] === null) {
            return i;
        }
    }
    return -1;
};

export const findEmptySpellTrapZone = (gameState: GameState): number => {
    for (let i = 0; i < 5; i++) {
        if (gameState.field.spellTrapZones[i] === null) {
            return i;
        }
    }
    return -1;
};

export const canActivateSpell = (gameState: GameState, card: Card): boolean => {
    const spellTypes = ["通常魔法", "速攻魔法", "永続魔法", "フィールド魔法", "装備魔法", "儀式魔法"];

    if (!spellTypes.includes(card.card_type)) return false;

    // メインフェイズのみ発動可能（速攻魔法は除く）
    if (card.card_type !== "速攻魔法" && gameState.phase !== "main1" && gameState.phase !== "main2") {
        return false;
    }

    // ジャック・イン・ザ・ハンドの特別な発動条件チェック
    if (card.card_name === "ジャック・イン・ザ・ハンド") {
        return canActivateJackInHand(gameState);
    }

    // おろかな埋葬の特別な発動条件チェック
    if (card.card_name === "おろかな埋葬") {
        return canActivateFoolishBurial(gameState);
    }

    // 金満で謙虚な壺の特別な発動条件チェック
    if (card.card_name === "金満で謙虚な壺") {
        return canActivateExtravagance(gameState);
    }

    // ワン・フォー・ワンの特別な発動条件チェック
    if (card.card_name === "ワン・フォー・ワン") {
        return canActivateOneForOne(gameState);
    }

    // エマージェンシー・サイバーの特別な発動条件チェック
    if (card.card_name === "エマージェンシー・サイバー") {
        return canActivateEmergencyCyber(gameState);
    }

    // 現在、金満で謙虚な壺による制限対象のカードはなし
    // （すべて「手札に加える」効果であり、「ドロー」効果ではないため）

    // 高等儀式術の特別な発動条件チェック
    if (card.card_name === "高等儀式術") {
        return canActivateAdvancedRitual(gameState);
    }

    // 流星輝巧群の特別な発動条件チェック
    if (card.card_name === "流星輝巧群") {
        return canActivateMeteorKikougun(gameState);
    }

    // 竜輝巧－ファフニールの特別な発動条件チェック
    if (card.card_name === "竜輝巧－ファフニール") {
        return canActivateFafnir(gameState);
    }

    // フィールド魔法は専用ゾーンへ（盆回し制限をチェック）
    if (card.card_type === "フィールド魔法") {
        if (gameState.bonmawashiRestriction) {
            return false;
        }
        return true;
    }

    // OCGルール準拠: 通常・速攻・儀式魔法も魔法・罠ゾーンに空きが必要
    if (card.card_type === "通常魔法" || card.card_type === "速攻魔法" || card.card_type === "儀式魔法") {
        return findEmptySpellTrapZone(gameState) !== -1;
    }

    // 永続魔法・装備魔法も魔法・罠ゾーンに空きが必要
    return findEmptySpellTrapZone(gameState) !== -1;
};

export const canActivateJackInHand = (gameState: GameState): boolean => {
    // デッキから異なるレベル1モンスター3体を探す
    const level1Monsters = gameState.deck.filter((c) => {
        if (!isMonsterCard(c.card)) return false;
        const monster = c.card as { level?: number };
        return monster.level === 1;
    });

    // 異なるカード名のモンスターを数える
    const uniqueNames = new Set<string>();
    for (const monster of level1Monsters) {
        uniqueNames.add(monster.card.card_name);
    }

    // 異なるカード名のレベル1モンスターが3体以上必要
    return uniqueNames.size >= 3;
};

export const canActivateFoolishBurial = (gameState: GameState): boolean => {
    // デッキにモンスターが1枚以上必要
    const monstersInDeck = gameState.deck.filter((c) => isMonsterCard(c.card));
    return monstersInDeck.length >= 1;
};

export const canActivateExtravagance = (gameState: GameState): boolean => {
    // EXデッキが3枚以上必要
    if (gameState.extraDeck.length < 3) return false;

    // このターンにカードの効果でドローしていない
    if (gameState.hasDrawnByEffect) return false;

    return true;
};

export const canActivateOneForOne = (gameState: GameState): boolean => {
    // 手札にモンスターが1体以上必要
    const handMonsters = gameState.hand.filter((c) => isMonsterCard(c.card));
    if (handMonsters.length === 0) return false;

    // デッキにレベル1モンスターが1体以上必要
    const level1Monsters = gameState.deck.filter((c) => {
        if (!isMonsterCard(c.card)) return false;
        const monster = c.card as { level?: number };
        return monster.level === 1;
    });

    return level1Monsters.length > 0;
};

export const canActivateEmergencyCyber = (gameState: GameState): boolean => {
    // このターンに既に発動済みの場合は発動不可
    if (gameState.hasActivatedEmergencyCyber) {
        return false;
    }

    // デッキに対象となるモンスターが1体以上必要
    const targetMonsters = gameState.deck.filter((c) => {
        if (!isMonsterCard(c.card)) return false;
        const monster = c.card as {
            card_name?: string;
            race?: string;
            attribute?: string;
            card_type?: string;
        };

        // サイバー・ドラゴンモンスター
        if (monster.card_name?.includes("サイバー・ドラゴン")) return true;

        // 通常召喚できない機械族・光属性モンスター
        if (
            monster.race === "機械族" &&
            monster.attribute === "光属性" &&
            monster.card_type === "特殊召喚・効果モンスター"
        ) {
            return true;
        }

        return false;
    });

    return targetMonsters.length > 0;
};

export const canActivateAdvancedRitual = (gameState: GameState): boolean => {
    // 手札に儀式モンスターが1体以上必要
    const ritualMonsters = gameState.hand.filter(
        (c) => isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
    );

    if (ritualMonsters.length === 0) {
        return false;
    }

    // 手札の儀式モンスターの最小レベルを取得
    const minRitualLevel = Math.min(
        ...ritualMonsters.map((c) => {
            const monster = c.card as { level?: number };
            return monster.level || 0;
        })
    );

    // デッキの通常モンスターのレベル合計を計算
    const normalMonsters = gameState.deck.filter((c) => isMonsterCard(c.card) && c.card.card_type === "通常モンスター");

    const totalNormalLevel = normalMonsters.reduce((sum, c) => {
        const monster = c.card as { level?: number };
        return sum + (monster.level || 0);
    }, 0);

    // デッキの通常モンスターレベル合計が手札の儀式モンスター最小レベル以上必要
    const canActivate = totalNormalLevel >= minRitualLevel;

    return canActivate;
};

export const canActivateHokyuYoin = (gameState: GameState): boolean => {
    // 墓地にモンスターが5体以上必要
    const graveyardMonsters = gameState.graveyard.filter((c) => isMonsterCard(c.card));
    if (graveyardMonsters.length < 5) return false;

    // 効果モンスター以外の攻撃力1500以下のモンスターが1体以上必要
    const targetMonsters = gameState.graveyard.filter((c) => {
        if (!isMonsterCard(c.card)) return false;
        const monster = c.card as { card_type?: string; attack?: number };
        return monster.card_type !== "効果モンスター" && (monster.attack || 0) <= 1500;
    });

    return targetMonsters.length >= 1;
};

export const canActivateFafnir = (gameState: GameState): boolean => {
    // このターンに既に発動済みの場合は発動不可
    if (gameState.hasActivatedFafnir) {
        return false;
    }

    // デッキに「竜輝巧－ファフニール」以外の「ドライトロン」魔法・罠カードが1枚以上必要
    const drytronSpellTraps = gameState.deck.filter((c) => {
        const isSpellOrTrap = c.card.card_type.includes("魔法") || c.card.card_type.includes("罠");
        const isDrytron = c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
        const isNotFafnir = c.card.card_name !== "竜輝巧－ファフニール";
        return isSpellOrTrap && isDrytron && isNotFafnir;
    });

    return drytronSpellTraps.length >= 1;
};

export const canActivateMeteorKikougun = (gameState: GameState): boolean => {
    console.log("Checking Meteor Kikougun activation conditions...");

    // 手札・墓地に儀式モンスターが1体以上必要
    const handRitualMonsters = gameState.hand.filter(
        (c) => isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
    );

    const graveyardRitualMonsters = gameState.graveyard.filter(
        (c) => isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
    );

    if (handRitualMonsters.length === 0 && graveyardRitualMonsters.length === 0) {
        return false;
    }
    const ritualMonstersMinAttack = Math.min(
        ...handRitualMonsters.map(
            (c) => (c.card as { attack: number }).attack,
            ...graveyardRitualMonsters.map((c) => (c.card as { attack: number }).attack)
        )
    );

    // 手札・フィールドに機械族モンスターが1体以上必要
    const handMachineMonsters = gameState.hand.filter((c) => {
        if (!isMonsterCard(c.card)) return false;
        const monster = c.card as { race?: string };
        return monster.race === "機械族";
    });

    const fieldMachineMonsters = gameState.field.monsterZones.filter((c): c is CardInstance => {
        if (!c || !isMonsterCard(c.card)) return false;
        const monster = c.card as { race?: string };
        return monster.race === "機械族";
    });

    const sumPower =
        handMachineMonsters.reduce((sum, c) => sum + (c.card as { attack: number }).attack, 0) +
        fieldMachineMonsters.reduce((sum, c) => sum + (c.card as { attack: number }).attack, 0);

    const canActivate =
        handMachineMonsters.length + fieldMachineMonsters.length >= 1 && sumPower >= ritualMonstersMinAttack;

    return canActivate;
};

export const canActivateBanAlpha = (gameState: GameState): boolean => {
    // このターンに既に発動済みの場合は発動不可
    if (gameState.hasActivatedBanAlpha) {
        return false;
    }

    // リリース対象となるカードが必要（手札・フィールドのドライトロンモンスターまたは儀式モンスター）
    const handTargets = gameState.hand.filter((c) => {
        if (!isMonsterCard(c.card)) return false;
        const isDrytron =
            (c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン")) &&
            c.card.card_name !== "竜輝巧－バンα";
        const isRitual = c.card.card_type === "儀式・効果モンスター";
        return isDrytron || isRitual;
    });

    const fieldTargets = gameState.field.monsterZones.filter((c): c is CardInstance => {
        if (!c || !isMonsterCard(c.card)) return false;
        const isDrytron =
            (c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン")) &&
            c.card.card_name !== "竜輝巧－バンα";
        const isRitual = c.card.card_type === "儀式・効果モンスター";
        return isDrytron || isRitual;
    });

    return handTargets.length + fieldTargets.length >= 1;
};

export const canActivateEruGanma = (gameState: GameState): boolean => {
    // このターンに既に発動済みの場合は発動不可
    if (gameState.hasActivatedEruGanma) {
        return false;
    }

    // リリース対象となるカードが必要（手札・フィールドのドライトロンモンスターまたは儀式モンスター）
    const handTargets = gameState.hand.filter((c) => {
        if (!isMonsterCard(c.card)) return false;
        const isDrytron =
            (c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン")) &&
            c.card.card_name !== "竜輝巧－エルγ";
        const isRitual = c.card.card_type === "儀式・効果モンスター";
        return isDrytron || isRitual;
    });

    const fieldTargets = gameState.field.monsterZones.filter((c): c is CardInstance => {
        if (!c || !isMonsterCard(c.card)) return false;
        const isDrytron =
            (c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン")) &&
            c.card.card_name !== "竜輝巧－エルγ";
        const isRitual = c.card.card_type === "儀式・効果モンスター";
        return isDrytron || isRitual;
    });

    return handTargets.length + fieldTargets.length >= 1;
};

export const canSetSpellTrap = (gameState: GameState, card: Card): boolean => {
    const settableTypes = [
        "通常魔法",
        "速攻魔法",
        "永続魔法",
        "装備魔法",
        "儀式魔法",
        "通常罠カード",
        "永続罠カード",
        "カウンター罠カード",
    ];

    if (!settableTypes.includes(card.card_type)) return false;

    // フィールド魔法はセットできない（直接発動のみ）
    if (card.card_type === "フィールド魔法") return false;

    // メインフェイズのみセット可能
    if (gameState.phase !== "main1" && gameState.phase !== "main2") {
        return false;
    }

    // 魔法・罠ゾーンに空きが必要
    return findEmptySpellTrapZone(gameState) !== -1;
};

// 後方互換性のため残しておく
export const canSetTrap = canSetSpellTrap;
