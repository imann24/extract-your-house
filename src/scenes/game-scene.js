import Phaser from 'phaser'
import Deck from '../deck.js'
import { Card } from '../game-objects.js'

export default class GameScene extends Phaser.Scene {
  constructor(socket) {
    super({ key: 'game' })
    this.socket = socket
    this.socket.on('game-full', () => alert('lobby is full'))
    this.socket.on('player', state => {
      this.playerHandler(state)
    })
    this.socket.on('update', state => {
      this.updateHandler(state)
    })
    this.deckSprites = []
  }

  preload () {
    for (const card of Deck.allCards()) {
      const cardName = Deck.getCardName(card)
      this.load.image(cardName, `assets/${cardName}.png`)
    }
  }

  playerHandler (state) {
    this.id = state.id
    this.deck = Deck.fromExisting(state.deck)
    this.hand = state.hand
    this.collectionPile = state.collectionPile
    this.suit = state.suit
    console.log('state', state)
  }

  updateHandler (state) {
    this.deck = Deck.fromExisting(state.deck)
    this.hand = state.players[this.id].hand
    this.hand = state.players[this.id].collectionPile
  }

  create () {
    this.suitText = this.add.text(50, 50, `SUIT: ${this.suit}`)
  }

  update () {
    for (let i = 0; i < this.deckSprites.length; i++) {
      this.deckSprites[i].destroy()
    }
    this.deckSprites = []
    let deckXPos = 75
    for (let i = 0; i < this.deck.count(); i++) {
      const card = new Card(this, deckXPos += 10, 300, this.deck.get(i))
      this.deckSprites.push(card)
    }
    this.handSprites = []
    let handXPos = 250
    for (let i = 0; i < this.hand.length; i++) {
      const card = new Card(this, handXPos += 50, 500, this.hand[i])
    }
  }
}
