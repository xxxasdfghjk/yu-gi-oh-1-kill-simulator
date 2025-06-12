import type { Position } from "@/utils/effectUtils";

// カードサイズの定数定義
export const CARD_SIZE = {
    // 基本サイズ（medium）
    MEDIUM: "w-40 h-56",
    // 小サイズ
    SMALL: "w-40 h-56",
    // 大サイズ
    LARGE: "w-24 h-32",
    // エクストラ大サイズ（墓地表示用など）
    EXTRA_LARGE: "w-32 h-44",
} as const;

export const EXODIA_CENTER_X = 960;
export const EXODIA_CENTER_Y = 540;
export const EXODIA_RADIUS = 0;

export const CONTAINER_PADDING_X = 16;
export const CONTAINER_PADDING_Y = 8;
export const RIHGT_CONTAINER_WIDTH = 288;
export const PAGE_WIDTH = 1920;
export const CARD_WIDTH = 160;
export const CARD_HEIGHT = 224;
export const CARD_MARGIN = 8;

export const DISPLAY_INFO_WIDTH = 432;

export const CONTAINER_WIDTH = PAGE_WIDTH - CONTAINER_PADDING_X * 2;
export const CONTAINER_RIGHT_MARGIN = 1;

export const FIELD_HEIGHT = 3 * CARD_HEIGHT + CARD_MARGIN * 2;
export const FIELD_WIDTH = 7 * CARD_WIDTH + CARD_MARGIN * 6;

export const HAND_CENTER_X = PAGE_WIDTH / 2;
export const HAND_CENTER_Y = FIELD_HEIGHT + CARD_MARGIN + CARD_HEIGHT / 2;
export const FIELD_CENTER_X =
    CONTAINER_PADDING_X + DISPLAY_INFO_WIDTH + 4 * CARD_WIDTH + 3 * CARD_MARGIN - CARD_WIDTH / 2;

export const FIELD_CENTER_Y = CONTAINER_PADDING_Y + 2 * CARD_HEIGHT + CARD_MARGIN - CARD_HEIGHT / 2;

export const GRAVEYARD_X = FIELD_CENTER_X + CARD_MARGIN * 3 + CARD_WIDTH * 3;
export const GRAVEYARD_Y = FIELD_CENTER_Y;

export const DECK_X = FIELD_CENTER_X + CARD_MARGIN * 3 + CARD_WIDTH * 3;
export const DECK_Y = FIELD_CENTER_Y + CARD_MARGIN * 2 + CARD_HEIGHT;
type Coordinate = { x: number; y: number };
// abベクトル
export const calcRelativeCoodinate = (a: Coordinate, b: Coordinate) => {
    return { x: b.x - a.x, y: b.y - a.y };
};

export const getHandCoordinateAbsolute = (index: number, length: number) => {
    if (length % 2 === 1) {
        return { x: HAND_CENTER_X + (-(length - 1) / 2 + index) * (CARD_WIDTH + CARD_MARGIN), y: HAND_CENTER_Y };
    } else {
        return {
            x: HAND_CENTER_X + CARD_MARGIN / 2 + CARD_WIDTH / 2 + (-length / 2 + index) * (CARD_WIDTH + CARD_MARGIN),
            y: HAND_CENTER_Y,
        };
    }
};
export type DisplayField =
    | "Deck"
    | "MonsterField"
    | "SpellField"
    | "ExtraDeck"
    | "Graveyard"
    | "FieldZone"
    | "OpponentField"
    | "Hand"
    | "TokenRemove"
    | "Throne";
export const getFieldCoodrinateAbsolute = (
    fieldType: DisplayField,
    index: number = 0,
    length = 0
): { x: number; y: number } => {
    switch (fieldType) {
        case "Deck":
            return { x: DECK_X, y: DECK_Y };
        case "MonsterField":
            if (index >= 5) {
                return {
                    x: FIELD_CENTER_X + (index === 5 ? -1 : 1) * (CARD_WIDTH + CARD_MARGIN),
                    y: FIELD_CENTER_Y - CARD_HEIGHT - CARD_MARGIN,
                };
            } else {
                return {
                    x: FIELD_CENTER_X - 2 * CARD_MARGIN - 2 * CARD_WIDTH + index * (CARD_WIDTH + CARD_MARGIN),
                    y: FIELD_CENTER_Y,
                };
            }
        case "SpellField":
            return {
                x: FIELD_CENTER_X - 2 * CARD_MARGIN - 2 * CARD_WIDTH + index * (CARD_WIDTH + CARD_MARGIN),
                y: FIELD_CENTER_Y + CARD_MARGIN + CARD_HEIGHT,
            };
        case "ExtraDeck":
            return {
                x: FIELD_CENTER_X - 3 * CARD_MARGIN - 3 * CARD_WIDTH,
                y: FIELD_CENTER_Y + CARD_MARGIN + CARD_HEIGHT,
            };
        case "Graveyard":
            return {
                x: FIELD_CENTER_X + CARD_MARGIN * 3 + 3 * CARD_WIDTH,
                y: FIELD_CENTER_Y,
            };
        case "FieldZone":
            return {
                x: FIELD_CENTER_X - CARD_MARGIN * 3 - 3 * CARD_WIDTH,
                y: FIELD_CENTER_Y,
            };
        case "OpponentField":
            return {
                x: FIELD_CENTER_X + 3 * (CARD_WIDTH + CARD_MARGIN),
                y: FIELD_CENTER_Y - CARD_HEIGHT - CARD_MARGIN,
            };
        case "Hand":
            return getHandCoordinateAbsolute(index, length);
        case "TokenRemove":
            // フィールドの同じ位置（フェードアウト用）
            return getFieldCoodrinateAbsolute("MonsterField", index);
        case "Throne":
            console.log(index, {
                x: EXODIA_CENTER_X + EXODIA_RADIUS * Math.cos(Math.PI / 2 - (index * Math.PI) / 5),
                y: EXODIA_CENTER_Y + EXODIA_RADIUS * Math.sin(Math.PI / 2 - (index * Math.PI) / 5),
            });
            return {
                x: EXODIA_CENTER_X + EXODIA_RADIUS * Math.cos(Math.PI / 2 - (index * Math.PI) / 5),
                y: EXODIA_CENTER_Y + EXODIA_RADIUS * Math.sin(Math.PI / 2 - (index * Math.PI) / 5),
            };
    }
};

export const getHandToDeckVector = (handIndex: number, length: number) => {
    const abs = getHandCoordinateAbsolute(handIndex, length);
    return calcRelativeCoodinate(abs, { x: DECK_X, y: DECK_Y });
};

export const getHandToFieldVector = (
    handIndex: number,
    handLength: number,
    field: { location: DisplayField; index: number }
) => {
    const abs = getHandCoordinateAbsolute(handIndex, handLength);
    return calcRelativeCoodinate(abs, getFieldCoodrinateAbsolute(field.location, field.index));
};

export const getLocationVectorWithPosition = (
    fieldA: { location: DisplayField; index?: number; length?: number; position?: Position },
    fieldB: { location: DisplayField; index?: number; length?: number; position?: Position }
) => {
    const rotate =
        ["attack", "back", undefined].findIndex((e) => e === fieldB?.position) !== -1 &&
        ["attack", "back", undefined].findIndex((e) => e === fieldA?.position) !== -1
            ? 0
            : 90;

    const flip =
        (["attack", "defense", undefined].findIndex((e) => e === fieldB?.position) !== -1) ===
        (["attack", "defense", undefined].findIndex((e) => e === fieldA?.position) !== -1)
            ? 0
            : 180;
    console.log(
        (getFieldCoodrinateAbsolute(fieldA.location, fieldA.index, fieldA.length),
        getFieldCoodrinateAbsolute(fieldB.location, fieldB.index, fieldB.length))
    );
    return {
        roteteY: flip,
        rotate,
        ...calcRelativeCoodinate(
            getFieldCoodrinateAbsolute(fieldA.location, fieldA.index, fieldA.length),
            getFieldCoodrinateAbsolute(fieldB.location, fieldB.index, fieldB.length)
        ),
    };
};

export const CARD_RECT = { x: "10rem", y: "14rem" };
export const CARD_GAP = { x: "2rem", y: "0.5rem" };
export const COORDINATES = {
    ABSOLUTE_FIELD_CENTRAL_RECT: { x: 0, y: 0 },
};

// 後方互換性のため
export const CARD_SIZE_MEDIUM = CARD_SIZE.MEDIUM;
