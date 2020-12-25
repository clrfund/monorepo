import { expect } from 'chai'
import { CartItem } from '@/api/contributions'
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
    mutations[ADD_CART_ITEM](state, newItem)
    expect(state.cart.length).to.equal(1)
    expect(state.cart[0].amount).to.equal(item.amount)
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
    mutations[UPDATE_CART_ITEM](state, newItem)
    expect(state.cart.length).to.equal(1)
    expect(state.cart[0].amount).to.equal(item.amount)
  })

  it('removes cart item', () => {
    const item1 = createItem({ id: '0x1' })
    const item2 = createItem({ id: '0x2' })
    const state = { cart: [item1, item2] }
    mutations[REMOVE_CART_ITEM](state, item1)
    expect(state.cart.length).to.equal(1)
    expect(state.cart[0].id).to.equal(item2.id)
  })

  it('does not remove item that is not in cart', () => {
    const item = createItem({ id: '0x1' })
    const state = { cart: [item] }
    const newItem = createItem({ id: '0x2' })
    mutations[REMOVE_CART_ITEM](state, newItem)
    expect(state.cart.length).to.equal(1)
    expect(state.cart[0].id).to.equal(item.id)
  })
})
