<template>
	<div id="join-the-round" class="container">JoinView</div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
	width: clamp(calc(800px - 4rem), calc(100% - 4rem), 1100px);
	margin: 0 auto;
	@media (max-width: $breakpoint-m) {
		width: 100%;
		background: var(--bg-secondary-color);
	}
}

.grid {
	display: grid;
	grid-template-columns: 1fr clamp(250px, 25%, 360px);
	grid-template-rows: auto 1fr;
	grid-template-areas:
		'title cancel'
		'form progress';
	height: calc(100vh - var($nav-header-height));
	gap: 0 2rem;
	@media (max-width: $breakpoint-m) {
		grid-template-rows: auto auto 1fr auto;
		grid-template-columns: 1fr;
		grid-template-areas:
			'progress'
			'title'
			'form';
		gap: 0;
	}
}

.title-area {
	grid-area: title;
	display: flex;
	padding: 1rem;
	padding-left: 0rem;
	justify-content: space-between;
	align-items: flex-start;
	flex-direction: column;

	h1 {
		font-family: 'Glacial Indifference', sans-serif;
	}

	@media (max-width: $breakpoint-m) {
		margin-top: 6rem;
		padding-bottom: 0;
		padding-left: 1rem;
		font-size: 14px;
		font-weight: normal;
	}
}

.cancel-area {
	grid-area: cancel;
	display: flex;
	justify-content: flex-end;
	align-items: center;

	.cancel-link {
		font-weight: 500;
	}
}

.form-area {
	grid-area: form;
	overflow: auto;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1rem;
	height: 100%;
	@media (min-width: $breakpoint-m) {
		padding: 0;
		width: 100%;
	}
}

.nav-bar {
	position: fixed;
	bottom: 0;
	right: 0;
	left: 0;
	padding: 1.5rem;
	background: var(--bg-primary-color);
	box-shadow: var(--box-shadow);
}

.layout-steps {
	display: flex;
	justify-content: center;
	align-items: flex-start;

	@media (max-width: $breakpoint-m) {
		display: block;
		margin: 0;
	}
}

.step-title {
	font-size: 1.5rem;
	margin-top: 1rem;
	font-weight: 600;
	&:first-of-type {
		margin-top: 0;
	}
}

.application {
	/* height: 100%; */
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	margin-bottom: 2rem;
	overflow: none;
	@media (min-width: $breakpoint-m) {
		background: var(--bg-secondary-color);
		padding: 1.5rem;
		border-radius: 1rem;
		margin-bottom: 4rem;
	}
}

.link {
	font-family: Inter;
	font-size: 16px;
	text-decoration: underline;
}

.cancel-link {
	position: sticky;
	top: 0px;
	color: var(--error-color);
	text-decoration: underline;
}

.inputs {
	margin: 1.5rem 0;
}

.form-background {
	border-radius: 0.5rem;
	padding: 1rem;
	background: var(--bg-light-color);
	margin-top: 1.5rem;
	display: flex;
	flex-direction: column;
	&:last-of-type {
		margin-bottom: 2rem;
	}
	@media (max-width: $breakpoint-m) {
		&:first-of-type {
			margin-top: 0;
		}
	}
}

.input {
	color: var(--text-color);
	border-radius: 16px;
	border: 2px solid var(-button-color);
	background-color: var(--bg-secondary-color);
	margin: 0.5rem 0;
	padding: 0.5rem 1rem;
	font-size: 16px;
	font-family: Inter;
	font-weight: 400;
	line-height: 24px;
	letter-spacing: 0em;
	&:valid {
		border: 2px solid $clr-green;
	}
	&:hover {
		background: var(--bg-primary-color);
		border: 2px solid $highlight-color;
		box-shadow: 0px 4px 16px 0px 25, 22, 35, 0.4;
	}
	&:optional {
		border: 2px solid $button-color;
		background-color: var(--bg-secondary-color);
	}
}

.input.invalid {
	border: 2px solid var(--error-color);
}

.input-description {
	margin-top: 0.25rem;
	font-size: 14px;
	font-family: Inter;
	margin-bottom: 0.5rem;
	line-height: 150%;
}

.input-notice {
	margin-top: 0.25rem;
	font-size: 12px;
	font-family: Inter;
	margin-bottom: 0.5rem;
	line-height: 150%;
	color: var(--attention-color);
	text-transform: uppercase;
	font-weight: 500;
}

.input-label {
	font-family: Inter;
	font-size: 16px;
	font-style: normal;
	font-weight: 500;
	line-height: 24px;
	letter-spacing: 0em;
	text-align: left;
	margin: 0;
}

.radio-row {
	display: flex;
	margin-top: 1rem;
	box-sizing: border-box;
	border: 2px solid $button-color;
	border-radius: 1rem;
	overflow: hidden;
	width: fit-content;
	input {
		position: fixed;
		opacity: 0;
		pointer-events: none;
	}
	input[type='radio']:checked + label {
		background: $clr-pink;
		font-weight: 600;
	}
	@media (max-width: $breakpoint-m) {
		width: 100%;
		flex-direction: column;
		text-align: center;
	}
}

.radio-btn {
	box-sizing: border-box;
	color: var(--text-color);
	font-size: 16px;
	line-height: 24px;
	align-items: center;
	padding: 0.5rem 1rem;
	margin-left: -1px;

	border-right: 2px solid $button-color;
	border-bottom: none;
	@media (max-width: $breakpoint-m) {
		border-right: none;
		border-bottom: 2px solid $button-color;
	}
	&:last-of-type {
		border-right: none;
		border-bottom: none;
	}

	&:hover {
		opacity: 0.8;
		background: var(--bg-secondary-highlight);
		transform: scale(1.04);
		cursor: pointer;
	}
	&:active {
		background: var(--bg-secondary-highlight);
	}
}

.read-only-title {
	line-height: 150%;
	margin: 0;
}

.project-details {
	&:last-child {
		margin-bottom: 0;
	}
}

.summary {
	margin-bottom: 1rem;
	:deep() {
		.markdown {
			h1,
			h2,
			h3,
			h4,
			h5,
			h6,
			p {
				margin: 0.25rem 0;
			}
		}
	}
}

.summary-section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
	border-bottom: 1px solid $highlight-color;
	padding-bottom: 0.5rem;
}

.toggle-tabs-desktop {
	display: flex;
	gap: 2rem;
	font-family: 'Inter';
	@media (max-width: $breakpoint-m) {
		/* flex-direction: column;
      gap: 0;
      margin-left: 0rem; */
		/* display: none; */
	}
	.active-tab {
		padding-bottom: 0.5rem;
		border-bottom: 4px solid $clr-green;
		border-radius: 4px;
		font-weight: 600;
		/* text-decoration: underline; */
	}
	.inactive-tab {
		padding-bottom: 0.5rem;
		cursor: pointer;
		&:hover {
			opacity: 0.8;
			border-bottom: 4px solid rgba(var(--text-color-rgb), 0.467);
			border-radius: 4px;
		}
		/* text-decoration: underline; */
	}
}

.toggle-tabs-mobile {
	display: flex;
	gap: 2rem;
	@media (min-width: $breakpoint-m) {
		/* flex-direction: column;
      gap: 0;
      margin-left: 0rem; */
		display: none;
	}
	.active-tab {
		padding-bottom: 0.5rem;
		border-bottom: 4px solid $clr-green;
		border-radius: 4px;
		font-weight: 600;
		/* text-decoration: underline; */
	}
	.inactive-tab {
		padding-bottom: 0.5rem;
		cursor: pointer;
		&:hover {
			opacity: 0.8;
			transform: scale(1.02);
		}
		/* text-decoration: underline; */
	}
}

.step-subtitle {
	margin: 0.5rem 0;
	font-family: 'Glacial Indifference', sans-serif;
	font-size: 1.5rem;
}

.edit-button {
	font-family: 'Inter';
	font-weight: 500;
	font-size: 16px;
	color: $clr-green;
}

.data {
	opacity: 0.8;
	margin-top: 0.25rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.data img {
	padding: 0.25rem;
	margin-top: 0.25rem;
	&:hover {
		background: var(--bg-primary-color);
		border-radius: 4px;
	}
}

.pt-1 {
	padding-top: 1rem;
}

/* .hr {
    opacity: 0.1;
    height: 1px;
    margin: 1rem 0;
  } */

.tx-value {
}

.fiat-value {
	font-weight: 400;
	opacity: 0.8;
}

.tx-progress-area {
	text-align: center;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 2rem;
}

.checkout {
	margin-bottom: 1rem;
}

.checkout-desktop {
	padding-top: 1.5rem;
	border-top: 1px solid $button-color;
}

.tx-notice {
	margin-top: 0.25rem;
	font-size: 12px;
	font-family: Inter;
	margin-bottom: 0.5rem;
	line-height: 150%;
	text-transform: uppercase;
	font-weight: 500;
}

.break-all {
	@media (max-width: $breakpoint-s) {
		display: block;
	}

	p {
		overflow: hidden;
		text-overflow: ellipsis;
	}
}

.no-break {
	white-space: nowrap;
}

.resolved-address {
	overflow: hidden;
	text-overflow: ellipsis;
	opacity: 0.5;
	word-break: keep-all;
	font-size: 0.875rem;
	margin-top: 0.25rem;
}
</style>
