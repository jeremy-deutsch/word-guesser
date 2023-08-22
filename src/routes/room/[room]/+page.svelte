<script lang="ts">
	export const ssr = false;
	import type { PageData } from "./$types";
	import PromiseButton from "./PromiseButton.svelte";
	import editIcon from "$lib/assets/pen-to-square-solid.svg";
	import xMark from "$lib/assets/xmark-solid.svg";
	import undoIcon from "$lib/assets/rotate-left-solid.svg";

	export let data: PageData;

	const { send, stateReadable } = data;

	let writtenClue = "";

	$: {
		if ($stateReadable.mode.type !== "writing") {
			writtenClue = "";
		}
	}

	let clueField: HTMLInputElement | undefined;
</script>

<!-- Host: {$stateReadable.players[$stateReadable.hostId]} -->

<main>
	<div class="top-bar">
		<div class="room-code-container">
			<div class="room-code">{data.room}</div>
			<div class="room-code-label">Room Code</div>
		</div>
		<div class="room-code-container">
			<div class="room-code">{$stateReadable.points}</div>
			<div class="room-code-label">Score</div>
		</div>
	</div>

	{#if $stateReadable.mode.type === "waiting"}
		<ul class="player-list">
			{#each Object.values($stateReadable.players) as player}
				<li class="player-list-item">{player}</li>
			{/each}
		</ul>

		{#if $stateReadable.hostId === data.id}
			<PromiseButton
				disabled={Object.keys($stateReadable.players).length < 3}
				normalText="Start game"
				loadingText="Loading..."
				onClick={() => data.send({ type: "start_game" })}
			/>
		{/if}
	{:else if $stateReadable.mode.type === "writing"}
		<ul class="player-list">
			{#each $stateReadable.playerOrder as playerId}
				{#if playerId !== $stateReadable.mode.guesser}
					<li class="player-list-item">
						{$stateReadable.players[playerId]}:
						{#if $stateReadable.mode.clues[playerId] != null}
							done
						{:else}
							writing...
						{/if}
					</li>
				{/if}
			{/each}
		</ul>
		{#if $stateReadable.mode.guesser === data.id}
			<div class="instructions">Wait for the other players to write clues!</div>
		{:else}
			<div class="word-to-guess-wrapper">
				The word is
				<span class="word-to-guess">{$stateReadable.mode.word}</span>.
			</div>

			{@const hasSubmittedClue = $stateReadable.mode.clues[data.id] != null}
			<form
				class="clue-input-form"
				on:submit|preventDefault={() => {
					if (!hasSubmittedClue) {
						send({ type: "set_clue", clue: writtenClue }, (state) => {
							if (state.mode.type === "writing") {
								state.mode.clues[data.id] = writtenClue;
							}
						});
					}
				}}
			>
				<div class="clue-input-wrapper">
					<input
						bind:this={clueField}
						bind:value={writtenClue}
						disabled={hasSubmittedClue}
						placeholder="Write a clue"
					/>
					{#if hasSubmittedClue}
						<button
							on:click={() => {
								send({ type: "clear_clue" }, (state) => {
									if (state.mode.type === "writing") {
										delete state.mode.clues[data.id];
									}
								});
								// Focus the field after the state updates
								setTimeout(() => {
									clueField?.focus();
								}, 0);
							}}
						>
							<img alt="edit clue" src={editIcon} />
						</button>
					{/if}
				</div>
				{#if !hasSubmittedClue}
					<input
						class="submit-clue-button big-button"
						type="submit"
						value="Submit clue"
						disabled={!writtenClue}
					/>
				{/if}
			</form>
		{/if}
	{:else if $stateReadable.mode.type === "checking"}
		{#if $stateReadable.mode.guesser === data.id}
			<ul class="player-list">
				{#each $stateReadable.playerOrder as playerId}
					{#if playerId !== $stateReadable.mode.guesser}
						<li class="player-list-item">
							{$stateReadable.players[playerId]}
						</li>
					{/if}
				{/each}
			</ul>
			<div class="instructions">
				Wait for the other players to decide which clues are ok!
			</div>
		{:else}
			<div class="word-to-guess-wrapper">
				The word is
				<span class="word-to-guess">{$stateReadable.mode.word}</span>.
			</div>

			<div class="instructions">Review the clues!</div>
			<ul class="player-list">
				{#each Object.entries($stateReadable.mode.clues) as [playerId, clue]}
					{@const isClueMarked =
						$stateReadable.mode.badClues.includes(playerId)}
					<li class="player-list-item">
						{$stateReadable.players[playerId]}:
						<span
							class="clue-to-review"
							style:text-decoration-line={isClueMarked ? "line-through" : ""}
						>
							{clue}
						</span>
						{#if isClueMarked}
							<button
								class="mark-clue-button unmark"
								on:click={() => {
									send(
										{ type: "unmark_clue", clueOwner: playerId },
										(state) => {
											if (state.mode.type === "checking") {
												state.mode.badClues = state.mode.badClues.filter(
													(id) => id !== playerId
												);
											}
										}
									);
								}}><img src={undoIcon} alt="unmark clue" /></button
							>
						{:else}
							<button
								class="mark-clue-button mark"
								on:click={() => {
									send({ type: "mark_clue", clueOwner: playerId }, (state) => {
										if (state.mode.type === "checking") {
											state.mode.badClues.push(playerId);
										}
									});
								}}><img src={xMark} alt="mark clue" /></button
							>
						{/if}
					</li>
				{/each}
			</ul>

			<PromiseButton
				normalText="Continue"
				loadingText="Loading..."
				onClick={() => send({ type: "reveal_clues" })}
			/>
			<!-- <button on:click={() => send({ type: "reveal_clues" })}>Continue</button> -->
		{/if}
	{:else if $stateReadable.mode.type === "guessing"}
		{#if $stateReadable.mode.guesser !== data.id}
			<div class="word-to-guess-wrapper">
				The word is
				<span class="word-to-guess">{$stateReadable.mode.word}</span>.
			</div>
		{:else}
			<div class="clues-title">Clues:</div>
		{/if}

		<ul class="player-list">
			{#each Object.entries($stateReadable.mode.validClues) as [playerId, clue]}
				<li class="player-list-item">
					{$stateReadable.players[playerId]}:
					{#if clue != null}
						{clue}
					{:else}
						invalid clue!
					{/if}
				</li>
			{/each}
		</ul>

		{#if data.id === $stateReadable.mode.guesser}
			<button
				class="guessed-right-button big-button"
				on:click={() => send({ type: "win_round" })}>Guessed right</button
			>
			<button
				class="guessed-wrong-button big-button"
				on:click={() => send({ type: "lose_round" })}>Guessed wrong</button
			>
		{/if}
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;

		--standard-padding: 8px;
	}

	.top-bar {
		display: flex;
		padding: 6px;
		justify-content: space-evenly;
	}

	.room-code-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		/* padding: 6px; */
	}

	.room-code-label {
		text-transform: uppercase;
		font-size: 12px;
		margin-top: -2px;
	}

	.room-code {
		font-size: 24px;
	}

	.player-list {
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 8px;
	}

	.player-list-item {
		padding: 8px 8px;
		font-size: 24px;
		display: flex;
		align-items: center;
	}

	.player-list-item:nth-of-type(1) {
		background-color: #b8b8d1;
	}
	.player-list-item:nth-of-type(2) {
		background-color: #ffc145;
	}
	.player-list-item:nth-of-type(3) {
		background-color: #a7bed3;
	}
	.player-list-item:nth-of-type(4) {
		background-color: #ff6b6c;
	}
	.player-list-item:nth-of-type(5) {
		background-color: #7dc95e;
	}

	.instructions {
		padding: 8px var(--standard-padding);
		font-size: 20px;
	}

	.word-to-guess-wrapper {
		padding: var(--standard-padding);
		font-size: 24px;
	}

	.word-to-guess {
		position: relative;
		display: inline-flex;
		flex-direction: column;
	}

	.word-to-guess::before {
		content: "";
		position: absolute;
		height: 2px;
		background-color: black;
		align-self: center;
		top: 92%;
		width: 95%;
		left: 2%;
		border-radius: 1px;
	}

	.word-to-guess::after {
		content: "";
		position: absolute;
		height: 2px;
		background-color: black;
		align-self: center;
		top: 102%;
		width: 86%;
		left: 6%;
		border-radius: 1px;
	}

	.clue-input-form {
		display: flex;
		flex-direction: column;
		padding: 8px 0;
	}

	.clue-input-wrapper {
		padding: 0 var(--standard-padding);

		display: flex;
		/* gap: 2px; */
	}

	/* .clue-input-wrapper input {
		font-size: 22px;
		flex: 1;
		border-radius: 6px;
		padding: 2px 4px;
	} */

	.clue-input-wrapper input:disabled {
		font-size: 22px;
		flex: 1;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		border-right: none;
	}

	.clue-input-wrapper button {
		width: 50px;
		background-color: #ff6b6c;
		border-radius: 6px;
		border: none;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		padding-bottom: 2px;
	}

	.clue-input-wrapper button img {
		max-height: 80%;
		max-width: 80%;
	}

	.submit-clue-button {
		background-color: #648767;
		color: white;
	}

	.clue-to-review {
		padding: 0 3px;
		text-decoration-thickness: 4px;
	}

	.mark-clue-button {
		width: 25px;
		height: 25px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: none;
		padding: 6px;
		margin-left: 4px;
	}

	.mark-clue-button.mark {
		background-color: #ff6b6c;
	}

	.mark-clue-button.unmark {
		background-color: #5da271;
	}

	.clues-title {
		padding: 0 var(--standard-padding);
		font-size: 24px;
	}

	.guessed-right-button {
		background-color: #5da271;
		color: white;
	}

	.guessed-wrong-button {
		background-color: #ff6b6c;
		color: white;
	}
</style>
