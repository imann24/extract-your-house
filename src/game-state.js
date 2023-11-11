import { PLAYER_MAX, CARDS_TO_DEAL } from './game-rules.js'
import Deck from './deck.js'
import ArrayUtil from './array-util.js'

class Player {
  constructor (id, suit) {
    this.id = id
    this.hand = []
    this.collectionPile = []
    this.suit = suit
  }
}
export default class GameState {
  constructor (id) {
    this.id = id
    this.deck = new Deck()
    this.deck.shuffle()
    this.players = []
    this.unclaimedSuits = ArrayUtil.shuffle(Deck.allSuits())
    this.turn = 0
    this.tick = 0
    this.playedCards = {}
  }

  canAddPlayer () {
    return this.players.length < PLAYER_MAX
  }

  addPlayer () { 
    // use player count as the id for a new player
    const player = new Player(this.players.length, this.unclaimedSuits.pop())
    for (let i = 0; i < CARDS_TO_DEAL; i++) {
      player.hand.push(this.deck.deal())
    }
    this.players.push(player)
    return this.getPlayerState(player.id)
  }

  getPlayerState (playerId) {
    return {
      id: playerId,
      deck: this.deck,
      hand: this.players[playerId].hand,
      collectionPile: this.players[playerId].collectionPile,
      suit: this.players[playerId].suit,
      turn: this.turn,
    }
  }

  getState () {
    return {
      deck: this.deck,
      players: this.players,
      turn: this.turn,
      // count up every time we update state
      tick: this.tick,
      playedCards: this.playedCards,
    }
  }

  playCard (playerId, card) {
    this.playedCards[playerId] = card
    this.players[playerId].hand = this.players[playerId].hand.filter(c => !Deck.sameCard(c, card))
    console.log('cards left in hand', this.players[playerId].hand)
  }

  nextTurn () {
    this.turn ++
    this.turn %= this.players.length
    this.tick ++
    console.log('turn', this.turn)
  }

  roundOver () {
    return Object.entries(this.playedCards).length === this.players.length
  }

  scoreCard (card) {
    // TODO: this needs to factor in leading suit and other factors:
    return Deck.allValues().indexOf(card.value)
  }

  assignRoundWinner () {
    // TODO: need to add logic for which player started trick
    let leadingPlayer
    let leadingScore = 0
    for (const [player, card] of Object.entries(this.playedCards)) {
      const currentScore = this.scoreCard(card)
      if (currentScore > leadingScore) {
        leadingPlayer = player
        leadingScore = currentScore
      }
    }
    return leadingPlayer
  }

  roundResults () {
    return {
      winner: this.assignRoundWinner(),
      // TODO: factor in powers here too, not just cards played
      cards: Object.values(this.playedCards)
    }
  }

  nextRound (roundWinner) {
    this.players[parseInt(roundWinner)].collectionPile.push(...Object.values(this.playedCards))
    this.playedCards = {}
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].hand.push(this.deck.deal())
    }
  }
}
