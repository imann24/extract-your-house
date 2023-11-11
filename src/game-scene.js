import Phaser from 'phaser'
import Deck from './deck.js'
import { Card } from './game-objects.js'

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
    this.playedSprites = []
    this.playedTexts = []
    this.collectionPileSprites = []
    this.lastDrawnTick = -1
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
    this.playedCards = {}
    console.log('START state', state)
  }

  updateHandler (state) {
    this.deck = Deck.fromExisting(state.deck)
    this.hand = state.players[this.id].hand
    this.collectionPile = state.players[this.id].collectionPile
    this.turn = state.turn
    this.tick = state.tick
    this.playedCards = state.playedCards
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
    this.deckText = this.add.text(50, 150, 'PLAYED:')
    this.deckText = this.add.text(50, 350, 'DECK:')
    this.handText = this.add.text(50, 550, 'HAND:')
    this.collectionPile = this.add.text(50, 750, 'COLLECTION PILE:')
    this.updateTurnText()
  }

  update () {
    // prevent unecessary updates:
    if (this.lastDrawnTick === this.tick) {
      return
    }

    this.updateTurnText()
    for (let i = 0; i < this.playedSprites.length; i++) {
      this.playedSprites[i].destroy()
      this.playedTexts[i].destroy()
    }
    // lazy hack: recreate the entire deck every frame in case there were any updates
    for (let i = 0; i < this.deckSprites.length; i++) {
      this.deckSprites[i].destroy()
    }
    for (let i = 0; i < this.handSprites.length; i++) {
      this.handSprites[i].destroy()
    }
    for (let i = 0; i< this.collectionPileSprites.length; i++) {
      this.collectionPileSprites[i].destroy()
    }
    
    this.playedSprites = []
    this.playedTexts = []
    this.deckSprites = []
    this.handSprites = []

    let playedXPos = 50
    for (const [player, card] of Object.entries(this.playedCards)) {
      const cardSprite = new Card(this, playedXPos + 37.5, 225, card)
      this.playedSprites.push(cardSprite)
      const playerText = this.add.text(playedXPos, 275, `Player ${player}`)
      this.playedTexts.push(playerText)
      playedXPos += 125
    }
    let deckXPos = 75
    for (let i = 0; i < this.deck.count(); i++) {
      const card = new Card(this, deckXPos += 10, 425, this.deck.get(i))
      this.deckSprites.push(card)
    }
    let handXPos = 35
    for (let i = 0; i < this.hand.length; i++) {
      const card = new Card(this, handXPos += 50, 625, this.hand[i])
      card.onClick(() => {
        if (this.playerTurn()) {
          this.socket.emit('play-card', this.hand[i])
        }
      })
      this.handSprites.push(card)
    }
    let collectionPileXPos = 35
    for (let i = 0; i < this.collectionPile.length; i++) {
      const card = new Card(this, collectionPileXPos += 50, 825, this.collectionPile[i])
      this.collectionPileSprites.push(card)
    }

    this.lastDrawnTick = this.tick
  }
}
