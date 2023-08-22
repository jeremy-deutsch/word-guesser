<script lang="ts">
	export const prerender = true;

	import { goto } from "$app/navigation";
	import { navigating } from "$app/stores";

	const roomCodeCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	const roomCodeRegex = new RegExp(
		`[${roomCodeCharacters}${roomCodeCharacters.toLowerCase()}]{6}`
	);

	let nameInputValue = "";

	let roomCodeInputValue = "";

	$: validRoomCode =
		roomCodeInputValue.length === 6 && roomCodeRegex.test(roomCodeInputValue);
</script>

<main>
	<label>
		Name: <input bind:value={nameInputValue} disabled={!!$navigating} />
	</label>

	<form
		on:submit|preventDefault={() => {
			if (nameInputValue && validRoomCode && !$navigating) {
				goto(
					`/room/${roomCodeInputValue.toUpperCase()}?name=${nameInputValue}`
				);
			}
		}}
	>
		<label>
			Room code:
			<input bind:value={roomCodeInputValue} disabled={!!$navigating} />
		</label>

		<input
			type="submit"
			disabled={!nameInputValue || !validRoomCode || !!$navigating}
			aria-hidden="true"
			style:visibility="hidden"
			style:position="absolute"
		/>
	</form>

	<button
		class="big-button create-button"
		disabled={!nameInputValue || !!$navigating}
		on:click={() => {
			if (!nameInputValue || $navigating) {
				return;
			}

			let newRoomCode = "";
			for (let i = 0; i < 6; i++) {
				newRoomCode +=
					roomCodeCharacters[
						Math.floor(Math.random() * roomCodeCharacters.length)
					];
			}

			goto(`room/${newRoomCode.toUpperCase()}?name=${nameInputValue}`);
		}}>Create</button
	>

	<a
		href={`/room/${roomCodeInputValue.toUpperCase()}?name=${nameInputValue}`}
		data-sveltekit-preload-data="tap"
		class="big-button join-button"
		aria-disabled={!validRoomCode || !!$navigating}
		tabindex={validRoomCode ? 0 : -1}>Join</a
	>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
	}

	label {
		display: flex;
		gap: 6px;
		padding: 0 8px;
		padding-top: 8px;
		font-size: 22px;
		align-items: center;
	}

	input {
		min-width: 0;
	}

	.create-button {
		background-color: #7dc95e;
		color: inherit;
	}

	.join-button {
		text-decoration: none;
		text-align: center;
		background-color: #ffc145;
		color: inherit;
	}

	.join-button[aria-disabled="true"] {
		pointer-events: none;
	}
</style>
