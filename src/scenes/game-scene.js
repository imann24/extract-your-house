import Phaser from 'phaser'
import Deck from '../deck.js'
import { Card } from '../game-objects.js'

export default class GameScene extends Phaser.Scene {
  constructor(socket) {
    super({ key: 'game' })
    this.socket = socket
    this.socket.on('player', state => {
      this.stateHandler(state)
    })
    this.socket.on('update', state => {
      this.updateHandler(state)
    })
  }

  preload () {
    for (const card of Deck.allCards()) {
      const cardName = Deck.getCardName(card)
      this.load.image(cardName, `assets/${cardName}.png`)
    }
  }

  stateHandler (state) {
    this.id = state.id
    this.deck = Deck.fromExisting(state.deck)
    this.hand = state.hand
    this.collectionPile = state.collectionPile
    console.log('state', state)
  }

  updateHandler (state) {
    this.stateHandler(state)
  }

  update () {
    console.log(this.deck.length)
    this.deckSprites = []
    let deckXPos = 25
    while (!this.deck.empty()) {
      const card = new Card(this, deckXPos += 10, 300, this.deck.deal())
      this.deckSprites.push(card)
    }
    this.handSprites = []
    let handXPos = 250
    for (var i = 0; i < this.hand.length; i++) {
      const card = new Card(this, handXPos += 50, 500, this.hand[i])
    }
  }
}
