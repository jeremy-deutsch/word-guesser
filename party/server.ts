import type { PartyKitServer } from "partykit/server";
import type { GameState, GameAction } from "../src/lib/types";
import { HandlerEvent, createHandlers } from "partystate-server";
import allWords from "./words";

const MAX_ROOM_SIZE = 10;

const MIN_ROOM_SIZE = 3;

function reducer(
	allState: { public: GameState; wordsSeen: number[] },
	event: HandlerEvent<GameAction>
): undefined {
	const { action, sender } = event;
	const state = allState.public;

	function generateNewWord() {
		let newWordIndex: number;
		do {
			newWordIndex = Math.floor(Math.random() * allWords.length);
		} while (allState.wordsSeen.includes(newWordIndex));
		allState.wordsSeen.push(newWordIndex);
		return allWords[newWordIndex];
	}

	switch (action.type) {
		case "connect":
			if (!state.hostId || !Object.keys(state.players).length) {
				state.hostId = sender;
			}
			state.players[sender] = action.params?.name;
			try {
				state.playerOrder.push(sender);
			} catch (e) {
				console.log(e);
				throw e;
			}
			break;
		case "close":
		case "error": {
			delete state.players[sender];
			if (state.hostId === sender) {
				state.hostId = Object.keys(state.players)[0] ?? "";
			}
			if (!Object.keys(state.players).length) {
				state.playerOrder = [];
				state.players = {};
				state.points = 0;
				state.mode = { type: "waiting" };
			} else {
				const indexOfSender = state.playerOrder.indexOf(sender);
				if (state.mode.type !== "waiting") {
					if (Object.keys(state.players).length < MIN_ROOM_SIZE) {
						state.mode = { type: "waiting" };
					} else if (state.mode.guesser === sender) {
						let newGuesserIndex = indexOfSender + 1;
						if (newGuesserIndex >= state.playerOrder.length) {
							newGuesserIndex = 0;
						}
						state.mode = {
							type: "writing",
							word: generateNewWord(),
							guesser: state.playerOrder[newGuesserIndex],
							clues: {},
						};
					}
				}
				state.playerOrder.splice(indexOfSender, 1);
			}
			break;
		}
		case "start_game":
			if (state.mode.type !== "waiting") {
				return;
			}
			state.mode = {
				type: "writing",
				word: generateNewWord(),
				guesser: state.playerOrder[0],
				clues: {},
			};
			break;
		case "set_clue":
			if (state.mode.type !== "writing") {
				return;
			}
			state.mode.clues[sender] = action.clue;
			if (
				Object.keys(state.mode.clues).length ===
				Object.keys(state.players).length - 1
			) {
				state.mode = {
					type: "checking",
					word: state.mode.word,
					guesser: state.mode.guesser,
					clues: state.mode.clues,
					badClues: [],
				};
			}
			break;
		case "clear_clue":
			if (state.mode.type !== "writing" || !(sender in state.mode.clues)) {
				return;
			}
			delete state.mode.clues[sender];
			break;
		case "mark_clue":
			if (
				state.mode.type !== "checking" ||
				state.mode.badClues.includes(action.clueOwner)
			) {
				return;
			}
			state.mode.badClues.push(action.clueOwner);
			break;
		case "unmark_clue": {
			if (state.mode.type !== "checking") {
				return;
			}
			const indexOfClueOwner = state.mode.badClues.indexOf(action.clueOwner);
			if (indexOfClueOwner === -1) {
				return;
			}
			state.mode.badClues.splice(indexOfClueOwner, 1);
			break;
		}
		case "reveal_clues":
			if (state.mode.type !== "checking") {
				return;
			}
			const validClues: { [playerId: string]: string | null } = {};
			for (const [playerId, clue] of Object.entries(state.mode.clues)) {
				if (state.mode.badClues.includes(playerId)) {
					validClues[playerId] = null;
				} else {
					validClues[playerId] = clue;
				}
			}
			state.mode = {
				type: "guessing",
				word: state.mode.word,
				guesser: state.mode.guesser,
				validClues,
			};
			break;
		case "win_round": {
			if (state.mode.type !== "guessing") {
				return;
			}
			state.points++;
			let indexOfGuesser = state.playerOrder.indexOf(state.mode.guesser) + 1;
			if (indexOfGuesser >= state.playerOrder.length) {
				indexOfGuesser = 0;
			}
			state.mode = {
				type: "writing",
				word: generateNewWord(),
				guesser: state.playerOrder[indexOfGuesser],
				clues: {},
			};
		}
		case "lose_round": {
			if (state.mode.type !== "guessing") {
				return;
			}
			let indexOfGuesser = state.playerOrder.indexOf(state.mode.guesser) + 1;
			if (indexOfGuesser >= state.playerOrder.length) {
				indexOfGuesser = 0;
			}
			state.mode = {
				type: "writing",
				word: generateNewWord(),
				guesser: state.playerOrder[indexOfGuesser],
				clues: {},
			};
		}
	}
}

const handlers = createHandlers(
	{
		public: {
			mode: { type: "waiting" },
			players: {},
			hostId: "",
			playerOrder: [],
			points: 0,
		},
		wordsSeen: [],
	},
	reducer
);

export default {
	...handlers,
	onConnect(websocket, room, ctx) {
		if (room.connections.size > MAX_ROOM_SIZE) {
			return websocket.close();
		}

		return handlers.onConnect(websocket, room, ctx);
	},
} satisfies PartyKitServer;
