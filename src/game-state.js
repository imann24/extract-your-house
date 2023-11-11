import { v4 as uuidv4 } from 'uuid';

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
    this.sessionId = uuidv4().toString()
    this.deck = new Deck()
    this.deck.shuffle()
    this.players = []
    this.unclaimedSuits = ArrayUtil.shuffle(Deck.allSuits())
    this.turn = 0
    this.startingPlayer = 0 // for the current trick
    this.tick = 0
    this.playedCards = {} // paired with player
    this.cardsInOrder = [] // array of played cards in order
    this.playersInOrder = []  // array of players matched with theirs cards in order
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

  // TODO: refactor getPlayerState into getState
  getPlayerState (playerId) {
    return {
      id: playerId,
      sessionId: this.sessionId,
      deck: this.deck,
      hand: this.getPlayer(playerId).hand,
      collectionPile: this.getPlayer(playerId).collectionPile,
      suit: this.getPlayer(playerId).suit,
      turn: this.turn,
      playedCards: this.playedCards,
      // This isn't techincally the individual player state but whatever:
      players: this.players
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

  getPlayer (playerId) {
    // playerId may be a string in some cases:
    return this.players[parseInt(playerId)]
  }

  playCard (playerId, card) {
    this.playedCards[playerId] = card
    this.cardsInOrder.push(card)
    this.playersInOrder.push(playerId)
    this.getPlayer(playerId).hand = this.getPlayer(playerId).hand.filter(c => !Deck.sameCard(c, card))
    console.log('cards left in hand', this.getPlayer(playerId).hand)
  }

  nextTurn () {
    this.turn ++
    this.turn %= this.players.length
    this.tick ++
  }

  roundOver () {
    return Object.entries(this.playedCards).length === this.players.length
  }

  getplayerTurnOrder (playerId) {
    if (playerId >= this.startingPlayer) {      
      return (playerId - this.startingPlayer)  
    }
    else {
      return this.players.length - (this.startingPlayer - playerId)
    }
  }

  scoreCard (card, playerId) {
    let ownSuitBonus = this.getPlayerState(playerId).suit == card.suit ? 1 : 0 
    return Deck.allValues().indexOf(card.value) + ownSuitBonus
  }

  assignRoundWinner () {
    let leadingPlayer
    let leadingScore = -1

    // so this should ensure that ties go to earlier players in round
    for (let i = 0; i < this.players.length; i++) {
      console.log('card ', this.cardsInOrder[i])

      const currentScore = this.scoreCard(this.cardsInOrder[i], this.playersInOrder[i])
      console.log('player ', this.playersInOrder[i], "score", currentScore)

      if (currentScore > leadingScore) {
        leadingPlayer = this.playersInOrder[i]
        leadingScore = currentScore
        console.log('leadingplayer ', leadingPlayer, "leadingScore", leadingScore)

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
    this.getPlayer(roundWinner).collectionPile.push(...Object.values(this.playedCards))
    this.playedCards = {}
    this.cardsInOrder = []
    this.playersInOrder = []
    for (let i = 0; i < this.players.length; i++) {
      // stop dealing if deck is empty
      if (this.deck.empty()) {
        break
      }

      this.players[i].hand.push(this.deck.deal())
    }
    this.startingPlayer = this.getPlayer(roundWinner).id // id is order number for now so 
    this.turn = this.startingPlayer
    this.tick ++
  }

  gameOver () {
    let cardActuallyInHand = false
    const playersWithCardsInHand = this.players.filter(p => {
      if (p.hand.length > 0) {
        cardActuallyInHand = true
        return true
      }
      // also count if the player has played a card this turn:
      return !!this.playedCards[p.id]
    })
    return this.deck.empty() && (playersWithCardsInHand.length <= 1 || !cardActuallyInHand)
  }

  handleGameOver () {
    this.tick ++
  }
  
  scoreCollectionPile (playerId) {
    const player = this.getPlayer(playerId)
    let points = 0
    for (const card of player.collectionPile) {
      if (player.suit === card.suit) {
        points ++
      }
    }
    return points
  }

  getWinner () {
    let leadingPlayer
    let leadingScore = -1
    for (const player of this.players) {
      const playerScore = this.scoreCollectionPile(player.id)
      // TODO: handle tie logic
      if (playerScore > leadingScore) {
        leadingPlayer = player
        leadingScore = playerScore
      }
    }
    return leadingPlayer
  }

  validRejoin (playerInfo) {
    if (!playerInfo.playerId || !playerInfo.sessionId) {
      return false
    }
    return !!this.players[parseInt(playerInfo.playerId)] && this.sessionId === playerInfo.sessionId
  }
}
