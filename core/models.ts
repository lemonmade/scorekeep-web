import {z} from 'zod';

export const MatchTeamSchema = z.enum(['us', 'them']);
export const MatchSportSchema = z.enum([
  'volleyball',
  'tennis',
  'squash',
  'ultimate',
]);
export const MatchGameSchema = z.object({
  startedAt: z.date(),
  endedAt: z.date().optional(),
  scoreUs: z.number(),
  scoreThem: z.number(),
  winner: MatchTeamSchema.optional(),
});
export const MatchSetSchema = z.object({
  startedAt: z.date(),
  endedAt: z.date().optional(),
  games: z.array(MatchGameSchema),
  winner: MatchTeamSchema.optional(),
});
export const MatchSchema = z.object({
  sport: MatchSportSchema,
  startedAt: z.date(),
  endedAt: z.date().optional(),
  sets: z.array(MatchSetSchema),
  winner: MatchTeamSchema.optional(),
});

export class Match {
  readonly #data: z.infer<typeof MatchSchema>;
  readonly #sets: MatchSet[];

  constructor(match: z.infer<typeof MatchSchema>) {
    this.#data = match;
    this.#sets = match.sets.map((set) => new MatchSet(set));
  }

  get data() {
    return this.#data;
  }

  get sport() {
    return this.#data.sport;
  }

  get startedAt() {
    return this.#data.startedAt;
  }

  get endedAt() {
    return this.#data.endedAt;
  }

  get winner() {
    return this.#data.winner;
  }

  get hasWinner() {
    return this.#data.winner !== undefined;
  }

  get sets() {
    return this.#sets;
  }

  get summaryString() {
    return this.sets.map((set) => set.summaryString).join('\n');
  }
}

export class MatchSet {
  readonly #data: z.infer<typeof MatchSetSchema>;
  readonly #games: MatchGame[];

  constructor(set: z.infer<typeof MatchSetSchema>) {
    this.#data = set;
    this.#games = set.games.map((game) => new MatchGame(game));
  }

  get startedAt() {
    return this.#data.startedAt;
  }

  get endedAt() {
    return this.#data.endedAt;
  }

  get games() {
    return this.#games;
  }

  get winner() {
    return this.#data.winner;
  }

  get hasWinner() {
    return this.#data.winner !== undefined;
  }

  get summaryString() {
    return this.games.map((game) => game.summaryString).join('\n');
  }
}

export class MatchGame {
  readonly #data: z.infer<typeof MatchGameSchema>;

  constructor(game: z.infer<typeof MatchGameSchema>) {
    this.#data = game;
  }

  get startedAt() {
    return this.#data.startedAt;
  }

  get endedAt() {
    return this.#data.endedAt;
  }

  get scoreUs() {
    return this.#data.scoreUs;
  }

  get scoreThem() {
    return this.#data.scoreThem;
  }

  get winner() {
    return this.#data.winner;
  }

  get hasWinner() {
    return this.#data.winner !== undefined;
  }

  get summaryString() {
    return `${this.scoreUs}-${this.scoreThem}`;
  }
}
