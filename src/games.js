// Game type definitions. Each game's `options` drive the setup screen.
// Option shape: { key, label, type: 'toggle' | 'choice', default, choices?, hint? }

export const GAMES = [
  {
    id: 'cricket',
    teams: 'optional', // singles or 2 teams
    name: 'Cricket',
    blurb: '15–20 and bull. First to close them all wins.',
    accent: 'green',
    options: [
      {
        key: 'points',
        label: 'Keep points',
        type: 'toggle',
        default: false,
        hint: 'Off = first to close wins',
      },
    ],
  },
  {
    id: 'super-cricket',
    teams: 'optional', // singles or 2 teams
    name: 'Super Cricket',
    blurb: 'Cricket plus 3-in-a-bed, triples, and doubles.',
    accent: 'red',
    options: [
      {
        key: 'points',
        label: 'Keep points',
        type: 'toggle',
        default: false,
        hint: 'Off = first to close wins',
      },
    ],
  },
  {
    id: 'x01',
    teams: 'optional', // singles or 2 teams
    name: 'X01',
    blurb: 'Count down from 301, 501, or 701 to zero.',
    accent: 'cream',
    options: [
      {
        key: 'start',
        label: 'Starting score',
        type: 'choice',
        default: 501,
        choices: [301, 501, 701],
      },
      { key: 'doubleIn', label: 'Double in', type: 'toggle', default: false },
      { key: 'doubleOut', label: 'Double out', type: 'toggle', default: true },
    ],
  },
  {
    id: 'real-baseball',
    name: 'Real Baseball',
    blurb: 'Two teams, one dart per at-bat. Runners advance.',
    accent: 'green',
    teams: 'always', // 2 teams with batting orders
    options: [
      {
        key: 'innings',
        label: 'Innings',
        type: 'choice',
        default: 9,
        choices: [3, 5, 7, 9],
      },
      {
        key: 'sacBunt',
        label: 'Sacrifice bunt',
        type: 'toggle',
        default: true,
        hint: 'Throw at either side of the inning slice',
      },
    ],
  },
]

export const getGame = (id) => GAMES.find((g) => g.id === id)

export const defaultOptions = (game) =>
  Object.fromEntries(game.options.map((o) => [o.key, o.default]))

export const MIN_PLAYERS = 1
export const MAX_PLAYERS = 4
export const MAX_PER_TEAM = 6
