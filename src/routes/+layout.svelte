<script>
	import "@fontsource-variable/roboto-slab";
</script>

<slot />

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(body, button, input) {
		font-family: "Roboto Slab Variable", sans-serif;
	}

	:global(body) {
		margin: 0;
	}

	:global(.big-button) {
		text-transform: uppercase;
		border: none;
		font-size: 26px;

		margin: 0 8px;
		margin-top: 8px;
		border-radius: 6px;
		padding: 8px;
	}

	:global(.big-button:disabled, .big-button[aria-disabled="true"]) {
		opacity: 0.7;
	}

	:global(input) {
		font-size: 22px;
		flex: 1;
		border-radius: 6px;
		padding: 2px 4px;
	}
</style>
