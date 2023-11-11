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
    this.handSprites = []
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
    this.turn = state.turn
    console.log('START state', state)
  }

  updateHandler (state) {
    this.deck = Deck.fromExisting(state.deck)
    this.hand = state.players[this.id].hand
    this.collectionPile = state.players[this.id].collectionPile
    this.turn = state.turn
    console.log('UPDATE state', state)
  }

  playerTurn () {
    return this.turn === this.id
  }

  updateTurnText () {
    if (this.turnText) this.turnText.destroy()
    this.turnText = this.add.text(50, 100, this.playerTurn() ? `TURN: ${this.turn} (yours)` : `TURN: ${this.turn}`)
  }

  create () {
    this.suitText = this.add.text(50, 50, `SUIT: ${this.suit}`)
    this.playerText = this.add.text(50, 75, `PLAYER: ${this.id}`)
    this.updateTurnText()
  }

  update () {
    this.updateTurnText()
    for (let i = 0; i < this.deckSprites.length; i++) {
      this.deckSprites[i].destroy()
    }
    // for (let i = 0; i < this.handSprites.length; i++) {
      // this.handSprites[i].destroy()
    // }
    this.deckSprites = []
    // this.handSprites = []
    let deckXPos = 75
    for (let i = 0; i < this.deck.count(); i++) {
      const card = new Card(this, deckXPos += 10, 300, this.deck.get(i))
      this.deckSprites.push(card)
    }
    let handXPos = 250
    for (let i = 0; i < this.hand.length; i++) {
      if (this.handSprites.length > i && Deck.sameCard(this.handSprites[i].card, this.hand[i])) {
        // console.log('SKIPPING', this.hand[i])
        continue
      }
      console.log('RECREATING', this.hand[i])
      const card = new Card(this, handXPos += 50, 500, this.hand[i])
      card.onClick(() => {
        if (this.playerTurn()) {
          this.socket.emit('play-card', this.hand[i])
          card.destroy()
        }
      })
      this.handSprites.push(card)
    }
  }
}
