import { BigNumber } from 'ethers'
import { expect } from 'vitest'

import { setActivePinia, createPinia } from 'pinia'
import { MAX_CART_SIZE, type CartItem } from '@/api/contributions'
import { useAppStore } from '../app'

function createItem(props: any): CartItem {
  return {
    id: '0x1',
    address: '0x1',
    name: 'test',
    description: 'test',
    imageUrl: '',
    index: 1,
    isHidden: false,
    isLocked: false,
    amount: '10.0',
    isCleared: false,
    ...props,
  }
}

describe('Cart mutations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  it('adds item to cart', () => {
    const appStore = useAppStore()

    const item = createItem({ id: '0x1' })
    appStore.$patch({ cart: [item] })
    const newItem = createItem({ id: '0x2' })
    appStore.addCartItem(newItem)
    expect(appStore.cart.length).to.equal(2)
    expect(appStore.cart[1]).toEqual(newItem)
  })

  it('replaces the item if it is already in cart', () => {
    const appStore = useAppStore()
    const item = createItem({ id: '0x1' })
    appStore.$patch({ cart: [item] })
    const newItem = createItem({ id: '0x1', amount: '3.5' })
    appStore.addCartItem(newItem)
    expect(appStore.cart.length).to.equal(1)
    expect(appStore.cart[0].amount).to.equal(newItem.amount)
  })

  it('replaces cleared items', () => {
    const appStore = useAppStore()
    const clearedItem1 = createItem({ id: '0x1', isCleared: true })
    const clearedItem2 = createItem({ id: '0x2', isCleared: true })
    appStore.$patch({ cart: [clearedItem1, clearedItem2] })
    expect(appStore.cart.length).to.equal(2)

    const newItem1 = createItem({ id: '0x3' })
    appStore.addCartItem(newItem1)
    expect(appStore.cart.length).to.equal(2)
    expect(appStore.cart[0]).toEqual(newItem1) // Replaced cleared item

    const newItem2 = createItem({ id: '0x4' })
    appStore.addCartItem(newItem2)
    expect(appStore.cart.length).to.equal(2)
    expect(appStore.cart[1]).toEqual(newItem2)

    const newItem3 = createItem({ id: '0x5' })
    appStore.addCartItem(newItem3)

    expect(appStore.cart.length).to.equal(3)
    expect(appStore.cart[2]).toEqual(newItem3)
  })

  it('updates cart item', () => {
    const appStore = useAppStore()
    const item = createItem({ id: '0x1' })
    appStore.$patch({ cart: [item] })
    const newItem = createItem({ id: '0x1', amount: '3.5' })
    appStore.addCartItem(newItem)
    expect(appStore.cart.length).to.equal(1)
    expect(appStore.cart[0].amount).to.equal(newItem.amount)
  })

  it('does not update item that is not in cart', () => {
    const appStore = useAppStore()
    const item = createItem({ id: '0x1', amount: '1' })
    appStore.$patch({ cart: [item] })
    const newItem = createItem({ id: '0x2' })
    expect(() => {
      appStore.updateCartItem(newItem)
    }).toThrowError('item is not in the cart')
    //expect(appStore.cart.length).to.equal(1)
    //expect(appStore.cart[0].amount).to.equal(item.amount)
  })

  it('removes cart item', () => {
    const appStore = useAppStore()
    const item1 = createItem({ id: '0x1' })
    const item2 = createItem({ id: '0x2' })
    appStore.$patch({ cart: [item1, item2], contribution: BigNumber.from(0) })
    appStore.removeCartItem(item1)
    expect(appStore.cart.length).to.equal(1)
    expect(appStore.cart[0].id).to.equal(item2.id)
  })

  it('does not remove item that is not in cart', () => {
    const appStore = useAppStore()
    const item = createItem({ id: '0x1' })
    appStore.$patch({ cart: [item], contribution: BigNumber.from(0) })
    const newItem = createItem({ id: '0x2' })
    expect(() => {
      appStore.removeCartItem(newItem)
    }).toThrowError('item is not in the cart')
    expect(appStore.cart.length).to.equal(1)
    expect(appStore.cart[0].id).to.equal(item.id)
  })

  it('does not remove item if contribution status is unknown', () => {
    const appStore = useAppStore()
    const item = createItem({ id: '0x1' })
    appStore.$patch({ cart: [item], contribution: null })
    expect(() => {
      appStore.removeCartItem(item)
    }).to.throw('invalid operation')
    expect(appStore.cart.length).to.equal(1)
  })

  it('clears item during reallocation period', () => {
    const appStore = useAppStore()
    const item1 = createItem({ id: '0x1' })
    const item2 = createItem({ id: '0x2' })
    appStore.$patch({ cart: [item1, item2], contribution: BigNumber.from(1) })
    appStore.removeCartItem(item1)
    expect(appStore.cart.length).to.equal(2)
    expect(appStore.cart[0].amount).to.equal('0')
    expect(appStore.cart[0].isCleared).to.equal(true)
    expect(appStore.cart[1].amount).to.equal(item2.amount)
    expect(appStore.cart[1].isCleared).to.equal(false)
  })

  it('removes item during reallocation period if cart size reaches limit', () => {
    const appStore = useAppStore()
    const items: CartItem[] = []
    for (let idx = 0; idx < MAX_CART_SIZE - 1; idx++) {
      const item = createItem({ id: `0x${idx}` })
      items.push(item)
    }
    const newItem1 = createItem({ id: '91' })
    const newItem2 = createItem({ id: '92' })
    appStore.$patch({
      cart: [...items, newItem1, newItem2],
      contribution: BigNumber.from(1),
    })
    expect(appStore.cart.length).to.equal(MAX_CART_SIZE + 1)

    appStore.removeCartItem(newItem1)
    expect(appStore.cart.length).to.equal(MAX_CART_SIZE) // Item removed

    appStore.removeCartItem(newItem2)
    expect(appStore.cart.length).to.equal(MAX_CART_SIZE) // Item cleared
    expect(appStore.cart[MAX_CART_SIZE - 1].id).to.equal(newItem2.id)
    expect(appStore.cart[MAX_CART_SIZE - 1].amount).to.equal('0')
    expect(appStore.cart[MAX_CART_SIZE - 1].isCleared).to.equal(true)
  })
})

describe('committedCart Mutations', () => {
  it('restores committedCart into local cart', () => {
    const appStore = useAppStore()
    const item = createItem({ id: '0x1' })
    appStore.$patch({
      cart: [],
      committedCart: [item],
    })

    appStore.restoreCommittedCartToLocalCart()
    expect(appStore.cart).to.deep.equal(appStore.committedCart)
  })

  it('saves local cart into committedCart', () => {
    const appStore = useAppStore()
    const item = createItem({ id: '0x1' })
    appStore.$patch({
      cart: [item],
      committedCart: [],
    })

    appStore.saveCommittedCart()
    expect(appStore.committedCart).to.deep.equal(appStore.cart)
  })
})
