/* eslint-disable */

export const AllTypesProps: Record<string, any> = {
	Boolean_comparison_exp: {

	},
	Float_comparison_exp: {

	},
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
		inscription_histories: {
			distinct_on: "inscription_history_select_column",
			order_by: "inscription_history_order_by",
			where: "inscription_history_bool_exp"
		},
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
		inscription_histories: "inscription_history_bool_exp",
		is_explicit: "Boolean_comparison_exp",
		metadata: "json_comparison_exp",
		transaction: "transaction_bool_exp",
		transaction_id: "Int_comparison_exp",
		type: "String_comparison_exp",
		version: "String_comparison_exp"
	},
	inscription_history_aggregate_order_by: {
		avg: "inscription_history_avg_order_by",
		count: "order_by",
		max: "inscription_history_max_order_by",
		min: "inscription_history_min_order_by",
		stddev: "inscription_history_stddev_order_by",
		stddev_pop: "inscription_history_stddev_pop_order_by",
		stddev_samp: "inscription_history_stddev_samp_order_by",
		sum: "inscription_history_sum_order_by",
		var_pop: "inscription_history_var_pop_order_by",
		var_samp: "inscription_history_var_samp_order_by",
		variance: "inscription_history_variance_order_by"
	},
	inscription_history_avg_order_by: {
		height: "order_by",
		id: "order_by",
		inscription_id: "order_by",
		transaction_id: "order_by"
	},
	inscription_history_bool_exp: {
		_and: "inscription_history_bool_exp",
		_not: "inscription_history_bool_exp",
		_or: "inscription_history_bool_exp",
		action: "String_comparison_exp",
		chain_id: "String_comparison_exp",
		date_created: "timestamp_comparison_exp",
		height: "Int_comparison_exp",
		id: "Int_comparison_exp",
		inscription: "inscription_bool_exp",
		inscription_id: "Int_comparison_exp",
		receiver: "String_comparison_exp",
		sender: "String_comparison_exp",
		transaction: "transaction_bool_exp",
		transaction_id: "Int_comparison_exp"
	},
	inscription_history_max_order_by: {
		action: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		height: "order_by",
		id: "order_by",
		inscription_id: "order_by",
		receiver: "order_by",
		sender: "order_by",
		transaction_id: "order_by"
	},
	inscription_history_min_order_by: {
		action: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		height: "order_by",
		id: "order_by",
		inscription_id: "order_by",
		receiver: "order_by",
		sender: "order_by",
		transaction_id: "order_by"
	},
	inscription_history_order_by: {
		action: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		height: "order_by",
		id: "order_by",
		inscription: "inscription_order_by",
		inscription_id: "order_by",
		receiver: "order_by",
		sender: "order_by",
		transaction: "transaction_order_by",
		transaction_id: "order_by"
	},
	inscription_history_select_column: "enum" as const,
	inscription_history_stddev_order_by: {
		height: "order_by",
		id: "order_by",
		inscription_id: "order_by",
		transaction_id: "order_by"
	},
	inscription_history_stddev_pop_order_by: {
		height: "order_by",
		id: "order_by",
		inscription_id: "order_by",
		transaction_id: "order_by"
	},
	inscription_history_stddev_samp_order_by: {
		height: "order_by",
		id: "order_by",
		inscription_id: "order_by",
		transaction_id: "order_by"
	},
	inscription_history_stream_cursor_input: {
		initial_value: "inscription_history_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	inscription_history_stream_cursor_value_input: {
		date_created: "timestamp"
	},
	inscription_history_sum_order_by: {
		height: "order_by",
		id: "order_by",
		inscription_id: "order_by",
		transaction_id: "order_by"
	},
	inscription_history_var_pop_order_by: {
		height: "order_by",
		id: "order_by",
		inscription_id: "order_by",
		transaction_id: "order_by"
	},
	inscription_history_var_samp_order_by: {
		height: "order_by",
		id: "order_by",
		inscription_id: "order_by",
		transaction_id: "order_by"
	},
	inscription_history_variance_order_by: {
		height: "order_by",
		id: "order_by",
		inscription_id: "order_by",
		transaction_id: "order_by"
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
		inscription_histories_aggregate: "inscription_history_aggregate_order_by",
		is_explicit: "order_by",
		metadata: "order_by",
		transaction: "transaction_order_by",
		transaction_id: "order_by",
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
	marketplace_cft20_detail_aggregate_order_by: {
		avg: "marketplace_cft20_detail_avg_order_by",
		count: "order_by",
		max: "marketplace_cft20_detail_max_order_by",
		min: "marketplace_cft20_detail_min_order_by",
		stddev: "marketplace_cft20_detail_stddev_order_by",
		stddev_pop: "marketplace_cft20_detail_stddev_pop_order_by",
		stddev_samp: "marketplace_cft20_detail_stddev_samp_order_by",
		sum: "marketplace_cft20_detail_sum_order_by",
		var_pop: "marketplace_cft20_detail_var_pop_order_by",
		var_samp: "marketplace_cft20_detail_var_samp_order_by",
		variance: "marketplace_cft20_detail_variance_order_by"
	},
	marketplace_cft20_detail_avg_order_by: {
		amount: "order_by",
		id: "order_by",
		listing_id: "order_by",
		ppt: "order_by",
		token_id: "order_by"
	},
	marketplace_cft20_detail_bool_exp: {
		_and: "marketplace_cft20_detail_bool_exp",
		_not: "marketplace_cft20_detail_bool_exp",
		_or: "marketplace_cft20_detail_bool_exp",
		amount: "bigint_comparison_exp",
		date_created: "timestamp_comparison_exp",
		id: "Int_comparison_exp",
		listing_id: "Int_comparison_exp",
		marketplace_listing: "marketplace_listing_bool_exp",
		ppt: "bigint_comparison_exp",
		token: "token_bool_exp",
		token_id: "Int_comparison_exp"
	},
	marketplace_cft20_detail_max_order_by: {
		amount: "order_by",
		date_created: "order_by",
		id: "order_by",
		listing_id: "order_by",
		ppt: "order_by",
		token_id: "order_by"
	},
	marketplace_cft20_detail_min_order_by: {
		amount: "order_by",
		date_created: "order_by",
		id: "order_by",
		listing_id: "order_by",
		ppt: "order_by",
		token_id: "order_by"
	},
	marketplace_cft20_detail_order_by: {
		amount: "order_by",
		date_created: "order_by",
		id: "order_by",
		listing_id: "order_by",
		marketplace_listing: "marketplace_listing_order_by",
		ppt: "order_by",
		token: "token_order_by",
		token_id: "order_by"
	},
	marketplace_cft20_detail_select_column: "enum" as const,
	marketplace_cft20_detail_stddev_order_by: {
		amount: "order_by",
		id: "order_by",
		listing_id: "order_by",
		ppt: "order_by",
		token_id: "order_by"
	},
	marketplace_cft20_detail_stddev_pop_order_by: {
		amount: "order_by",
		id: "order_by",
		listing_id: "order_by",
		ppt: "order_by",
		token_id: "order_by"
	},
	marketplace_cft20_detail_stddev_samp_order_by: {
		amount: "order_by",
		id: "order_by",
		listing_id: "order_by",
		ppt: "order_by",
		token_id: "order_by"
	},
	marketplace_cft20_detail_stream_cursor_input: {
		initial_value: "marketplace_cft20_detail_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	marketplace_cft20_detail_stream_cursor_value_input: {
		amount: "bigint",
		date_created: "timestamp",
		ppt: "bigint"
	},
	marketplace_cft20_detail_sum_order_by: {
		amount: "order_by",
		id: "order_by",
		listing_id: "order_by",
		ppt: "order_by",
		token_id: "order_by"
	},
	marketplace_cft20_detail_var_pop_order_by: {
		amount: "order_by",
		id: "order_by",
		listing_id: "order_by",
		ppt: "order_by",
		token_id: "order_by"
	},
	marketplace_cft20_detail_var_samp_order_by: {
		amount: "order_by",
		id: "order_by",
		listing_id: "order_by",
		ppt: "order_by",
		token_id: "order_by"
	},
	marketplace_cft20_detail_variance_order_by: {
		amount: "order_by",
		id: "order_by",
		listing_id: "order_by",
		ppt: "order_by",
		token_id: "order_by"
	},
	marketplace_listing: {
		marketplace_cft20_details: {
			distinct_on: "marketplace_cft20_detail_select_column",
			order_by: "marketplace_cft20_detail_order_by",
			where: "marketplace_cft20_detail_bool_exp"
		}
	},
	marketplace_listing_aggregate_order_by: {
		avg: "marketplace_listing_avg_order_by",
		count: "order_by",
		max: "marketplace_listing_max_order_by",
		min: "marketplace_listing_min_order_by",
		stddev: "marketplace_listing_stddev_order_by",
		stddev_pop: "marketplace_listing_stddev_pop_order_by",
		stddev_samp: "marketplace_listing_stddev_samp_order_by",
		sum: "marketplace_listing_sum_order_by",
		var_pop: "marketplace_listing_var_pop_order_by",
		var_samp: "marketplace_listing_var_samp_order_by",
		variance: "marketplace_listing_variance_order_by"
	},
	marketplace_listing_avg_order_by: {
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	marketplace_listing_bool_exp: {
		_and: "marketplace_listing_bool_exp",
		_not: "marketplace_listing_bool_exp",
		_or: "marketplace_listing_bool_exp",
		chain_id: "String_comparison_exp",
		date_created: "timestamp_comparison_exp",
		date_updated: "timestamp_comparison_exp",
		deposit_timeout: "Int_comparison_exp",
		deposit_total: "bigint_comparison_exp",
		depositor_address: "String_comparison_exp",
		depositor_timedout_block: "Int_comparison_exp",
		id: "Int_comparison_exp",
		is_cancelled: "Boolean_comparison_exp",
		is_deposited: "Boolean_comparison_exp",
		is_filled: "Boolean_comparison_exp",
		marketplace_cft20_details: "marketplace_cft20_detail_bool_exp",
		seller_address: "String_comparison_exp",
		total: "bigint_comparison_exp",
		transaction: "transaction_bool_exp",
		transaction_id: "Int_comparison_exp"
	},
	marketplace_listing_max_order_by: {
		chain_id: "order_by",
		date_created: "order_by",
		date_updated: "order_by",
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_address: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		seller_address: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	marketplace_listing_min_order_by: {
		chain_id: "order_by",
		date_created: "order_by",
		date_updated: "order_by",
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_address: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		seller_address: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	marketplace_listing_order_by: {
		chain_id: "order_by",
		date_created: "order_by",
		date_updated: "order_by",
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_address: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		is_cancelled: "order_by",
		is_deposited: "order_by",
		is_filled: "order_by",
		marketplace_cft20_details_aggregate: "marketplace_cft20_detail_aggregate_order_by",
		seller_address: "order_by",
		total: "order_by",
		transaction: "transaction_order_by",
		transaction_id: "order_by"
	},
	marketplace_listing_select_column: "enum" as const,
	marketplace_listing_stddev_order_by: {
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	marketplace_listing_stddev_pop_order_by: {
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	marketplace_listing_stddev_samp_order_by: {
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	marketplace_listing_stream_cursor_input: {
		initial_value: "marketplace_listing_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	marketplace_listing_stream_cursor_value_input: {
		date_created: "timestamp",
		date_updated: "timestamp",
		deposit_total: "bigint",
		total: "bigint"
	},
	marketplace_listing_sum_order_by: {
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	marketplace_listing_var_pop_order_by: {
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	marketplace_listing_var_samp_order_by: {
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	marketplace_listing_variance_order_by: {
		deposit_timeout: "order_by",
		deposit_total: "order_by",
		depositor_timedout_block: "order_by",
		id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	numeric: `scalar.numeric` as const,
	numeric_comparison_exp: {
		_eq: "numeric",
		_gt: "numeric",
		_gte: "numeric",
		_in: "numeric",
		_lt: "numeric",
		_lte: "numeric",
		_neq: "numeric",
		_nin: "numeric"
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
		inscription_history: {
			distinct_on: "inscription_history_select_column",
			order_by: "inscription_history_order_by",
			where: "inscription_history_bool_exp"
		},
		inscription_history_by_pk: {

		},
		marketplace_cft20_detail: {
			distinct_on: "marketplace_cft20_detail_select_column",
			order_by: "marketplace_cft20_detail_order_by",
			where: "marketplace_cft20_detail_bool_exp"
		},
		marketplace_cft20_detail_by_pk: {

		},
		marketplace_listing: {
			distinct_on: "marketplace_listing_select_column",
			order_by: "marketplace_listing_order_by",
			where: "marketplace_listing_bool_exp"
		},
		marketplace_listing_by_pk: {

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
		token_address_history: {
			distinct_on: "token_address_history_select_column",
			order_by: "token_address_history_order_by",
			where: "token_address_history_bool_exp"
		},
		token_address_history_by_pk: {

		},
		token_by_pk: {

		},
		token_holder: {
			distinct_on: "token_holder_select_column",
			order_by: "token_holder_order_by",
			where: "token_holder_bool_exp"
		},
		token_holder_by_pk: {

		},
		token_open_position: {
			distinct_on: "token_open_position_select_column",
			order_by: "token_open_position_order_by",
			where: "token_open_position_bool_exp"
		},
		token_open_position_by_pk: {

		},
		token_trade_history: {
			distinct_on: "token_trade_history_select_column",
			order_by: "token_trade_history_order_by",
			where: "token_trade_history_bool_exp"
		},
		token_trade_history_by_pk: {

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
		base_token: "String_comparison_exp",
		base_token_usd: "Float_comparison_exp",
		chain_id: "String_comparison_exp",
		date_updated: "timestamp_comparison_exp",
		id: "Int_comparison_exp",
		last_known_height: "Int_comparison_exp",
		last_processed_height: "Int_comparison_exp"
	},
	status_order_by: {
		base_token: "order_by",
		base_token_usd: "order_by",
		chain_id: "order_by",
		date_updated: "order_by",
		id: "order_by",
		last_known_height: "order_by",
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
		inscription_history: {
			distinct_on: "inscription_history_select_column",
			order_by: "inscription_history_order_by",
			where: "inscription_history_bool_exp"
		},
		inscription_history_by_pk: {

		},
		inscription_history_stream: {
			cursor: "inscription_history_stream_cursor_input",
			where: "inscription_history_bool_exp"
		},
		inscription_stream: {
			cursor: "inscription_stream_cursor_input",
			where: "inscription_bool_exp"
		},
		marketplace_cft20_detail: {
			distinct_on: "marketplace_cft20_detail_select_column",
			order_by: "marketplace_cft20_detail_order_by",
			where: "marketplace_cft20_detail_bool_exp"
		},
		marketplace_cft20_detail_by_pk: {

		},
		marketplace_cft20_detail_stream: {
			cursor: "marketplace_cft20_detail_stream_cursor_input",
			where: "marketplace_cft20_detail_bool_exp"
		},
		marketplace_listing: {
			distinct_on: "marketplace_listing_select_column",
			order_by: "marketplace_listing_order_by",
			where: "marketplace_listing_bool_exp"
		},
		marketplace_listing_by_pk: {

		},
		marketplace_listing_stream: {
			cursor: "marketplace_listing_stream_cursor_input",
			where: "marketplace_listing_bool_exp"
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
		token_address_history: {
			distinct_on: "token_address_history_select_column",
			order_by: "token_address_history_order_by",
			where: "token_address_history_bool_exp"
		},
		token_address_history_by_pk: {

		},
		token_address_history_stream: {
			cursor: "token_address_history_stream_cursor_input",
			where: "token_address_history_bool_exp"
		},
		token_by_pk: {

		},
		token_holder: {
			distinct_on: "token_holder_select_column",
			order_by: "token_holder_order_by",
			where: "token_holder_bool_exp"
		},
		token_holder_by_pk: {

		},
		token_holder_stream: {
			cursor: "token_holder_stream_cursor_input",
			where: "token_holder_bool_exp"
		},
		token_open_position: {
			distinct_on: "token_open_position_select_column",
			order_by: "token_open_position_order_by",
			where: "token_open_position_bool_exp"
		},
		token_open_position_by_pk: {

		},
		token_open_position_stream: {
			cursor: "token_open_position_stream_cursor_input",
			where: "token_open_position_bool_exp"
		},
		token_stream: {
			cursor: "token_stream_cursor_input",
			where: "token_bool_exp"
		},
		token_trade_history: {
			distinct_on: "token_trade_history_select_column",
			order_by: "token_trade_history_order_by",
			where: "token_trade_history_bool_exp"
		},
		token_trade_history_by_pk: {

		},
		token_trade_history_stream: {
			cursor: "token_trade_history_stream_cursor_input",
			where: "token_trade_history_bool_exp"
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
	token: {
		marketplace_cft20_details: {
			distinct_on: "marketplace_cft20_detail_select_column",
			order_by: "marketplace_cft20_detail_order_by",
			where: "marketplace_cft20_detail_bool_exp"
		},
		token_address_histories: {
			distinct_on: "token_address_history_select_column",
			order_by: "token_address_history_order_by",
			where: "token_address_history_bool_exp"
		},
		token_holders: {
			distinct_on: "token_holder_select_column",
			order_by: "token_holder_order_by",
			where: "token_holder_bool_exp"
		},
		token_open_positions: {
			distinct_on: "token_open_position_select_column",
			order_by: "token_open_position_order_by",
			where: "token_open_position_bool_exp"
		},
		token_trade_histories: {
			distinct_on: "token_trade_history_select_column",
			order_by: "token_trade_history_order_by",
			where: "token_trade_history_bool_exp"
		}
	},
	token_address_history_aggregate_order_by: {
		avg: "token_address_history_avg_order_by",
		count: "order_by",
		max: "token_address_history_max_order_by",
		min: "token_address_history_min_order_by",
		stddev: "token_address_history_stddev_order_by",
		stddev_pop: "token_address_history_stddev_pop_order_by",
		stddev_samp: "token_address_history_stddev_samp_order_by",
		sum: "token_address_history_sum_order_by",
		var_pop: "token_address_history_var_pop_order_by",
		var_samp: "token_address_history_var_samp_order_by",
		variance: "token_address_history_variance_order_by"
	},
	token_address_history_avg_order_by: {
		amount: "order_by",
		height: "order_by",
		id: "order_by",
		token_id: "order_by",
		transaction_id: "order_by"
	},
	token_address_history_bool_exp: {
		_and: "token_address_history_bool_exp",
		_not: "token_address_history_bool_exp",
		_or: "token_address_history_bool_exp",
		action: "String_comparison_exp",
		amount: "bigint_comparison_exp",
		chain_id: "String_comparison_exp",
		date_created: "timestamp_comparison_exp",
		height: "Int_comparison_exp",
		id: "Int_comparison_exp",
		receiver: "String_comparison_exp",
		sender: "String_comparison_exp",
		token: "token_bool_exp",
		token_id: "Int_comparison_exp",
		transaction: "transaction_bool_exp",
		transaction_id: "Int_comparison_exp"
	},
	token_address_history_max_order_by: {
		action: "order_by",
		amount: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		height: "order_by",
		id: "order_by",
		receiver: "order_by",
		sender: "order_by",
		token_id: "order_by",
		transaction_id: "order_by"
	},
	token_address_history_min_order_by: {
		action: "order_by",
		amount: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		height: "order_by",
		id: "order_by",
		receiver: "order_by",
		sender: "order_by",
		token_id: "order_by",
		transaction_id: "order_by"
	},
	token_address_history_order_by: {
		action: "order_by",
		amount: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		height: "order_by",
		id: "order_by",
		receiver: "order_by",
		sender: "order_by",
		token: "token_order_by",
		token_id: "order_by",
		transaction: "transaction_order_by",
		transaction_id: "order_by"
	},
	token_address_history_select_column: "enum" as const,
	token_address_history_stddev_order_by: {
		amount: "order_by",
		height: "order_by",
		id: "order_by",
		token_id: "order_by",
		transaction_id: "order_by"
	},
	token_address_history_stddev_pop_order_by: {
		amount: "order_by",
		height: "order_by",
		id: "order_by",
		token_id: "order_by",
		transaction_id: "order_by"
	},
	token_address_history_stddev_samp_order_by: {
		amount: "order_by",
		height: "order_by",
		id: "order_by",
		token_id: "order_by",
		transaction_id: "order_by"
	},
	token_address_history_stream_cursor_input: {
		initial_value: "token_address_history_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	token_address_history_stream_cursor_value_input: {
		amount: "bigint",
		date_created: "timestamp"
	},
	token_address_history_sum_order_by: {
		amount: "order_by",
		height: "order_by",
		id: "order_by",
		token_id: "order_by",
		transaction_id: "order_by"
	},
	token_address_history_var_pop_order_by: {
		amount: "order_by",
		height: "order_by",
		id: "order_by",
		token_id: "order_by",
		transaction_id: "order_by"
	},
	token_address_history_var_samp_order_by: {
		amount: "order_by",
		height: "order_by",
		id: "order_by",
		token_id: "order_by",
		transaction_id: "order_by"
	},
	token_address_history_variance_order_by: {
		amount: "order_by",
		height: "order_by",
		id: "order_by",
		token_id: "order_by",
		transaction_id: "order_by"
	},
	token_bool_exp: {
		_and: "token_bool_exp",
		_not: "token_bool_exp",
		_or: "token_bool_exp",
		chain_id: "String_comparison_exp",
		circulating_supply: "bigint_comparison_exp",
		content_path: "String_comparison_exp",
		content_size_bytes: "Int_comparison_exp",
		creator: "String_comparison_exp",
		current_owner: "String_comparison_exp",
		date_created: "timestamp_comparison_exp",
		decimals: "smallint_comparison_exp",
		height: "Int_comparison_exp",
		id: "Int_comparison_exp",
		last_price_base: "bigint_comparison_exp",
		launch_timestamp: "bigint_comparison_exp",
		marketplace_cft20_details: "marketplace_cft20_detail_bool_exp",
		max_supply: "numeric_comparison_exp",
		metadata: "String_comparison_exp",
		mint_page: "String_comparison_exp",
		name: "String_comparison_exp",
		per_mint_limit: "bigint_comparison_exp",
		ticker: "String_comparison_exp",
		token_address_histories: "token_address_history_bool_exp",
		token_holders: "token_holder_bool_exp",
		token_open_positions: "token_open_position_bool_exp",
		token_trade_histories: "token_trade_history_bool_exp",
		transaction: "transaction_bool_exp",
		transaction_id: "Int_comparison_exp",
		version: "String_comparison_exp",
		volume_24_base: "bigint_comparison_exp"
	},
	token_holder_aggregate_order_by: {
		avg: "token_holder_avg_order_by",
		count: "order_by",
		max: "token_holder_max_order_by",
		min: "token_holder_min_order_by",
		stddev: "token_holder_stddev_order_by",
		stddev_pop: "token_holder_stddev_pop_order_by",
		stddev_samp: "token_holder_stddev_samp_order_by",
		sum: "token_holder_sum_order_by",
		var_pop: "token_holder_var_pop_order_by",
		var_samp: "token_holder_var_samp_order_by",
		variance: "token_holder_variance_order_by"
	},
	token_holder_avg_order_by: {
		amount: "order_by",
		id: "order_by",
		token_id: "order_by"
	},
	token_holder_bool_exp: {
		_and: "token_holder_bool_exp",
		_not: "token_holder_bool_exp",
		_or: "token_holder_bool_exp",
		address: "String_comparison_exp",
		amount: "bigint_comparison_exp",
		chain_id: "String_comparison_exp",
		date_updated: "timestamp_comparison_exp",
		id: "Int_comparison_exp",
		token: "token_bool_exp",
		token_id: "Int_comparison_exp"
	},
	token_holder_max_order_by: {
		address: "order_by",
		amount: "order_by",
		chain_id: "order_by",
		date_updated: "order_by",
		id: "order_by",
		token_id: "order_by"
	},
	token_holder_min_order_by: {
		address: "order_by",
		amount: "order_by",
		chain_id: "order_by",
		date_updated: "order_by",
		id: "order_by",
		token_id: "order_by"
	},
	token_holder_order_by: {
		address: "order_by",
		amount: "order_by",
		chain_id: "order_by",
		date_updated: "order_by",
		id: "order_by",
		token: "token_order_by",
		token_id: "order_by"
	},
	token_holder_select_column: "enum" as const,
	token_holder_stddev_order_by: {
		amount: "order_by",
		id: "order_by",
		token_id: "order_by"
	},
	token_holder_stddev_pop_order_by: {
		amount: "order_by",
		id: "order_by",
		token_id: "order_by"
	},
	token_holder_stddev_samp_order_by: {
		amount: "order_by",
		id: "order_by",
		token_id: "order_by"
	},
	token_holder_stream_cursor_input: {
		initial_value: "token_holder_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	token_holder_stream_cursor_value_input: {
		amount: "bigint",
		date_updated: "timestamp"
	},
	token_holder_sum_order_by: {
		amount: "order_by",
		id: "order_by",
		token_id: "order_by"
	},
	token_holder_var_pop_order_by: {
		amount: "order_by",
		id: "order_by",
		token_id: "order_by"
	},
	token_holder_var_samp_order_by: {
		amount: "order_by",
		id: "order_by",
		token_id: "order_by"
	},
	token_holder_variance_order_by: {
		amount: "order_by",
		id: "order_by",
		token_id: "order_by"
	},
	token_open_position_aggregate_order_by: {
		avg: "token_open_position_avg_order_by",
		count: "order_by",
		max: "token_open_position_max_order_by",
		min: "token_open_position_min_order_by",
		stddev: "token_open_position_stddev_order_by",
		stddev_pop: "token_open_position_stddev_pop_order_by",
		stddev_samp: "token_open_position_stddev_samp_order_by",
		sum: "token_open_position_sum_order_by",
		var_pop: "token_open_position_var_pop_order_by",
		var_samp: "token_open_position_var_samp_order_by",
		variance: "token_open_position_variance_order_by"
	},
	token_open_position_avg_order_by: {
		amount: "order_by",
		id: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		token_id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	token_open_position_bool_exp: {
		_and: "token_open_position_bool_exp",
		_not: "token_open_position_bool_exp",
		_or: "token_open_position_bool_exp",
		amount: "bigint_comparison_exp",
		chain_id: "String_comparison_exp",
		date_created: "timestamp_comparison_exp",
		date_filled: "timestamp_comparison_exp",
		id: "Int_comparison_exp",
		is_cancelled: "Boolean_comparison_exp",
		is_filled: "Boolean_comparison_exp",
		is_reserved: "Boolean_comparison_exp",
		ppt: "bigint_comparison_exp",
		reserve_expires_block: "Int_comparison_exp",
		reserved_by: "String_comparison_exp",
		seller_address: "String_comparison_exp",
		token: "token_bool_exp",
		token_id: "Int_comparison_exp",
		total: "bigint_comparison_exp",
		transaction: "transaction_bool_exp",
		transaction_id: "Int_comparison_exp"
	},
	token_open_position_max_order_by: {
		amount: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		date_filled: "order_by",
		id: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		reserved_by: "order_by",
		seller_address: "order_by",
		token_id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	token_open_position_min_order_by: {
		amount: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		date_filled: "order_by",
		id: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		reserved_by: "order_by",
		seller_address: "order_by",
		token_id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	token_open_position_order_by: {
		amount: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		date_filled: "order_by",
		id: "order_by",
		is_cancelled: "order_by",
		is_filled: "order_by",
		is_reserved: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		reserved_by: "order_by",
		seller_address: "order_by",
		token: "token_order_by",
		token_id: "order_by",
		total: "order_by",
		transaction: "transaction_order_by",
		transaction_id: "order_by"
	},
	token_open_position_select_column: "enum" as const,
	token_open_position_stddev_order_by: {
		amount: "order_by",
		id: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		token_id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	token_open_position_stddev_pop_order_by: {
		amount: "order_by",
		id: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		token_id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	token_open_position_stddev_samp_order_by: {
		amount: "order_by",
		id: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		token_id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	token_open_position_stream_cursor_input: {
		initial_value: "token_open_position_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	token_open_position_stream_cursor_value_input: {
		amount: "bigint",
		date_created: "timestamp",
		date_filled: "timestamp",
		ppt: "bigint",
		total: "bigint"
	},
	token_open_position_sum_order_by: {
		amount: "order_by",
		id: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		token_id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	token_open_position_var_pop_order_by: {
		amount: "order_by",
		id: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		token_id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	token_open_position_var_samp_order_by: {
		amount: "order_by",
		id: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		token_id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	token_open_position_variance_order_by: {
		amount: "order_by",
		id: "order_by",
		ppt: "order_by",
		reserve_expires_block: "order_by",
		token_id: "order_by",
		total: "order_by",
		transaction_id: "order_by"
	},
	token_order_by: {
		chain_id: "order_by",
		circulating_supply: "order_by",
		content_path: "order_by",
		content_size_bytes: "order_by",
		creator: "order_by",
		current_owner: "order_by",
		date_created: "order_by",
		decimals: "order_by",
		height: "order_by",
		id: "order_by",
		last_price_base: "order_by",
		launch_timestamp: "order_by",
		marketplace_cft20_details_aggregate: "marketplace_cft20_detail_aggregate_order_by",
		max_supply: "order_by",
		metadata: "order_by",
		mint_page: "order_by",
		name: "order_by",
		per_mint_limit: "order_by",
		ticker: "order_by",
		token_address_histories_aggregate: "token_address_history_aggregate_order_by",
		token_holders_aggregate: "token_holder_aggregate_order_by",
		token_open_positions_aggregate: "token_open_position_aggregate_order_by",
		token_trade_histories_aggregate: "token_trade_history_aggregate_order_by",
		transaction: "transaction_order_by",
		transaction_id: "order_by",
		version: "order_by",
		volume_24_base: "order_by"
	},
	token_select_column: "enum" as const,
	token_stream_cursor_input: {
		initial_value: "token_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	token_stream_cursor_value_input: {
		circulating_supply: "bigint",
		date_created: "timestamp",
		decimals: "smallint",
		last_price_base: "bigint",
		launch_timestamp: "bigint",
		max_supply: "numeric",
		per_mint_limit: "bigint",
		volume_24_base: "bigint"
	},
	token_trade_history_aggregate_order_by: {
		avg: "token_trade_history_avg_order_by",
		count: "order_by",
		max: "token_trade_history_max_order_by",
		min: "token_trade_history_min_order_by",
		stddev: "token_trade_history_stddev_order_by",
		stddev_pop: "token_trade_history_stddev_pop_order_by",
		stddev_samp: "token_trade_history_stddev_samp_order_by",
		sum: "token_trade_history_sum_order_by",
		var_pop: "token_trade_history_var_pop_order_by",
		var_samp: "token_trade_history_var_samp_order_by",
		variance: "token_trade_history_variance_order_by"
	},
	token_trade_history_avg_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		id: "order_by",
		rate: "order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction_id: "order_by"
	},
	token_trade_history_bool_exp: {
		_and: "token_trade_history_bool_exp",
		_not: "token_trade_history_bool_exp",
		_or: "token_trade_history_bool_exp",
		amount_base: "bigint_comparison_exp",
		amount_quote: "bigint_comparison_exp",
		buyer_address: "String_comparison_exp",
		chain_id: "String_comparison_exp",
		date_created: "timestamp_comparison_exp",
		id: "Int_comparison_exp",
		rate: "bigint_comparison_exp",
		seller_address: "String_comparison_exp",
		token: "token_bool_exp",
		token_id: "Int_comparison_exp",
		total_usd: "Float_comparison_exp",
		transaction: "transaction_bool_exp",
		transaction_id: "Int_comparison_exp"
	},
	token_trade_history_max_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		buyer_address: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		id: "order_by",
		rate: "order_by",
		seller_address: "order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction_id: "order_by"
	},
	token_trade_history_min_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		buyer_address: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		id: "order_by",
		rate: "order_by",
		seller_address: "order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction_id: "order_by"
	},
	token_trade_history_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		buyer_address: "order_by",
		chain_id: "order_by",
		date_created: "order_by",
		id: "order_by",
		rate: "order_by",
		seller_address: "order_by",
		token: "token_order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction: "transaction_order_by",
		transaction_id: "order_by"
	},
	token_trade_history_select_column: "enum" as const,
	token_trade_history_stddev_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		id: "order_by",
		rate: "order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction_id: "order_by"
	},
	token_trade_history_stddev_pop_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		id: "order_by",
		rate: "order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction_id: "order_by"
	},
	token_trade_history_stddev_samp_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		id: "order_by",
		rate: "order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction_id: "order_by"
	},
	token_trade_history_stream_cursor_input: {
		initial_value: "token_trade_history_stream_cursor_value_input",
		ordering: "cursor_ordering"
	},
	token_trade_history_stream_cursor_value_input: {
		amount_base: "bigint",
		amount_quote: "bigint",
		date_created: "timestamp",
		rate: "bigint"
	},
	token_trade_history_sum_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		id: "order_by",
		rate: "order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction_id: "order_by"
	},
	token_trade_history_var_pop_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		id: "order_by",
		rate: "order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction_id: "order_by"
	},
	token_trade_history_var_samp_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		id: "order_by",
		rate: "order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction_id: "order_by"
	},
	token_trade_history_variance_order_by: {
		amount_base: "order_by",
		amount_quote: "order_by",
		id: "order_by",
		rate: "order_by",
		token_id: "order_by",
		total_usd: "order_by",
		transaction_id: "order_by"
	},
	transaction: {
		marketplace_listings: {
			distinct_on: "marketplace_listing_select_column",
			order_by: "marketplace_listing_order_by",
			where: "marketplace_listing_bool_exp"
		},
		token_open_positions: {
			distinct_on: "token_open_position_select_column",
			order_by: "token_open_position_order_by",
			where: "token_open_position_bool_exp"
		}
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
		inscription: "inscription_bool_exp",
		inscription_history: "inscription_history_bool_exp",
		marketplace_listings: "marketplace_listing_bool_exp",
		status_message: "String_comparison_exp",
		token: "token_bool_exp",
		token_address_history: "token_address_history_bool_exp",
		token_open_positions: "token_open_position_bool_exp",
		token_trade_history: "token_trade_history_bool_exp"
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
		inscription: "inscription_order_by",
		inscription_history: "inscription_history_order_by",
		marketplace_listings_aggregate: "marketplace_listing_aggregate_order_by",
		status_message: "order_by",
		token: "token_order_by",
		token_address_history: "token_address_history_order_by",
		token_open_positions_aggregate: "token_open_position_aggregate_order_by",
		token_trade_history: "token_trade_history_order_by"
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
		inscription_histories: "inscription_history",
		is_explicit: "Boolean",
		metadata: "json",
		transaction: "transaction",
		transaction_id: "Int",
		type: "String",
		version: "String"
	},
	inscription_history: {
		action: "String",
		chain_id: "String",
		date_created: "timestamp",
		height: "Int",
		id: "Int",
		inscription: "inscription",
		inscription_id: "Int",
		receiver: "String",
		sender: "String",
		transaction: "transaction",
		transaction_id: "Int"
	},
	json: `scalar.json` as const,
	marketplace_cft20_detail: {
		amount: "bigint",
		date_created: "timestamp",
		id: "Int",
		listing_id: "Int",
		marketplace_listing: "marketplace_listing",
		ppt: "bigint",
		token: "token",
		token_id: "Int"
	},
	marketplace_listing: {
		chain_id: "String",
		date_created: "timestamp",
		date_updated: "timestamp",
		deposit_timeout: "Int",
		deposit_total: "bigint",
		depositor_address: "String",
		depositor_timedout_block: "Int",
		id: "Int",
		is_cancelled: "Boolean",
		is_deposited: "Boolean",
		is_filled: "Boolean",
		marketplace_cft20_details: "marketplace_cft20_detail",
		seller_address: "String",
		total: "bigint",
		transaction: "transaction",
		transaction_id: "Int"
	},
	numeric: `scalar.numeric` as const,
	query_root: {
		inscription: "inscription",
		inscription_by_pk: "inscription",
		inscription_history: "inscription_history",
		inscription_history_by_pk: "inscription_history",
		marketplace_cft20_detail: "marketplace_cft20_detail",
		marketplace_cft20_detail_by_pk: "marketplace_cft20_detail",
		marketplace_listing: "marketplace_listing",
		marketplace_listing_by_pk: "marketplace_listing",
		status: "status",
		status_by_pk: "status",
		token: "token",
		token_address_history: "token_address_history",
		token_address_history_by_pk: "token_address_history",
		token_by_pk: "token",
		token_holder: "token_holder",
		token_holder_by_pk: "token_holder",
		token_open_position: "token_open_position",
		token_open_position_by_pk: "token_open_position",
		token_trade_history: "token_trade_history",
		token_trade_history_by_pk: "token_trade_history",
		transaction: "transaction",
		transaction_by_pk: "transaction"
	},
	smallint: `scalar.smallint` as const,
	status: {
		base_token: "String",
		base_token_usd: "Float",
		chain_id: "String",
		date_updated: "timestamp",
		id: "Int",
		last_known_height: "Int",
		last_processed_height: "Int"
	},
	subscription_root: {
		inscription: "inscription",
		inscription_by_pk: "inscription",
		inscription_history: "inscription_history",
		inscription_history_by_pk: "inscription_history",
		inscription_history_stream: "inscription_history",
		inscription_stream: "inscription",
		marketplace_cft20_detail: "marketplace_cft20_detail",
		marketplace_cft20_detail_by_pk: "marketplace_cft20_detail",
		marketplace_cft20_detail_stream: "marketplace_cft20_detail",
		marketplace_listing: "marketplace_listing",
		marketplace_listing_by_pk: "marketplace_listing",
		marketplace_listing_stream: "marketplace_listing",
		status: "status",
		status_by_pk: "status",
		status_stream: "status",
		token: "token",
		token_address_history: "token_address_history",
		token_address_history_by_pk: "token_address_history",
		token_address_history_stream: "token_address_history",
		token_by_pk: "token",
		token_holder: "token_holder",
		token_holder_by_pk: "token_holder",
		token_holder_stream: "token_holder",
		token_open_position: "token_open_position",
		token_open_position_by_pk: "token_open_position",
		token_open_position_stream: "token_open_position",
		token_stream: "token",
		token_trade_history: "token_trade_history",
		token_trade_history_by_pk: "token_trade_history",
		token_trade_history_stream: "token_trade_history",
		transaction: "transaction",
		transaction_by_pk: "transaction",
		transaction_stream: "transaction"
	},
	timestamp: `scalar.timestamp` as const,
	token: {
		chain_id: "String",
		circulating_supply: "bigint",
		content_path: "String",
		content_size_bytes: "Int",
		creator: "String",
		current_owner: "String",
		date_created: "timestamp",
		decimals: "smallint",
		height: "Int",
		id: "Int",
		last_price_base: "bigint",
		launch_timestamp: "bigint",
		marketplace_cft20_details: "marketplace_cft20_detail",
		max_supply: "numeric",
		metadata: "String",
		mint_page: "String",
		name: "String",
		per_mint_limit: "bigint",
		ticker: "String",
		token_address_histories: "token_address_history",
		token_holders: "token_holder",
		token_open_positions: "token_open_position",
		token_trade_histories: "token_trade_history",
		transaction: "transaction",
		transaction_id: "Int",
		version: "String",
		volume_24_base: "bigint"
	},
	token_address_history: {
		action: "String",
		amount: "bigint",
		chain_id: "String",
		date_created: "timestamp",
		height: "Int",
		id: "Int",
		receiver: "String",
		sender: "String",
		token: "token",
		token_id: "Int",
		transaction: "transaction",
		transaction_id: "Int"
	},
	token_holder: {
		address: "String",
		amount: "bigint",
		chain_id: "String",
		date_updated: "timestamp",
		id: "Int",
		token: "token",
		token_id: "Int"
	},
	token_open_position: {
		amount: "bigint",
		chain_id: "String",
		date_created: "timestamp",
		date_filled: "timestamp",
		id: "Int",
		is_cancelled: "Boolean",
		is_filled: "Boolean",
		is_reserved: "Boolean",
		ppt: "bigint",
		reserve_expires_block: "Int",
		reserved_by: "String",
		seller_address: "String",
		token: "token",
		token_id: "Int",
		total: "bigint",
		transaction: "transaction",
		transaction_id: "Int"
	},
	token_trade_history: {
		amount_base: "bigint",
		amount_quote: "bigint",
		buyer_address: "String",
		chain_id: "String",
		date_created: "timestamp",
		id: "Int",
		rate: "bigint",
		seller_address: "String",
		token: "token",
		token_id: "Int",
		total_usd: "Float",
		transaction: "transaction",
		transaction_id: "Int"
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
		inscription: "inscription",
		inscription_history: "inscription_history",
		marketplace_listings: "marketplace_listing",
		status_message: "String",
		token: "token",
		token_address_history: "token_address_history",
		token_open_positions: "token_open_position",
		token_trade_history: "token_trade_history"
	}
}

export const Ops = {
	query: "query_root" as const,
	subscription: "subscription_root" as const
}