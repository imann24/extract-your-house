import ArrayUtil from './array-util.js'

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

  static getCardName(card) {
    return `card${card.suit}${card.value}`
  }

  static allSuits () {
    return ['Hearts', 'Diamonds', 'Clubs', 'Spades']
  }

  static allCards () {
    const suits = Deck.allSuits()
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace']
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
