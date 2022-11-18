import { defineStore } from 'pinia'
import { CartItem } from '@/api/contributions'

export type CartState = {
	cart: CartItem[]
	cartEditModeSelected: boolean
	committedCart: CartItem[]
}

export const useCartStore = defineStore('cart', {
	state: (): CartState => ({
		cart: new Array<CartItem>(),
		cartEditModeSelected: false,
		committedCart: new Array<CartItem>(),
	}),
	getters: {},
	actions: {},
})
