/**
 * Endless shuffled playback: every item plays once per pass in a fresh random
 * order, and a new pass never starts on the item that just played.
 */
export function createShuffleDeck<T>(items: readonly T[], random: () => number = Math.random) {
  let deck: T[] = [];
  const shuffle = () => {
    const order = [...items];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  };
  return {
    /** The item to show after `current`. */
    next(current: T): T {
      deck = deck.filter(item => item !== current);
      if (!deck.length) {
        deck = shuffle();
        if (items.length > 1 && deck[0] === current) deck.push(deck.shift()!);
      }
      return deck.shift()!;
    },
  };
}
