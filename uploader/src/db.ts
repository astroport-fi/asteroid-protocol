import knex, { Knex } from 'knex'

declare module 'knex/types/tables.js' {
  export interface Session {
    address: string
    hash: string
    date_created: Date
    verified: boolean
  }

  export interface Launchpad {
    creator: string
    hash: string
    folder: string
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

  export interface LaunchpadAsset {
    id: number
    launchpad_hash: string
    asset_id: number
    name: string
    uploaded: boolean
  }

  export type LaunchpadAssetInsert = Omit<
    LaunchpadInscription,
    'id' | 'uploaded'
  >

  interface Tables {
    session: Session

    launchpad: Launchpad
    launchpad_inscription: LaunchpadInscription
    launchpad_asset: LaunchpadAsset

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

    launchpad_asset_composite: Knex.CompositeTableType<
      LaunchpadAsset,
      LaunchpadAsset,
      LaunchpadAssetInsert
    >
  }
}

export function connect(databaseUrl: string) {
  return knex({
    client: 'pg',
    connection: { connectionString: databaseUrl },
  })
}
