<template>
	<span>
		<span :class="valueClass || 'value'">
			{{ values[0] }}
		</span>
		<span :class="unitClass || 'unit'">
			{{ units[0] }}
		</span>
		<span v-if="units[1].length > 0">
			<span :class="valueClass || 'value'">
				{{ values[1] }}
			</span>
			<span :class="unitClass || 'unit'">
				{{ units[1] }}
			</span>
		</span>
	</span>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { DateTime } from 'luxon'

import { getTimeLeft } from '@/utils/dates'
import { TimeLeft } from '@/api/round'

interface Props {
	date: DateTime
	valueClass?: string
	unitClass?: string
}

const props = defineProps<Props>()

const timeLeft = ref<TimeLeft>(getTimeLeft(props.date))
let interval: any
onMounted(() => {
	interval = setInterval(() => {
		timeLeft.value = getTimeLeft(props.date)
	}, 1000)
})

onBeforeUnmount(() => {
	clearInterval(interval)
})

const values = computed(() => {
	if (timeLeft.value.days > 0) return [timeLeft.value.days, timeLeft.value.hours]
	if (timeLeft.value.hours > 0) return [timeLeft.value.hours, timeLeft.value.minutes]
	if (timeLeft.value.minutes > 5) return [timeLeft.value.minutes, 0]
	if (timeLeft.value.minutes > 0) return [timeLeft.value.minutes, timeLeft.value.seconds]
	if (timeLeft.value.seconds > 0) return [timeLeft.value.seconds, 0]
	return [0, 0]
})

const units = computed<string[]>(() => {
	if (timeLeft.value.days > 0) return [unitPlurality('days'), unitPlurality('hours')]
	if (timeLeft.value.hours > 0) return [unitPlurality('hours'), unitPlurality('minutes')]
	if (timeLeft.value.minutes > 5) return [unitPlurality('minutes'), '']
	if (timeLeft.value.minutes > 0) return [unitPlurality('minutes'), unitPlurality('seconds')]
	if (timeLeft.value.seconds > 0) return [unitPlurality('seconds'), '']
	return [unitPlurality('days'), unitPlurality('hours')]
})

function unitPlurality(pluralUnit: string): string {
	// @ts-ignore
	return timeLeft.value[pluralUnit] !== 1 ? `${pluralUnit}` : `${pluralUnit.substring(0, pluralUnit.length - 1)}`
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.value {
	font-size: 24px;
	font-family: 'Glacial Indifference', sans-serif;
	font-weight: 700;
	line-height: 120%;

	&.large {
		font-size: 32px;
		line-height: 120%;
	}

	&.extra {
		font-size: 32px;
		font-family: 'Glacial Indifference', sans-serif;
		color: white;
		line-height: 120%;
	}
}

.unit {
	font-family: 'Glacial Indifference', sans-serif;
	font-size: 16px;
	font-weight: 600;
	text-transform: uppercase;
	line-height: 150%;
	margin: 0 0.25rem;

	&:last-child {
		margin-right: 0;
	}
}

.flex {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}
</style>
