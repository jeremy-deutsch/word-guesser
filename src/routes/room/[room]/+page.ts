export const ssr = false;

import type { PageLoad } from "./$types";
import type { GameState, GameAction } from "$lib/types";
import { PUBLIC_PARTY_URL } from "$env/static/public";
import { createPartyState } from "partystate-svelte";

export const load = (async ({ params, url }) => {
	const name = url.searchParams.get("name");
	if (!name) {
		throw new Error("Must provide a name.");
	}

	const { send, id, stateReadablePromise } = createPartyState<
		GameState,
		GameAction
	>(
		{
			host: PUBLIC_PARTY_URL, // for local development
			// host: "my-party.username.partykit.dev", // for production
			room: params.room,
		},
		{ onConnectParams: { name } }
	);

	return {
		send,
		stateReadable: await stateReadablePromise,
		room: params.room,
		id,
	};
}) satisfies PageLoad;
