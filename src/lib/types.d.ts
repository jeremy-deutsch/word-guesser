export type GameAction =
	| { type: "start_game" }
	| { type: "set_clue"; clue: string }
	| { type: "clear_clue" }
	| { type: "mark_clue"; clueOwner: string }
	| { type: "unmark_clue"; clueOwner: string }
	| { type: "reveal_clues" }
	| { type: "win_round" }
	| { type: "lose_round" };

export interface GameState {
	players: { [id: string]: string /* name */ };
	playerOrder: string[]; // player IDs
	hostId: string;
	points: number;
	mode: WaitingState | WritingState | CheckingCluesState | GuessingState;
}

interface WaitingState {
	type: "waiting";
}

interface WritingState {
	type: "writing";
	guesser: string;
	word: string;
	clues: { [playerId: string]: string };
}

interface CheckingCluesState {
	type: "checking";
	guesser: string;
	word: string;
	clues: { [playerId: string]: string };
	badClues: string[]; // player IDs
}

interface GuessingState {
	type: "guessing";
	guesser: string;
	word: string;
	validClues: { [playerId: string]: string | null };
}
