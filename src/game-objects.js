class GameObject {
  constructor(scene, asset, x, y, scale) {
    this.sprite = scene.add.sprite(x, y, asset)
    this.x = x
    this.y = y
    this.sprite.setScale(scale)
  }

  destroy() {
    this.sprite.destroy()
  }
}
export class Card extends GameObject {
  static getAsset(suit, value) {
    return `card${suit}${value}`
  }

  constructor(scene, x, y, card) {
    super(scene, Card.getAsset(card.suit, card.value), x, y, 0.5)
  }
}

