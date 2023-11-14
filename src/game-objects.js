class GameObject {
  constructor (scene, asset, x, y, scale) {
    this.sprite = scene.add.image(x, y, asset)
    this.x = x
    this.y = y
    this.sprite.setScale(scale)
  }

  destroy () {
    this.sprite.destroy()
  }

  onClick (handler) {
    this.sprite.setInteractive()
    this.sprite.on('pointerup', handler)
  }
}
export class Card extends GameObject {
  static getAsset (suit, value, faceUp) {
    if (faceUp) {
      return `card${suit}${value}`
    }
    return 'cardBack'
  }

  constructor (scene, x, y, card, faceUp = true) {
    super(scene, Card.getAsset(card.suit, card.value, faceUp), x, y, 0.5)
    this.card = card
  }
}

export class Player extends GameObject {
  static getAsset (suit) {
    return `playerIcon${suit}`
  }

  constructor (scene, x, y, player, turn) {
    super(scene, Player.getAsset(player.suit), x, y)
    this.texts = [
      scene.add.text(x - 50, y + 75, `Player ${player.id}`),
      scene.add.text(x - 50, y + 100, `HAND: ${player.hand.length}`),
      scene.add.text(x - 50, y + 125, `COLLECTION PILE: ${player.collectionPile.length}`),
    ]
    this.extraSprites = player.id === turn ? [ scene.add.image(x, y + 175, 'upArrow') ] : []
  }

  destroy () {
    super.destroy()
    for (const text of this.texts) {
      text.destroy()
    }
    for (const extra of this.extraSprites) {
      extra.destroy()
    }
  }
}
