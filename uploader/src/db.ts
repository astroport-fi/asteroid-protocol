import knex, { Knex } from 'knex'

declare module 'knex/types/tables.js' {
  export interface Launchpad {
    hash: string
    date_created: Date
  }

  export type LaunchpadInsert = Omit<Launchpad, 'date_created'>

  export interface LaunchpadInscription {
    id: number
    launchpad_hash: string
    inscription_number: number
    name: string
    uploaded: boolean
  }

  export type LaunchpadInscriptionInsert = Omit<
    LaunchpadInscription,
    'id' | 'uploaded'
  >

  interface Tables {
    launchpad: Launchpad
    launchpad_inscription: LaunchpadInscription

    launchpad_composite: Knex.CompositeTableType<
      Launchpad,
      Launchpad,
      LaunchpadInsert
    >

    launchpad_inscription_composite: Knex.CompositeTableType<
      LaunchpadInscription,
      LaunchpadInscription,
      LaunchpadInscriptionInsert
    >
  }
}

export function connect(databaseUrl: string) {
  return knex({
    client: 'pg',
    connection: { connectionString: databaseUrl },
  })
}
