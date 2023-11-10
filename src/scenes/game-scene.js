import Phaser from 'phaser'
import Deck from '../deck.js'
import { Card } from '../game-objects.js'

export default class GameScene extends Phaser.Scene {
  constructor(socket) {
    super({ key: 'game' })
    this.socket = socket
    this.socket.on('player', state => {
      this.startHandler(state)
    })
  }

  preload () {
    for (const card of Deck.allCards()) {
      const cardName = Deck.getCardName(card)
      this.load.image(cardName, `assets/${cardName}.png`)
    }
  }

  startHandler (state) {
    this.deck = Deck.fromExisting(state.deck)
  }

  create () {
    console.log(this.deck)
    this.deckSprites = []
    let xPos = 25
    while (!this.deck.empty()) {
      const card = new Card(this, xPos += 10, 300, this.deck.deal())
      this.deckSprites.push(card)
    }
  }
}
