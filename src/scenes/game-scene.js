import Phaser from 'phaser'
import Deck from '../deck'
import { Card } from '../game-objects'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'game' })
  }

  preload() {
    for (const card of Deck.allCards()) {
      const cardName = Deck.getCardName(card)
      this.load.image(cardName, `assets/${cardName}.png`)
    }
  }

  create() {
    this.deck = new Deck()
    this.deck.shuffle()
    this.deckSprites = []
    let xPos = 25
    while (!this.deck.empty()) {
      const card = new Card(this, xPos += 10, 300, this.deck.deal())
      this.deckSprites.push(card)
    }
  }
}
