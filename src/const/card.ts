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

// 後方互換性のため
export const CARD_SIZE_MEDIUM = CARD_SIZE.MEDIUM;
