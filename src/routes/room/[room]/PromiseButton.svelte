<script lang="ts">
	export let normalText: string;
	export let loadingText: string;

	export let disabled: boolean | undefined = undefined;

	let currentPromise: Promise<void> | undefined;

	export let onClick: (
		e: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) => Promise<void>;
</script>

{#await currentPromise}
	<button disabled class="big-button">
		{loadingText}
	</button>
{:then _}
	<button
		class="big-button"
		{disabled}
		on:click={(e) => {
			currentPromise = onClick(e);
		}}
	>
		{normalText}
	</button>
{/await}

<style>
	button {
		/* background-color: #1d3354; */
		background-color: #7b4b94;
		color: white;
		/* text-transform: uppercase;
		border: none;
		font-size: 26px;

		margin: 0 8px;
		margin-top: 8px;
		border-radius: 6px;
		padding: 8px; */
	}
</style>
