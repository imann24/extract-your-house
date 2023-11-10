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

  static allCards () {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades']
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
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }

  deal () {
    if (this.cards.length === 0) {
      throw new Error('The deck is empty. Cannot deal any more cards.')
    }
    return this.cards.pop()
  }

  empty () {
    return !this.cards.length
  }

  reset () {
    this.cards = []
    this.createDeck()
  }
}
