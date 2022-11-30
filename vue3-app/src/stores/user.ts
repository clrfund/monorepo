import type { User } from '@/api/user'
import { defineStore } from 'pinia'

export type UserState = {
	currentUser: User | null
}

export const useUserStore = defineStore('user', {
	state: (): UserState => ({
		currentUser: null,
	}),
	getters: {},
	actions: {},
})
