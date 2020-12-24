import { expect } from 'chai'
import { BigNumber } from 'ethers'

import { MAX_CART_SIZE, CartItem } from '@/api/contributions'
import { mutations } from '@/store'
import { ADD_CART_ITEM, UPDATE_CART_ITEM, REMOVE_CART_ITEM } from '@/store/mutation-types'

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
  it('adds item to cart', () => {
    const item = createItem({ id: '0x1' })
    const state = { cart: [item] }
    const newItem = createItem({ id: '0x2' })
    mutations[ADD_CART_ITEM](state, newItem)
    expect(state.cart.length).to.equal(2)
    expect(state.cart[1]).to.equal(newItem)
  })

  it('does not add item that is already in cart', () => {
    const item = createItem({ id: '0x1' })
    const state = { cart: [item] }
    const newItem = createItem({ id: '0x1', amount: '3.5' })
    expect(() => {
      mutations[ADD_CART_ITEM](state, newItem)
    }).to.throw('item is already in the cart')
    expect(state.cart.length).to.equal(1)
    expect(state.cart[0].amount).to.equal(item.amount)
  })

  it('replaces cleared items', () => {
    const clearedItem1 = createItem({ id: '0x1', isCleared: true })
    const clearedItem2 = createItem({ id: '0x2', isCleared: true })
    const state = { cart: [clearedItem1, clearedItem2] }
    expect(state.cart.length).to.equal(2)

    const newItem1 = createItem({ id: '0x3' })
    mutations[ADD_CART_ITEM](state, newItem1)
    expect(state.cart.length).to.equal(2)
    expect(state.cart[0]).to.equal(newItem1) // Replaced cleared item

    const newItem2 = createItem({ id: '0x4' })
    mutations[ADD_CART_ITEM](state, newItem2)
    expect(state.cart.length).to.equal(2)
    expect(state.cart[1]).to.equal(newItem2)

    const newItem3 = createItem({ id: '0x5' })
    mutations[ADD_CART_ITEM](state, newItem3)
    expect(state.cart.length).to.equal(3)
    expect(state.cart[2]).to.equal(newItem3)
  })

  it('updates cart item', () => {
    const item = createItem({ id: '0x1' })
    const state = { cart: [item] }
    const newItem = createItem({ id: '0x1', amount: '3.5' })
    mutations[UPDATE_CART_ITEM](state, newItem)
    expect(state.cart.length).to.equal(1)
    expect(state.cart[0].amount).to.equal(newItem.amount)
  })

  it('does not update item that is not in cart', () => {
    const item = createItem({ id: '0x1' })
    const state = { cart: [item] }
    const newItem = createItem({ id: '0x2' })
    expect(() => {
      mutations[UPDATE_CART_ITEM](state, newItem)
    }).to.throw('item is not in the cart')
    expect(state.cart.length).to.equal(1)
    expect(state.cart[0].amount).to.equal(item.amount)
  })

  it('removes cart item', () => {
    const item1 = createItem({ id: '0x1' })
    const item2 = createItem({ id: '0x2' })
    const state = { cart: [item1, item2], contribution: BigNumber.from(0) }
    mutations[REMOVE_CART_ITEM](state, item1)
    expect(state.cart.length).to.equal(1)
    expect(state.cart[0].id).to.equal(item2.id)
  })

  it('does not remove item that is not in cart', () => {
    const item = createItem({ id: '0x1' })
    const state = { cart: [item], contribution: BigNumber.from(0) }
    const newItem = createItem({ id: '0x2' })
    expect(() => {
      mutations[REMOVE_CART_ITEM](state, newItem)
    }).to.throw('item is not in the cart')
    expect(state.cart.length).to.equal(1)
    expect(state.cart[0].id).to.equal(item.id)
  })

  it('does not remove item if contribution status is unknown', () => {
    const item = createItem({ id: '0x1' })
    const state = { cart: [item], contribution: null }
    expect(() => {
      mutations[REMOVE_CART_ITEM](state, item)
    }).to.throw('invalid operation')
    expect(state.cart.length).to.equal(1)
  })

  it('clears item during reallocation period', () => {
    const item1 = createItem({ id: '0x1' })
    const item2 = createItem({ id: '0x2' })
    const state = { cart: [item1, item2], contribution: BigNumber.from(1) }
    mutations[REMOVE_CART_ITEM](state, item1)
    expect(state.cart.length).to.equal(2)
    expect(state.cart[0].amount).to.equal('0')
    expect(state.cart[0].isCleared).to.equal(true)
    expect(state.cart[1].amount).to.equal(item2.amount)
    expect(state.cart[1].isCleared).to.equal(false)
  })

  it('removes item during reallocation period if cart size reaches limit', () => {
    const items: CartItem[] = []
    for (let idx = 0; idx < MAX_CART_SIZE - 1; idx++) {
      const item = createItem({ id: `0x${idx}` })
      items.push(item)
    }
    const newItem1 = createItem({ id: '91' })
    const newItem2 = createItem({ id: '92' })
    const state = {
      cart: [...items, newItem1, newItem2],
      contribution: BigNumber.from(1),
    }
    expect(state.cart.length).to.equal(MAX_CART_SIZE + 1)

    mutations[REMOVE_CART_ITEM](state, newItem1)
    expect(state.cart.length).to.equal(MAX_CART_SIZE) // Item removed

    mutations[REMOVE_CART_ITEM](state, newItem2)
    expect(state.cart.length).to.equal(MAX_CART_SIZE) // Item cleared
    expect(state.cart[MAX_CART_SIZE - 1].id).to.equal(newItem2.id)
    expect(state.cart[MAX_CART_SIZE - 1].amount).to.equal('0')
    expect(state.cart[MAX_CART_SIZE - 1].isCleared).to.equal(true)
  })
})
