/** Neutral proper name used wherever a real store name is unavailable. */
export const NEUTRAL_STORE_NAME = 'Movemall Store';

const SYNTHETIC_MATCHING_TOKENS = ['ยอดนิยม', 'คุณภาพสูง', 'ของแท้', 'พร้อมส่ง'] as const;

interface RankableVisualProduct {
  name: string;
  tags: string[];
  category: string;
}

export function createSyntheticSearchSubject(label: string) {
  return {
    label,
    suggestedKeywords: [...SYNTHETIC_MATCHING_TOKENS],
  };
}

export function rankVisualSearchProducts<T extends RankableVisualProduct>(
  products: readonly T[],
  categoryFilter: string,
  suggestedKeywords: readonly string[],
) {
  const scoredProducts = products.map((product, index) => {
    let score = 75;

    if (categoryFilter === product.category) score += 15;

    suggestedKeywords.forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase();
      if (
        product.name.toLowerCase().includes(normalizedKeyword)
        || product.tags.some(tag => tag.toLowerCase().includes(normalizedKeyword))
      ) {
        score += 4;
      }
    });

    score = Math.min(
      99,
      Math.max(68, score + ((product.name.length * 7 + index * 3) % 9)),
    );

    return { ...product, visualMatchScore: score };
  });

  return scoredProducts.sort((a, b) => b.visualMatchScore - a.visualMatchScore);
}

export function resolveVisualSearchStoreName(storeName: string | undefined) {
  return storeName || NEUTRAL_STORE_NAME;
}
