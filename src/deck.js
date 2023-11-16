import ArrayUtil from './array-util.js'

// locally set this to true to test with a small 12 card deck:
const MINI_DECK_FOR_DEBUGGING = true

export default class Deck {
  static fromExisting(deck) {
    const newDeck = new Deck()
    newDeck.cards = deck.cards
    return newDeck
  }

  constructor() {
    this.cards = []
    this.createDeck()
  }

  static sameCard(card1, card2) {
    if (!card1 || !card2) {
      return false
    }
    return card1.suit === card2.suit && card1.value === card2.value
  }

  static getCardName(card) {
    return `card${card.suit}${card.value}`
  }

  static allSuits () {
    return ['Hearts', 'Diamonds', 'Clubs', 'Spades']
  }

  static allValues () {
    if (MINI_DECK_FOR_DEBUGGING) {
      return ['2', '3', '4', '5']
    }
    return ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace']
  }

  static allCards () {
    const suits = Deck.allSuits()
    const values = Deck.allValues()
    const cards = []
    for (const suit of suits) {
      for (const value of values) {
        cards.push({ suit, value })
      }
    }
    return cards
  }

  createDeck () {
    this.cards = Deck.allCards()
  }

  shuffle () {
    ArrayUtil.shuffle(this.cards)
  }

  deal () {
    if (this.cards.length === 0) {
      throw new Error('The deck is empty. Cannot deal any more cards.')
    }
    return this.cards.pop()
  }

  count () {
    return this.cards.length
  }

  get (i) {
    return this.cards[i]
  }

  empty () {
    return !this.cards.length
  }

  reset () {
    this.cards = []
    this.createDeck()
  }
}
