/* eslint-disable */

export const AllTypesProps: Record<string, any> = {
	Int_comparison_exp: {

	},
	String_comparison_exp: {

	},
	bigint: `scalar.bigint` as const,
	bigint_comparison_exp: {
		_eq: "bigint",
		_gt: "bigint",
		_gte: "bigint",
		_in: "bigint",
		_lt: "bigint",
		_lte: "bigint",
		_neq: "bigint",
		_nin: "bigint"
	},
	cursor_ordering: "enum" as const,
	inscription: {
		metadata: {

		}
	},
	inscription_bool_exp: {
		_and: "inscription_bool_exp",
		_not: "inscription_bool_exp",
		_or: "inscription_bool_exp",
		chain_id: "String_comparison_exp",
		content_hash: "String_comparison_exp",
		content_path: "String_comparison_exp",
		content_size_bytes: "Int_comparison_exp",
		creator: "String_comparison_exp",
		current_owner: "String_comparison_exp",
		date_created: "timestamp_comparison_exp",
		height: "Int_comparison_exp",
		id: "Int_comparison_exp",
		metadata: "json_comparison_exp",
		transaction_hash: "String_comparison_exp",
		type: "String_comparison_exp",
		version: "String_comparison_exp"
	},
	inscription_order_by: {
		chain_id: "order_by",
		content_hash: "order_by",
		content_path: "order_by",
		content_size_bytes: "order_by",
		creator: "order_by",
		current_owner: "order_by",
		date_created: "order_by",
		height: "order_by",
		id: "order_by",
		metadata: "order_by",
		transaction_hash: "order_by",
		type: "order_by",
		version: "order_by"
	},
	inscription_select_column: "enum" as const,
	inscription_stream_cursor_input: {
		initial_value: "inscription_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	inscription_stream_cursor_value_input: {
		date_created: "timestamp",
		metadata: "json"
	},
	json: `scalar.json` as const,
	json_comparison_exp: {
		_eq: "json",
		_gt: "json",
		_gte: "json",
		_in: "json",
		_lt: "json",
		_lte: "json",
		_neq: "json",
		_nin: "json"
	},
	order_by: "enum" as const,
	query_root: {
		inscription: {
			distinct_on: "inscription_select_column",
			order_by: "inscription_order_by",
			where: "inscription_bool_exp"
		},
		inscription_by_pk: {

		},
		status: {
			distinct_on: "status_select_column",
			order_by: "status_order_by",
			where: "status_bool_exp"
		},
		status_by_pk: {

		},
		token: {
			distinct_on: "token_select_column",
			order_by: "token_order_by",
			where: "token_bool_exp"
		},
		token_by_pk: {

		},
		transaction: {
			distinct_on: "transaction_select_column",
			order_by: "transaction_order_by",
			where: "transaction_bool_exp"
		},
		transaction_by_pk: {

		}
	},
	smallint: `scalar.smallint` as const,
	smallint_comparison_exp: {
		_eq: "smallint",
		_gt: "smallint",
		_gte: "smallint",
		_in: "smallint",
		_lt: "smallint",
		_lte: "smallint",
		_neq: "smallint",
		_nin: "smallint"
	},
	status_bool_exp: {
		_and: "status_bool_exp",
		_not: "status_bool_exp",
		_or: "status_bool_exp",
		chain_id: "String_comparison_exp",
		date_updated: "timestamp_comparison_exp",
		id: "Int_comparison_exp",
		last_processed_height: "Int_comparison_exp"
	},
	status_order_by: {
		chain_id: "order_by",
		date_updated: "order_by",
		id: "order_by",
		last_processed_height: "order_by"
	},
	status_select_column: "enum" as const,
	status_stream_cursor_input: {
		initial_value: "status_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	status_stream_cursor_value_input: {
		date_updated: "timestamp"
	},
	subscription_root: {
		inscription: {
			distinct_on: "inscription_select_column",
			order_by: "inscription_order_by",
			where: "inscription_bool_exp"
		},
		inscription_by_pk: {

		},
		inscription_stream: {
			cursor: "inscription_stream_cursor_input",
			where: "inscription_bool_exp"
		},
		status: {
			distinct_on: "status_select_column",
			order_by: "status_order_by",
			where: "status_bool_exp"
		},
		status_by_pk: {

		},
		status_stream: {
			cursor: "status_stream_cursor_input",
			where: "status_bool_exp"
		},
		token: {
			distinct_on: "token_select_column",
			order_by: "token_order_by",
			where: "token_bool_exp"
		},
		token_by_pk: {

		},
		token_stream: {
			cursor: "token_stream_cursor_input",
			where: "token_bool_exp"
		},
		transaction: {
			distinct_on: "transaction_select_column",
			order_by: "transaction_order_by",
			where: "transaction_bool_exp"
		},
		transaction_by_pk: {

		},
		transaction_stream: {
			cursor: "transaction_stream_cursor_input",
			where: "transaction_bool_exp"
		}
	},
	timestamp: `scalar.timestamp` as const,
	timestamp_comparison_exp: {
		_eq: "timestamp",
		_gt: "timestamp",
		_gte: "timestamp",
		_in: "timestamp",
		_lt: "timestamp",
		_lte: "timestamp",
		_neq: "timestamp",
		_nin: "timestamp"
	},
	token_bool_exp: {
		_and: "token_bool_exp",
		_not: "token_bool_exp",
		_or: "token_bool_exp",
		chain_id: "String_comparison_exp",
		content_path: "String_comparison_exp",
		content_size_bytes: "Int_comparison_exp",
		creator: "String_comparison_exp",
		current_owner: "String_comparison_exp",
		date_created: "timestamp_comparison_exp",
		decimals: "smallint_comparison_exp",
		height: "Int_comparison_exp",
		id: "Int_comparison_exp",
		launch_timestamp: "bigint_comparison_exp",
		max_supply: "bigint_comparison_exp",
		metadata: "String_comparison_exp",
		mint_page: "String_comparison_exp",
		name: "String_comparison_exp",
		per_wallet_limit: "bigint_comparison_exp",
		ticker: "String_comparison_exp",
		transaction_hash: "String_comparison_exp",
		version: "String_comparison_exp"
	},
	token_order_by: {
		chain_id: "order_by",
		content_path: "order_by",
		content_size_bytes: "order_by",
		creator: "order_by",
		current_owner: "order_by",
		date_created: "order_by",
		decimals: "order_by",
		height: "order_by",
		id: "order_by",
		launch_timestamp: "order_by",
		max_supply: "order_by",
		metadata: "order_by",
		mint_page: "order_by",
		name: "order_by",
		per_wallet_limit: "order_by",
		ticker: "order_by",
		transaction_hash: "order_by",
		version: "order_by"
	},
	token_select_column: "enum" as const,
	token_stream_cursor_input: {
		initial_value: "token_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	token_stream_cursor_value_input: {
		date_created: "timestamp",
		decimals: "smallint",
		launch_timestamp: "bigint",
		max_supply: "bigint",
		per_wallet_limit: "bigint"
	},
	transaction_bool_exp: {
		_and: "transaction_bool_exp",
		_not: "transaction_bool_exp",
		_or: "transaction_bool_exp",
		content: "String_comparison_exp",
		content_length: "Int_comparison_exp",
		date_created: "timestamp_comparison_exp",
		fees: "String_comparison_exp",
		gas_used: "Int_comparison_exp",
		hash: "String_comparison_exp",
		height: "Int_comparison_exp",
		id: "Int_comparison_exp",
		status_message: "String_comparison_exp"
	},
	transaction_order_by: {
		content: "order_by",
		content_length: "order_by",
		date_created: "order_by",
		fees: "order_by",
		gas_used: "order_by",
		hash: "order_by",
		height: "order_by",
		id: "order_by",
		status_message: "order_by"
	},
	transaction_select_column: "enum" as const,
	transaction_stream_cursor_input: {
		initial_value: "transaction_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	transaction_stream_cursor_value_input: {
		date_created: "timestamp"
	}
}

export const ReturnTypes: Record<string, any> = {
	cached: {
		ttl: "Int",
		refresh: "Boolean"
	},
	bigint: `scalar.bigint` as const,
	inscription: {
		chain_id: "String",
		content_hash: "String",
		content_path: "String",
		content_size_bytes: "Int",
		creator: "String",
		current_owner: "String",
		date_created: "timestamp",
		height: "Int",
		id: "Int",
		metadata: "json",
		transaction_hash: "String",
		type: "String",
		version: "String"
	},
	json: `scalar.json` as const,
	query_root: {
		inscription: "inscription",
		inscription_by_pk: "inscription",
		status: "status",
		status_by_pk: "status",
		token: "token",
		token_by_pk: "token",
		transaction: "transaction",
		transaction_by_pk: "transaction"
	},
	smallint: `scalar.smallint` as const,
	status: {
		chain_id: "String",
		date_updated: "timestamp",
		id: "Int",
		last_processed_height: "Int"
	},
	subscription_root: {
		inscription: "inscription",
		inscription_by_pk: "inscription",
		inscription_stream: "inscription",
		status: "status",
		status_by_pk: "status",
		status_stream: "status",
		token: "token",
		token_by_pk: "token",
		token_stream: "token",
		transaction: "transaction",
		transaction_by_pk: "transaction",
		transaction_stream: "transaction"
	},
	timestamp: `scalar.timestamp` as const,
	token: {
		chain_id: "String",
		content_path: "String",
		content_size_bytes: "Int",
		creator: "String",
		current_owner: "String",
		date_created: "timestamp",
		decimals: "smallint",
		height: "Int",
		id: "Int",
		launch_timestamp: "bigint",
		max_supply: "bigint",
		metadata: "String",
		mint_page: "String",
		name: "String",
		per_wallet_limit: "bigint",
		ticker: "String",
		transaction_hash: "String",
		version: "String"
	},
	transaction: {
		content: "String",
		content_length: "Int",
		date_created: "timestamp",
		fees: "String",
		gas_used: "Int",
		hash: "String",
		height: "Int",
		id: "Int",
		status_message: "String"
	}
}

export const Ops = {
	query: "query_root" as const,
	subscription: "subscription_root" as const
}