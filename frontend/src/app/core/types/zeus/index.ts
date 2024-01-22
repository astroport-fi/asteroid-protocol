/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';
export const HOST = "http://localhost:8080/v1/graphql"


export const HEADERS = {}
import { createClient, type Sink } from 'graphql-ws'; // keep

export const apiSubscription = (options: chainOptions) => {
	const client = createClient({
		url: String(options[0]),
		connectionParams: Object.fromEntries((new Headers(options[1]?.headers) as any).entries()),
	});

	const ws = new Proxy(
		{
			close: () => client.dispose(),
		} as WebSocket,
		{
			get(target, key) {
				if (key === 'close') return target.close;
				throw new Error(`Unimplemented property '${String(key)}', only 'close()' is available.`);
			},
		},
	);

	return (query: string) => {
		let onMessage: ((event: any) => void) | undefined;
		let onError: Sink['error'] | undefined;
		let onClose: Sink['complete'] | undefined;

		client.subscribe(
			{ query },
			{
				next({ data }) {
					onMessage && onMessage(data);
				},
				error(error) {
					onError && onError(error);
				},
				complete() {
					onClose && onClose();
				},
			},
		);

		return {
			ws,
			on(listener: typeof onMessage) {
				onMessage = listener;
			},
			error(listener: typeof onError) {
				onError = listener;
			},
			open(listener: (socket: unknown) => void) {
				client.on('opened', listener);
			},
			off(listener: typeof onClose) {
				onClose = listener;
			},
		};
	};
};
const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
	if (!response.ok) {
		return new Promise((_, reject) => {
			response
				.text()
				.then((text) => {
					try {
						reject(JSON.parse(text));
					} catch (err) {
						reject(text);
					}
				})
				.catch(reject);
		});
	}
	return response.json() as Promise<GraphQLResponse>;
};

export const apiFetch =
	(options: fetchOptions) =>
		(query: string, variables: Record<string, unknown> = {}) => {
			const fetchOptions = options[1] || {};
			if (fetchOptions.method && fetchOptions.method === 'GET') {
				return fetch(`${options[0]}?query=${encodeURIComponent(query)}`, fetchOptions)
					.then(handleFetchResponse)
					.then((response: GraphQLResponse) => {
						if (response.errors) {
							throw new GraphQLError(response);
						}
						return response.data;
					});
			}
			return fetch(`${options[0]}`, {
				body: JSON.stringify({ query, variables }),
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				...fetchOptions,
			})
				.then(handleFetchResponse)
				.then((response: GraphQLResponse) => {
					if (response.errors) {
						throw new GraphQLError(response);
					}
					return response.data;
				});
		};

export const InternalsBuildQuery = ({
	ops,
	props,
	returns,
	options,
	scalars,
}: {
	props: AllTypesPropsType;
	returns: ReturnTypesType;
	ops: Operations;
	options?: OperationOptions;
	scalars?: ScalarDefinition;
}) => {
	const ibb = (
		k: string,
		o: InputValueType | VType,
		p = '',
		root = true,
		vars: Array<{ name: string; graphQLType: string }> = [],
	): string => {
		const keyForPath = purifyGraphQLKey(k);
		const newPath = [p, keyForPath].join(SEPARATOR);
		if (!o) {
			return '';
		}
		if (typeof o === 'boolean' || typeof o === 'number') {
			return k;
		}
		if (typeof o === 'string') {
			return `${k} ${o}`;
		}
		if (Array.isArray(o)) {
			const args = InternalArgsBuilt({
				props,
				returns,
				ops,
				scalars,
				vars,
			})(o[0], newPath);
			return `${ibb(args ? `${k}(${args})` : k, o[1], p, false, vars)}`;
		}
		if (k === '__alias') {
			return Object.entries(o)
				.map(([alias, objectUnderAlias]) => {
					if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
						throw new Error(
							'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
						);
					}
					const operationName = Object.keys(objectUnderAlias)[0];
					const operation = objectUnderAlias[operationName];
					return ibb(`${alias}:${operationName}`, operation, p, false, vars);
				})
				.join('\n');
		}
		const hasOperationName = root && options?.operationName ? ' ' + options.operationName : '';
		const keyForDirectives = o['__directives'] ?? '';
		const query = `{${Object.entries(o)
			.filter(([k]) => k !== '__directives')
			.map((e) => ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false, vars))
			.join('\n')}}`;
		if (!root) {
			return `${k} ${keyForDirectives}${hasOperationName} ${query}`;
		}
		const varsString = vars.map((v) => `${v.name}: ${v.graphQLType}`).join(', ');
		return `${k} ${keyForDirectives}${hasOperationName}${varsString ? `(${varsString})` : ''} ${query}`;
	};
	return ibb;
};

export const Thunder =
	(fn: FetchFunction) =>
		<O extends keyof typeof Ops, SCLR extends ScalarDefinition, R extends keyof ValueTypes = GenericOperation<O>>(
			operation: O,
			graphqlOptions?: ThunderGraphQLOptions<SCLR>,
		) =>
			<Z extends ValueTypes[R]>(
				o: (Z & ValueTypes[R]) | ValueTypes[R],
				ops?: OperationOptions & { variables?: Record<string, unknown> },
			) =>
				fn(
					Zeus(operation, o, {
						operationOptions: ops,
						scalars: graphqlOptions?.scalars,
					}),
					ops?.variables,
				).then((data) => {
					if (graphqlOptions?.scalars) {
						return decodeScalarsInResponse({
							response: data,
							initialOp: operation,
							initialZeusQuery: o as VType,
							returns: ReturnTypes,
							scalars: graphqlOptions.scalars,
							ops: Ops,
						});
					}
					return data;
				}) as Promise<InputType<GraphQLTypes[R], Z, SCLR>>;

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
	(fn: SubscriptionFunction) =>
		<O extends keyof typeof Ops, SCLR extends ScalarDefinition, R extends keyof ValueTypes = GenericOperation<O>>(
			operation: O,
			graphqlOptions?: ThunderGraphQLOptions<SCLR>,
		) =>
			<Z extends ValueTypes[R]>(
				o: (Z & ValueTypes[R]) | ValueTypes[R],
				ops?: OperationOptions & { variables?: ExtractVariables<Z> },
			) => {
				const returnedFunction = fn(
					Zeus(operation, o, {
						operationOptions: ops,
						scalars: graphqlOptions?.scalars,
					}),
				) as SubscriptionToGraphQL<Z, GraphQLTypes[R], SCLR>;
				if (returnedFunction?.on && graphqlOptions?.scalars) {
					const wrapped = returnedFunction.on;
					returnedFunction.on = (fnToCall: (args: InputType<GraphQLTypes[R], Z, SCLR>) => void) =>
						wrapped((data: InputType<GraphQLTypes[R], Z, SCLR>) => {
							if (graphqlOptions?.scalars) {
								return fnToCall(
									decodeScalarsInResponse({
										response: data,
										initialOp: operation,
										initialZeusQuery: o as VType,
										returns: ReturnTypes,
										scalars: graphqlOptions.scalars,
										ops: Ops,
									}),
								);
							}
							return fnToCall(data);
						});
				}
				return returnedFunction;
			};

export const Subscription = (...options: chainOptions) => SubscriptionThunder(apiSubscription(options));
export const Zeus = <
	Z extends ValueTypes[R],
	O extends keyof typeof Ops,
	R extends keyof ValueTypes = GenericOperation<O>,
>(
	operation: O,
	o: (Z & ValueTypes[R]) | ValueTypes[R],
	ops?: {
		operationOptions?: OperationOptions;
		scalars?: ScalarDefinition;
	},
) =>
	InternalsBuildQuery({
		props: AllTypesProps,
		returns: ReturnTypes,
		ops: Ops,
		options: ops?.operationOptions,
		scalars: ops?.scalars,
	})(operation, o as VType);

export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;

export const Selector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();

export const TypeFromSelector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();
export const Gql = Chain(HOST, {
	headers: {
		'Content-Type': 'application/json',
		...HEADERS,
	},
});

export const ZeusScalars = ZeusSelect<ScalarCoders>();

export const decodeScalarsInResponse = <O extends Operations>({
	response,
	scalars,
	returns,
	ops,
	initialZeusQuery,
	initialOp,
}: {
	ops: O;
	response: any;
	returns: ReturnTypesType;
	scalars?: Record<string, ScalarResolver | undefined>;
	initialOp: keyof O;
	initialZeusQuery: InputValueType | VType;
}) => {
	if (!scalars) {
		return response;
	}
	const builder = PrepareScalarPaths({
		ops,
		returns,
	});

	const scalarPaths = builder(initialOp as string, ops[initialOp], initialZeusQuery);
	if (scalarPaths) {
		const r = traverseResponse({ scalarPaths, resolvers: scalars })(initialOp as string, response, [ops[initialOp]]);
		return r;
	}
	return response;
};

export const traverseResponse = ({
	resolvers,
	scalarPaths,
}: {
	scalarPaths: { [x: string]: `scalar.${string}` };
	resolvers: {
		[x: string]: ScalarResolver | undefined;
	};
}) => {
	const ibb = (k: string, o: InputValueType | VType, p: string[] = []): unknown => {
		if (Array.isArray(o)) {
			return o.map((eachO) => ibb(k, eachO, p));
		}
		if (o == null) {
			return o;
		}
		const scalarPathString = p.join(SEPARATOR);
		const currentScalarString = scalarPaths[scalarPathString];
		if (currentScalarString) {
			const currentDecoder = resolvers[currentScalarString.split('.')[1]]?.decode;
			if (currentDecoder) {
				return currentDecoder(o);
			}
		}
		if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string' || !o) {
			return o;
		}
		const entries = Object.entries(o).map(([k, v]) => [k, ibb(k, v, [...p, purifyGraphQLKey(k)])] as const);
		const objectFromEntries = entries.reduce<Record<string, unknown>>((a, [k, v]) => {
			a[k] = v;
			return a;
		}, {});
		return objectFromEntries;
	};
	return ibb;
};

export type AllTypesPropsType = {
	[x: string]:
	| undefined
	| `scalar.${string}`
	| 'enum'
	| {
		[x: string]:
		| undefined
		| string
		| {
			[x: string]: string | undefined;
		};
	};
};

export type ReturnTypesType = {
	[x: string]:
	| {
		[x: string]: string | undefined;
	}
	| `scalar.${string}`
	| undefined;
};
export type InputValueType = {
	[x: string]: undefined | boolean | string | number | [any, undefined | boolean | InputValueType] | InputValueType;
};
export type VType =
	| undefined
	| boolean
	| string
	| number
	| [any, undefined | boolean | InputValueType]
	| InputValueType;

export type PlainType = boolean | number | string | null | undefined;
export type ZeusArgsType =
	| PlainType
	| {
		[x: string]: ZeusArgsType;
	}
	| Array<ZeusArgsType>;

export type Operations = Record<string, string>;

export type VariableDefinition = {
	[x: string]: unknown;
};

export const SEPARATOR = '|';

export type fetchOptions = Parameters<typeof fetch>;
type websocketOptions = typeof WebSocket extends new (...args: infer R) => WebSocket ? R : never;
export type chainOptions = [fetchOptions[0], fetchOptions[1] & { websocket?: websocketOptions }] | [fetchOptions[0]];
export type FetchFunction = (query: string, variables?: Record<string, unknown>) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<F extends [infer ARGS, any] ? ARGS : undefined>;

export type OperationOptions = {
	operationName?: string;
};

export type ScalarCoder = Record<string, (s: unknown) => string>;

export interface GraphQLResponse {
	data?: Record<string, any>;
	errors?: Array<{
		message: string;
	}>;
}
export class GraphQLError extends Error {
	constructor(public response: GraphQLResponse) {
		super('');
		console.error(response);
	}
	override toString() {
		return 'GraphQL Response Error';
	}
}
export type GenericOperation<O> = O extends keyof typeof Ops ? typeof Ops[O] : never;
export type ThunderGraphQLOptions<SCLR extends ScalarDefinition> = {
	scalars?: SCLR | ScalarCoders;
};

const ExtractScalar = (mappedParts: string[], returns: ReturnTypesType): `scalar.${string}` | undefined => {
	if (mappedParts.length === 0) {
		return;
	}
	const oKey = mappedParts[0];
	const returnP1 = returns[oKey];
	if (typeof returnP1 === 'object') {
		const returnP2 = returnP1[mappedParts[1]];
		if (returnP2) {
			return ExtractScalar([returnP2, ...mappedParts.slice(2)], returns);
		}
		return undefined;
	}
	return returnP1 as `scalar.${string}` | undefined;
};

export const PrepareScalarPaths = ({ ops, returns }: { returns: ReturnTypesType; ops: Operations }) => {
	const ibb = (
		k: string,
		originalKey: string,
		o: InputValueType | VType,
		p: string[] = [],
		pOriginals: string[] = [],
		root = true,
	): { [x: string]: `scalar.${string}` } | undefined => {
		if (!o) {
			return;
		}
		if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string') {
			const extractionArray = [...pOriginals, originalKey];
			const isScalar = ExtractScalar(extractionArray, returns);
			if (isScalar?.startsWith('scalar')) {
				const partOfTree = {
					[[...p, k].join(SEPARATOR)]: isScalar,
				};
				return partOfTree;
			}
			return {};
		}
		if (Array.isArray(o)) {
			return ibb(k, k, o[1], p, pOriginals, false);
		}
		if (k === '__alias') {
			return Object.entries(o)
				.map(([alias, objectUnderAlias]) => {
					if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
						throw new Error(
							'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
						);
					}
					const operationName = Object.keys(objectUnderAlias)[0];
					const operation = objectUnderAlias[operationName];
					return ibb(alias, operationName, operation, p, pOriginals, false);
				})
				.reduce((a, b) => ({
					...a,
					...b,
				}));
		}
		const keyName = root ? ops[k] : k;
		return Object.entries(o)
			.filter(([k]) => k !== '__directives')
			.map(([k, v]) => {
				// Inline fragments shouldn't be added to the path as they aren't a field
				const isInlineFragment = originalKey.match(/^...\s*on/) != null;
				return ibb(
					k,
					k,
					v,
					isInlineFragment ? p : [...p, purifyGraphQLKey(keyName || k)],
					isInlineFragment ? pOriginals : [...pOriginals, purifyGraphQLKey(originalKey)],
					false,
				);
			})
			.reduce((a, b) => ({
				...a,
				...b,
			}));
	};
	return ibb;
};

export const purifyGraphQLKey = (k: string) => k.replace(/\([^)]*\)/g, '').replace(/^[^:]*\:/g, '');

const mapPart = (p: string) => {
	const [isArg, isField] = p.split('<>');
	if (isField) {
		return {
			v: isField,
			__type: 'field',
		} as const;
	}
	return {
		v: isArg,
		__type: 'arg',
	} as const;
};

type Part = ReturnType<typeof mapPart>;

export const ResolveFromPath = (props: AllTypesPropsType, returns: ReturnTypesType, ops: Operations) => {
	const ResolvePropsType = (mappedParts: Part[]) => {
		const oKey = ops[mappedParts[0].v];
		const propsP1 = oKey ? props[oKey] : props[mappedParts[0].v];
		if (propsP1 === 'enum' && mappedParts.length === 1) {
			return 'enum';
		}
		if (typeof propsP1 === 'string' && propsP1.startsWith('scalar.') && mappedParts.length === 1) {
			return propsP1;
		}
		if (typeof propsP1 === 'object') {
			if (mappedParts.length < 2) {
				return 'not';
			}
			const propsP2 = propsP1[mappedParts[1].v];
			if (typeof propsP2 === 'string') {
				return rpp(
					`${propsP2}${SEPARATOR}${mappedParts
						.slice(2)
						.map((mp) => mp.v)
						.join(SEPARATOR)}`,
				);
			}
			if (typeof propsP2 === 'object') {
				if (mappedParts.length < 3) {
					return 'not';
				}
				const propsP3 = propsP2[mappedParts[2].v];
				if (propsP3 && mappedParts[2].__type === 'arg') {
					return rpp(
						`${propsP3}${SEPARATOR}${mappedParts
							.slice(3)
							.map((mp) => mp.v)
							.join(SEPARATOR)}`,
					);
				}
			}
		}
		return 'not';
	};
	const ResolveReturnType = (mappedParts: Part[]) => {
		if (mappedParts.length === 0) {
			return 'not';
		}
		const oKey = ops[mappedParts[0].v];
		const returnP1 = oKey ? returns[oKey] : returns[mappedParts[0].v];
		if (typeof returnP1 === 'object') {
			if (mappedParts.length < 2) return 'not';
			const returnP2 = returnP1[mappedParts[1].v];
			if (returnP2) {
				return rpp(
					`${returnP2}${SEPARATOR}${mappedParts
						.slice(2)
						.map((mp) => mp.v)
						.join(SEPARATOR)}`,
				);
			}
		}
		return 'not';
	};
	const rpp = (path: string): 'enum' | 'not' | `scalar.${string}` => {
		const parts = path.split(SEPARATOR).filter((l) => l.length > 0);
		const mappedParts = parts.map(mapPart);
		const propsP1 = ResolvePropsType(mappedParts);
		if (propsP1) {
			return propsP1;
		}
		const returnP1 = ResolveReturnType(mappedParts);
		if (returnP1) {
			return returnP1;
		}
		return 'not';
	};
	return rpp;
};

export const InternalArgsBuilt = ({
	props,
	ops,
	returns,
	scalars,
	vars,
}: {
	props: AllTypesPropsType;
	returns: ReturnTypesType;
	ops: Operations;
	scalars?: ScalarDefinition;
	vars: Array<{ name: string; graphQLType: string }>;
}) => {
	const arb = (a: ZeusArgsType, p = '', root = true): string => {
		if (typeof a === 'string') {
			if (a.startsWith(START_VAR_NAME)) {
				const [varName, graphQLType] = a.replace(START_VAR_NAME, '$').split(GRAPHQL_TYPE_SEPARATOR);
				const v = vars.find((v) => v.name === varName);
				if (!v) {
					vars.push({
						name: varName,
						graphQLType,
					});
				} else {
					if (v.graphQLType !== graphQLType) {
						throw new Error(
							`Invalid variable exists with two different GraphQL Types, "${v.graphQLType}" and ${graphQLType}`,
						);
					}
				}
				return varName;
			}
		}
		const checkType = ResolveFromPath(props, returns, ops)(p);
		if (checkType.startsWith('scalar.')) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const [_, ...splittedScalar] = checkType.split('.');
			const scalarKey = splittedScalar.join('.');
			return (scalars?.[scalarKey]?.encode?.(a) as string) || JSON.stringify(a);
		}
		if (Array.isArray(a)) {
			return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
		}
		if (typeof a === 'string') {
			if (checkType === 'enum') {
				return a;
			}
			return `${JSON.stringify(a)}`;
		}
		if (typeof a === 'object') {
			if (a === null) {
				return `null`;
			}
			const returnedObjectString = Object.entries(a)
				.filter(([, v]) => typeof v !== 'undefined')
				.map(([k, v]) => `${k}: ${arb(v, [p, k].join(SEPARATOR), false)}`)
				.join(',\n');
			if (!root) {
				return `{${returnedObjectString}}`;
			}
			return returnedObjectString;
		}
		return `${a}`;
	};
	return arb;
};

export const resolverFor = <X, T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T]>(
	type: T,
	field: Z,
	fn: (
		args: Required<ResolverInputTypes[T]>[Z] extends [infer Input, any] ? Input : any,
		source: any,
	) => Z extends keyof ModelTypes[T] ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X : never,
) => fn as (args?: any, source?: any) => ReturnType<typeof fn>;

export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
export type ZeusState<T extends (...args: any[]) => Promise<any>> = NonNullable<UnwrapPromise<ReturnType<T>>>;
export type ZeusHook<
	T extends (...args: any[]) => Record<string, (...args: any[]) => Promise<any>>,
	N extends keyof ReturnType<T>,
> = ZeusState<ReturnType<T>[N]>;

export type WithTypeNameValue<T> = T & {
	__typename?: boolean;
	__directives?: string;
};
export type AliasType<T> = WithTypeNameValue<T> & {
	__alias?: Record<string, WithTypeNameValue<T>>;
};
type DeepAnify<T> = {
	[P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
export type ScalarDefinition = Record<string, ScalarResolver>;

type IsScalar<S, SCLR extends ScalarDefinition> = S extends 'scalar' & { name: infer T }
	? T extends keyof SCLR
	? SCLR[T]['decode'] extends (s: unknown) => unknown
	? ReturnType<SCLR[T]['decode']>
	: unknown
	: unknown
	: S;
type IsArray<T, U, SCLR extends ScalarDefinition> = T extends Array<infer R>
	? InputType<R, U, SCLR>[]
	: InputType<T, U, SCLR>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;
type BaseZeusResolver = boolean | 1 | string | Variable<any, string>;

type IsInterfaced<SRC extends DeepAnify<DST>, DST, SCLR extends ScalarDefinition> = FlattenArray<SRC> extends
	| ZEUS_INTERFACES
	| ZEUS_UNIONS
	? {
		[P in keyof SRC]: SRC[P] extends '__union' & infer R
		? P extends keyof DST
		? IsArray<R, '__typename' extends keyof DST ? DST[P] & { __typename: true } : DST[P], SCLR>
		: IsArray<R, '__typename' extends keyof DST ? { __typename: true } : Record<string, never>, SCLR>
		: never;
	}[keyof SRC] & {
		[P in keyof Omit<
			Pick<
				SRC,
				{
					[P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
				}[keyof DST]
			>,
			'__typename'
		>]: IsPayLoad<DST[P]> extends BaseZeusResolver ? IsScalar<SRC[P], SCLR> : IsArray<SRC[P], DST[P], SCLR>;
	}
	: {
		[P in keyof Pick<SRC, keyof DST>]: IsPayLoad<DST[P]> extends BaseZeusResolver
		? IsScalar<SRC[P], SCLR>
		: IsArray<SRC[P], DST[P], SCLR>;
	};

export type MapType<SRC, DST, SCLR extends ScalarDefinition> = SRC extends DeepAnify<DST>
	? IsInterfaced<SRC, DST, SCLR>
	: never;
// eslint-disable-next-line @typescript-eslint/ban-types
export type InputType<SRC, DST, SCLR extends ScalarDefinition = {}> = IsPayLoad<DST> extends { __alias: infer R }
	? {
		[P in keyof R]: MapType<SRC, R[P], SCLR>[keyof MapType<SRC, R[P], SCLR>];
	} & MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>, SCLR>
	: MapType<SRC, IsPayLoad<DST>, SCLR>;
export type SubscriptionToGraphQL<Z, T, SCLR extends ScalarDefinition> = {
	ws: WebSocket;
	on: (fn: (args: InputType<T, Z, SCLR>) => void) => void;
	off: (fn: (e: { data?: InputType<T, Z, SCLR>; code?: number; reason?: string; message?: string }) => void) => void;
	error: (fn: (e: { data?: InputType<T, Z, SCLR>; errors?: string[] }) => void) => void;
	open: () => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FromSelector<SELECTOR, NAME extends keyof GraphQLTypes, SCLR extends ScalarDefinition = {}> = InputType<
	GraphQLTypes[NAME],
	SELECTOR,
	SCLR
>;

export type ScalarResolver = {
	encode?: (s: unknown) => string;
	decode?: (s: unknown) => unknown;
};

export type SelectionFunction<V> = <T>(t: T | V) => T;

type BuiltInVariableTypes = {
	['String']: string;
	['Int']: number;
	['Float']: number;
	['ID']: unknown;
	['Boolean']: boolean;
};
type AllVariableTypes = keyof BuiltInVariableTypes | keyof ZEUS_VARIABLES;
type VariableRequired<T extends string> = `${T}!` | T | `[${T}]` | `[${T}]!` | `[${T}!]` | `[${T}!]!`;
type VR<T extends string> = VariableRequired<VariableRequired<T>>;

export type GraphQLVariableType = VR<AllVariableTypes>;

type ExtractVariableTypeString<T extends string> = T extends VR<infer R1>
	? R1 extends VR<infer R2>
	? R2 extends VR<infer R3>
	? R3 extends VR<infer R4>
	? R4 extends VR<infer R5>
	? R5
	: R4
	: R3
	: R2
	: R1
	: T;

type DecomposeType<T, Type> = T extends `[${infer R}]`
	? Array<DecomposeType<R, Type>> | undefined
	: T extends `${infer R}!`
	? NonNullable<DecomposeType<R, Type>>
	: Type | undefined;

type ExtractTypeFromGraphQLType<T extends string> = T extends keyof ZEUS_VARIABLES
	? ZEUS_VARIABLES[T]
	: T extends keyof BuiltInVariableTypes
	? BuiltInVariableTypes[T]
	: any;

export type GetVariableType<T extends string> = DecomposeType<
	T,
	ExtractTypeFromGraphQLType<ExtractVariableTypeString<T>>
>;

type UndefinedKeys<T> = {
	[K in keyof T]-?: T[K] extends NonNullable<T[K]> ? never : K;
}[keyof T];

type WithNullableKeys<T> = Pick<T, UndefinedKeys<T>>;
type WithNonNullableKeys<T> = Omit<T, UndefinedKeys<T>>;

type OptionalKeys<T> = {
	[P in keyof T]?: T[P];
};

export type WithOptionalNullables<T> = OptionalKeys<WithNullableKeys<T>> & WithNonNullableKeys<T>;

export type Variable<T extends GraphQLVariableType, Name extends string> = {
	' __zeus_name': Name;
	' __zeus_type': T;
};

export type ExtractVariables<Query> = Query extends Variable<infer VType, infer VName>
	? { [key in VName]: GetVariableType<VType> }
	: Query extends [infer Inputs, infer Outputs]
	? ExtractVariables<Inputs> & ExtractVariables<Outputs>
	: Query extends string | number | boolean
	? // eslint-disable-next-line @typescript-eslint/ban-types
	{}
	: UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariables<Query[K]>> }[keyof Query]>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export const START_VAR_NAME = `$ZEUS_VAR`;
export const GRAPHQL_TYPE_SEPARATOR = `__$GRAPHQL__`;

export const $ = <Type extends GraphQLVariableType, Name extends string>(name: Name, graphqlType: Type) => {
	return (START_VAR_NAME + name + GRAPHQL_TYPE_SEPARATOR + graphqlType) as unknown as Variable<Type, Name>;
};
type ZEUS_INTERFACES = never
export type ScalarCoders = {
	bigint?: ScalarResolver;
	json?: ScalarResolver;
	numeric?: ScalarResolver;
	smallint?: ScalarResolver;
	timestamp?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
	/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
	["Boolean_comparison_exp"]: {
		_eq?: boolean | undefined | null | Variable<any, string>,
		_gt?: boolean | undefined | null | Variable<any, string>,
		_gte?: boolean | undefined | null | Variable<any, string>,
		_in?: Array<boolean> | undefined | null | Variable<any, string>,
		_is_null?: boolean | undefined | null | Variable<any, string>,
		_lt?: boolean | undefined | null | Variable<any, string>,
		_lte?: boolean | undefined | null | Variable<any, string>,
		_neq?: boolean | undefined | null | Variable<any, string>,
		_nin?: Array<boolean> | undefined | null | Variable<any, string>
	};
	/** Boolean expression to compare columns of type "Float". All fields are combined with logical 'AND'. */
	["Float_comparison_exp"]: {
		_eq?: number | undefined | null | Variable<any, string>,
		_gt?: number | undefined | null | Variable<any, string>,
		_gte?: number | undefined | null | Variable<any, string>,
		_in?: Array<number> | undefined | null | Variable<any, string>,
		_is_null?: boolean | undefined | null | Variable<any, string>,
		_lt?: number | undefined | null | Variable<any, string>,
		_lte?: number | undefined | null | Variable<any, string>,
		_neq?: number | undefined | null | Variable<any, string>,
		_nin?: Array<number> | undefined | null | Variable<any, string>
	};
	/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
	["Int_comparison_exp"]: {
		_eq?: number | undefined | null | Variable<any, string>,
		_gt?: number | undefined | null | Variable<any, string>,
		_gte?: number | undefined | null | Variable<any, string>,
		_in?: Array<number> | undefined | null | Variable<any, string>,
		_is_null?: boolean | undefined | null | Variable<any, string>,
		_lt?: number | undefined | null | Variable<any, string>,
		_lte?: number | undefined | null | Variable<any, string>,
		_neq?: number | undefined | null | Variable<any, string>,
		_nin?: Array<number> | undefined | null | Variable<any, string>
	};
	/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
	["String_comparison_exp"]: {
		_eq?: string | undefined | null | Variable<any, string>,
		_gt?: string | undefined | null | Variable<any, string>,
		_gte?: string | undefined | null | Variable<any, string>,
		/** does the column match the given case-insensitive pattern */
		_ilike?: string | undefined | null | Variable<any, string>,
		_in?: Array<string> | undefined | null | Variable<any, string>,
		/** does the column match the given POSIX regular expression, case insensitive */
		_iregex?: string | undefined | null | Variable<any, string>,
		_is_null?: boolean | undefined | null | Variable<any, string>,
		/** does the column match the given pattern */
		_like?: string | undefined | null | Variable<any, string>,
		_lt?: string | undefined | null | Variable<any, string>,
		_lte?: string | undefined | null | Variable<any, string>,
		_neq?: string | undefined | null | Variable<any, string>,
		/** does the column NOT match the given case-insensitive pattern */
		_nilike?: string | undefined | null | Variable<any, string>,
		_nin?: Array<string> | undefined | null | Variable<any, string>,
		/** does the column NOT match the given POSIX regular expression, case insensitive */
		_niregex?: string | undefined | null | Variable<any, string>,
		/** does the column NOT match the given pattern */
		_nlike?: string | undefined | null | Variable<any, string>,
		/** does the column NOT match the given POSIX regular expression, case sensitive */
		_nregex?: string | undefined | null | Variable<any, string>,
		/** does the column NOT match the given SQL regular expression */
		_nsimilar?: string | undefined | null | Variable<any, string>,
		/** does the column match the given POSIX regular expression, case sensitive */
		_regex?: string | undefined | null | Variable<any, string>,
		/** does the column match the given SQL regular expression */
		_similar?: string | undefined | null | Variable<any, string>
	};
	["bigint"]: unknown;
	/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
	["bigint_comparison_exp"]: {
		_eq?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		_gt?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		_gte?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		_in?: Array<ValueTypes["bigint"]> | undefined | null | Variable<any, string>,
		_is_null?: boolean | undefined | null | Variable<any, string>,
		_lt?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		_lte?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		_neq?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		_nin?: Array<ValueTypes["bigint"]> | undefined | null | Variable<any, string>
	};
	/** ordering argument of a cursor */
	["cursor_ordering"]: cursor_ordering;
	/** columns and relationships of "inscription" */
	["inscription"]: AliasType<{
		chain_id?: boolean | `@${string}`,
		content_hash?: boolean | `@${string}`,
		content_path?: boolean | `@${string}`,
		content_size_bytes?: boolean | `@${string}`,
		creator?: boolean | `@${string}`,
		current_owner?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		height?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		inscription_histories?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["inscription_history_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["inscription_history_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["inscription_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["inscription_history"]],
		is_explicit?: boolean | `@${string}`,
		metadata?: [{	/** JSON select path */
			path?: string | undefined | null | Variable<any, string>
		}, boolean | `@${string}`],
		/** An object relationship */
		transaction?: ValueTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		type?: boolean | `@${string}`,
		version?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** Boolean expression to filter rows from the table "inscription". All fields are combined with a logical 'AND'. */
	["inscription_bool_exp"]: {
		_and?: Array<ValueTypes["inscription_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["inscription_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["inscription_bool_exp"]> | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		content_hash?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		content_path?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		content_size_bytes?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		creator?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		current_owner?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		inscription_histories?: ValueTypes["inscription_history_bool_exp"] | undefined | null | Variable<any, string>,
		is_explicit?: ValueTypes["Boolean_comparison_exp"] | undefined | null | Variable<any, string>,
		metadata?: ValueTypes["json_comparison_exp"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		type?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		version?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>
	};
	/** columns and relationships of "inscription_history" */
	["inscription_history"]: AliasType<{
		action?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		height?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		/** An object relationship */
		inscription?: ValueTypes["inscription"],
		inscription_id?: boolean | `@${string}`,
		receiver?: boolean | `@${string}`,
		sender?: boolean | `@${string}`,
		/** An object relationship */
		transaction?: ValueTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "inscription_history" */
	["inscription_history_aggregate_order_by"]: {
		avg?: ValueTypes["inscription_history_avg_order_by"] | undefined | null | Variable<any, string>,
		count?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		max?: ValueTypes["inscription_history_max_order_by"] | undefined | null | Variable<any, string>,
		min?: ValueTypes["inscription_history_min_order_by"] | undefined | null | Variable<any, string>,
		stddev?: ValueTypes["inscription_history_stddev_order_by"] | undefined | null | Variable<any, string>,
		stddev_pop?: ValueTypes["inscription_history_stddev_pop_order_by"] | undefined | null | Variable<any, string>,
		stddev_samp?: ValueTypes["inscription_history_stddev_samp_order_by"] | undefined | null | Variable<any, string>,
		sum?: ValueTypes["inscription_history_sum_order_by"] | undefined | null | Variable<any, string>,
		var_pop?: ValueTypes["inscription_history_var_pop_order_by"] | undefined | null | Variable<any, string>,
		var_samp?: ValueTypes["inscription_history_var_samp_order_by"] | undefined | null | Variable<any, string>,
		variance?: ValueTypes["inscription_history_variance_order_by"] | undefined | null | Variable<any, string>
	};
	/** order by avg() on columns of table "inscription_history" */
	["inscription_history_avg_order_by"]: {
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Boolean expression to filter rows from the table "inscription_history". All fields are combined with a logical 'AND'. */
	["inscription_history_bool_exp"]: {
		_and?: Array<ValueTypes["inscription_history_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["inscription_history_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["inscription_history_bool_exp"]> | undefined | null | Variable<any, string>,
		action?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		inscription?: ValueTypes["inscription_bool_exp"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		receiver?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		sender?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>
	};
	/** order by max() on columns of table "inscription_history" */
	["inscription_history_max_order_by"]: {
		action?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		receiver?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		sender?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by min() on columns of table "inscription_history" */
	["inscription_history_min_order_by"]: {
		action?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		receiver?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		sender?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "inscription_history". */
	["inscription_history_order_by"]: {
		action?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription?: ValueTypes["inscription_order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		receiver?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		sender?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "inscription_history" */
	["inscription_history_select_column"]: inscription_history_select_column;
	/** order by stddev() on columns of table "inscription_history" */
	["inscription_history_stddev_order_by"]: {
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_pop() on columns of table "inscription_history" */
	["inscription_history_stddev_pop_order_by"]: {
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_samp() on columns of table "inscription_history" */
	["inscription_history_stddev_samp_order_by"]: {
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Streaming cursor of the table "inscription_history" */
	["inscription_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["inscription_history_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["inscription_history_stream_cursor_value_input"]: {
		action?: string | undefined | null | Variable<any, string>,
		chain_id?: string | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		height?: number | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		inscription_id?: number | undefined | null | Variable<any, string>,
		receiver?: string | undefined | null | Variable<any, string>,
		sender?: string | undefined | null | Variable<any, string>,
		transaction_id?: number | undefined | null | Variable<any, string>
	};
	/** order by sum() on columns of table "inscription_history" */
	["inscription_history_sum_order_by"]: {
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_pop() on columns of table "inscription_history" */
	["inscription_history_var_pop_order_by"]: {
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_samp() on columns of table "inscription_history" */
	["inscription_history_var_samp_order_by"]: {
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by variance() on columns of table "inscription_history" */
	["inscription_history_variance_order_by"]: {
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "inscription". */
	["inscription_order_by"]: {
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		content_hash?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		content_path?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		content_size_bytes?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		creator?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		current_owner?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription_histories_aggregate?: ValueTypes["inscription_history_aggregate_order_by"] | undefined | null | Variable<any, string>,
		is_explicit?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		metadata?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		type?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		version?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "inscription" */
	["inscription_select_column"]: inscription_select_column;
	/** Streaming cursor of the table "inscription" */
	["inscription_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["inscription_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["inscription_stream_cursor_value_input"]: {
		chain_id?: string | undefined | null | Variable<any, string>,
		content_hash?: string | undefined | null | Variable<any, string>,
		content_path?: string | undefined | null | Variable<any, string>,
		content_size_bytes?: number | undefined | null | Variable<any, string>,
		creator?: string | undefined | null | Variable<any, string>,
		current_owner?: string | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		height?: number | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		is_explicit?: boolean | undefined | null | Variable<any, string>,
		metadata?: ValueTypes["json"] | undefined | null | Variable<any, string>,
		transaction_id?: number | undefined | null | Variable<any, string>,
		type?: string | undefined | null | Variable<any, string>,
		version?: string | undefined | null | Variable<any, string>
	};
	["json"]: unknown;
	/** Boolean expression to compare columns of type "json". All fields are combined with logical 'AND'. */
	["json_comparison_exp"]: {
		_eq?: ValueTypes["json"] | undefined | null | Variable<any, string>,
		_gt?: ValueTypes["json"] | undefined | null | Variable<any, string>,
		_gte?: ValueTypes["json"] | undefined | null | Variable<any, string>,
		_in?: Array<ValueTypes["json"]> | undefined | null | Variable<any, string>,
		_is_null?: boolean | undefined | null | Variable<any, string>,
		_lt?: ValueTypes["json"] | undefined | null | Variable<any, string>,
		_lte?: ValueTypes["json"] | undefined | null | Variable<any, string>,
		_neq?: ValueTypes["json"] | undefined | null | Variable<any, string>,
		_nin?: Array<ValueTypes["json"]> | undefined | null | Variable<any, string>
	};
	/** columns and relationships of "marketplace_cft20_detail" */
	["marketplace_cft20_detail"]: AliasType<{
		amount?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		listing_id?: boolean | `@${string}`,
		/** An object relationship */
		marketplace_listing?: ValueTypes["marketplace_listing"],
		ppt?: boolean | `@${string}`,
		/** An object relationship */
		token?: ValueTypes["token"],
		token_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_aggregate_order_by"]: {
		avg?: ValueTypes["marketplace_cft20_detail_avg_order_by"] | undefined | null | Variable<any, string>,
		count?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		max?: ValueTypes["marketplace_cft20_detail_max_order_by"] | undefined | null | Variable<any, string>,
		min?: ValueTypes["marketplace_cft20_detail_min_order_by"] | undefined | null | Variable<any, string>,
		stddev?: ValueTypes["marketplace_cft20_detail_stddev_order_by"] | undefined | null | Variable<any, string>,
		stddev_pop?: ValueTypes["marketplace_cft20_detail_stddev_pop_order_by"] | undefined | null | Variable<any, string>,
		stddev_samp?: ValueTypes["marketplace_cft20_detail_stddev_samp_order_by"] | undefined | null | Variable<any, string>,
		sum?: ValueTypes["marketplace_cft20_detail_sum_order_by"] | undefined | null | Variable<any, string>,
		var_pop?: ValueTypes["marketplace_cft20_detail_var_pop_order_by"] | undefined | null | Variable<any, string>,
		var_samp?: ValueTypes["marketplace_cft20_detail_var_samp_order_by"] | undefined | null | Variable<any, string>,
		variance?: ValueTypes["marketplace_cft20_detail_variance_order_by"] | undefined | null | Variable<any, string>
	};
	/** order by avg() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_avg_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Boolean expression to filter rows from the table "marketplace_cft20_detail". All fields are combined with a logical 'AND'. */
	["marketplace_cft20_detail_bool_exp"]: {
		_and?: Array<ValueTypes["marketplace_cft20_detail_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["marketplace_cft20_detail_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["marketplace_cft20_detail_bool_exp"]> | undefined | null | Variable<any, string>,
		amount?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		marketplace_listing?: ValueTypes["marketplace_listing_bool_exp"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_bool_exp"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>
	};
	/** order by max() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_max_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by min() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_min_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "marketplace_cft20_detail". */
	["marketplace_cft20_detail_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		marketplace_listing?: ValueTypes["marketplace_listing_order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_select_column"]: marketplace_cft20_detail_select_column;
	/** order by stddev() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_pop() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_pop_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_samp() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_samp_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Streaming cursor of the table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["marketplace_cft20_detail_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["marketplace_cft20_detail_stream_cursor_value_input"]: {
		amount?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		listing_id?: number | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		token_id?: number | undefined | null | Variable<any, string>
	};
	/** order by sum() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_sum_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_pop() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_var_pop_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_samp() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_var_samp_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by variance() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_variance_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		listing_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** columns and relationships of "marketplace_listing" */
	["marketplace_listing"]: AliasType<{
		chain_id?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		date_updated?: boolean | `@${string}`,
		deposit_timeout?: boolean | `@${string}`,
		deposit_total?: boolean | `@${string}`,
		depositor_address?: boolean | `@${string}`,
		depositor_timedout_block?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		is_cancelled?: boolean | `@${string}`,
		is_deposited?: boolean | `@${string}`,
		is_filled?: boolean | `@${string}`,
		marketplace_cft20_details?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["marketplace_cft20_detail_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["marketplace_cft20_detail_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["marketplace_cft20_detail_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["marketplace_cft20_detail"]],
		seller_address?: boolean | `@${string}`,
		total?: boolean | `@${string}`,
		/** An object relationship */
		transaction?: ValueTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "marketplace_listing" */
	["marketplace_listing_aggregate_order_by"]: {
		avg?: ValueTypes["marketplace_listing_avg_order_by"] | undefined | null | Variable<any, string>,
		count?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		max?: ValueTypes["marketplace_listing_max_order_by"] | undefined | null | Variable<any, string>,
		min?: ValueTypes["marketplace_listing_min_order_by"] | undefined | null | Variable<any, string>,
		stddev?: ValueTypes["marketplace_listing_stddev_order_by"] | undefined | null | Variable<any, string>,
		stddev_pop?: ValueTypes["marketplace_listing_stddev_pop_order_by"] | undefined | null | Variable<any, string>,
		stddev_samp?: ValueTypes["marketplace_listing_stddev_samp_order_by"] | undefined | null | Variable<any, string>,
		sum?: ValueTypes["marketplace_listing_sum_order_by"] | undefined | null | Variable<any, string>,
		var_pop?: ValueTypes["marketplace_listing_var_pop_order_by"] | undefined | null | Variable<any, string>,
		var_samp?: ValueTypes["marketplace_listing_var_samp_order_by"] | undefined | null | Variable<any, string>,
		variance?: ValueTypes["marketplace_listing_variance_order_by"] | undefined | null | Variable<any, string>
	};
	/** order by avg() on columns of table "marketplace_listing" */
	["marketplace_listing_avg_order_by"]: {
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Boolean expression to filter rows from the table "marketplace_listing". All fields are combined with a logical 'AND'. */
	["marketplace_listing_bool_exp"]: {
		_and?: Array<ValueTypes["marketplace_listing_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["marketplace_listing_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["marketplace_listing_bool_exp"]> | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		deposit_timeout?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		depositor_address?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		is_cancelled?: ValueTypes["Boolean_comparison_exp"] | undefined | null | Variable<any, string>,
		is_deposited?: ValueTypes["Boolean_comparison_exp"] | undefined | null | Variable<any, string>,
		is_filled?: ValueTypes["Boolean_comparison_exp"] | undefined | null | Variable<any, string>,
		marketplace_cft20_details?: ValueTypes["marketplace_cft20_detail_bool_exp"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>
	};
	/** order by max() on columns of table "marketplace_listing" */
	["marketplace_listing_max_order_by"]: {
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by min() on columns of table "marketplace_listing" */
	["marketplace_listing_min_order_by"]: {
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "marketplace_listing". */
	["marketplace_listing_order_by"]: {
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		is_cancelled?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		is_deposited?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		is_filled?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		marketplace_cft20_details_aggregate?: ValueTypes["marketplace_cft20_detail_aggregate_order_by"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "marketplace_listing" */
	["marketplace_listing_select_column"]: marketplace_listing_select_column;
	/** order by stddev() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_order_by"]: {
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_pop() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_pop_order_by"]: {
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_samp() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_samp_order_by"]: {
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Streaming cursor of the table "marketplace_listing" */
	["marketplace_listing_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["marketplace_listing_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["marketplace_listing_stream_cursor_value_input"]: {
		chain_id?: string | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		deposit_timeout?: number | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		depositor_address?: string | undefined | null | Variable<any, string>,
		depositor_timedout_block?: number | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		is_cancelled?: boolean | undefined | null | Variable<any, string>,
		is_deposited?: boolean | undefined | null | Variable<any, string>,
		is_filled?: boolean | undefined | null | Variable<any, string>,
		seller_address?: string | undefined | null | Variable<any, string>,
		total?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		transaction_id?: number | undefined | null | Variable<any, string>
	};
	/** order by sum() on columns of table "marketplace_listing" */
	["marketplace_listing_sum_order_by"]: {
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_pop() on columns of table "marketplace_listing" */
	["marketplace_listing_var_pop_order_by"]: {
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_samp() on columns of table "marketplace_listing" */
	["marketplace_listing_var_samp_order_by"]: {
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by variance() on columns of table "marketplace_listing" */
	["marketplace_listing_variance_order_by"]: {
		deposit_timeout?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		deposit_total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		depositor_timedout_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	["numeric"]: unknown;
	/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
	["numeric_comparison_exp"]: {
		_eq?: ValueTypes["numeric"] | undefined | null | Variable<any, string>,
		_gt?: ValueTypes["numeric"] | undefined | null | Variable<any, string>,
		_gte?: ValueTypes["numeric"] | undefined | null | Variable<any, string>,
		_in?: Array<ValueTypes["numeric"]> | undefined | null | Variable<any, string>,
		_is_null?: boolean | undefined | null | Variable<any, string>,
		_lt?: ValueTypes["numeric"] | undefined | null | Variable<any, string>,
		_lte?: ValueTypes["numeric"] | undefined | null | Variable<any, string>,
		_neq?: ValueTypes["numeric"] | undefined | null | Variable<any, string>,
		_nin?: Array<ValueTypes["numeric"]> | undefined | null | Variable<any, string>
	};
	/** column ordering options */
	["order_by"]: order_by;
	["query_root"]: AliasType<{
		inscription?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["inscription_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["inscription_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["inscription_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["inscription"]],
		inscription_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["inscription"]],
		inscription_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["inscription_history_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["inscription_history_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["inscription_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["inscription_history"]],
		inscription_history_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["inscription_history"]],
		marketplace_cft20_detail?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["marketplace_cft20_detail_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["marketplace_cft20_detail_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["marketplace_cft20_detail_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["marketplace_cft20_detail"]],
		marketplace_cft20_detail_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["marketplace_cft20_detail"]],
		marketplace_listing?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["marketplace_listing_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["marketplace_listing_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["marketplace_listing_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["marketplace_listing"]],
		marketplace_listing_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["marketplace_listing"]],
		status?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["status_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["status_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["status_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["status"]],
		status_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["status"]],
		token?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token"]],
		token_address_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_address_history_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_address_history_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_address_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_address_history"]],
		token_address_history_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["token_address_history"]],
		token_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["token"]],
		token_holder?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_holder_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_holder_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_holder_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_holder"]],
		token_holder_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["token_holder"]],
		token_open_position?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_open_position_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_open_position_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_open_position_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_open_position"]],
		token_open_position_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["token_open_position"]],
		token_trade_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_trade_history_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_trade_history_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_trade_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_trade_history"]],
		token_trade_history_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["token_trade_history"]],
		transaction?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["transaction_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["transaction_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["transaction"]],
		transaction_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["transaction"]],
		__typename?: boolean | `@${string}`
	}>;
	["smallint"]: unknown;
	/** Boolean expression to compare columns of type "smallint". All fields are combined with logical 'AND'. */
	["smallint_comparison_exp"]: {
		_eq?: ValueTypes["smallint"] | undefined | null | Variable<any, string>,
		_gt?: ValueTypes["smallint"] | undefined | null | Variable<any, string>,
		_gte?: ValueTypes["smallint"] | undefined | null | Variable<any, string>,
		_in?: Array<ValueTypes["smallint"]> | undefined | null | Variable<any, string>,
		_is_null?: boolean | undefined | null | Variable<any, string>,
		_lt?: ValueTypes["smallint"] | undefined | null | Variable<any, string>,
		_lte?: ValueTypes["smallint"] | undefined | null | Variable<any, string>,
		_neq?: ValueTypes["smallint"] | undefined | null | Variable<any, string>,
		_nin?: Array<ValueTypes["smallint"]> | undefined | null | Variable<any, string>
	};
	/** columns and relationships of "status" */
	["status"]: AliasType<{
		base_token?: boolean | `@${string}`,
		base_token_usd?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_updated?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		last_known_height?: boolean | `@${string}`,
		last_processed_height?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** Boolean expression to filter rows from the table "status". All fields are combined with a logical 'AND'. */
	["status_bool_exp"]: {
		_and?: Array<ValueTypes["status_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["status_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["status_bool_exp"]> | undefined | null | Variable<any, string>,
		base_token?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		base_token_usd?: ValueTypes["Float_comparison_exp"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		last_known_height?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		last_processed_height?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "status". */
	["status_order_by"]: {
		base_token?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		base_token_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		last_known_height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		last_processed_height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "status" */
	["status_select_column"]: status_select_column;
	/** Streaming cursor of the table "status" */
	["status_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["status_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["status_stream_cursor_value_input"]: {
		base_token?: string | undefined | null | Variable<any, string>,
		base_token_usd?: number | undefined | null | Variable<any, string>,
		chain_id?: string | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		last_known_height?: number | undefined | null | Variable<any, string>,
		last_processed_height?: number | undefined | null | Variable<any, string>
	};
	["subscription_root"]: AliasType<{
		inscription?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["inscription_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["inscription_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["inscription_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["inscription"]],
		inscription_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["inscription"]],
		inscription_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["inscription_history_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["inscription_history_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["inscription_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["inscription_history"]],
		inscription_history_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["inscription_history"]],
		inscription_history_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["inscription_history_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["inscription_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["inscription_history"]],
		inscription_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["inscription_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["inscription_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["inscription"]],
		marketplace_cft20_detail?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["marketplace_cft20_detail_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["marketplace_cft20_detail_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["marketplace_cft20_detail_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["marketplace_cft20_detail"]],
		marketplace_cft20_detail_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["marketplace_cft20_detail"]],
		marketplace_cft20_detail_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["marketplace_cft20_detail_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["marketplace_cft20_detail_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["marketplace_cft20_detail"]],
		marketplace_listing?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["marketplace_listing_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["marketplace_listing_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["marketplace_listing_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["marketplace_listing"]],
		marketplace_listing_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["marketplace_listing"]],
		marketplace_listing_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["marketplace_listing_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["marketplace_listing_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["marketplace_listing"]],
		status?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["status_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["status_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["status_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["status"]],
		status_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["status"]],
		status_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["status_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["status_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["status"]],
		token?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token"]],
		token_address_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_address_history_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_address_history_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_address_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_address_history"]],
		token_address_history_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["token_address_history"]],
		token_address_history_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["token_address_history_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_address_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_address_history"]],
		token_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["token"]],
		token_holder?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_holder_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_holder_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_holder_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_holder"]],
		token_holder_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["token_holder"]],
		token_holder_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["token_holder_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_holder_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_holder"]],
		token_open_position?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_open_position_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_open_position_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_open_position_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_open_position"]],
		token_open_position_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["token_open_position"]],
		token_open_position_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["token_open_position_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_open_position_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_open_position"]],
		token_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["token_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token"]],
		token_trade_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_trade_history_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_trade_history_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_trade_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_trade_history"]],
		token_trade_history_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["token_trade_history"]],
		token_trade_history_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["token_trade_history_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_trade_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_trade_history"]],
		transaction?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["transaction_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["transaction_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["transaction"]],
		transaction_by_pk?: [{ id: number | Variable<any, string> }, ValueTypes["transaction"]],
		transaction_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number | Variable<any, string>,	/** cursor to stream the results returned by the query */
			cursor: Array<ValueTypes["transaction_stream_cursor_input"] | undefined | null> | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["transaction"]],
		__typename?: boolean | `@${string}`
	}>;
	["timestamp"]: unknown;
	/** Boolean expression to compare columns of type "timestamp". All fields are combined with logical 'AND'. */
	["timestamp_comparison_exp"]: {
		_eq?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		_gt?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		_gte?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		_in?: Array<ValueTypes["timestamp"]> | undefined | null | Variable<any, string>,
		_is_null?: boolean | undefined | null | Variable<any, string>,
		_lt?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		_lte?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		_neq?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		_nin?: Array<ValueTypes["timestamp"]> | undefined | null | Variable<any, string>
	};
	/** columns and relationships of "token" */
	["token"]: AliasType<{
		chain_id?: boolean | `@${string}`,
		circulating_supply?: boolean | `@${string}`,
		content_path?: boolean | `@${string}`,
		content_size_bytes?: boolean | `@${string}`,
		creator?: boolean | `@${string}`,
		current_owner?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		decimals?: boolean | `@${string}`,
		height?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		last_price_base?: boolean | `@${string}`,
		launch_timestamp?: boolean | `@${string}`,
		marketplace_cft20_details?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["marketplace_cft20_detail_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["marketplace_cft20_detail_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["marketplace_cft20_detail_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["marketplace_cft20_detail"]],
		max_supply?: boolean | `@${string}`,
		metadata?: boolean | `@${string}`,
		mint_page?: boolean | `@${string}`,
		name?: boolean | `@${string}`,
		per_mint_limit?: boolean | `@${string}`,
		ticker?: boolean | `@${string}`,
		token_address_histories?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_address_history_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_address_history_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_address_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_address_history"]],
		token_holders?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_holder_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_holder_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_holder_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_holder"]],
		token_open_positions?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_open_position_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_open_position_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_open_position_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_open_position"]],
		token_trade_histories?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_trade_history_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_trade_history_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_trade_history_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_trade_history"]],
		/** An object relationship */
		transaction?: ValueTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		version?: boolean | `@${string}`,
		volume_24_base?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** columns and relationships of "token_address_history" */
	["token_address_history"]: AliasType<{
		action?: boolean | `@${string}`,
		amount?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		height?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		receiver?: boolean | `@${string}`,
		sender?: boolean | `@${string}`,
		/** An object relationship */
		token?: ValueTypes["token"],
		token_id?: boolean | `@${string}`,
		/** An object relationship */
		transaction?: ValueTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "token_address_history" */
	["token_address_history_aggregate_order_by"]: {
		avg?: ValueTypes["token_address_history_avg_order_by"] | undefined | null | Variable<any, string>,
		count?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		max?: ValueTypes["token_address_history_max_order_by"] | undefined | null | Variable<any, string>,
		min?: ValueTypes["token_address_history_min_order_by"] | undefined | null | Variable<any, string>,
		stddev?: ValueTypes["token_address_history_stddev_order_by"] | undefined | null | Variable<any, string>,
		stddev_pop?: ValueTypes["token_address_history_stddev_pop_order_by"] | undefined | null | Variable<any, string>,
		stddev_samp?: ValueTypes["token_address_history_stddev_samp_order_by"] | undefined | null | Variable<any, string>,
		sum?: ValueTypes["token_address_history_sum_order_by"] | undefined | null | Variable<any, string>,
		var_pop?: ValueTypes["token_address_history_var_pop_order_by"] | undefined | null | Variable<any, string>,
		var_samp?: ValueTypes["token_address_history_var_samp_order_by"] | undefined | null | Variable<any, string>,
		variance?: ValueTypes["token_address_history_variance_order_by"] | undefined | null | Variable<any, string>
	};
	/** order by avg() on columns of table "token_address_history" */
	["token_address_history_avg_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Boolean expression to filter rows from the table "token_address_history". All fields are combined with a logical 'AND'. */
	["token_address_history_bool_exp"]: {
		_and?: Array<ValueTypes["token_address_history_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["token_address_history_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["token_address_history_bool_exp"]> | undefined | null | Variable<any, string>,
		action?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		amount?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		receiver?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		sender?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_bool_exp"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>
	};
	/** order by max() on columns of table "token_address_history" */
	["token_address_history_max_order_by"]: {
		action?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		receiver?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		sender?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by min() on columns of table "token_address_history" */
	["token_address_history_min_order_by"]: {
		action?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		receiver?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		sender?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "token_address_history". */
	["token_address_history_order_by"]: {
		action?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		receiver?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		sender?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "token_address_history" */
	["token_address_history_select_column"]: token_address_history_select_column;
	/** order by stddev() on columns of table "token_address_history" */
	["token_address_history_stddev_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_pop() on columns of table "token_address_history" */
	["token_address_history_stddev_pop_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_samp() on columns of table "token_address_history" */
	["token_address_history_stddev_samp_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Streaming cursor of the table "token_address_history" */
	["token_address_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["token_address_history_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["token_address_history_stream_cursor_value_input"]: {
		action?: string | undefined | null | Variable<any, string>,
		amount?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		chain_id?: string | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		height?: number | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		receiver?: string | undefined | null | Variable<any, string>,
		sender?: string | undefined | null | Variable<any, string>,
		token_id?: number | undefined | null | Variable<any, string>,
		transaction_id?: number | undefined | null | Variable<any, string>
	};
	/** order by sum() on columns of table "token_address_history" */
	["token_address_history_sum_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_pop() on columns of table "token_address_history" */
	["token_address_history_var_pop_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_samp() on columns of table "token_address_history" */
	["token_address_history_var_samp_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by variance() on columns of table "token_address_history" */
	["token_address_history_variance_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Boolean expression to filter rows from the table "token". All fields are combined with a logical 'AND'. */
	["token_bool_exp"]: {
		_and?: Array<ValueTypes["token_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["token_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["token_bool_exp"]> | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		circulating_supply?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		content_path?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		content_size_bytes?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		creator?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		current_owner?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		decimals?: ValueTypes["smallint_comparison_exp"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		last_price_base?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		launch_timestamp?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		marketplace_cft20_details?: ValueTypes["marketplace_cft20_detail_bool_exp"] | undefined | null | Variable<any, string>,
		max_supply?: ValueTypes["numeric_comparison_exp"] | undefined | null | Variable<any, string>,
		metadata?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		mint_page?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		name?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		per_mint_limit?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		ticker?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		token_address_histories?: ValueTypes["token_address_history_bool_exp"] | undefined | null | Variable<any, string>,
		token_holders?: ValueTypes["token_holder_bool_exp"] | undefined | null | Variable<any, string>,
		token_open_positions?: ValueTypes["token_open_position_bool_exp"] | undefined | null | Variable<any, string>,
		token_trade_histories?: ValueTypes["token_trade_history_bool_exp"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		version?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		volume_24_base?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>
	};
	/** columns and relationships of "token_holder" */
	["token_holder"]: AliasType<{
		address?: boolean | `@${string}`,
		amount?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_updated?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		/** An object relationship */
		token?: ValueTypes["token"],
		token_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "token_holder" */
	["token_holder_aggregate_order_by"]: {
		avg?: ValueTypes["token_holder_avg_order_by"] | undefined | null | Variable<any, string>,
		count?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		max?: ValueTypes["token_holder_max_order_by"] | undefined | null | Variable<any, string>,
		min?: ValueTypes["token_holder_min_order_by"] | undefined | null | Variable<any, string>,
		stddev?: ValueTypes["token_holder_stddev_order_by"] | undefined | null | Variable<any, string>,
		stddev_pop?: ValueTypes["token_holder_stddev_pop_order_by"] | undefined | null | Variable<any, string>,
		stddev_samp?: ValueTypes["token_holder_stddev_samp_order_by"] | undefined | null | Variable<any, string>,
		sum?: ValueTypes["token_holder_sum_order_by"] | undefined | null | Variable<any, string>,
		var_pop?: ValueTypes["token_holder_var_pop_order_by"] | undefined | null | Variable<any, string>,
		var_samp?: ValueTypes["token_holder_var_samp_order_by"] | undefined | null | Variable<any, string>,
		variance?: ValueTypes["token_holder_variance_order_by"] | undefined | null | Variable<any, string>
	};
	/** order by avg() on columns of table "token_holder" */
	["token_holder_avg_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Boolean expression to filter rows from the table "token_holder". All fields are combined with a logical 'AND'. */
	["token_holder_bool_exp"]: {
		_and?: Array<ValueTypes["token_holder_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["token_holder_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["token_holder_bool_exp"]> | undefined | null | Variable<any, string>,
		address?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		amount?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_bool_exp"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>
	};
	/** order by max() on columns of table "token_holder" */
	["token_holder_max_order_by"]: {
		address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by min() on columns of table "token_holder" */
	["token_holder_min_order_by"]: {
		address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "token_holder". */
	["token_holder_order_by"]: {
		address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "token_holder" */
	["token_holder_select_column"]: token_holder_select_column;
	/** order by stddev() on columns of table "token_holder" */
	["token_holder_stddev_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_pop() on columns of table "token_holder" */
	["token_holder_stddev_pop_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_samp() on columns of table "token_holder" */
	["token_holder_stddev_samp_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Streaming cursor of the table "token_holder" */
	["token_holder_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["token_holder_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["token_holder_stream_cursor_value_input"]: {
		address?: string | undefined | null | Variable<any, string>,
		amount?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		chain_id?: string | undefined | null | Variable<any, string>,
		date_updated?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		token_id?: number | undefined | null | Variable<any, string>
	};
	/** order by sum() on columns of table "token_holder" */
	["token_holder_sum_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_pop() on columns of table "token_holder" */
	["token_holder_var_pop_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_samp() on columns of table "token_holder" */
	["token_holder_var_samp_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by variance() on columns of table "token_holder" */
	["token_holder_variance_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** columns and relationships of "token_open_position" */
	["token_open_position"]: AliasType<{
		amount?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		date_filled?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		is_cancelled?: boolean | `@${string}`,
		is_filled?: boolean | `@${string}`,
		is_reserved?: boolean | `@${string}`,
		ppt?: boolean | `@${string}`,
		reserve_expires_block?: boolean | `@${string}`,
		reserved_by?: boolean | `@${string}`,
		seller_address?: boolean | `@${string}`,
		/** An object relationship */
		token?: ValueTypes["token"],
		token_id?: boolean | `@${string}`,
		total?: boolean | `@${string}`,
		/** An object relationship */
		transaction?: ValueTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "token_open_position" */
	["token_open_position_aggregate_order_by"]: {
		avg?: ValueTypes["token_open_position_avg_order_by"] | undefined | null | Variable<any, string>,
		count?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		max?: ValueTypes["token_open_position_max_order_by"] | undefined | null | Variable<any, string>,
		min?: ValueTypes["token_open_position_min_order_by"] | undefined | null | Variable<any, string>,
		stddev?: ValueTypes["token_open_position_stddev_order_by"] | undefined | null | Variable<any, string>,
		stddev_pop?: ValueTypes["token_open_position_stddev_pop_order_by"] | undefined | null | Variable<any, string>,
		stddev_samp?: ValueTypes["token_open_position_stddev_samp_order_by"] | undefined | null | Variable<any, string>,
		sum?: ValueTypes["token_open_position_sum_order_by"] | undefined | null | Variable<any, string>,
		var_pop?: ValueTypes["token_open_position_var_pop_order_by"] | undefined | null | Variable<any, string>,
		var_samp?: ValueTypes["token_open_position_var_samp_order_by"] | undefined | null | Variable<any, string>,
		variance?: ValueTypes["token_open_position_variance_order_by"] | undefined | null | Variable<any, string>
	};
	/** order by avg() on columns of table "token_open_position" */
	["token_open_position_avg_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Boolean expression to filter rows from the table "token_open_position". All fields are combined with a logical 'AND'. */
	["token_open_position_bool_exp"]: {
		_and?: Array<ValueTypes["token_open_position_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["token_open_position_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["token_open_position_bool_exp"]> | undefined | null | Variable<any, string>,
		amount?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		date_filled?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		is_cancelled?: ValueTypes["Boolean_comparison_exp"] | undefined | null | Variable<any, string>,
		is_filled?: ValueTypes["Boolean_comparison_exp"] | undefined | null | Variable<any, string>,
		is_reserved?: ValueTypes["Boolean_comparison_exp"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		reserved_by?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_bool_exp"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>
	};
	/** order by max() on columns of table "token_open_position" */
	["token_open_position_max_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_filled?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserved_by?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by min() on columns of table "token_open_position" */
	["token_open_position_min_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_filled?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserved_by?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "token_open_position". */
	["token_open_position_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_filled?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		is_cancelled?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		is_filled?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		is_reserved?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserved_by?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "token_open_position" */
	["token_open_position_select_column"]: token_open_position_select_column;
	/** order by stddev() on columns of table "token_open_position" */
	["token_open_position_stddev_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_pop() on columns of table "token_open_position" */
	["token_open_position_stddev_pop_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_samp() on columns of table "token_open_position" */
	["token_open_position_stddev_samp_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Streaming cursor of the table "token_open_position" */
	["token_open_position_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["token_open_position_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["token_open_position_stream_cursor_value_input"]: {
		amount?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		chain_id?: string | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		date_filled?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		is_cancelled?: boolean | undefined | null | Variable<any, string>,
		is_filled?: boolean | undefined | null | Variable<any, string>,
		is_reserved?: boolean | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: number | undefined | null | Variable<any, string>,
		reserved_by?: string | undefined | null | Variable<any, string>,
		seller_address?: string | undefined | null | Variable<any, string>,
		token_id?: number | undefined | null | Variable<any, string>,
		total?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		transaction_id?: number | undefined | null | Variable<any, string>
	};
	/** order by sum() on columns of table "token_open_position" */
	["token_open_position_sum_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_pop() on columns of table "token_open_position" */
	["token_open_position_var_pop_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_samp() on columns of table "token_open_position" */
	["token_open_position_var_samp_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by variance() on columns of table "token_open_position" */
	["token_open_position_variance_order_by"]: {
		amount?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ppt?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		reserve_expires_block?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "token". */
	["token_order_by"]: {
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		circulating_supply?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		content_path?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		content_size_bytes?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		creator?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		current_owner?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		decimals?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		last_price_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		launch_timestamp?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		marketplace_cft20_details_aggregate?: ValueTypes["marketplace_cft20_detail_aggregate_order_by"] | undefined | null | Variable<any, string>,
		max_supply?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		metadata?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		mint_page?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		name?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		per_mint_limit?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		ticker?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_address_histories_aggregate?: ValueTypes["token_address_history_aggregate_order_by"] | undefined | null | Variable<any, string>,
		token_holders_aggregate?: ValueTypes["token_holder_aggregate_order_by"] | undefined | null | Variable<any, string>,
		token_open_positions_aggregate?: ValueTypes["token_open_position_aggregate_order_by"] | undefined | null | Variable<any, string>,
		token_trade_histories_aggregate?: ValueTypes["token_trade_history_aggregate_order_by"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		version?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		volume_24_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "token" */
	["token_select_column"]: token_select_column;
	/** Streaming cursor of the table "token" */
	["token_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["token_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["token_stream_cursor_value_input"]: {
		chain_id?: string | undefined | null | Variable<any, string>,
		circulating_supply?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		content_path?: string | undefined | null | Variable<any, string>,
		content_size_bytes?: number | undefined | null | Variable<any, string>,
		creator?: string | undefined | null | Variable<any, string>,
		current_owner?: string | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		decimals?: ValueTypes["smallint"] | undefined | null | Variable<any, string>,
		height?: number | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		last_price_base?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		launch_timestamp?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		max_supply?: ValueTypes["numeric"] | undefined | null | Variable<any, string>,
		metadata?: string | undefined | null | Variable<any, string>,
		mint_page?: string | undefined | null | Variable<any, string>,
		name?: string | undefined | null | Variable<any, string>,
		per_mint_limit?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		ticker?: string | undefined | null | Variable<any, string>,
		transaction_id?: number | undefined | null | Variable<any, string>,
		version?: string | undefined | null | Variable<any, string>,
		volume_24_base?: ValueTypes["bigint"] | undefined | null | Variable<any, string>
	};
	/** columns and relationships of "token_trade_history" */
	["token_trade_history"]: AliasType<{
		amount_base?: boolean | `@${string}`,
		amount_quote?: boolean | `@${string}`,
		buyer_address?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		rate?: boolean | `@${string}`,
		seller_address?: boolean | `@${string}`,
		/** An object relationship */
		token?: ValueTypes["token"],
		token_id?: boolean | `@${string}`,
		total_usd?: boolean | `@${string}`,
		/** An object relationship */
		transaction?: ValueTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "token_trade_history" */
	["token_trade_history_aggregate_order_by"]: {
		avg?: ValueTypes["token_trade_history_avg_order_by"] | undefined | null | Variable<any, string>,
		count?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		max?: ValueTypes["token_trade_history_max_order_by"] | undefined | null | Variable<any, string>,
		min?: ValueTypes["token_trade_history_min_order_by"] | undefined | null | Variable<any, string>,
		stddev?: ValueTypes["token_trade_history_stddev_order_by"] | undefined | null | Variable<any, string>,
		stddev_pop?: ValueTypes["token_trade_history_stddev_pop_order_by"] | undefined | null | Variable<any, string>,
		stddev_samp?: ValueTypes["token_trade_history_stddev_samp_order_by"] | undefined | null | Variable<any, string>,
		sum?: ValueTypes["token_trade_history_sum_order_by"] | undefined | null | Variable<any, string>,
		var_pop?: ValueTypes["token_trade_history_var_pop_order_by"] | undefined | null | Variable<any, string>,
		var_samp?: ValueTypes["token_trade_history_var_samp_order_by"] | undefined | null | Variable<any, string>,
		variance?: ValueTypes["token_trade_history_variance_order_by"] | undefined | null | Variable<any, string>
	};
	/** order by avg() on columns of table "token_trade_history" */
	["token_trade_history_avg_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Boolean expression to filter rows from the table "token_trade_history". All fields are combined with a logical 'AND'. */
	["token_trade_history_bool_exp"]: {
		_and?: Array<ValueTypes["token_trade_history_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["token_trade_history_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["token_trade_history_bool_exp"]> | undefined | null | Variable<any, string>,
		amount_base?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		buyer_address?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["bigint_comparison_exp"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_bool_exp"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["Float_comparison_exp"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>
	};
	/** order by max() on columns of table "token_trade_history" */
	["token_trade_history_max_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		buyer_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by min() on columns of table "token_trade_history" */
	["token_trade_history_min_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		buyer_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "token_trade_history". */
	["token_trade_history_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		buyer_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		chain_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		seller_address?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction?: ValueTypes["transaction_order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "token_trade_history" */
	["token_trade_history_select_column"]: token_trade_history_select_column;
	/** order by stddev() on columns of table "token_trade_history" */
	["token_trade_history_stddev_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_pop() on columns of table "token_trade_history" */
	["token_trade_history_stddev_pop_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by stddev_samp() on columns of table "token_trade_history" */
	["token_trade_history_stddev_samp_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** Streaming cursor of the table "token_trade_history" */
	["token_trade_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["token_trade_history_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["token_trade_history_stream_cursor_value_input"]: {
		amount_base?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		buyer_address?: string | undefined | null | Variable<any, string>,
		chain_id?: string | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		rate?: ValueTypes["bigint"] | undefined | null | Variable<any, string>,
		seller_address?: string | undefined | null | Variable<any, string>,
		token_id?: number | undefined | null | Variable<any, string>,
		total_usd?: number | undefined | null | Variable<any, string>,
		transaction_id?: number | undefined | null | Variable<any, string>
	};
	/** order by sum() on columns of table "token_trade_history" */
	["token_trade_history_sum_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_pop() on columns of table "token_trade_history" */
	["token_trade_history_var_pop_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by var_samp() on columns of table "token_trade_history" */
	["token_trade_history_var_samp_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** order by variance() on columns of table "token_trade_history" */
	["token_trade_history_variance_order_by"]: {
		amount_base?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		amount_quote?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		rate?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		total_usd?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		transaction_id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>
	};
	/** columns and relationships of "transaction" */
	["transaction"]: AliasType<{
		content?: boolean | `@${string}`,
		content_length?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		fees?: boolean | `@${string}`,
		gas_used?: boolean | `@${string}`,
		hash?: boolean | `@${string}`,
		height?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		/** An object relationship */
		inscription?: ValueTypes["inscription"],
		/** An object relationship */
		inscription_history?: ValueTypes["inscription_history"],
		marketplace_listings?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["marketplace_listing_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["marketplace_listing_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["marketplace_listing_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["marketplace_listing"]],
		status_message?: boolean | `@${string}`,
		/** An object relationship */
		token?: ValueTypes["token"],
		/** An object relationship */
		token_address_history?: ValueTypes["token_address_history"],
		token_open_positions?: [{	/** distinct select on columns */
			distinct_on?: Array<ValueTypes["token_open_position_select_column"]> | undefined | null | Variable<any, string>,	/** limit the number of rows returned */
			limit?: number | undefined | null | Variable<any, string>,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null | Variable<any, string>,	/** sort the rows by one or more columns */
			order_by?: Array<ValueTypes["token_open_position_order_by"]> | undefined | null | Variable<any, string>,	/** filter the rows returned */
			where?: ValueTypes["token_open_position_bool_exp"] | undefined | null | Variable<any, string>
		}, ValueTypes["token_open_position"]],
		/** An object relationship */
		token_trade_history?: ValueTypes["token_trade_history"],
		__typename?: boolean | `@${string}`
	}>;
	/** Boolean expression to filter rows from the table "transaction". All fields are combined with a logical 'AND'. */
	["transaction_bool_exp"]: {
		_and?: Array<ValueTypes["transaction_bool_exp"]> | undefined | null | Variable<any, string>,
		_not?: ValueTypes["transaction_bool_exp"] | undefined | null | Variable<any, string>,
		_or?: Array<ValueTypes["transaction_bool_exp"]> | undefined | null | Variable<any, string>,
		content?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		content_length?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp_comparison_exp"] | undefined | null | Variable<any, string>,
		fees?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		gas_used?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		hash?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["Int_comparison_exp"] | undefined | null | Variable<any, string>,
		inscription?: ValueTypes["inscription_bool_exp"] | undefined | null | Variable<any, string>,
		inscription_history?: ValueTypes["inscription_history_bool_exp"] | undefined | null | Variable<any, string>,
		marketplace_listings?: ValueTypes["marketplace_listing_bool_exp"] | undefined | null | Variable<any, string>,
		status_message?: ValueTypes["String_comparison_exp"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_bool_exp"] | undefined | null | Variable<any, string>,
		token_address_history?: ValueTypes["token_address_history_bool_exp"] | undefined | null | Variable<any, string>,
		token_open_positions?: ValueTypes["token_open_position_bool_exp"] | undefined | null | Variable<any, string>,
		token_trade_history?: ValueTypes["token_trade_history_bool_exp"] | undefined | null | Variable<any, string>
	};
	/** Ordering options when selecting data from "transaction". */
	["transaction_order_by"]: {
		content?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		content_length?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		fees?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		gas_used?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		hash?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		height?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		id?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		inscription?: ValueTypes["inscription_order_by"] | undefined | null | Variable<any, string>,
		inscription_history?: ValueTypes["inscription_history_order_by"] | undefined | null | Variable<any, string>,
		marketplace_listings_aggregate?: ValueTypes["marketplace_listing_aggregate_order_by"] | undefined | null | Variable<any, string>,
		status_message?: ValueTypes["order_by"] | undefined | null | Variable<any, string>,
		token?: ValueTypes["token_order_by"] | undefined | null | Variable<any, string>,
		token_address_history?: ValueTypes["token_address_history_order_by"] | undefined | null | Variable<any, string>,
		token_open_positions_aggregate?: ValueTypes["token_open_position_aggregate_order_by"] | undefined | null | Variable<any, string>,
		token_trade_history?: ValueTypes["token_trade_history_order_by"] | undefined | null | Variable<any, string>
	};
	/** select columns of table "transaction" */
	["transaction_select_column"]: transaction_select_column;
	/** Streaming cursor of the table "transaction" */
	["transaction_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ValueTypes["transaction_stream_cursor_value_input"] | Variable<any, string>,
		/** cursor ordering */
		ordering?: ValueTypes["cursor_ordering"] | undefined | null | Variable<any, string>
	};
	/** Initial value of the column from where the streaming should start */
	["transaction_stream_cursor_value_input"]: {
		content?: string | undefined | null | Variable<any, string>,
		content_length?: number | undefined | null | Variable<any, string>,
		date_created?: ValueTypes["timestamp"] | undefined | null | Variable<any, string>,
		fees?: string | undefined | null | Variable<any, string>,
		gas_used?: number | undefined | null | Variable<any, string>,
		hash?: string | undefined | null | Variable<any, string>,
		height?: number | undefined | null | Variable<any, string>,
		id?: number | undefined | null | Variable<any, string>,
		status_message?: string | undefined | null | Variable<any, string>
	}
}

export type ResolverInputTypes = {
	["schema"]: AliasType<{
		query?: ResolverInputTypes["query_root"],
		subscription?: ResolverInputTypes["subscription_root"],
		__typename?: boolean | `@${string}`
	}>;
	/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
	["Boolean_comparison_exp"]: {
		_eq?: boolean | undefined | null,
		_gt?: boolean | undefined | null,
		_gte?: boolean | undefined | null,
		_in?: Array<boolean> | undefined | null,
		_is_null?: boolean | undefined | null,
		_lt?: boolean | undefined | null,
		_lte?: boolean | undefined | null,
		_neq?: boolean | undefined | null,
		_nin?: Array<boolean> | undefined | null
	};
	/** Boolean expression to compare columns of type "Float". All fields are combined with logical 'AND'. */
	["Float_comparison_exp"]: {
		_eq?: number | undefined | null,
		_gt?: number | undefined | null,
		_gte?: number | undefined | null,
		_in?: Array<number> | undefined | null,
		_is_null?: boolean | undefined | null,
		_lt?: number | undefined | null,
		_lte?: number | undefined | null,
		_neq?: number | undefined | null,
		_nin?: Array<number> | undefined | null
	};
	/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
	["Int_comparison_exp"]: {
		_eq?: number | undefined | null,
		_gt?: number | undefined | null,
		_gte?: number | undefined | null,
		_in?: Array<number> | undefined | null,
		_is_null?: boolean | undefined | null,
		_lt?: number | undefined | null,
		_lte?: number | undefined | null,
		_neq?: number | undefined | null,
		_nin?: Array<number> | undefined | null
	};
	/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
	["String_comparison_exp"]: {
		_eq?: string | undefined | null,
		_gt?: string | undefined | null,
		_gte?: string | undefined | null,
		/** does the column match the given case-insensitive pattern */
		_ilike?: string | undefined | null,
		_in?: Array<string> | undefined | null,
		/** does the column match the given POSIX regular expression, case insensitive */
		_iregex?: string | undefined | null,
		_is_null?: boolean | undefined | null,
		/** does the column match the given pattern */
		_like?: string | undefined | null,
		_lt?: string | undefined | null,
		_lte?: string | undefined | null,
		_neq?: string | undefined | null,
		/** does the column NOT match the given case-insensitive pattern */
		_nilike?: string | undefined | null,
		_nin?: Array<string> | undefined | null,
		/** does the column NOT match the given POSIX regular expression, case insensitive */
		_niregex?: string | undefined | null,
		/** does the column NOT match the given pattern */
		_nlike?: string | undefined | null,
		/** does the column NOT match the given POSIX regular expression, case sensitive */
		_nregex?: string | undefined | null,
		/** does the column NOT match the given SQL regular expression */
		_nsimilar?: string | undefined | null,
		/** does the column match the given POSIX regular expression, case sensitive */
		_regex?: string | undefined | null,
		/** does the column match the given SQL regular expression */
		_similar?: string | undefined | null
	};
	["bigint"]: unknown;
	/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
	["bigint_comparison_exp"]: {
		_eq?: ResolverInputTypes["bigint"] | undefined | null,
		_gt?: ResolverInputTypes["bigint"] | undefined | null,
		_gte?: ResolverInputTypes["bigint"] | undefined | null,
		_in?: Array<ResolverInputTypes["bigint"]> | undefined | null,
		_is_null?: boolean | undefined | null,
		_lt?: ResolverInputTypes["bigint"] | undefined | null,
		_lte?: ResolverInputTypes["bigint"] | undefined | null,
		_neq?: ResolverInputTypes["bigint"] | undefined | null,
		_nin?: Array<ResolverInputTypes["bigint"]> | undefined | null
	};
	/** ordering argument of a cursor */
	["cursor_ordering"]: cursor_ordering;
	/** columns and relationships of "inscription" */
	["inscription"]: AliasType<{
		chain_id?: boolean | `@${string}`,
		content_hash?: boolean | `@${string}`,
		content_path?: boolean | `@${string}`,
		content_size_bytes?: boolean | `@${string}`,
		creator?: boolean | `@${string}`,
		current_owner?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		height?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		inscription_histories?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["inscription_history_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["inscription_history_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["inscription_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["inscription_history"]],
		is_explicit?: boolean | `@${string}`,
		metadata?: [{	/** JSON select path */
			path?: string | undefined | null
		}, boolean | `@${string}`],
		/** An object relationship */
		transaction?: ResolverInputTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		type?: boolean | `@${string}`,
		version?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** Boolean expression to filter rows from the table "inscription". All fields are combined with a logical 'AND'. */
	["inscription_bool_exp"]: {
		_and?: Array<ResolverInputTypes["inscription_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["inscription_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["inscription_bool_exp"]> | undefined | null,
		chain_id?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		content_hash?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		content_path?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		content_size_bytes?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		creator?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		current_owner?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		date_created?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		height?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		inscription_histories?: ResolverInputTypes["inscription_history_bool_exp"] | undefined | null,
		is_explicit?: ResolverInputTypes["Boolean_comparison_exp"] | undefined | null,
		metadata?: ResolverInputTypes["json_comparison_exp"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_bool_exp"] | undefined | null,
		transaction_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		type?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		version?: ResolverInputTypes["String_comparison_exp"] | undefined | null
	};
	/** columns and relationships of "inscription_history" */
	["inscription_history"]: AliasType<{
		action?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		height?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		/** An object relationship */
		inscription?: ResolverInputTypes["inscription"],
		inscription_id?: boolean | `@${string}`,
		receiver?: boolean | `@${string}`,
		sender?: boolean | `@${string}`,
		/** An object relationship */
		transaction?: ResolverInputTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "inscription_history" */
	["inscription_history_aggregate_order_by"]: {
		avg?: ResolverInputTypes["inscription_history_avg_order_by"] | undefined | null,
		count?: ResolverInputTypes["order_by"] | undefined | null,
		max?: ResolverInputTypes["inscription_history_max_order_by"] | undefined | null,
		min?: ResolverInputTypes["inscription_history_min_order_by"] | undefined | null,
		stddev?: ResolverInputTypes["inscription_history_stddev_order_by"] | undefined | null,
		stddev_pop?: ResolverInputTypes["inscription_history_stddev_pop_order_by"] | undefined | null,
		stddev_samp?: ResolverInputTypes["inscription_history_stddev_samp_order_by"] | undefined | null,
		sum?: ResolverInputTypes["inscription_history_sum_order_by"] | undefined | null,
		var_pop?: ResolverInputTypes["inscription_history_var_pop_order_by"] | undefined | null,
		var_samp?: ResolverInputTypes["inscription_history_var_samp_order_by"] | undefined | null,
		variance?: ResolverInputTypes["inscription_history_variance_order_by"] | undefined | null
	};
	/** order by avg() on columns of table "inscription_history" */
	["inscription_history_avg_order_by"]: {
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Boolean expression to filter rows from the table "inscription_history". All fields are combined with a logical 'AND'. */
	["inscription_history_bool_exp"]: {
		_and?: Array<ResolverInputTypes["inscription_history_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["inscription_history_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["inscription_history_bool_exp"]> | undefined | null,
		action?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		chain_id?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		date_created?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		height?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		inscription?: ResolverInputTypes["inscription_bool_exp"] | undefined | null,
		inscription_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		receiver?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		sender?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_bool_exp"] | undefined | null,
		transaction_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null
	};
	/** order by max() on columns of table "inscription_history" */
	["inscription_history_max_order_by"]: {
		action?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		receiver?: ResolverInputTypes["order_by"] | undefined | null,
		sender?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by min() on columns of table "inscription_history" */
	["inscription_history_min_order_by"]: {
		action?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		receiver?: ResolverInputTypes["order_by"] | undefined | null,
		sender?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Ordering options when selecting data from "inscription_history". */
	["inscription_history_order_by"]: {
		action?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription?: ResolverInputTypes["inscription_order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		receiver?: ResolverInputTypes["order_by"] | undefined | null,
		sender?: ResolverInputTypes["order_by"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** select columns of table "inscription_history" */
	["inscription_history_select_column"]: inscription_history_select_column;
	/** order by stddev() on columns of table "inscription_history" */
	["inscription_history_stddev_order_by"]: {
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_pop() on columns of table "inscription_history" */
	["inscription_history_stddev_pop_order_by"]: {
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_samp() on columns of table "inscription_history" */
	["inscription_history_stddev_samp_order_by"]: {
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Streaming cursor of the table "inscription_history" */
	["inscription_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["inscription_history_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["inscription_history_stream_cursor_value_input"]: {
		action?: string | undefined | null,
		chain_id?: string | undefined | null,
		date_created?: ResolverInputTypes["timestamp"] | undefined | null,
		height?: number | undefined | null,
		id?: number | undefined | null,
		inscription_id?: number | undefined | null,
		receiver?: string | undefined | null,
		sender?: string | undefined | null,
		transaction_id?: number | undefined | null
	};
	/** order by sum() on columns of table "inscription_history" */
	["inscription_history_sum_order_by"]: {
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_pop() on columns of table "inscription_history" */
	["inscription_history_var_pop_order_by"]: {
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_samp() on columns of table "inscription_history" */
	["inscription_history_var_samp_order_by"]: {
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by variance() on columns of table "inscription_history" */
	["inscription_history_variance_order_by"]: {
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Ordering options when selecting data from "inscription". */
	["inscription_order_by"]: {
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		content_hash?: ResolverInputTypes["order_by"] | undefined | null,
		content_path?: ResolverInputTypes["order_by"] | undefined | null,
		content_size_bytes?: ResolverInputTypes["order_by"] | undefined | null,
		creator?: ResolverInputTypes["order_by"] | undefined | null,
		current_owner?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription_histories_aggregate?: ResolverInputTypes["inscription_history_aggregate_order_by"] | undefined | null,
		is_explicit?: ResolverInputTypes["order_by"] | undefined | null,
		metadata?: ResolverInputTypes["order_by"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null,
		type?: ResolverInputTypes["order_by"] | undefined | null,
		version?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** select columns of table "inscription" */
	["inscription_select_column"]: inscription_select_column;
	/** Streaming cursor of the table "inscription" */
	["inscription_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["inscription_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["inscription_stream_cursor_value_input"]: {
		chain_id?: string | undefined | null,
		content_hash?: string | undefined | null,
		content_path?: string | undefined | null,
		content_size_bytes?: number | undefined | null,
		creator?: string | undefined | null,
		current_owner?: string | undefined | null,
		date_created?: ResolverInputTypes["timestamp"] | undefined | null,
		height?: number | undefined | null,
		id?: number | undefined | null,
		is_explicit?: boolean | undefined | null,
		metadata?: ResolverInputTypes["json"] | undefined | null,
		transaction_id?: number | undefined | null,
		type?: string | undefined | null,
		version?: string | undefined | null
	};
	["json"]: unknown;
	/** Boolean expression to compare columns of type "json". All fields are combined with logical 'AND'. */
	["json_comparison_exp"]: {
		_eq?: ResolverInputTypes["json"] | undefined | null,
		_gt?: ResolverInputTypes["json"] | undefined | null,
		_gte?: ResolverInputTypes["json"] | undefined | null,
		_in?: Array<ResolverInputTypes["json"]> | undefined | null,
		_is_null?: boolean | undefined | null,
		_lt?: ResolverInputTypes["json"] | undefined | null,
		_lte?: ResolverInputTypes["json"] | undefined | null,
		_neq?: ResolverInputTypes["json"] | undefined | null,
		_nin?: Array<ResolverInputTypes["json"]> | undefined | null
	};
	/** columns and relationships of "marketplace_cft20_detail" */
	["marketplace_cft20_detail"]: AliasType<{
		amount?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		listing_id?: boolean | `@${string}`,
		/** An object relationship */
		marketplace_listing?: ResolverInputTypes["marketplace_listing"],
		ppt?: boolean | `@${string}`,
		/** An object relationship */
		token?: ResolverInputTypes["token"],
		token_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_aggregate_order_by"]: {
		avg?: ResolverInputTypes["marketplace_cft20_detail_avg_order_by"] | undefined | null,
		count?: ResolverInputTypes["order_by"] | undefined | null,
		max?: ResolverInputTypes["marketplace_cft20_detail_max_order_by"] | undefined | null,
		min?: ResolverInputTypes["marketplace_cft20_detail_min_order_by"] | undefined | null,
		stddev?: ResolverInputTypes["marketplace_cft20_detail_stddev_order_by"] | undefined | null,
		stddev_pop?: ResolverInputTypes["marketplace_cft20_detail_stddev_pop_order_by"] | undefined | null,
		stddev_samp?: ResolverInputTypes["marketplace_cft20_detail_stddev_samp_order_by"] | undefined | null,
		sum?: ResolverInputTypes["marketplace_cft20_detail_sum_order_by"] | undefined | null,
		var_pop?: ResolverInputTypes["marketplace_cft20_detail_var_pop_order_by"] | undefined | null,
		var_samp?: ResolverInputTypes["marketplace_cft20_detail_var_samp_order_by"] | undefined | null,
		variance?: ResolverInputTypes["marketplace_cft20_detail_variance_order_by"] | undefined | null
	};
	/** order by avg() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_avg_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Boolean expression to filter rows from the table "marketplace_cft20_detail". All fields are combined with a logical 'AND'. */
	["marketplace_cft20_detail_bool_exp"]: {
		_and?: Array<ResolverInputTypes["marketplace_cft20_detail_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["marketplace_cft20_detail_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["marketplace_cft20_detail_bool_exp"]> | undefined | null,
		amount?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		date_created?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		listing_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		marketplace_listing?: ResolverInputTypes["marketplace_listing_bool_exp"] | undefined | null,
		ppt?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		token?: ResolverInputTypes["token_bool_exp"] | undefined | null,
		token_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null
	};
	/** order by max() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_max_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by min() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_min_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Ordering options when selecting data from "marketplace_cft20_detail". */
	["marketplace_cft20_detail_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		marketplace_listing?: ResolverInputTypes["marketplace_listing_order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token?: ResolverInputTypes["token_order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** select columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_select_column"]: marketplace_cft20_detail_select_column;
	/** order by stddev() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_pop() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_pop_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_samp() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_samp_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Streaming cursor of the table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["marketplace_cft20_detail_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["marketplace_cft20_detail_stream_cursor_value_input"]: {
		amount?: ResolverInputTypes["bigint"] | undefined | null,
		date_created?: ResolverInputTypes["timestamp"] | undefined | null,
		id?: number | undefined | null,
		listing_id?: number | undefined | null,
		ppt?: ResolverInputTypes["bigint"] | undefined | null,
		token_id?: number | undefined | null
	};
	/** order by sum() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_sum_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_pop() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_var_pop_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_samp() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_var_samp_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by variance() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_variance_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		listing_id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** columns and relationships of "marketplace_listing" */
	["marketplace_listing"]: AliasType<{
		chain_id?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		date_updated?: boolean | `@${string}`,
		deposit_timeout?: boolean | `@${string}`,
		deposit_total?: boolean | `@${string}`,
		depositor_address?: boolean | `@${string}`,
		depositor_timedout_block?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		is_cancelled?: boolean | `@${string}`,
		is_deposited?: boolean | `@${string}`,
		is_filled?: boolean | `@${string}`,
		marketplace_cft20_details?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["marketplace_cft20_detail_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["marketplace_cft20_detail_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["marketplace_cft20_detail_bool_exp"] | undefined | null
		}, ResolverInputTypes["marketplace_cft20_detail"]],
		seller_address?: boolean | `@${string}`,
		total?: boolean | `@${string}`,
		/** An object relationship */
		transaction?: ResolverInputTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "marketplace_listing" */
	["marketplace_listing_aggregate_order_by"]: {
		avg?: ResolverInputTypes["marketplace_listing_avg_order_by"] | undefined | null,
		count?: ResolverInputTypes["order_by"] | undefined | null,
		max?: ResolverInputTypes["marketplace_listing_max_order_by"] | undefined | null,
		min?: ResolverInputTypes["marketplace_listing_min_order_by"] | undefined | null,
		stddev?: ResolverInputTypes["marketplace_listing_stddev_order_by"] | undefined | null,
		stddev_pop?: ResolverInputTypes["marketplace_listing_stddev_pop_order_by"] | undefined | null,
		stddev_samp?: ResolverInputTypes["marketplace_listing_stddev_samp_order_by"] | undefined | null,
		sum?: ResolverInputTypes["marketplace_listing_sum_order_by"] | undefined | null,
		var_pop?: ResolverInputTypes["marketplace_listing_var_pop_order_by"] | undefined | null,
		var_samp?: ResolverInputTypes["marketplace_listing_var_samp_order_by"] | undefined | null,
		variance?: ResolverInputTypes["marketplace_listing_variance_order_by"] | undefined | null
	};
	/** order by avg() on columns of table "marketplace_listing" */
	["marketplace_listing_avg_order_by"]: {
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Boolean expression to filter rows from the table "marketplace_listing". All fields are combined with a logical 'AND'. */
	["marketplace_listing_bool_exp"]: {
		_and?: Array<ResolverInputTypes["marketplace_listing_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["marketplace_listing_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["marketplace_listing_bool_exp"]> | undefined | null,
		chain_id?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		date_created?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		date_updated?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		deposit_timeout?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		deposit_total?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		depositor_address?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		is_cancelled?: ResolverInputTypes["Boolean_comparison_exp"] | undefined | null,
		is_deposited?: ResolverInputTypes["Boolean_comparison_exp"] | undefined | null,
		is_filled?: ResolverInputTypes["Boolean_comparison_exp"] | undefined | null,
		marketplace_cft20_details?: ResolverInputTypes["marketplace_cft20_detail_bool_exp"] | undefined | null,
		seller_address?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		total?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_bool_exp"] | undefined | null,
		transaction_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null
	};
	/** order by max() on columns of table "marketplace_listing" */
	["marketplace_listing_max_order_by"]: {
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		date_updated?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_address?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		seller_address?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by min() on columns of table "marketplace_listing" */
	["marketplace_listing_min_order_by"]: {
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		date_updated?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_address?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		seller_address?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Ordering options when selecting data from "marketplace_listing". */
	["marketplace_listing_order_by"]: {
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		date_updated?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_address?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		is_cancelled?: ResolverInputTypes["order_by"] | undefined | null,
		is_deposited?: ResolverInputTypes["order_by"] | undefined | null,
		is_filled?: ResolverInputTypes["order_by"] | undefined | null,
		marketplace_cft20_details_aggregate?: ResolverInputTypes["marketplace_cft20_detail_aggregate_order_by"] | undefined | null,
		seller_address?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** select columns of table "marketplace_listing" */
	["marketplace_listing_select_column"]: marketplace_listing_select_column;
	/** order by stddev() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_order_by"]: {
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_pop() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_pop_order_by"]: {
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_samp() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_samp_order_by"]: {
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Streaming cursor of the table "marketplace_listing" */
	["marketplace_listing_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["marketplace_listing_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["marketplace_listing_stream_cursor_value_input"]: {
		chain_id?: string | undefined | null,
		date_created?: ResolverInputTypes["timestamp"] | undefined | null,
		date_updated?: ResolverInputTypes["timestamp"] | undefined | null,
		deposit_timeout?: number | undefined | null,
		deposit_total?: ResolverInputTypes["bigint"] | undefined | null,
		depositor_address?: string | undefined | null,
		depositor_timedout_block?: number | undefined | null,
		id?: number | undefined | null,
		is_cancelled?: boolean | undefined | null,
		is_deposited?: boolean | undefined | null,
		is_filled?: boolean | undefined | null,
		seller_address?: string | undefined | null,
		total?: ResolverInputTypes["bigint"] | undefined | null,
		transaction_id?: number | undefined | null
	};
	/** order by sum() on columns of table "marketplace_listing" */
	["marketplace_listing_sum_order_by"]: {
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_pop() on columns of table "marketplace_listing" */
	["marketplace_listing_var_pop_order_by"]: {
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_samp() on columns of table "marketplace_listing" */
	["marketplace_listing_var_samp_order_by"]: {
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by variance() on columns of table "marketplace_listing" */
	["marketplace_listing_variance_order_by"]: {
		deposit_timeout?: ResolverInputTypes["order_by"] | undefined | null,
		deposit_total?: ResolverInputTypes["order_by"] | undefined | null,
		depositor_timedout_block?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	["numeric"]: unknown;
	/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
	["numeric_comparison_exp"]: {
		_eq?: ResolverInputTypes["numeric"] | undefined | null,
		_gt?: ResolverInputTypes["numeric"] | undefined | null,
		_gte?: ResolverInputTypes["numeric"] | undefined | null,
		_in?: Array<ResolverInputTypes["numeric"]> | undefined | null,
		_is_null?: boolean | undefined | null,
		_lt?: ResolverInputTypes["numeric"] | undefined | null,
		_lte?: ResolverInputTypes["numeric"] | undefined | null,
		_neq?: ResolverInputTypes["numeric"] | undefined | null,
		_nin?: Array<ResolverInputTypes["numeric"]> | undefined | null
	};
	/** column ordering options */
	["order_by"]: order_by;
	["query_root"]: AliasType<{
		inscription?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["inscription_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["inscription_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["inscription_bool_exp"] | undefined | null
		}, ResolverInputTypes["inscription"]],
		inscription_by_pk?: [{ id: number }, ResolverInputTypes["inscription"]],
		inscription_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["inscription_history_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["inscription_history_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["inscription_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["inscription_history"]],
		inscription_history_by_pk?: [{ id: number }, ResolverInputTypes["inscription_history"]],
		marketplace_cft20_detail?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["marketplace_cft20_detail_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["marketplace_cft20_detail_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["marketplace_cft20_detail_bool_exp"] | undefined | null
		}, ResolverInputTypes["marketplace_cft20_detail"]],
		marketplace_cft20_detail_by_pk?: [{ id: number }, ResolverInputTypes["marketplace_cft20_detail"]],
		marketplace_listing?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["marketplace_listing_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["marketplace_listing_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["marketplace_listing_bool_exp"] | undefined | null
		}, ResolverInputTypes["marketplace_listing"]],
		marketplace_listing_by_pk?: [{ id: number }, ResolverInputTypes["marketplace_listing"]],
		status?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["status_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["status_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["status_bool_exp"] | undefined | null
		}, ResolverInputTypes["status"]],
		status_by_pk?: [{ id: number }, ResolverInputTypes["status"]],
		token?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_bool_exp"] | undefined | null
		}, ResolverInputTypes["token"]],
		token_address_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_address_history_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_address_history_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_address_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_address_history"]],
		token_address_history_by_pk?: [{ id: number }, ResolverInputTypes["token_address_history"]],
		token_by_pk?: [{ id: number }, ResolverInputTypes["token"]],
		token_holder?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_holder_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_holder_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_holder_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_holder"]],
		token_holder_by_pk?: [{ id: number }, ResolverInputTypes["token_holder"]],
		token_open_position?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_open_position_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_open_position_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_open_position_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_open_position"]],
		token_open_position_by_pk?: [{ id: number }, ResolverInputTypes["token_open_position"]],
		token_trade_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_trade_history_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_trade_history_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_trade_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_trade_history"]],
		token_trade_history_by_pk?: [{ id: number }, ResolverInputTypes["token_trade_history"]],
		transaction?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["transaction_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["transaction_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["transaction_bool_exp"] | undefined | null
		}, ResolverInputTypes["transaction"]],
		transaction_by_pk?: [{ id: number }, ResolverInputTypes["transaction"]],
		__typename?: boolean | `@${string}`
	}>;
	["smallint"]: unknown;
	/** Boolean expression to compare columns of type "smallint". All fields are combined with logical 'AND'. */
	["smallint_comparison_exp"]: {
		_eq?: ResolverInputTypes["smallint"] | undefined | null,
		_gt?: ResolverInputTypes["smallint"] | undefined | null,
		_gte?: ResolverInputTypes["smallint"] | undefined | null,
		_in?: Array<ResolverInputTypes["smallint"]> | undefined | null,
		_is_null?: boolean | undefined | null,
		_lt?: ResolverInputTypes["smallint"] | undefined | null,
		_lte?: ResolverInputTypes["smallint"] | undefined | null,
		_neq?: ResolverInputTypes["smallint"] | undefined | null,
		_nin?: Array<ResolverInputTypes["smallint"]> | undefined | null
	};
	/** columns and relationships of "status" */
	["status"]: AliasType<{
		base_token?: boolean | `@${string}`,
		base_token_usd?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_updated?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		last_known_height?: boolean | `@${string}`,
		last_processed_height?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** Boolean expression to filter rows from the table "status". All fields are combined with a logical 'AND'. */
	["status_bool_exp"]: {
		_and?: Array<ResolverInputTypes["status_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["status_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["status_bool_exp"]> | undefined | null,
		base_token?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		base_token_usd?: ResolverInputTypes["Float_comparison_exp"] | undefined | null,
		chain_id?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		date_updated?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		last_known_height?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		last_processed_height?: ResolverInputTypes["Int_comparison_exp"] | undefined | null
	};
	/** Ordering options when selecting data from "status". */
	["status_order_by"]: {
		base_token?: ResolverInputTypes["order_by"] | undefined | null,
		base_token_usd?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_updated?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		last_known_height?: ResolverInputTypes["order_by"] | undefined | null,
		last_processed_height?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** select columns of table "status" */
	["status_select_column"]: status_select_column;
	/** Streaming cursor of the table "status" */
	["status_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["status_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["status_stream_cursor_value_input"]: {
		base_token?: string | undefined | null,
		base_token_usd?: number | undefined | null,
		chain_id?: string | undefined | null,
		date_updated?: ResolverInputTypes["timestamp"] | undefined | null,
		id?: number | undefined | null,
		last_known_height?: number | undefined | null,
		last_processed_height?: number | undefined | null
	};
	["subscription_root"]: AliasType<{
		inscription?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["inscription_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["inscription_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["inscription_bool_exp"] | undefined | null
		}, ResolverInputTypes["inscription"]],
		inscription_by_pk?: [{ id: number }, ResolverInputTypes["inscription"]],
		inscription_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["inscription_history_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["inscription_history_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["inscription_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["inscription_history"]],
		inscription_history_by_pk?: [{ id: number }, ResolverInputTypes["inscription_history"]],
		inscription_history_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["inscription_history_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["inscription_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["inscription_history"]],
		inscription_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["inscription_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["inscription_bool_exp"] | undefined | null
		}, ResolverInputTypes["inscription"]],
		marketplace_cft20_detail?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["marketplace_cft20_detail_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["marketplace_cft20_detail_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["marketplace_cft20_detail_bool_exp"] | undefined | null
		}, ResolverInputTypes["marketplace_cft20_detail"]],
		marketplace_cft20_detail_by_pk?: [{ id: number }, ResolverInputTypes["marketplace_cft20_detail"]],
		marketplace_cft20_detail_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["marketplace_cft20_detail_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["marketplace_cft20_detail_bool_exp"] | undefined | null
		}, ResolverInputTypes["marketplace_cft20_detail"]],
		marketplace_listing?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["marketplace_listing_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["marketplace_listing_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["marketplace_listing_bool_exp"] | undefined | null
		}, ResolverInputTypes["marketplace_listing"]],
		marketplace_listing_by_pk?: [{ id: number }, ResolverInputTypes["marketplace_listing"]],
		marketplace_listing_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["marketplace_listing_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["marketplace_listing_bool_exp"] | undefined | null
		}, ResolverInputTypes["marketplace_listing"]],
		status?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["status_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["status_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["status_bool_exp"] | undefined | null
		}, ResolverInputTypes["status"]],
		status_by_pk?: [{ id: number }, ResolverInputTypes["status"]],
		status_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["status_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["status_bool_exp"] | undefined | null
		}, ResolverInputTypes["status"]],
		token?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_bool_exp"] | undefined | null
		}, ResolverInputTypes["token"]],
		token_address_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_address_history_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_address_history_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_address_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_address_history"]],
		token_address_history_by_pk?: [{ id: number }, ResolverInputTypes["token_address_history"]],
		token_address_history_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["token_address_history_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["token_address_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_address_history"]],
		token_by_pk?: [{ id: number }, ResolverInputTypes["token"]],
		token_holder?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_holder_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_holder_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_holder_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_holder"]],
		token_holder_by_pk?: [{ id: number }, ResolverInputTypes["token_holder"]],
		token_holder_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["token_holder_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["token_holder_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_holder"]],
		token_open_position?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_open_position_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_open_position_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_open_position_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_open_position"]],
		token_open_position_by_pk?: [{ id: number }, ResolverInputTypes["token_open_position"]],
		token_open_position_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["token_open_position_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["token_open_position_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_open_position"]],
		token_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["token_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["token_bool_exp"] | undefined | null
		}, ResolverInputTypes["token"]],
		token_trade_history?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_trade_history_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_trade_history_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_trade_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_trade_history"]],
		token_trade_history_by_pk?: [{ id: number }, ResolverInputTypes["token_trade_history"]],
		token_trade_history_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["token_trade_history_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["token_trade_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_trade_history"]],
		transaction?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["transaction_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["transaction_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["transaction_bool_exp"] | undefined | null
		}, ResolverInputTypes["transaction"]],
		transaction_by_pk?: [{ id: number }, ResolverInputTypes["transaction"]],
		transaction_stream?: [{	/** maximum number of rows returned in a single batch */
			batch_size: number,	/** cursor to stream the results returned by the query */
			cursor: Array<ResolverInputTypes["transaction_stream_cursor_input"] | undefined | null>,	/** filter the rows returned */
			where?: ResolverInputTypes["transaction_bool_exp"] | undefined | null
		}, ResolverInputTypes["transaction"]],
		__typename?: boolean | `@${string}`
	}>;
	["timestamp"]: unknown;
	/** Boolean expression to compare columns of type "timestamp". All fields are combined with logical 'AND'. */
	["timestamp_comparison_exp"]: {
		_eq?: ResolverInputTypes["timestamp"] | undefined | null,
		_gt?: ResolverInputTypes["timestamp"] | undefined | null,
		_gte?: ResolverInputTypes["timestamp"] | undefined | null,
		_in?: Array<ResolverInputTypes["timestamp"]> | undefined | null,
		_is_null?: boolean | undefined | null,
		_lt?: ResolverInputTypes["timestamp"] | undefined | null,
		_lte?: ResolverInputTypes["timestamp"] | undefined | null,
		_neq?: ResolverInputTypes["timestamp"] | undefined | null,
		_nin?: Array<ResolverInputTypes["timestamp"]> | undefined | null
	};
	/** columns and relationships of "token" */
	["token"]: AliasType<{
		chain_id?: boolean | `@${string}`,
		circulating_supply?: boolean | `@${string}`,
		content_path?: boolean | `@${string}`,
		content_size_bytes?: boolean | `@${string}`,
		creator?: boolean | `@${string}`,
		current_owner?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		decimals?: boolean | `@${string}`,
		height?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		last_price_base?: boolean | `@${string}`,
		launch_timestamp?: boolean | `@${string}`,
		marketplace_cft20_details?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["marketplace_cft20_detail_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["marketplace_cft20_detail_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["marketplace_cft20_detail_bool_exp"] | undefined | null
		}, ResolverInputTypes["marketplace_cft20_detail"]],
		max_supply?: boolean | `@${string}`,
		metadata?: boolean | `@${string}`,
		mint_page?: boolean | `@${string}`,
		name?: boolean | `@${string}`,
		per_mint_limit?: boolean | `@${string}`,
		ticker?: boolean | `@${string}`,
		token_address_histories?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_address_history_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_address_history_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_address_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_address_history"]],
		token_holders?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_holder_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_holder_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_holder_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_holder"]],
		token_open_positions?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_open_position_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_open_position_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_open_position_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_open_position"]],
		token_trade_histories?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_trade_history_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_trade_history_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_trade_history_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_trade_history"]],
		/** An object relationship */
		transaction?: ResolverInputTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		version?: boolean | `@${string}`,
		volume_24_base?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** columns and relationships of "token_address_history" */
	["token_address_history"]: AliasType<{
		action?: boolean | `@${string}`,
		amount?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		height?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		receiver?: boolean | `@${string}`,
		sender?: boolean | `@${string}`,
		/** An object relationship */
		token?: ResolverInputTypes["token"],
		token_id?: boolean | `@${string}`,
		/** An object relationship */
		transaction?: ResolverInputTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "token_address_history" */
	["token_address_history_aggregate_order_by"]: {
		avg?: ResolverInputTypes["token_address_history_avg_order_by"] | undefined | null,
		count?: ResolverInputTypes["order_by"] | undefined | null,
		max?: ResolverInputTypes["token_address_history_max_order_by"] | undefined | null,
		min?: ResolverInputTypes["token_address_history_min_order_by"] | undefined | null,
		stddev?: ResolverInputTypes["token_address_history_stddev_order_by"] | undefined | null,
		stddev_pop?: ResolverInputTypes["token_address_history_stddev_pop_order_by"] | undefined | null,
		stddev_samp?: ResolverInputTypes["token_address_history_stddev_samp_order_by"] | undefined | null,
		sum?: ResolverInputTypes["token_address_history_sum_order_by"] | undefined | null,
		var_pop?: ResolverInputTypes["token_address_history_var_pop_order_by"] | undefined | null,
		var_samp?: ResolverInputTypes["token_address_history_var_samp_order_by"] | undefined | null,
		variance?: ResolverInputTypes["token_address_history_variance_order_by"] | undefined | null
	};
	/** order by avg() on columns of table "token_address_history" */
	["token_address_history_avg_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Boolean expression to filter rows from the table "token_address_history". All fields are combined with a logical 'AND'. */
	["token_address_history_bool_exp"]: {
		_and?: Array<ResolverInputTypes["token_address_history_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["token_address_history_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["token_address_history_bool_exp"]> | undefined | null,
		action?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		amount?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		chain_id?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		date_created?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		height?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		receiver?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		sender?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		token?: ResolverInputTypes["token_bool_exp"] | undefined | null,
		token_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_bool_exp"] | undefined | null,
		transaction_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null
	};
	/** order by max() on columns of table "token_address_history" */
	["token_address_history_max_order_by"]: {
		action?: ResolverInputTypes["order_by"] | undefined | null,
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		receiver?: ResolverInputTypes["order_by"] | undefined | null,
		sender?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by min() on columns of table "token_address_history" */
	["token_address_history_min_order_by"]: {
		action?: ResolverInputTypes["order_by"] | undefined | null,
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		receiver?: ResolverInputTypes["order_by"] | undefined | null,
		sender?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Ordering options when selecting data from "token_address_history". */
	["token_address_history_order_by"]: {
		action?: ResolverInputTypes["order_by"] | undefined | null,
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		receiver?: ResolverInputTypes["order_by"] | undefined | null,
		sender?: ResolverInputTypes["order_by"] | undefined | null,
		token?: ResolverInputTypes["token_order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** select columns of table "token_address_history" */
	["token_address_history_select_column"]: token_address_history_select_column;
	/** order by stddev() on columns of table "token_address_history" */
	["token_address_history_stddev_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_pop() on columns of table "token_address_history" */
	["token_address_history_stddev_pop_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_samp() on columns of table "token_address_history" */
	["token_address_history_stddev_samp_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Streaming cursor of the table "token_address_history" */
	["token_address_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["token_address_history_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["token_address_history_stream_cursor_value_input"]: {
		action?: string | undefined | null,
		amount?: ResolverInputTypes["bigint"] | undefined | null,
		chain_id?: string | undefined | null,
		date_created?: ResolverInputTypes["timestamp"] | undefined | null,
		height?: number | undefined | null,
		id?: number | undefined | null,
		receiver?: string | undefined | null,
		sender?: string | undefined | null,
		token_id?: number | undefined | null,
		transaction_id?: number | undefined | null
	};
	/** order by sum() on columns of table "token_address_history" */
	["token_address_history_sum_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_pop() on columns of table "token_address_history" */
	["token_address_history_var_pop_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_samp() on columns of table "token_address_history" */
	["token_address_history_var_samp_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by variance() on columns of table "token_address_history" */
	["token_address_history_variance_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Boolean expression to filter rows from the table "token". All fields are combined with a logical 'AND'. */
	["token_bool_exp"]: {
		_and?: Array<ResolverInputTypes["token_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["token_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["token_bool_exp"]> | undefined | null,
		chain_id?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		circulating_supply?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		content_path?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		content_size_bytes?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		creator?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		current_owner?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		date_created?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		decimals?: ResolverInputTypes["smallint_comparison_exp"] | undefined | null,
		height?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		last_price_base?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		launch_timestamp?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		marketplace_cft20_details?: ResolverInputTypes["marketplace_cft20_detail_bool_exp"] | undefined | null,
		max_supply?: ResolverInputTypes["numeric_comparison_exp"] | undefined | null,
		metadata?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		mint_page?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		name?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		per_mint_limit?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		ticker?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		token_address_histories?: ResolverInputTypes["token_address_history_bool_exp"] | undefined | null,
		token_holders?: ResolverInputTypes["token_holder_bool_exp"] | undefined | null,
		token_open_positions?: ResolverInputTypes["token_open_position_bool_exp"] | undefined | null,
		token_trade_histories?: ResolverInputTypes["token_trade_history_bool_exp"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_bool_exp"] | undefined | null,
		transaction_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		version?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		volume_24_base?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null
	};
	/** columns and relationships of "token_holder" */
	["token_holder"]: AliasType<{
		address?: boolean | `@${string}`,
		amount?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_updated?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		/** An object relationship */
		token?: ResolverInputTypes["token"],
		token_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "token_holder" */
	["token_holder_aggregate_order_by"]: {
		avg?: ResolverInputTypes["token_holder_avg_order_by"] | undefined | null,
		count?: ResolverInputTypes["order_by"] | undefined | null,
		max?: ResolverInputTypes["token_holder_max_order_by"] | undefined | null,
		min?: ResolverInputTypes["token_holder_min_order_by"] | undefined | null,
		stddev?: ResolverInputTypes["token_holder_stddev_order_by"] | undefined | null,
		stddev_pop?: ResolverInputTypes["token_holder_stddev_pop_order_by"] | undefined | null,
		stddev_samp?: ResolverInputTypes["token_holder_stddev_samp_order_by"] | undefined | null,
		sum?: ResolverInputTypes["token_holder_sum_order_by"] | undefined | null,
		var_pop?: ResolverInputTypes["token_holder_var_pop_order_by"] | undefined | null,
		var_samp?: ResolverInputTypes["token_holder_var_samp_order_by"] | undefined | null,
		variance?: ResolverInputTypes["token_holder_variance_order_by"] | undefined | null
	};
	/** order by avg() on columns of table "token_holder" */
	["token_holder_avg_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Boolean expression to filter rows from the table "token_holder". All fields are combined with a logical 'AND'. */
	["token_holder_bool_exp"]: {
		_and?: Array<ResolverInputTypes["token_holder_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["token_holder_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["token_holder_bool_exp"]> | undefined | null,
		address?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		amount?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		chain_id?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		date_updated?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		token?: ResolverInputTypes["token_bool_exp"] | undefined | null,
		token_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null
	};
	/** order by max() on columns of table "token_holder" */
	["token_holder_max_order_by"]: {
		address?: ResolverInputTypes["order_by"] | undefined | null,
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_updated?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by min() on columns of table "token_holder" */
	["token_holder_min_order_by"]: {
		address?: ResolverInputTypes["order_by"] | undefined | null,
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_updated?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Ordering options when selecting data from "token_holder". */
	["token_holder_order_by"]: {
		address?: ResolverInputTypes["order_by"] | undefined | null,
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_updated?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token?: ResolverInputTypes["token_order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** select columns of table "token_holder" */
	["token_holder_select_column"]: token_holder_select_column;
	/** order by stddev() on columns of table "token_holder" */
	["token_holder_stddev_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_pop() on columns of table "token_holder" */
	["token_holder_stddev_pop_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_samp() on columns of table "token_holder" */
	["token_holder_stddev_samp_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Streaming cursor of the table "token_holder" */
	["token_holder_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["token_holder_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["token_holder_stream_cursor_value_input"]: {
		address?: string | undefined | null,
		amount?: ResolverInputTypes["bigint"] | undefined | null,
		chain_id?: string | undefined | null,
		date_updated?: ResolverInputTypes["timestamp"] | undefined | null,
		id?: number | undefined | null,
		token_id?: number | undefined | null
	};
	/** order by sum() on columns of table "token_holder" */
	["token_holder_sum_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_pop() on columns of table "token_holder" */
	["token_holder_var_pop_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_samp() on columns of table "token_holder" */
	["token_holder_var_samp_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by variance() on columns of table "token_holder" */
	["token_holder_variance_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** columns and relationships of "token_open_position" */
	["token_open_position"]: AliasType<{
		amount?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		date_filled?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		is_cancelled?: boolean | `@${string}`,
		is_filled?: boolean | `@${string}`,
		is_reserved?: boolean | `@${string}`,
		ppt?: boolean | `@${string}`,
		reserve_expires_block?: boolean | `@${string}`,
		reserved_by?: boolean | `@${string}`,
		seller_address?: boolean | `@${string}`,
		/** An object relationship */
		token?: ResolverInputTypes["token"],
		token_id?: boolean | `@${string}`,
		total?: boolean | `@${string}`,
		/** An object relationship */
		transaction?: ResolverInputTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "token_open_position" */
	["token_open_position_aggregate_order_by"]: {
		avg?: ResolverInputTypes["token_open_position_avg_order_by"] | undefined | null,
		count?: ResolverInputTypes["order_by"] | undefined | null,
		max?: ResolverInputTypes["token_open_position_max_order_by"] | undefined | null,
		min?: ResolverInputTypes["token_open_position_min_order_by"] | undefined | null,
		stddev?: ResolverInputTypes["token_open_position_stddev_order_by"] | undefined | null,
		stddev_pop?: ResolverInputTypes["token_open_position_stddev_pop_order_by"] | undefined | null,
		stddev_samp?: ResolverInputTypes["token_open_position_stddev_samp_order_by"] | undefined | null,
		sum?: ResolverInputTypes["token_open_position_sum_order_by"] | undefined | null,
		var_pop?: ResolverInputTypes["token_open_position_var_pop_order_by"] | undefined | null,
		var_samp?: ResolverInputTypes["token_open_position_var_samp_order_by"] | undefined | null,
		variance?: ResolverInputTypes["token_open_position_variance_order_by"] | undefined | null
	};
	/** order by avg() on columns of table "token_open_position" */
	["token_open_position_avg_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Boolean expression to filter rows from the table "token_open_position". All fields are combined with a logical 'AND'. */
	["token_open_position_bool_exp"]: {
		_and?: Array<ResolverInputTypes["token_open_position_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["token_open_position_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["token_open_position_bool_exp"]> | undefined | null,
		amount?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		chain_id?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		date_created?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		date_filled?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		is_cancelled?: ResolverInputTypes["Boolean_comparison_exp"] | undefined | null,
		is_filled?: ResolverInputTypes["Boolean_comparison_exp"] | undefined | null,
		is_reserved?: ResolverInputTypes["Boolean_comparison_exp"] | undefined | null,
		ppt?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		reserved_by?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		seller_address?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		token?: ResolverInputTypes["token_bool_exp"] | undefined | null,
		token_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		total?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_bool_exp"] | undefined | null,
		transaction_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null
	};
	/** order by max() on columns of table "token_open_position" */
	["token_open_position_max_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		date_filled?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		reserved_by?: ResolverInputTypes["order_by"] | undefined | null,
		seller_address?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by min() on columns of table "token_open_position" */
	["token_open_position_min_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		date_filled?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		reserved_by?: ResolverInputTypes["order_by"] | undefined | null,
		seller_address?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Ordering options when selecting data from "token_open_position". */
	["token_open_position_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		date_filled?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		is_cancelled?: ResolverInputTypes["order_by"] | undefined | null,
		is_filled?: ResolverInputTypes["order_by"] | undefined | null,
		is_reserved?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		reserved_by?: ResolverInputTypes["order_by"] | undefined | null,
		seller_address?: ResolverInputTypes["order_by"] | undefined | null,
		token?: ResolverInputTypes["token_order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** select columns of table "token_open_position" */
	["token_open_position_select_column"]: token_open_position_select_column;
	/** order by stddev() on columns of table "token_open_position" */
	["token_open_position_stddev_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_pop() on columns of table "token_open_position" */
	["token_open_position_stddev_pop_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_samp() on columns of table "token_open_position" */
	["token_open_position_stddev_samp_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Streaming cursor of the table "token_open_position" */
	["token_open_position_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["token_open_position_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["token_open_position_stream_cursor_value_input"]: {
		amount?: ResolverInputTypes["bigint"] | undefined | null,
		chain_id?: string | undefined | null,
		date_created?: ResolverInputTypes["timestamp"] | undefined | null,
		date_filled?: ResolverInputTypes["timestamp"] | undefined | null,
		id?: number | undefined | null,
		is_cancelled?: boolean | undefined | null,
		is_filled?: boolean | undefined | null,
		is_reserved?: boolean | undefined | null,
		ppt?: ResolverInputTypes["bigint"] | undefined | null,
		reserve_expires_block?: number | undefined | null,
		reserved_by?: string | undefined | null,
		seller_address?: string | undefined | null,
		token_id?: number | undefined | null,
		total?: ResolverInputTypes["bigint"] | undefined | null,
		transaction_id?: number | undefined | null
	};
	/** order by sum() on columns of table "token_open_position" */
	["token_open_position_sum_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_pop() on columns of table "token_open_position" */
	["token_open_position_var_pop_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_samp() on columns of table "token_open_position" */
	["token_open_position_var_samp_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by variance() on columns of table "token_open_position" */
	["token_open_position_variance_order_by"]: {
		amount?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		ppt?: ResolverInputTypes["order_by"] | undefined | null,
		reserve_expires_block?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Ordering options when selecting data from "token". */
	["token_order_by"]: {
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		circulating_supply?: ResolverInputTypes["order_by"] | undefined | null,
		content_path?: ResolverInputTypes["order_by"] | undefined | null,
		content_size_bytes?: ResolverInputTypes["order_by"] | undefined | null,
		creator?: ResolverInputTypes["order_by"] | undefined | null,
		current_owner?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		decimals?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		last_price_base?: ResolverInputTypes["order_by"] | undefined | null,
		launch_timestamp?: ResolverInputTypes["order_by"] | undefined | null,
		marketplace_cft20_details_aggregate?: ResolverInputTypes["marketplace_cft20_detail_aggregate_order_by"] | undefined | null,
		max_supply?: ResolverInputTypes["order_by"] | undefined | null,
		metadata?: ResolverInputTypes["order_by"] | undefined | null,
		mint_page?: ResolverInputTypes["order_by"] | undefined | null,
		name?: ResolverInputTypes["order_by"] | undefined | null,
		per_mint_limit?: ResolverInputTypes["order_by"] | undefined | null,
		ticker?: ResolverInputTypes["order_by"] | undefined | null,
		token_address_histories_aggregate?: ResolverInputTypes["token_address_history_aggregate_order_by"] | undefined | null,
		token_holders_aggregate?: ResolverInputTypes["token_holder_aggregate_order_by"] | undefined | null,
		token_open_positions_aggregate?: ResolverInputTypes["token_open_position_aggregate_order_by"] | undefined | null,
		token_trade_histories_aggregate?: ResolverInputTypes["token_trade_history_aggregate_order_by"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null,
		version?: ResolverInputTypes["order_by"] | undefined | null,
		volume_24_base?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** select columns of table "token" */
	["token_select_column"]: token_select_column;
	/** Streaming cursor of the table "token" */
	["token_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["token_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["token_stream_cursor_value_input"]: {
		chain_id?: string | undefined | null,
		circulating_supply?: ResolverInputTypes["bigint"] | undefined | null,
		content_path?: string | undefined | null,
		content_size_bytes?: number | undefined | null,
		creator?: string | undefined | null,
		current_owner?: string | undefined | null,
		date_created?: ResolverInputTypes["timestamp"] | undefined | null,
		decimals?: ResolverInputTypes["smallint"] | undefined | null,
		height?: number | undefined | null,
		id?: number | undefined | null,
		last_price_base?: ResolverInputTypes["bigint"] | undefined | null,
		launch_timestamp?: ResolverInputTypes["bigint"] | undefined | null,
		max_supply?: ResolverInputTypes["numeric"] | undefined | null,
		metadata?: string | undefined | null,
		mint_page?: string | undefined | null,
		name?: string | undefined | null,
		per_mint_limit?: ResolverInputTypes["bigint"] | undefined | null,
		ticker?: string | undefined | null,
		transaction_id?: number | undefined | null,
		version?: string | undefined | null,
		volume_24_base?: ResolverInputTypes["bigint"] | undefined | null
	};
	/** columns and relationships of "token_trade_history" */
	["token_trade_history"]: AliasType<{
		amount_base?: boolean | `@${string}`,
		amount_quote?: boolean | `@${string}`,
		buyer_address?: boolean | `@${string}`,
		chain_id?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		rate?: boolean | `@${string}`,
		seller_address?: boolean | `@${string}`,
		/** An object relationship */
		token?: ResolverInputTypes["token"],
		token_id?: boolean | `@${string}`,
		total_usd?: boolean | `@${string}`,
		/** An object relationship */
		transaction?: ResolverInputTypes["transaction"],
		transaction_id?: boolean | `@${string}`,
		__typename?: boolean | `@${string}`
	}>;
	/** order by aggregate values of table "token_trade_history" */
	["token_trade_history_aggregate_order_by"]: {
		avg?: ResolverInputTypes["token_trade_history_avg_order_by"] | undefined | null,
		count?: ResolverInputTypes["order_by"] | undefined | null,
		max?: ResolverInputTypes["token_trade_history_max_order_by"] | undefined | null,
		min?: ResolverInputTypes["token_trade_history_min_order_by"] | undefined | null,
		stddev?: ResolverInputTypes["token_trade_history_stddev_order_by"] | undefined | null,
		stddev_pop?: ResolverInputTypes["token_trade_history_stddev_pop_order_by"] | undefined | null,
		stddev_samp?: ResolverInputTypes["token_trade_history_stddev_samp_order_by"] | undefined | null,
		sum?: ResolverInputTypes["token_trade_history_sum_order_by"] | undefined | null,
		var_pop?: ResolverInputTypes["token_trade_history_var_pop_order_by"] | undefined | null,
		var_samp?: ResolverInputTypes["token_trade_history_var_samp_order_by"] | undefined | null,
		variance?: ResolverInputTypes["token_trade_history_variance_order_by"] | undefined | null
	};
	/** order by avg() on columns of table "token_trade_history" */
	["token_trade_history_avg_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Boolean expression to filter rows from the table "token_trade_history". All fields are combined with a logical 'AND'. */
	["token_trade_history_bool_exp"]: {
		_and?: Array<ResolverInputTypes["token_trade_history_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["token_trade_history_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["token_trade_history_bool_exp"]> | undefined | null,
		amount_base?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		amount_quote?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		buyer_address?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		chain_id?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		date_created?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		rate?: ResolverInputTypes["bigint_comparison_exp"] | undefined | null,
		seller_address?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		token?: ResolverInputTypes["token_bool_exp"] | undefined | null,
		token_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		total_usd?: ResolverInputTypes["Float_comparison_exp"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_bool_exp"] | undefined | null,
		transaction_id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null
	};
	/** order by max() on columns of table "token_trade_history" */
	["token_trade_history_max_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		buyer_address?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		seller_address?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by min() on columns of table "token_trade_history" */
	["token_trade_history_min_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		buyer_address?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		seller_address?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Ordering options when selecting data from "token_trade_history". */
	["token_trade_history_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		buyer_address?: ResolverInputTypes["order_by"] | undefined | null,
		chain_id?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		seller_address?: ResolverInputTypes["order_by"] | undefined | null,
		token?: ResolverInputTypes["token_order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction?: ResolverInputTypes["transaction_order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** select columns of table "token_trade_history" */
	["token_trade_history_select_column"]: token_trade_history_select_column;
	/** order by stddev() on columns of table "token_trade_history" */
	["token_trade_history_stddev_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_pop() on columns of table "token_trade_history" */
	["token_trade_history_stddev_pop_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by stddev_samp() on columns of table "token_trade_history" */
	["token_trade_history_stddev_samp_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** Streaming cursor of the table "token_trade_history" */
	["token_trade_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["token_trade_history_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["token_trade_history_stream_cursor_value_input"]: {
		amount_base?: ResolverInputTypes["bigint"] | undefined | null,
		amount_quote?: ResolverInputTypes["bigint"] | undefined | null,
		buyer_address?: string | undefined | null,
		chain_id?: string | undefined | null,
		date_created?: ResolverInputTypes["timestamp"] | undefined | null,
		id?: number | undefined | null,
		rate?: ResolverInputTypes["bigint"] | undefined | null,
		seller_address?: string | undefined | null,
		token_id?: number | undefined | null,
		total_usd?: number | undefined | null,
		transaction_id?: number | undefined | null
	};
	/** order by sum() on columns of table "token_trade_history" */
	["token_trade_history_sum_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_pop() on columns of table "token_trade_history" */
	["token_trade_history_var_pop_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by var_samp() on columns of table "token_trade_history" */
	["token_trade_history_var_samp_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** order by variance() on columns of table "token_trade_history" */
	["token_trade_history_variance_order_by"]: {
		amount_base?: ResolverInputTypes["order_by"] | undefined | null,
		amount_quote?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		rate?: ResolverInputTypes["order_by"] | undefined | null,
		token_id?: ResolverInputTypes["order_by"] | undefined | null,
		total_usd?: ResolverInputTypes["order_by"] | undefined | null,
		transaction_id?: ResolverInputTypes["order_by"] | undefined | null
	};
	/** columns and relationships of "transaction" */
	["transaction"]: AliasType<{
		content?: boolean | `@${string}`,
		content_length?: boolean | `@${string}`,
		date_created?: boolean | `@${string}`,
		fees?: boolean | `@${string}`,
		gas_used?: boolean | `@${string}`,
		hash?: boolean | `@${string}`,
		height?: boolean | `@${string}`,
		id?: boolean | `@${string}`,
		/** An object relationship */
		inscription?: ResolverInputTypes["inscription"],
		/** An object relationship */
		inscription_history?: ResolverInputTypes["inscription_history"],
		marketplace_listings?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["marketplace_listing_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["marketplace_listing_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["marketplace_listing_bool_exp"] | undefined | null
		}, ResolverInputTypes["marketplace_listing"]],
		status_message?: boolean | `@${string}`,
		/** An object relationship */
		token?: ResolverInputTypes["token"],
		/** An object relationship */
		token_address_history?: ResolverInputTypes["token_address_history"],
		token_open_positions?: [{	/** distinct select on columns */
			distinct_on?: Array<ResolverInputTypes["token_open_position_select_column"]> | undefined | null,	/** limit the number of rows returned */
			limit?: number | undefined | null,	/** skip the first n rows. Use only with order_by */
			offset?: number | undefined | null,	/** sort the rows by one or more columns */
			order_by?: Array<ResolverInputTypes["token_open_position_order_by"]> | undefined | null,	/** filter the rows returned */
			where?: ResolverInputTypes["token_open_position_bool_exp"] | undefined | null
		}, ResolverInputTypes["token_open_position"]],
		/** An object relationship */
		token_trade_history?: ResolverInputTypes["token_trade_history"],
		__typename?: boolean | `@${string}`
	}>;
	/** Boolean expression to filter rows from the table "transaction". All fields are combined with a logical 'AND'. */
	["transaction_bool_exp"]: {
		_and?: Array<ResolverInputTypes["transaction_bool_exp"]> | undefined | null,
		_not?: ResolverInputTypes["transaction_bool_exp"] | undefined | null,
		_or?: Array<ResolverInputTypes["transaction_bool_exp"]> | undefined | null,
		content?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		content_length?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		date_created?: ResolverInputTypes["timestamp_comparison_exp"] | undefined | null,
		fees?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		gas_used?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		hash?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		height?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		id?: ResolverInputTypes["Int_comparison_exp"] | undefined | null,
		inscription?: ResolverInputTypes["inscription_bool_exp"] | undefined | null,
		inscription_history?: ResolverInputTypes["inscription_history_bool_exp"] | undefined | null,
		marketplace_listings?: ResolverInputTypes["marketplace_listing_bool_exp"] | undefined | null,
		status_message?: ResolverInputTypes["String_comparison_exp"] | undefined | null,
		token?: ResolverInputTypes["token_bool_exp"] | undefined | null,
		token_address_history?: ResolverInputTypes["token_address_history_bool_exp"] | undefined | null,
		token_open_positions?: ResolverInputTypes["token_open_position_bool_exp"] | undefined | null,
		token_trade_history?: ResolverInputTypes["token_trade_history_bool_exp"] | undefined | null
	};
	/** Ordering options when selecting data from "transaction". */
	["transaction_order_by"]: {
		content?: ResolverInputTypes["order_by"] | undefined | null,
		content_length?: ResolverInputTypes["order_by"] | undefined | null,
		date_created?: ResolverInputTypes["order_by"] | undefined | null,
		fees?: ResolverInputTypes["order_by"] | undefined | null,
		gas_used?: ResolverInputTypes["order_by"] | undefined | null,
		hash?: ResolverInputTypes["order_by"] | undefined | null,
		height?: ResolverInputTypes["order_by"] | undefined | null,
		id?: ResolverInputTypes["order_by"] | undefined | null,
		inscription?: ResolverInputTypes["inscription_order_by"] | undefined | null,
		inscription_history?: ResolverInputTypes["inscription_history_order_by"] | undefined | null,
		marketplace_listings_aggregate?: ResolverInputTypes["marketplace_listing_aggregate_order_by"] | undefined | null,
		status_message?: ResolverInputTypes["order_by"] | undefined | null,
		token?: ResolverInputTypes["token_order_by"] | undefined | null,
		token_address_history?: ResolverInputTypes["token_address_history_order_by"] | undefined | null,
		token_open_positions_aggregate?: ResolverInputTypes["token_open_position_aggregate_order_by"] | undefined | null,
		token_trade_history?: ResolverInputTypes["token_trade_history_order_by"] | undefined | null
	};
	/** select columns of table "transaction" */
	["transaction_select_column"]: transaction_select_column;
	/** Streaming cursor of the table "transaction" */
	["transaction_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ResolverInputTypes["transaction_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ResolverInputTypes["cursor_ordering"] | undefined | null
	};
	/** Initial value of the column from where the streaming should start */
	["transaction_stream_cursor_value_input"]: {
		content?: string | undefined | null,
		content_length?: number | undefined | null,
		date_created?: ResolverInputTypes["timestamp"] | undefined | null,
		fees?: string | undefined | null,
		gas_used?: number | undefined | null,
		hash?: string | undefined | null,
		height?: number | undefined | null,
		id?: number | undefined | null,
		status_message?: string | undefined | null
	}
}

export type ModelTypes = {
	["schema"]: {
		query?: ModelTypes["query_root"] | undefined,
		subscription?: ModelTypes["subscription_root"] | undefined
	};
	/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
	["Boolean_comparison_exp"]: {
		_eq?: boolean | undefined,
		_gt?: boolean | undefined,
		_gte?: boolean | undefined,
		_in?: Array<boolean> | undefined,
		_is_null?: boolean | undefined,
		_lt?: boolean | undefined,
		_lte?: boolean | undefined,
		_neq?: boolean | undefined,
		_nin?: Array<boolean> | undefined
	};
	/** Boolean expression to compare columns of type "Float". All fields are combined with logical 'AND'. */
	["Float_comparison_exp"]: {
		_eq?: number | undefined,
		_gt?: number | undefined,
		_gte?: number | undefined,
		_in?: Array<number> | undefined,
		_is_null?: boolean | undefined,
		_lt?: number | undefined,
		_lte?: number | undefined,
		_neq?: number | undefined,
		_nin?: Array<number> | undefined
	};
	/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
	["Int_comparison_exp"]: {
		_eq?: number | undefined,
		_gt?: number | undefined,
		_gte?: number | undefined,
		_in?: Array<number> | undefined,
		_is_null?: boolean | undefined,
		_lt?: number | undefined,
		_lte?: number | undefined,
		_neq?: number | undefined,
		_nin?: Array<number> | undefined
	};
	/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
	["String_comparison_exp"]: {
		_eq?: string | undefined,
		_gt?: string | undefined,
		_gte?: string | undefined,
		/** does the column match the given case-insensitive pattern */
		_ilike?: string | undefined,
		_in?: Array<string> | undefined,
		/** does the column match the given POSIX regular expression, case insensitive */
		_iregex?: string | undefined,
		_is_null?: boolean | undefined,
		/** does the column match the given pattern */
		_like?: string | undefined,
		_lt?: string | undefined,
		_lte?: string | undefined,
		_neq?: string | undefined,
		/** does the column NOT match the given case-insensitive pattern */
		_nilike?: string | undefined,
		_nin?: Array<string> | undefined,
		/** does the column NOT match the given POSIX regular expression, case insensitive */
		_niregex?: string | undefined,
		/** does the column NOT match the given pattern */
		_nlike?: string | undefined,
		/** does the column NOT match the given POSIX regular expression, case sensitive */
		_nregex?: string | undefined,
		/** does the column NOT match the given SQL regular expression */
		_nsimilar?: string | undefined,
		/** does the column match the given POSIX regular expression, case sensitive */
		_regex?: string | undefined,
		/** does the column match the given SQL regular expression */
		_similar?: string | undefined
	};
	["bigint"]: any;
	/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
	["bigint_comparison_exp"]: {
		_eq?: ModelTypes["bigint"] | undefined,
		_gt?: ModelTypes["bigint"] | undefined,
		_gte?: ModelTypes["bigint"] | undefined,
		_in?: Array<ModelTypes["bigint"]> | undefined,
		_is_null?: boolean | undefined,
		_lt?: ModelTypes["bigint"] | undefined,
		_lte?: ModelTypes["bigint"] | undefined,
		_neq?: ModelTypes["bigint"] | undefined,
		_nin?: Array<ModelTypes["bigint"]> | undefined
	};
	["cursor_ordering"]: cursor_ordering;
	/** columns and relationships of "inscription" */
	["inscription"]: {
		chain_id: string,
		content_hash: string,
		content_path: string,
		content_size_bytes: number,
		creator: string,
		current_owner: string,
		date_created: ModelTypes["timestamp"],
		height: number,
		id: number,
		/** An array relationship */
		inscription_histories: Array<ModelTypes["inscription_history"]>,
		is_explicit?: boolean | undefined,
		metadata: ModelTypes["json"],
		/** An object relationship */
		transaction: ModelTypes["transaction"],
		transaction_id: number,
		type: string,
		version: string
	};
	/** Boolean expression to filter rows from the table "inscription". All fields are combined with a logical 'AND'. */
	["inscription_bool_exp"]: {
		_and?: Array<ModelTypes["inscription_bool_exp"]> | undefined,
		_not?: ModelTypes["inscription_bool_exp"] | undefined,
		_or?: Array<ModelTypes["inscription_bool_exp"]> | undefined,
		chain_id?: ModelTypes["String_comparison_exp"] | undefined,
		content_hash?: ModelTypes["String_comparison_exp"] | undefined,
		content_path?: ModelTypes["String_comparison_exp"] | undefined,
		content_size_bytes?: ModelTypes["Int_comparison_exp"] | undefined,
		creator?: ModelTypes["String_comparison_exp"] | undefined,
		current_owner?: ModelTypes["String_comparison_exp"] | undefined,
		date_created?: ModelTypes["timestamp_comparison_exp"] | undefined,
		height?: ModelTypes["Int_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		inscription_histories?: ModelTypes["inscription_history_bool_exp"] | undefined,
		is_explicit?: ModelTypes["Boolean_comparison_exp"] | undefined,
		metadata?: ModelTypes["json_comparison_exp"] | undefined,
		transaction?: ModelTypes["transaction_bool_exp"] | undefined,
		transaction_id?: ModelTypes["Int_comparison_exp"] | undefined,
		type?: ModelTypes["String_comparison_exp"] | undefined,
		version?: ModelTypes["String_comparison_exp"] | undefined
	};
	/** columns and relationships of "inscription_history" */
	["inscription_history"]: {
		action: string,
		chain_id: string,
		date_created: ModelTypes["timestamp"],
		height: number,
		id: number,
		/** An object relationship */
		inscription: ModelTypes["inscription"],
		inscription_id: number,
		receiver?: string | undefined,
		sender: string,
		/** An object relationship */
		transaction: ModelTypes["transaction"],
		transaction_id: number
	};
	/** order by aggregate values of table "inscription_history" */
	["inscription_history_aggregate_order_by"]: {
		avg?: ModelTypes["inscription_history_avg_order_by"] | undefined,
		count?: ModelTypes["order_by"] | undefined,
		max?: ModelTypes["inscription_history_max_order_by"] | undefined,
		min?: ModelTypes["inscription_history_min_order_by"] | undefined,
		stddev?: ModelTypes["inscription_history_stddev_order_by"] | undefined,
		stddev_pop?: ModelTypes["inscription_history_stddev_pop_order_by"] | undefined,
		stddev_samp?: ModelTypes["inscription_history_stddev_samp_order_by"] | undefined,
		sum?: ModelTypes["inscription_history_sum_order_by"] | undefined,
		var_pop?: ModelTypes["inscription_history_var_pop_order_by"] | undefined,
		var_samp?: ModelTypes["inscription_history_var_samp_order_by"] | undefined,
		variance?: ModelTypes["inscription_history_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "inscription_history" */
	["inscription_history_avg_order_by"]: {
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "inscription_history". All fields are combined with a logical 'AND'. */
	["inscription_history_bool_exp"]: {
		_and?: Array<ModelTypes["inscription_history_bool_exp"]> | undefined,
		_not?: ModelTypes["inscription_history_bool_exp"] | undefined,
		_or?: Array<ModelTypes["inscription_history_bool_exp"]> | undefined,
		action?: ModelTypes["String_comparison_exp"] | undefined,
		chain_id?: ModelTypes["String_comparison_exp"] | undefined,
		date_created?: ModelTypes["timestamp_comparison_exp"] | undefined,
		height?: ModelTypes["Int_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		inscription?: ModelTypes["inscription_bool_exp"] | undefined,
		inscription_id?: ModelTypes["Int_comparison_exp"] | undefined,
		receiver?: ModelTypes["String_comparison_exp"] | undefined,
		sender?: ModelTypes["String_comparison_exp"] | undefined,
		transaction?: ModelTypes["transaction_bool_exp"] | undefined,
		transaction_id?: ModelTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "inscription_history" */
	["inscription_history_max_order_by"]: {
		action?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		receiver?: ModelTypes["order_by"] | undefined,
		sender?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "inscription_history" */
	["inscription_history_min_order_by"]: {
		action?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		receiver?: ModelTypes["order_by"] | undefined,
		sender?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "inscription_history". */
	["inscription_history_order_by"]: {
		action?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription?: ModelTypes["inscription_order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		receiver?: ModelTypes["order_by"] | undefined,
		sender?: ModelTypes["order_by"] | undefined,
		transaction?: ModelTypes["transaction_order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	["inscription_history_select_column"]: inscription_history_select_column;
	/** order by stddev() on columns of table "inscription_history" */
	["inscription_history_stddev_order_by"]: {
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "inscription_history" */
	["inscription_history_stddev_pop_order_by"]: {
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "inscription_history" */
	["inscription_history_stddev_samp_order_by"]: {
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "inscription_history" */
	["inscription_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["inscription_history_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["inscription_history_stream_cursor_value_input"]: {
		action?: string | undefined,
		chain_id?: string | undefined,
		date_created?: ModelTypes["timestamp"] | undefined,
		height?: number | undefined,
		id?: number | undefined,
		inscription_id?: number | undefined,
		receiver?: string | undefined,
		sender?: string | undefined,
		transaction_id?: number | undefined
	};
	/** order by sum() on columns of table "inscription_history" */
	["inscription_history_sum_order_by"]: {
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "inscription_history" */
	["inscription_history_var_pop_order_by"]: {
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "inscription_history" */
	["inscription_history_var_samp_order_by"]: {
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "inscription_history" */
	["inscription_history_variance_order_by"]: {
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "inscription". */
	["inscription_order_by"]: {
		chain_id?: ModelTypes["order_by"] | undefined,
		content_hash?: ModelTypes["order_by"] | undefined,
		content_path?: ModelTypes["order_by"] | undefined,
		content_size_bytes?: ModelTypes["order_by"] | undefined,
		creator?: ModelTypes["order_by"] | undefined,
		current_owner?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription_histories_aggregate?: ModelTypes["inscription_history_aggregate_order_by"] | undefined,
		is_explicit?: ModelTypes["order_by"] | undefined,
		metadata?: ModelTypes["order_by"] | undefined,
		transaction?: ModelTypes["transaction_order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined,
		type?: ModelTypes["order_by"] | undefined,
		version?: ModelTypes["order_by"] | undefined
	};
	["inscription_select_column"]: inscription_select_column;
	/** Streaming cursor of the table "inscription" */
	["inscription_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["inscription_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["inscription_stream_cursor_value_input"]: {
		chain_id?: string | undefined,
		content_hash?: string | undefined,
		content_path?: string | undefined,
		content_size_bytes?: number | undefined,
		creator?: string | undefined,
		current_owner?: string | undefined,
		date_created?: ModelTypes["timestamp"] | undefined,
		height?: number | undefined,
		id?: number | undefined,
		is_explicit?: boolean | undefined,
		metadata?: ModelTypes["json"] | undefined,
		transaction_id?: number | undefined,
		type?: string | undefined,
		version?: string | undefined
	};
	["json"]: any;
	/** Boolean expression to compare columns of type "json". All fields are combined with logical 'AND'. */
	["json_comparison_exp"]: {
		_eq?: ModelTypes["json"] | undefined,
		_gt?: ModelTypes["json"] | undefined,
		_gte?: ModelTypes["json"] | undefined,
		_in?: Array<ModelTypes["json"]> | undefined,
		_is_null?: boolean | undefined,
		_lt?: ModelTypes["json"] | undefined,
		_lte?: ModelTypes["json"] | undefined,
		_neq?: ModelTypes["json"] | undefined,
		_nin?: Array<ModelTypes["json"]> | undefined
	};
	/** columns and relationships of "marketplace_cft20_detail" */
	["marketplace_cft20_detail"]: {
		amount: ModelTypes["bigint"],
		date_created: ModelTypes["timestamp"],
		id: number,
		listing_id: number,
		/** An object relationship */
		marketplace_listing: ModelTypes["marketplace_listing"],
		ppt: ModelTypes["bigint"],
		/** An object relationship */
		token: ModelTypes["token"],
		token_id: number
	};
	/** order by aggregate values of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_aggregate_order_by"]: {
		avg?: ModelTypes["marketplace_cft20_detail_avg_order_by"] | undefined,
		count?: ModelTypes["order_by"] | undefined,
		max?: ModelTypes["marketplace_cft20_detail_max_order_by"] | undefined,
		min?: ModelTypes["marketplace_cft20_detail_min_order_by"] | undefined,
		stddev?: ModelTypes["marketplace_cft20_detail_stddev_order_by"] | undefined,
		stddev_pop?: ModelTypes["marketplace_cft20_detail_stddev_pop_order_by"] | undefined,
		stddev_samp?: ModelTypes["marketplace_cft20_detail_stddev_samp_order_by"] | undefined,
		sum?: ModelTypes["marketplace_cft20_detail_sum_order_by"] | undefined,
		var_pop?: ModelTypes["marketplace_cft20_detail_var_pop_order_by"] | undefined,
		var_samp?: ModelTypes["marketplace_cft20_detail_var_samp_order_by"] | undefined,
		variance?: ModelTypes["marketplace_cft20_detail_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_avg_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "marketplace_cft20_detail". All fields are combined with a logical 'AND'. */
	["marketplace_cft20_detail_bool_exp"]: {
		_and?: Array<ModelTypes["marketplace_cft20_detail_bool_exp"]> | undefined,
		_not?: ModelTypes["marketplace_cft20_detail_bool_exp"] | undefined,
		_or?: Array<ModelTypes["marketplace_cft20_detail_bool_exp"]> | undefined,
		amount?: ModelTypes["bigint_comparison_exp"] | undefined,
		date_created?: ModelTypes["timestamp_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		listing_id?: ModelTypes["Int_comparison_exp"] | undefined,
		marketplace_listing?: ModelTypes["marketplace_listing_bool_exp"] | undefined,
		ppt?: ModelTypes["bigint_comparison_exp"] | undefined,
		token?: ModelTypes["token_bool_exp"] | undefined,
		token_id?: ModelTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_max_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_min_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "marketplace_cft20_detail". */
	["marketplace_cft20_detail_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		marketplace_listing?: ModelTypes["marketplace_listing_order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token?: ModelTypes["token_order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	["marketplace_cft20_detail_select_column"]: marketplace_cft20_detail_select_column;
	/** order by stddev() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_pop_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_samp_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["marketplace_cft20_detail_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["marketplace_cft20_detail_stream_cursor_value_input"]: {
		amount?: ModelTypes["bigint"] | undefined,
		date_created?: ModelTypes["timestamp"] | undefined,
		id?: number | undefined,
		listing_id?: number | undefined,
		ppt?: ModelTypes["bigint"] | undefined,
		token_id?: number | undefined
	};
	/** order by sum() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_sum_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_var_pop_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_var_samp_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_variance_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		listing_id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** columns and relationships of "marketplace_listing" */
	["marketplace_listing"]: {
		chain_id: string,
		date_created: ModelTypes["timestamp"],
		date_updated?: ModelTypes["timestamp"] | undefined,
		deposit_timeout: number,
		deposit_total: ModelTypes["bigint"],
		depositor_address?: string | undefined,
		depositor_timedout_block?: number | undefined,
		id: number,
		is_cancelled: boolean,
		is_deposited: boolean,
		is_filled: boolean,
		/** An array relationship */
		marketplace_cft20_details: Array<ModelTypes["marketplace_cft20_detail"]>,
		seller_address: string,
		total: ModelTypes["bigint"],
		/** An object relationship */
		transaction: ModelTypes["transaction"],
		transaction_id: number
	};
	/** order by aggregate values of table "marketplace_listing" */
	["marketplace_listing_aggregate_order_by"]: {
		avg?: ModelTypes["marketplace_listing_avg_order_by"] | undefined,
		count?: ModelTypes["order_by"] | undefined,
		max?: ModelTypes["marketplace_listing_max_order_by"] | undefined,
		min?: ModelTypes["marketplace_listing_min_order_by"] | undefined,
		stddev?: ModelTypes["marketplace_listing_stddev_order_by"] | undefined,
		stddev_pop?: ModelTypes["marketplace_listing_stddev_pop_order_by"] | undefined,
		stddev_samp?: ModelTypes["marketplace_listing_stddev_samp_order_by"] | undefined,
		sum?: ModelTypes["marketplace_listing_sum_order_by"] | undefined,
		var_pop?: ModelTypes["marketplace_listing_var_pop_order_by"] | undefined,
		var_samp?: ModelTypes["marketplace_listing_var_samp_order_by"] | undefined,
		variance?: ModelTypes["marketplace_listing_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "marketplace_listing" */
	["marketplace_listing_avg_order_by"]: {
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "marketplace_listing". All fields are combined with a logical 'AND'. */
	["marketplace_listing_bool_exp"]: {
		_and?: Array<ModelTypes["marketplace_listing_bool_exp"]> | undefined,
		_not?: ModelTypes["marketplace_listing_bool_exp"] | undefined,
		_or?: Array<ModelTypes["marketplace_listing_bool_exp"]> | undefined,
		chain_id?: ModelTypes["String_comparison_exp"] | undefined,
		date_created?: ModelTypes["timestamp_comparison_exp"] | undefined,
		date_updated?: ModelTypes["timestamp_comparison_exp"] | undefined,
		deposit_timeout?: ModelTypes["Int_comparison_exp"] | undefined,
		deposit_total?: ModelTypes["bigint_comparison_exp"] | undefined,
		depositor_address?: ModelTypes["String_comparison_exp"] | undefined,
		depositor_timedout_block?: ModelTypes["Int_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		is_cancelled?: ModelTypes["Boolean_comparison_exp"] | undefined,
		is_deposited?: ModelTypes["Boolean_comparison_exp"] | undefined,
		is_filled?: ModelTypes["Boolean_comparison_exp"] | undefined,
		marketplace_cft20_details?: ModelTypes["marketplace_cft20_detail_bool_exp"] | undefined,
		seller_address?: ModelTypes["String_comparison_exp"] | undefined,
		total?: ModelTypes["bigint_comparison_exp"] | undefined,
		transaction?: ModelTypes["transaction_bool_exp"] | undefined,
		transaction_id?: ModelTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "marketplace_listing" */
	["marketplace_listing_max_order_by"]: {
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		date_updated?: ModelTypes["order_by"] | undefined,
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_address?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		seller_address?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "marketplace_listing" */
	["marketplace_listing_min_order_by"]: {
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		date_updated?: ModelTypes["order_by"] | undefined,
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_address?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		seller_address?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "marketplace_listing". */
	["marketplace_listing_order_by"]: {
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		date_updated?: ModelTypes["order_by"] | undefined,
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_address?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		is_cancelled?: ModelTypes["order_by"] | undefined,
		is_deposited?: ModelTypes["order_by"] | undefined,
		is_filled?: ModelTypes["order_by"] | undefined,
		marketplace_cft20_details_aggregate?: ModelTypes["marketplace_cft20_detail_aggregate_order_by"] | undefined,
		seller_address?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction?: ModelTypes["transaction_order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	["marketplace_listing_select_column"]: marketplace_listing_select_column;
	/** order by stddev() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_order_by"]: {
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_pop_order_by"]: {
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_samp_order_by"]: {
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "marketplace_listing" */
	["marketplace_listing_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["marketplace_listing_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["marketplace_listing_stream_cursor_value_input"]: {
		chain_id?: string | undefined,
		date_created?: ModelTypes["timestamp"] | undefined,
		date_updated?: ModelTypes["timestamp"] | undefined,
		deposit_timeout?: number | undefined,
		deposit_total?: ModelTypes["bigint"] | undefined,
		depositor_address?: string | undefined,
		depositor_timedout_block?: number | undefined,
		id?: number | undefined,
		is_cancelled?: boolean | undefined,
		is_deposited?: boolean | undefined,
		is_filled?: boolean | undefined,
		seller_address?: string | undefined,
		total?: ModelTypes["bigint"] | undefined,
		transaction_id?: number | undefined
	};
	/** order by sum() on columns of table "marketplace_listing" */
	["marketplace_listing_sum_order_by"]: {
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "marketplace_listing" */
	["marketplace_listing_var_pop_order_by"]: {
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "marketplace_listing" */
	["marketplace_listing_var_samp_order_by"]: {
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "marketplace_listing" */
	["marketplace_listing_variance_order_by"]: {
		deposit_timeout?: ModelTypes["order_by"] | undefined,
		deposit_total?: ModelTypes["order_by"] | undefined,
		depositor_timedout_block?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	["numeric"]: any;
	/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
	["numeric_comparison_exp"]: {
		_eq?: ModelTypes["numeric"] | undefined,
		_gt?: ModelTypes["numeric"] | undefined,
		_gte?: ModelTypes["numeric"] | undefined,
		_in?: Array<ModelTypes["numeric"]> | undefined,
		_is_null?: boolean | undefined,
		_lt?: ModelTypes["numeric"] | undefined,
		_lte?: ModelTypes["numeric"] | undefined,
		_neq?: ModelTypes["numeric"] | undefined,
		_nin?: Array<ModelTypes["numeric"]> | undefined
	};
	["order_by"]: order_by;
	["query_root"]: {
		/** fetch data from the table: "inscription" */
		inscription: Array<ModelTypes["inscription"]>,
		/** fetch data from the table: "inscription" using primary key columns */
		inscription_by_pk?: ModelTypes["inscription"] | undefined,
		/** fetch data from the table: "inscription_history" */
		inscription_history: Array<ModelTypes["inscription_history"]>,
		/** fetch data from the table: "inscription_history" using primary key columns */
		inscription_history_by_pk?: ModelTypes["inscription_history"] | undefined,
		/** fetch data from the table: "marketplace_cft20_detail" */
		marketplace_cft20_detail: Array<ModelTypes["marketplace_cft20_detail"]>,
		/** fetch data from the table: "marketplace_cft20_detail" using primary key columns */
		marketplace_cft20_detail_by_pk?: ModelTypes["marketplace_cft20_detail"] | undefined,
		/** fetch data from the table: "marketplace_listing" */
		marketplace_listing: Array<ModelTypes["marketplace_listing"]>,
		/** fetch data from the table: "marketplace_listing" using primary key columns */
		marketplace_listing_by_pk?: ModelTypes["marketplace_listing"] | undefined,
		/** fetch data from the table: "status" */
		status: Array<ModelTypes["status"]>,
		/** fetch data from the table: "status" using primary key columns */
		status_by_pk?: ModelTypes["status"] | undefined,
		/** fetch data from the table: "token" */
		token: Array<ModelTypes["token"]>,
		/** fetch data from the table: "token_address_history" */
		token_address_history: Array<ModelTypes["token_address_history"]>,
		/** fetch data from the table: "token_address_history" using primary key columns */
		token_address_history_by_pk?: ModelTypes["token_address_history"] | undefined,
		/** fetch data from the table: "token" using primary key columns */
		token_by_pk?: ModelTypes["token"] | undefined,
		/** fetch data from the table: "token_holder" */
		token_holder: Array<ModelTypes["token_holder"]>,
		/** fetch data from the table: "token_holder" using primary key columns */
		token_holder_by_pk?: ModelTypes["token_holder"] | undefined,
		/** fetch data from the table: "token_open_position" */
		token_open_position: Array<ModelTypes["token_open_position"]>,
		/** fetch data from the table: "token_open_position" using primary key columns */
		token_open_position_by_pk?: ModelTypes["token_open_position"] | undefined,
		/** fetch data from the table: "token_trade_history" */
		token_trade_history: Array<ModelTypes["token_trade_history"]>,
		/** fetch data from the table: "token_trade_history" using primary key columns */
		token_trade_history_by_pk?: ModelTypes["token_trade_history"] | undefined,
		/** fetch data from the table: "transaction" */
		transaction: Array<ModelTypes["transaction"]>,
		/** fetch data from the table: "transaction" using primary key columns */
		transaction_by_pk?: ModelTypes["transaction"] | undefined
	};
	["smallint"]: any;
	/** Boolean expression to compare columns of type "smallint". All fields are combined with logical 'AND'. */
	["smallint_comparison_exp"]: {
		_eq?: ModelTypes["smallint"] | undefined,
		_gt?: ModelTypes["smallint"] | undefined,
		_gte?: ModelTypes["smallint"] | undefined,
		_in?: Array<ModelTypes["smallint"]> | undefined,
		_is_null?: boolean | undefined,
		_lt?: ModelTypes["smallint"] | undefined,
		_lte?: ModelTypes["smallint"] | undefined,
		_neq?: ModelTypes["smallint"] | undefined,
		_nin?: Array<ModelTypes["smallint"]> | undefined
	};
	/** columns and relationships of "status" */
	["status"]: {
		base_token: string,
		base_token_usd: number,
		chain_id: string,
		date_updated: ModelTypes["timestamp"],
		id: number,
		last_known_height: number,
		last_processed_height: number
	};
	/** Boolean expression to filter rows from the table "status". All fields are combined with a logical 'AND'. */
	["status_bool_exp"]: {
		_and?: Array<ModelTypes["status_bool_exp"]> | undefined,
		_not?: ModelTypes["status_bool_exp"] | undefined,
		_or?: Array<ModelTypes["status_bool_exp"]> | undefined,
		base_token?: ModelTypes["String_comparison_exp"] | undefined,
		base_token_usd?: ModelTypes["Float_comparison_exp"] | undefined,
		chain_id?: ModelTypes["String_comparison_exp"] | undefined,
		date_updated?: ModelTypes["timestamp_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		last_known_height?: ModelTypes["Int_comparison_exp"] | undefined,
		last_processed_height?: ModelTypes["Int_comparison_exp"] | undefined
	};
	/** Ordering options when selecting data from "status". */
	["status_order_by"]: {
		base_token?: ModelTypes["order_by"] | undefined,
		base_token_usd?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_updated?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		last_known_height?: ModelTypes["order_by"] | undefined,
		last_processed_height?: ModelTypes["order_by"] | undefined
	};
	["status_select_column"]: status_select_column;
	/** Streaming cursor of the table "status" */
	["status_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["status_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["status_stream_cursor_value_input"]: {
		base_token?: string | undefined,
		base_token_usd?: number | undefined,
		chain_id?: string | undefined,
		date_updated?: ModelTypes["timestamp"] | undefined,
		id?: number | undefined,
		last_known_height?: number | undefined,
		last_processed_height?: number | undefined
	};
	["subscription_root"]: {
		/** fetch data from the table: "inscription" */
		inscription: Array<ModelTypes["inscription"]>,
		/** fetch data from the table: "inscription" using primary key columns */
		inscription_by_pk?: ModelTypes["inscription"] | undefined,
		/** fetch data from the table: "inscription_history" */
		inscription_history: Array<ModelTypes["inscription_history"]>,
		/** fetch data from the table: "inscription_history" using primary key columns */
		inscription_history_by_pk?: ModelTypes["inscription_history"] | undefined,
		/** fetch data from the table in a streaming manner: "inscription_history" */
		inscription_history_stream: Array<ModelTypes["inscription_history"]>,
		/** fetch data from the table in a streaming manner: "inscription" */
		inscription_stream: Array<ModelTypes["inscription"]>,
		/** fetch data from the table: "marketplace_cft20_detail" */
		marketplace_cft20_detail: Array<ModelTypes["marketplace_cft20_detail"]>,
		/** fetch data from the table: "marketplace_cft20_detail" using primary key columns */
		marketplace_cft20_detail_by_pk?: ModelTypes["marketplace_cft20_detail"] | undefined,
		/** fetch data from the table in a streaming manner: "marketplace_cft20_detail" */
		marketplace_cft20_detail_stream: Array<ModelTypes["marketplace_cft20_detail"]>,
		/** fetch data from the table: "marketplace_listing" */
		marketplace_listing: Array<ModelTypes["marketplace_listing"]>,
		/** fetch data from the table: "marketplace_listing" using primary key columns */
		marketplace_listing_by_pk?: ModelTypes["marketplace_listing"] | undefined,
		/** fetch data from the table in a streaming manner: "marketplace_listing" */
		marketplace_listing_stream: Array<ModelTypes["marketplace_listing"]>,
		/** fetch data from the table: "status" */
		status: Array<ModelTypes["status"]>,
		/** fetch data from the table: "status" using primary key columns */
		status_by_pk?: ModelTypes["status"] | undefined,
		/** fetch data from the table in a streaming manner: "status" */
		status_stream: Array<ModelTypes["status"]>,
		/** fetch data from the table: "token" */
		token: Array<ModelTypes["token"]>,
		/** fetch data from the table: "token_address_history" */
		token_address_history: Array<ModelTypes["token_address_history"]>,
		/** fetch data from the table: "token_address_history" using primary key columns */
		token_address_history_by_pk?: ModelTypes["token_address_history"] | undefined,
		/** fetch data from the table in a streaming manner: "token_address_history" */
		token_address_history_stream: Array<ModelTypes["token_address_history"]>,
		/** fetch data from the table: "token" using primary key columns */
		token_by_pk?: ModelTypes["token"] | undefined,
		/** fetch data from the table: "token_holder" */
		token_holder: Array<ModelTypes["token_holder"]>,
		/** fetch data from the table: "token_holder" using primary key columns */
		token_holder_by_pk?: ModelTypes["token_holder"] | undefined,
		/** fetch data from the table in a streaming manner: "token_holder" */
		token_holder_stream: Array<ModelTypes["token_holder"]>,
		/** fetch data from the table: "token_open_position" */
		token_open_position: Array<ModelTypes["token_open_position"]>,
		/** fetch data from the table: "token_open_position" using primary key columns */
		token_open_position_by_pk?: ModelTypes["token_open_position"] | undefined,
		/** fetch data from the table in a streaming manner: "token_open_position" */
		token_open_position_stream: Array<ModelTypes["token_open_position"]>,
		/** fetch data from the table in a streaming manner: "token" */
		token_stream: Array<ModelTypes["token"]>,
		/** fetch data from the table: "token_trade_history" */
		token_trade_history: Array<ModelTypes["token_trade_history"]>,
		/** fetch data from the table: "token_trade_history" using primary key columns */
		token_trade_history_by_pk?: ModelTypes["token_trade_history"] | undefined,
		/** fetch data from the table in a streaming manner: "token_trade_history" */
		token_trade_history_stream: Array<ModelTypes["token_trade_history"]>,
		/** fetch data from the table: "transaction" */
		transaction: Array<ModelTypes["transaction"]>,
		/** fetch data from the table: "transaction" using primary key columns */
		transaction_by_pk?: ModelTypes["transaction"] | undefined,
		/** fetch data from the table in a streaming manner: "transaction" */
		transaction_stream: Array<ModelTypes["transaction"]>
	};
	["timestamp"]: any;
	/** Boolean expression to compare columns of type "timestamp". All fields are combined with logical 'AND'. */
	["timestamp_comparison_exp"]: {
		_eq?: ModelTypes["timestamp"] | undefined,
		_gt?: ModelTypes["timestamp"] | undefined,
		_gte?: ModelTypes["timestamp"] | undefined,
		_in?: Array<ModelTypes["timestamp"]> | undefined,
		_is_null?: boolean | undefined,
		_lt?: ModelTypes["timestamp"] | undefined,
		_lte?: ModelTypes["timestamp"] | undefined,
		_neq?: ModelTypes["timestamp"] | undefined,
		_nin?: Array<ModelTypes["timestamp"]> | undefined
	};
	/** columns and relationships of "token" */
	["token"]: {
		chain_id: string,
		circulating_supply: ModelTypes["bigint"],
		content_path?: string | undefined,
		content_size_bytes?: number | undefined,
		creator: string,
		current_owner: string,
		date_created: ModelTypes["timestamp"],
		decimals: ModelTypes["smallint"],
		height: number,
		id: number,
		last_price_base: ModelTypes["bigint"],
		launch_timestamp: ModelTypes["bigint"],
		/** An array relationship */
		marketplace_cft20_details: Array<ModelTypes["marketplace_cft20_detail"]>,
		max_supply: ModelTypes["numeric"],
		metadata?: string | undefined,
		mint_page: string,
		name: string,
		per_mint_limit: ModelTypes["bigint"],
		ticker: string,
		/** An array relationship */
		token_address_histories: Array<ModelTypes["token_address_history"]>,
		/** An array relationship */
		token_holders: Array<ModelTypes["token_holder"]>,
		/** An array relationship */
		token_open_positions: Array<ModelTypes["token_open_position"]>,
		/** An array relationship */
		token_trade_histories: Array<ModelTypes["token_trade_history"]>,
		/** An object relationship */
		transaction: ModelTypes["transaction"],
		transaction_id: number,
		version: string,
		volume_24_base: ModelTypes["bigint"]
	};
	/** columns and relationships of "token_address_history" */
	["token_address_history"]: {
		action: string,
		amount: ModelTypes["bigint"],
		chain_id: string,
		date_created: ModelTypes["timestamp"],
		height: number,
		id: number,
		receiver?: string | undefined,
		sender: string,
		/** An object relationship */
		token: ModelTypes["token"],
		token_id: number,
		/** An object relationship */
		transaction: ModelTypes["transaction"],
		transaction_id: number
	};
	/** order by aggregate values of table "token_address_history" */
	["token_address_history_aggregate_order_by"]: {
		avg?: ModelTypes["token_address_history_avg_order_by"] | undefined,
		count?: ModelTypes["order_by"] | undefined,
		max?: ModelTypes["token_address_history_max_order_by"] | undefined,
		min?: ModelTypes["token_address_history_min_order_by"] | undefined,
		stddev?: ModelTypes["token_address_history_stddev_order_by"] | undefined,
		stddev_pop?: ModelTypes["token_address_history_stddev_pop_order_by"] | undefined,
		stddev_samp?: ModelTypes["token_address_history_stddev_samp_order_by"] | undefined,
		sum?: ModelTypes["token_address_history_sum_order_by"] | undefined,
		var_pop?: ModelTypes["token_address_history_var_pop_order_by"] | undefined,
		var_samp?: ModelTypes["token_address_history_var_samp_order_by"] | undefined,
		variance?: ModelTypes["token_address_history_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "token_address_history" */
	["token_address_history_avg_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "token_address_history". All fields are combined with a logical 'AND'. */
	["token_address_history_bool_exp"]: {
		_and?: Array<ModelTypes["token_address_history_bool_exp"]> | undefined,
		_not?: ModelTypes["token_address_history_bool_exp"] | undefined,
		_or?: Array<ModelTypes["token_address_history_bool_exp"]> | undefined,
		action?: ModelTypes["String_comparison_exp"] | undefined,
		amount?: ModelTypes["bigint_comparison_exp"] | undefined,
		chain_id?: ModelTypes["String_comparison_exp"] | undefined,
		date_created?: ModelTypes["timestamp_comparison_exp"] | undefined,
		height?: ModelTypes["Int_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		receiver?: ModelTypes["String_comparison_exp"] | undefined,
		sender?: ModelTypes["String_comparison_exp"] | undefined,
		token?: ModelTypes["token_bool_exp"] | undefined,
		token_id?: ModelTypes["Int_comparison_exp"] | undefined,
		transaction?: ModelTypes["transaction_bool_exp"] | undefined,
		transaction_id?: ModelTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "token_address_history" */
	["token_address_history_max_order_by"]: {
		action?: ModelTypes["order_by"] | undefined,
		amount?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		receiver?: ModelTypes["order_by"] | undefined,
		sender?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "token_address_history" */
	["token_address_history_min_order_by"]: {
		action?: ModelTypes["order_by"] | undefined,
		amount?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		receiver?: ModelTypes["order_by"] | undefined,
		sender?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "token_address_history". */
	["token_address_history_order_by"]: {
		action?: ModelTypes["order_by"] | undefined,
		amount?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		receiver?: ModelTypes["order_by"] | undefined,
		sender?: ModelTypes["order_by"] | undefined,
		token?: ModelTypes["token_order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction?: ModelTypes["transaction_order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	["token_address_history_select_column"]: token_address_history_select_column;
	/** order by stddev() on columns of table "token_address_history" */
	["token_address_history_stddev_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "token_address_history" */
	["token_address_history_stddev_pop_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "token_address_history" */
	["token_address_history_stddev_samp_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "token_address_history" */
	["token_address_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["token_address_history_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["token_address_history_stream_cursor_value_input"]: {
		action?: string | undefined,
		amount?: ModelTypes["bigint"] | undefined,
		chain_id?: string | undefined,
		date_created?: ModelTypes["timestamp"] | undefined,
		height?: number | undefined,
		id?: number | undefined,
		receiver?: string | undefined,
		sender?: string | undefined,
		token_id?: number | undefined,
		transaction_id?: number | undefined
	};
	/** order by sum() on columns of table "token_address_history" */
	["token_address_history_sum_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "token_address_history" */
	["token_address_history_var_pop_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "token_address_history" */
	["token_address_history_var_samp_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "token_address_history" */
	["token_address_history_variance_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "token". All fields are combined with a logical 'AND'. */
	["token_bool_exp"]: {
		_and?: Array<ModelTypes["token_bool_exp"]> | undefined,
		_not?: ModelTypes["token_bool_exp"] | undefined,
		_or?: Array<ModelTypes["token_bool_exp"]> | undefined,
		chain_id?: ModelTypes["String_comparison_exp"] | undefined,
		circulating_supply?: ModelTypes["bigint_comparison_exp"] | undefined,
		content_path?: ModelTypes["String_comparison_exp"] | undefined,
		content_size_bytes?: ModelTypes["Int_comparison_exp"] | undefined,
		creator?: ModelTypes["String_comparison_exp"] | undefined,
		current_owner?: ModelTypes["String_comparison_exp"] | undefined,
		date_created?: ModelTypes["timestamp_comparison_exp"] | undefined,
		decimals?: ModelTypes["smallint_comparison_exp"] | undefined,
		height?: ModelTypes["Int_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		last_price_base?: ModelTypes["bigint_comparison_exp"] | undefined,
		launch_timestamp?: ModelTypes["bigint_comparison_exp"] | undefined,
		marketplace_cft20_details?: ModelTypes["marketplace_cft20_detail_bool_exp"] | undefined,
		max_supply?: ModelTypes["numeric_comparison_exp"] | undefined,
		metadata?: ModelTypes["String_comparison_exp"] | undefined,
		mint_page?: ModelTypes["String_comparison_exp"] | undefined,
		name?: ModelTypes["String_comparison_exp"] | undefined,
		per_mint_limit?: ModelTypes["bigint_comparison_exp"] | undefined,
		ticker?: ModelTypes["String_comparison_exp"] | undefined,
		token_address_histories?: ModelTypes["token_address_history_bool_exp"] | undefined,
		token_holders?: ModelTypes["token_holder_bool_exp"] | undefined,
		token_open_positions?: ModelTypes["token_open_position_bool_exp"] | undefined,
		token_trade_histories?: ModelTypes["token_trade_history_bool_exp"] | undefined,
		transaction?: ModelTypes["transaction_bool_exp"] | undefined,
		transaction_id?: ModelTypes["Int_comparison_exp"] | undefined,
		version?: ModelTypes["String_comparison_exp"] | undefined,
		volume_24_base?: ModelTypes["bigint_comparison_exp"] | undefined
	};
	/** columns and relationships of "token_holder" */
	["token_holder"]: {
		address: string,
		amount: ModelTypes["bigint"],
		chain_id: string,
		date_updated: ModelTypes["timestamp"],
		id: number,
		/** An object relationship */
		token: ModelTypes["token"],
		token_id: number
	};
	/** order by aggregate values of table "token_holder" */
	["token_holder_aggregate_order_by"]: {
		avg?: ModelTypes["token_holder_avg_order_by"] | undefined,
		count?: ModelTypes["order_by"] | undefined,
		max?: ModelTypes["token_holder_max_order_by"] | undefined,
		min?: ModelTypes["token_holder_min_order_by"] | undefined,
		stddev?: ModelTypes["token_holder_stddev_order_by"] | undefined,
		stddev_pop?: ModelTypes["token_holder_stddev_pop_order_by"] | undefined,
		stddev_samp?: ModelTypes["token_holder_stddev_samp_order_by"] | undefined,
		sum?: ModelTypes["token_holder_sum_order_by"] | undefined,
		var_pop?: ModelTypes["token_holder_var_pop_order_by"] | undefined,
		var_samp?: ModelTypes["token_holder_var_samp_order_by"] | undefined,
		variance?: ModelTypes["token_holder_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "token_holder" */
	["token_holder_avg_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "token_holder". All fields are combined with a logical 'AND'. */
	["token_holder_bool_exp"]: {
		_and?: Array<ModelTypes["token_holder_bool_exp"]> | undefined,
		_not?: ModelTypes["token_holder_bool_exp"] | undefined,
		_or?: Array<ModelTypes["token_holder_bool_exp"]> | undefined,
		address?: ModelTypes["String_comparison_exp"] | undefined,
		amount?: ModelTypes["bigint_comparison_exp"] | undefined,
		chain_id?: ModelTypes["String_comparison_exp"] | undefined,
		date_updated?: ModelTypes["timestamp_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		token?: ModelTypes["token_bool_exp"] | undefined,
		token_id?: ModelTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "token_holder" */
	["token_holder_max_order_by"]: {
		address?: ModelTypes["order_by"] | undefined,
		amount?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_updated?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "token_holder" */
	["token_holder_min_order_by"]: {
		address?: ModelTypes["order_by"] | undefined,
		amount?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_updated?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "token_holder". */
	["token_holder_order_by"]: {
		address?: ModelTypes["order_by"] | undefined,
		amount?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_updated?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token?: ModelTypes["token_order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	["token_holder_select_column"]: token_holder_select_column;
	/** order by stddev() on columns of table "token_holder" */
	["token_holder_stddev_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "token_holder" */
	["token_holder_stddev_pop_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "token_holder" */
	["token_holder_stddev_samp_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "token_holder" */
	["token_holder_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["token_holder_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["token_holder_stream_cursor_value_input"]: {
		address?: string | undefined,
		amount?: ModelTypes["bigint"] | undefined,
		chain_id?: string | undefined,
		date_updated?: ModelTypes["timestamp"] | undefined,
		id?: number | undefined,
		token_id?: number | undefined
	};
	/** order by sum() on columns of table "token_holder" */
	["token_holder_sum_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "token_holder" */
	["token_holder_var_pop_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "token_holder" */
	["token_holder_var_samp_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "token_holder" */
	["token_holder_variance_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined
	};
	/** columns and relationships of "token_open_position" */
	["token_open_position"]: {
		amount: ModelTypes["bigint"],
		chain_id: string,
		date_created: ModelTypes["timestamp"],
		date_filled?: ModelTypes["timestamp"] | undefined,
		id: number,
		is_cancelled: boolean,
		is_filled: boolean,
		is_reserved: boolean,
		ppt: ModelTypes["bigint"],
		reserve_expires_block?: number | undefined,
		reserved_by?: string | undefined,
		seller_address: string,
		/** An object relationship */
		token: ModelTypes["token"],
		token_id: number,
		total: ModelTypes["bigint"],
		/** An object relationship */
		transaction: ModelTypes["transaction"],
		transaction_id: number
	};
	/** order by aggregate values of table "token_open_position" */
	["token_open_position_aggregate_order_by"]: {
		avg?: ModelTypes["token_open_position_avg_order_by"] | undefined,
		count?: ModelTypes["order_by"] | undefined,
		max?: ModelTypes["token_open_position_max_order_by"] | undefined,
		min?: ModelTypes["token_open_position_min_order_by"] | undefined,
		stddev?: ModelTypes["token_open_position_stddev_order_by"] | undefined,
		stddev_pop?: ModelTypes["token_open_position_stddev_pop_order_by"] | undefined,
		stddev_samp?: ModelTypes["token_open_position_stddev_samp_order_by"] | undefined,
		sum?: ModelTypes["token_open_position_sum_order_by"] | undefined,
		var_pop?: ModelTypes["token_open_position_var_pop_order_by"] | undefined,
		var_samp?: ModelTypes["token_open_position_var_samp_order_by"] | undefined,
		variance?: ModelTypes["token_open_position_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "token_open_position" */
	["token_open_position_avg_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "token_open_position". All fields are combined with a logical 'AND'. */
	["token_open_position_bool_exp"]: {
		_and?: Array<ModelTypes["token_open_position_bool_exp"]> | undefined,
		_not?: ModelTypes["token_open_position_bool_exp"] | undefined,
		_or?: Array<ModelTypes["token_open_position_bool_exp"]> | undefined,
		amount?: ModelTypes["bigint_comparison_exp"] | undefined,
		chain_id?: ModelTypes["String_comparison_exp"] | undefined,
		date_created?: ModelTypes["timestamp_comparison_exp"] | undefined,
		date_filled?: ModelTypes["timestamp_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		is_cancelled?: ModelTypes["Boolean_comparison_exp"] | undefined,
		is_filled?: ModelTypes["Boolean_comparison_exp"] | undefined,
		is_reserved?: ModelTypes["Boolean_comparison_exp"] | undefined,
		ppt?: ModelTypes["bigint_comparison_exp"] | undefined,
		reserve_expires_block?: ModelTypes["Int_comparison_exp"] | undefined,
		reserved_by?: ModelTypes["String_comparison_exp"] | undefined,
		seller_address?: ModelTypes["String_comparison_exp"] | undefined,
		token?: ModelTypes["token_bool_exp"] | undefined,
		token_id?: ModelTypes["Int_comparison_exp"] | undefined,
		total?: ModelTypes["bigint_comparison_exp"] | undefined,
		transaction?: ModelTypes["transaction_bool_exp"] | undefined,
		transaction_id?: ModelTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "token_open_position" */
	["token_open_position_max_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		date_filled?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		reserved_by?: ModelTypes["order_by"] | undefined,
		seller_address?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "token_open_position" */
	["token_open_position_min_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		date_filled?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		reserved_by?: ModelTypes["order_by"] | undefined,
		seller_address?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "token_open_position". */
	["token_open_position_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		date_filled?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		is_cancelled?: ModelTypes["order_by"] | undefined,
		is_filled?: ModelTypes["order_by"] | undefined,
		is_reserved?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		reserved_by?: ModelTypes["order_by"] | undefined,
		seller_address?: ModelTypes["order_by"] | undefined,
		token?: ModelTypes["token_order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction?: ModelTypes["transaction_order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	["token_open_position_select_column"]: token_open_position_select_column;
	/** order by stddev() on columns of table "token_open_position" */
	["token_open_position_stddev_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "token_open_position" */
	["token_open_position_stddev_pop_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "token_open_position" */
	["token_open_position_stddev_samp_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "token_open_position" */
	["token_open_position_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["token_open_position_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["token_open_position_stream_cursor_value_input"]: {
		amount?: ModelTypes["bigint"] | undefined,
		chain_id?: string | undefined,
		date_created?: ModelTypes["timestamp"] | undefined,
		date_filled?: ModelTypes["timestamp"] | undefined,
		id?: number | undefined,
		is_cancelled?: boolean | undefined,
		is_filled?: boolean | undefined,
		is_reserved?: boolean | undefined,
		ppt?: ModelTypes["bigint"] | undefined,
		reserve_expires_block?: number | undefined,
		reserved_by?: string | undefined,
		seller_address?: string | undefined,
		token_id?: number | undefined,
		total?: ModelTypes["bigint"] | undefined,
		transaction_id?: number | undefined
	};
	/** order by sum() on columns of table "token_open_position" */
	["token_open_position_sum_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "token_open_position" */
	["token_open_position_var_pop_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "token_open_position" */
	["token_open_position_var_samp_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "token_open_position" */
	["token_open_position_variance_order_by"]: {
		amount?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		ppt?: ModelTypes["order_by"] | undefined,
		reserve_expires_block?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "token". */
	["token_order_by"]: {
		chain_id?: ModelTypes["order_by"] | undefined,
		circulating_supply?: ModelTypes["order_by"] | undefined,
		content_path?: ModelTypes["order_by"] | undefined,
		content_size_bytes?: ModelTypes["order_by"] | undefined,
		creator?: ModelTypes["order_by"] | undefined,
		current_owner?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		decimals?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		last_price_base?: ModelTypes["order_by"] | undefined,
		launch_timestamp?: ModelTypes["order_by"] | undefined,
		marketplace_cft20_details_aggregate?: ModelTypes["marketplace_cft20_detail_aggregate_order_by"] | undefined,
		max_supply?: ModelTypes["order_by"] | undefined,
		metadata?: ModelTypes["order_by"] | undefined,
		mint_page?: ModelTypes["order_by"] | undefined,
		name?: ModelTypes["order_by"] | undefined,
		per_mint_limit?: ModelTypes["order_by"] | undefined,
		ticker?: ModelTypes["order_by"] | undefined,
		token_address_histories_aggregate?: ModelTypes["token_address_history_aggregate_order_by"] | undefined,
		token_holders_aggregate?: ModelTypes["token_holder_aggregate_order_by"] | undefined,
		token_open_positions_aggregate?: ModelTypes["token_open_position_aggregate_order_by"] | undefined,
		token_trade_histories_aggregate?: ModelTypes["token_trade_history_aggregate_order_by"] | undefined,
		transaction?: ModelTypes["transaction_order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined,
		version?: ModelTypes["order_by"] | undefined,
		volume_24_base?: ModelTypes["order_by"] | undefined
	};
	["token_select_column"]: token_select_column;
	/** Streaming cursor of the table "token" */
	["token_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["token_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["token_stream_cursor_value_input"]: {
		chain_id?: string | undefined,
		circulating_supply?: ModelTypes["bigint"] | undefined,
		content_path?: string | undefined,
		content_size_bytes?: number | undefined,
		creator?: string | undefined,
		current_owner?: string | undefined,
		date_created?: ModelTypes["timestamp"] | undefined,
		decimals?: ModelTypes["smallint"] | undefined,
		height?: number | undefined,
		id?: number | undefined,
		last_price_base?: ModelTypes["bigint"] | undefined,
		launch_timestamp?: ModelTypes["bigint"] | undefined,
		max_supply?: ModelTypes["numeric"] | undefined,
		metadata?: string | undefined,
		mint_page?: string | undefined,
		name?: string | undefined,
		per_mint_limit?: ModelTypes["bigint"] | undefined,
		ticker?: string | undefined,
		transaction_id?: number | undefined,
		version?: string | undefined,
		volume_24_base?: ModelTypes["bigint"] | undefined
	};
	/** columns and relationships of "token_trade_history" */
	["token_trade_history"]: {
		amount_base: ModelTypes["bigint"],
		amount_quote: ModelTypes["bigint"],
		buyer_address?: string | undefined,
		chain_id: string,
		date_created: ModelTypes["timestamp"],
		id: number,
		rate: ModelTypes["bigint"],
		seller_address: string,
		/** An object relationship */
		token: ModelTypes["token"],
		token_id: number,
		total_usd: number,
		/** An object relationship */
		transaction: ModelTypes["transaction"],
		transaction_id: number
	};
	/** order by aggregate values of table "token_trade_history" */
	["token_trade_history_aggregate_order_by"]: {
		avg?: ModelTypes["token_trade_history_avg_order_by"] | undefined,
		count?: ModelTypes["order_by"] | undefined,
		max?: ModelTypes["token_trade_history_max_order_by"] | undefined,
		min?: ModelTypes["token_trade_history_min_order_by"] | undefined,
		stddev?: ModelTypes["token_trade_history_stddev_order_by"] | undefined,
		stddev_pop?: ModelTypes["token_trade_history_stddev_pop_order_by"] | undefined,
		stddev_samp?: ModelTypes["token_trade_history_stddev_samp_order_by"] | undefined,
		sum?: ModelTypes["token_trade_history_sum_order_by"] | undefined,
		var_pop?: ModelTypes["token_trade_history_var_pop_order_by"] | undefined,
		var_samp?: ModelTypes["token_trade_history_var_samp_order_by"] | undefined,
		variance?: ModelTypes["token_trade_history_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "token_trade_history" */
	["token_trade_history_avg_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "token_trade_history". All fields are combined with a logical 'AND'. */
	["token_trade_history_bool_exp"]: {
		_and?: Array<ModelTypes["token_trade_history_bool_exp"]> | undefined,
		_not?: ModelTypes["token_trade_history_bool_exp"] | undefined,
		_or?: Array<ModelTypes["token_trade_history_bool_exp"]> | undefined,
		amount_base?: ModelTypes["bigint_comparison_exp"] | undefined,
		amount_quote?: ModelTypes["bigint_comparison_exp"] | undefined,
		buyer_address?: ModelTypes["String_comparison_exp"] | undefined,
		chain_id?: ModelTypes["String_comparison_exp"] | undefined,
		date_created?: ModelTypes["timestamp_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		rate?: ModelTypes["bigint_comparison_exp"] | undefined,
		seller_address?: ModelTypes["String_comparison_exp"] | undefined,
		token?: ModelTypes["token_bool_exp"] | undefined,
		token_id?: ModelTypes["Int_comparison_exp"] | undefined,
		total_usd?: ModelTypes["Float_comparison_exp"] | undefined,
		transaction?: ModelTypes["transaction_bool_exp"] | undefined,
		transaction_id?: ModelTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "token_trade_history" */
	["token_trade_history_max_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		buyer_address?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		seller_address?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "token_trade_history" */
	["token_trade_history_min_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		buyer_address?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		seller_address?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "token_trade_history". */
	["token_trade_history_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		buyer_address?: ModelTypes["order_by"] | undefined,
		chain_id?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		seller_address?: ModelTypes["order_by"] | undefined,
		token?: ModelTypes["token_order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction?: ModelTypes["transaction_order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	["token_trade_history_select_column"]: token_trade_history_select_column;
	/** order by stddev() on columns of table "token_trade_history" */
	["token_trade_history_stddev_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "token_trade_history" */
	["token_trade_history_stddev_pop_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "token_trade_history" */
	["token_trade_history_stddev_samp_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "token_trade_history" */
	["token_trade_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["token_trade_history_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["token_trade_history_stream_cursor_value_input"]: {
		amount_base?: ModelTypes["bigint"] | undefined,
		amount_quote?: ModelTypes["bigint"] | undefined,
		buyer_address?: string | undefined,
		chain_id?: string | undefined,
		date_created?: ModelTypes["timestamp"] | undefined,
		id?: number | undefined,
		rate?: ModelTypes["bigint"] | undefined,
		seller_address?: string | undefined,
		token_id?: number | undefined,
		total_usd?: number | undefined,
		transaction_id?: number | undefined
	};
	/** order by sum() on columns of table "token_trade_history" */
	["token_trade_history_sum_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "token_trade_history" */
	["token_trade_history_var_pop_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "token_trade_history" */
	["token_trade_history_var_samp_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "token_trade_history" */
	["token_trade_history_variance_order_by"]: {
		amount_base?: ModelTypes["order_by"] | undefined,
		amount_quote?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		rate?: ModelTypes["order_by"] | undefined,
		token_id?: ModelTypes["order_by"] | undefined,
		total_usd?: ModelTypes["order_by"] | undefined,
		transaction_id?: ModelTypes["order_by"] | undefined
	};
	/** columns and relationships of "transaction" */
	["transaction"]: {
		content: string,
		content_length: number,
		date_created: ModelTypes["timestamp"],
		fees: string,
		gas_used: number,
		hash: string,
		height: number,
		id: number,
		/** An object relationship */
		inscription?: ModelTypes["inscription"] | undefined,
		/** An object relationship */
		inscription_history?: ModelTypes["inscription_history"] | undefined,
		/** An array relationship */
		marketplace_listings: Array<ModelTypes["marketplace_listing"]>,
		status_message?: string | undefined,
		/** An object relationship */
		token?: ModelTypes["token"] | undefined,
		/** An object relationship */
		token_address_history?: ModelTypes["token_address_history"] | undefined,
		/** An array relationship */
		token_open_positions: Array<ModelTypes["token_open_position"]>,
		/** An object relationship */
		token_trade_history?: ModelTypes["token_trade_history"] | undefined
	};
	/** Boolean expression to filter rows from the table "transaction". All fields are combined with a logical 'AND'. */
	["transaction_bool_exp"]: {
		_and?: Array<ModelTypes["transaction_bool_exp"]> | undefined,
		_not?: ModelTypes["transaction_bool_exp"] | undefined,
		_or?: Array<ModelTypes["transaction_bool_exp"]> | undefined,
		content?: ModelTypes["String_comparison_exp"] | undefined,
		content_length?: ModelTypes["Int_comparison_exp"] | undefined,
		date_created?: ModelTypes["timestamp_comparison_exp"] | undefined,
		fees?: ModelTypes["String_comparison_exp"] | undefined,
		gas_used?: ModelTypes["Int_comparison_exp"] | undefined,
		hash?: ModelTypes["String_comparison_exp"] | undefined,
		height?: ModelTypes["Int_comparison_exp"] | undefined,
		id?: ModelTypes["Int_comparison_exp"] | undefined,
		inscription?: ModelTypes["inscription_bool_exp"] | undefined,
		inscription_history?: ModelTypes["inscription_history_bool_exp"] | undefined,
		marketplace_listings?: ModelTypes["marketplace_listing_bool_exp"] | undefined,
		status_message?: ModelTypes["String_comparison_exp"] | undefined,
		token?: ModelTypes["token_bool_exp"] | undefined,
		token_address_history?: ModelTypes["token_address_history_bool_exp"] | undefined,
		token_open_positions?: ModelTypes["token_open_position_bool_exp"] | undefined,
		token_trade_history?: ModelTypes["token_trade_history_bool_exp"] | undefined
	};
	/** Ordering options when selecting data from "transaction". */
	["transaction_order_by"]: {
		content?: ModelTypes["order_by"] | undefined,
		content_length?: ModelTypes["order_by"] | undefined,
		date_created?: ModelTypes["order_by"] | undefined,
		fees?: ModelTypes["order_by"] | undefined,
		gas_used?: ModelTypes["order_by"] | undefined,
		hash?: ModelTypes["order_by"] | undefined,
		height?: ModelTypes["order_by"] | undefined,
		id?: ModelTypes["order_by"] | undefined,
		inscription?: ModelTypes["inscription_order_by"] | undefined,
		inscription_history?: ModelTypes["inscription_history_order_by"] | undefined,
		marketplace_listings_aggregate?: ModelTypes["marketplace_listing_aggregate_order_by"] | undefined,
		status_message?: ModelTypes["order_by"] | undefined,
		token?: ModelTypes["token_order_by"] | undefined,
		token_address_history?: ModelTypes["token_address_history_order_by"] | undefined,
		token_open_positions_aggregate?: ModelTypes["token_open_position_aggregate_order_by"] | undefined,
		token_trade_history?: ModelTypes["token_trade_history_order_by"] | undefined
	};
	["transaction_select_column"]: transaction_select_column;
	/** Streaming cursor of the table "transaction" */
	["transaction_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: ModelTypes["transaction_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: ModelTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["transaction_stream_cursor_value_input"]: {
		content?: string | undefined,
		content_length?: number | undefined,
		date_created?: ModelTypes["timestamp"] | undefined,
		fees?: string | undefined,
		gas_used?: number | undefined,
		hash?: string | undefined,
		height?: number | undefined,
		id?: number | undefined,
		status_message?: string | undefined
	}
}

export type GraphQLTypes = {
	/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
	["Boolean_comparison_exp"]: {
		_eq?: boolean | undefined,
		_gt?: boolean | undefined,
		_gte?: boolean | undefined,
		_in?: Array<boolean> | undefined,
		_is_null?: boolean | undefined,
		_lt?: boolean | undefined,
		_lte?: boolean | undefined,
		_neq?: boolean | undefined,
		_nin?: Array<boolean> | undefined
	};
	/** Boolean expression to compare columns of type "Float". All fields are combined with logical 'AND'. */
	["Float_comparison_exp"]: {
		_eq?: number | undefined,
		_gt?: number | undefined,
		_gte?: number | undefined,
		_in?: Array<number> | undefined,
		_is_null?: boolean | undefined,
		_lt?: number | undefined,
		_lte?: number | undefined,
		_neq?: number | undefined,
		_nin?: Array<number> | undefined
	};
	/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
	["Int_comparison_exp"]: {
		_eq?: number | undefined,
		_gt?: number | undefined,
		_gte?: number | undefined,
		_in?: Array<number> | undefined,
		_is_null?: boolean | undefined,
		_lt?: number | undefined,
		_lte?: number | undefined,
		_neq?: number | undefined,
		_nin?: Array<number> | undefined
	};
	/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
	["String_comparison_exp"]: {
		_eq?: string | undefined,
		_gt?: string | undefined,
		_gte?: string | undefined,
		/** does the column match the given case-insensitive pattern */
		_ilike?: string | undefined,
		_in?: Array<string> | undefined,
		/** does the column match the given POSIX regular expression, case insensitive */
		_iregex?: string | undefined,
		_is_null?: boolean | undefined,
		/** does the column match the given pattern */
		_like?: string | undefined,
		_lt?: string | undefined,
		_lte?: string | undefined,
		_neq?: string | undefined,
		/** does the column NOT match the given case-insensitive pattern */
		_nilike?: string | undefined,
		_nin?: Array<string> | undefined,
		/** does the column NOT match the given POSIX regular expression, case insensitive */
		_niregex?: string | undefined,
		/** does the column NOT match the given pattern */
		_nlike?: string | undefined,
		/** does the column NOT match the given POSIX regular expression, case sensitive */
		_nregex?: string | undefined,
		/** does the column NOT match the given SQL regular expression */
		_nsimilar?: string | undefined,
		/** does the column match the given POSIX regular expression, case sensitive */
		_regex?: string | undefined,
		/** does the column match the given SQL regular expression */
		_similar?: string | undefined
	};
	["bigint"]: "scalar" & { name: "bigint" };
	/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
	["bigint_comparison_exp"]: {
		_eq?: GraphQLTypes["bigint"] | undefined,
		_gt?: GraphQLTypes["bigint"] | undefined,
		_gte?: GraphQLTypes["bigint"] | undefined,
		_in?: Array<GraphQLTypes["bigint"]> | undefined,
		_is_null?: boolean | undefined,
		_lt?: GraphQLTypes["bigint"] | undefined,
		_lte?: GraphQLTypes["bigint"] | undefined,
		_neq?: GraphQLTypes["bigint"] | undefined,
		_nin?: Array<GraphQLTypes["bigint"]> | undefined
	};
	/** ordering argument of a cursor */
	["cursor_ordering"]: cursor_ordering;
	/** columns and relationships of "inscription" */
	["inscription"]: {
		__typename: "inscription",
		chain_id: string,
		content_hash: string,
		content_path: string,
		content_size_bytes: number,
		creator: string,
		current_owner: string,
		date_created: GraphQLTypes["timestamp"],
		height: number,
		id: number,
		/** An array relationship */
		inscription_histories: Array<GraphQLTypes["inscription_history"]>,
		is_explicit?: boolean | undefined,
		metadata: GraphQLTypes["json"],
		/** An object relationship */
		transaction: GraphQLTypes["transaction"],
		transaction_id: number,
		type: string,
		version: string
	};
	/** Boolean expression to filter rows from the table "inscription". All fields are combined with a logical 'AND'. */
	["inscription_bool_exp"]: {
		_and?: Array<GraphQLTypes["inscription_bool_exp"]> | undefined,
		_not?: GraphQLTypes["inscription_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["inscription_bool_exp"]> | undefined,
		chain_id?: GraphQLTypes["String_comparison_exp"] | undefined,
		content_hash?: GraphQLTypes["String_comparison_exp"] | undefined,
		content_path?: GraphQLTypes["String_comparison_exp"] | undefined,
		content_size_bytes?: GraphQLTypes["Int_comparison_exp"] | undefined,
		creator?: GraphQLTypes["String_comparison_exp"] | undefined,
		current_owner?: GraphQLTypes["String_comparison_exp"] | undefined,
		date_created?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		height?: GraphQLTypes["Int_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		inscription_histories?: GraphQLTypes["inscription_history_bool_exp"] | undefined,
		is_explicit?: GraphQLTypes["Boolean_comparison_exp"] | undefined,
		metadata?: GraphQLTypes["json_comparison_exp"] | undefined,
		transaction?: GraphQLTypes["transaction_bool_exp"] | undefined,
		transaction_id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		type?: GraphQLTypes["String_comparison_exp"] | undefined,
		version?: GraphQLTypes["String_comparison_exp"] | undefined
	};
	/** columns and relationships of "inscription_history" */
	["inscription_history"]: {
		__typename: "inscription_history",
		action: string,
		chain_id: string,
		date_created: GraphQLTypes["timestamp"],
		height: number,
		id: number,
		/** An object relationship */
		inscription: GraphQLTypes["inscription"],
		inscription_id: number,
		receiver?: string | undefined,
		sender: string,
		/** An object relationship */
		transaction: GraphQLTypes["transaction"],
		transaction_id: number
	};
	/** order by aggregate values of table "inscription_history" */
	["inscription_history_aggregate_order_by"]: {
		avg?: GraphQLTypes["inscription_history_avg_order_by"] | undefined,
		count?: GraphQLTypes["order_by"] | undefined,
		max?: GraphQLTypes["inscription_history_max_order_by"] | undefined,
		min?: GraphQLTypes["inscription_history_min_order_by"] | undefined,
		stddev?: GraphQLTypes["inscription_history_stddev_order_by"] | undefined,
		stddev_pop?: GraphQLTypes["inscription_history_stddev_pop_order_by"] | undefined,
		stddev_samp?: GraphQLTypes["inscription_history_stddev_samp_order_by"] | undefined,
		sum?: GraphQLTypes["inscription_history_sum_order_by"] | undefined,
		var_pop?: GraphQLTypes["inscription_history_var_pop_order_by"] | undefined,
		var_samp?: GraphQLTypes["inscription_history_var_samp_order_by"] | undefined,
		variance?: GraphQLTypes["inscription_history_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "inscription_history" */
	["inscription_history_avg_order_by"]: {
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "inscription_history". All fields are combined with a logical 'AND'. */
	["inscription_history_bool_exp"]: {
		_and?: Array<GraphQLTypes["inscription_history_bool_exp"]> | undefined,
		_not?: GraphQLTypes["inscription_history_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["inscription_history_bool_exp"]> | undefined,
		action?: GraphQLTypes["String_comparison_exp"] | undefined,
		chain_id?: GraphQLTypes["String_comparison_exp"] | undefined,
		date_created?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		height?: GraphQLTypes["Int_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		inscription?: GraphQLTypes["inscription_bool_exp"] | undefined,
		inscription_id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		receiver?: GraphQLTypes["String_comparison_exp"] | undefined,
		sender?: GraphQLTypes["String_comparison_exp"] | undefined,
		transaction?: GraphQLTypes["transaction_bool_exp"] | undefined,
		transaction_id?: GraphQLTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "inscription_history" */
	["inscription_history_max_order_by"]: {
		action?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		receiver?: GraphQLTypes["order_by"] | undefined,
		sender?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "inscription_history" */
	["inscription_history_min_order_by"]: {
		action?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		receiver?: GraphQLTypes["order_by"] | undefined,
		sender?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "inscription_history". */
	["inscription_history_order_by"]: {
		action?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription?: GraphQLTypes["inscription_order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		receiver?: GraphQLTypes["order_by"] | undefined,
		sender?: GraphQLTypes["order_by"] | undefined,
		transaction?: GraphQLTypes["transaction_order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** select columns of table "inscription_history" */
	["inscription_history_select_column"]: inscription_history_select_column;
	/** order by stddev() on columns of table "inscription_history" */
	["inscription_history_stddev_order_by"]: {
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "inscription_history" */
	["inscription_history_stddev_pop_order_by"]: {
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "inscription_history" */
	["inscription_history_stddev_samp_order_by"]: {
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "inscription_history" */
	["inscription_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["inscription_history_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["inscription_history_stream_cursor_value_input"]: {
		action?: string | undefined,
		chain_id?: string | undefined,
		date_created?: GraphQLTypes["timestamp"] | undefined,
		height?: number | undefined,
		id?: number | undefined,
		inscription_id?: number | undefined,
		receiver?: string | undefined,
		sender?: string | undefined,
		transaction_id?: number | undefined
	};
	/** order by sum() on columns of table "inscription_history" */
	["inscription_history_sum_order_by"]: {
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "inscription_history" */
	["inscription_history_var_pop_order_by"]: {
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "inscription_history" */
	["inscription_history_var_samp_order_by"]: {
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "inscription_history" */
	["inscription_history_variance_order_by"]: {
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "inscription". */
	["inscription_order_by"]: {
		chain_id?: GraphQLTypes["order_by"] | undefined,
		content_hash?: GraphQLTypes["order_by"] | undefined,
		content_path?: GraphQLTypes["order_by"] | undefined,
		content_size_bytes?: GraphQLTypes["order_by"] | undefined,
		creator?: GraphQLTypes["order_by"] | undefined,
		current_owner?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription_histories_aggregate?: GraphQLTypes["inscription_history_aggregate_order_by"] | undefined,
		is_explicit?: GraphQLTypes["order_by"] | undefined,
		metadata?: GraphQLTypes["order_by"] | undefined,
		transaction?: GraphQLTypes["transaction_order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined,
		type?: GraphQLTypes["order_by"] | undefined,
		version?: GraphQLTypes["order_by"] | undefined
	};
	/** select columns of table "inscription" */
	["inscription_select_column"]: inscription_select_column;
	/** Streaming cursor of the table "inscription" */
	["inscription_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["inscription_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["inscription_stream_cursor_value_input"]: {
		chain_id?: string | undefined,
		content_hash?: string | undefined,
		content_path?: string | undefined,
		content_size_bytes?: number | undefined,
		creator?: string | undefined,
		current_owner?: string | undefined,
		date_created?: GraphQLTypes["timestamp"] | undefined,
		height?: number | undefined,
		id?: number | undefined,
		is_explicit?: boolean | undefined,
		metadata?: GraphQLTypes["json"] | undefined,
		transaction_id?: number | undefined,
		type?: string | undefined,
		version?: string | undefined
	};
	["json"]: "scalar" & { name: "json" };
	/** Boolean expression to compare columns of type "json". All fields are combined with logical 'AND'. */
	["json_comparison_exp"]: {
		_eq?: GraphQLTypes["json"] | undefined,
		_gt?: GraphQLTypes["json"] | undefined,
		_gte?: GraphQLTypes["json"] | undefined,
		_in?: Array<GraphQLTypes["json"]> | undefined,
		_is_null?: boolean | undefined,
		_lt?: GraphQLTypes["json"] | undefined,
		_lte?: GraphQLTypes["json"] | undefined,
		_neq?: GraphQLTypes["json"] | undefined,
		_nin?: Array<GraphQLTypes["json"]> | undefined
	};
	/** columns and relationships of "marketplace_cft20_detail" */
	["marketplace_cft20_detail"]: {
		__typename: "marketplace_cft20_detail",
		amount: GraphQLTypes["bigint"],
		date_created: GraphQLTypes["timestamp"],
		id: number,
		listing_id: number,
		/** An object relationship */
		marketplace_listing: GraphQLTypes["marketplace_listing"],
		ppt: GraphQLTypes["bigint"],
		/** An object relationship */
		token: GraphQLTypes["token"],
		token_id: number
	};
	/** order by aggregate values of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_aggregate_order_by"]: {
		avg?: GraphQLTypes["marketplace_cft20_detail_avg_order_by"] | undefined,
		count?: GraphQLTypes["order_by"] | undefined,
		max?: GraphQLTypes["marketplace_cft20_detail_max_order_by"] | undefined,
		min?: GraphQLTypes["marketplace_cft20_detail_min_order_by"] | undefined,
		stddev?: GraphQLTypes["marketplace_cft20_detail_stddev_order_by"] | undefined,
		stddev_pop?: GraphQLTypes["marketplace_cft20_detail_stddev_pop_order_by"] | undefined,
		stddev_samp?: GraphQLTypes["marketplace_cft20_detail_stddev_samp_order_by"] | undefined,
		sum?: GraphQLTypes["marketplace_cft20_detail_sum_order_by"] | undefined,
		var_pop?: GraphQLTypes["marketplace_cft20_detail_var_pop_order_by"] | undefined,
		var_samp?: GraphQLTypes["marketplace_cft20_detail_var_samp_order_by"] | undefined,
		variance?: GraphQLTypes["marketplace_cft20_detail_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_avg_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "marketplace_cft20_detail". All fields are combined with a logical 'AND'. */
	["marketplace_cft20_detail_bool_exp"]: {
		_and?: Array<GraphQLTypes["marketplace_cft20_detail_bool_exp"]> | undefined,
		_not?: GraphQLTypes["marketplace_cft20_detail_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["marketplace_cft20_detail_bool_exp"]> | undefined,
		amount?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		date_created?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		listing_id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		marketplace_listing?: GraphQLTypes["marketplace_listing_bool_exp"] | undefined,
		ppt?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		token?: GraphQLTypes["token_bool_exp"] | undefined,
		token_id?: GraphQLTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_max_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_min_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "marketplace_cft20_detail". */
	["marketplace_cft20_detail_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		marketplace_listing?: GraphQLTypes["marketplace_listing_order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token?: GraphQLTypes["token_order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** select columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_select_column"]: marketplace_cft20_detail_select_column;
	/** order by stddev() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_pop_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stddev_samp_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["marketplace_cft20_detail_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["marketplace_cft20_detail_stream_cursor_value_input"]: {
		amount?: GraphQLTypes["bigint"] | undefined,
		date_created?: GraphQLTypes["timestamp"] | undefined,
		id?: number | undefined,
		listing_id?: number | undefined,
		ppt?: GraphQLTypes["bigint"] | undefined,
		token_id?: number | undefined
	};
	/** order by sum() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_sum_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_var_pop_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_var_samp_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "marketplace_cft20_detail" */
	["marketplace_cft20_detail_variance_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		listing_id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** columns and relationships of "marketplace_listing" */
	["marketplace_listing"]: {
		__typename: "marketplace_listing",
		chain_id: string,
		date_created: GraphQLTypes["timestamp"],
		date_updated?: GraphQLTypes["timestamp"] | undefined,
		deposit_timeout: number,
		deposit_total: GraphQLTypes["bigint"],
		depositor_address?: string | undefined,
		depositor_timedout_block?: number | undefined,
		id: number,
		is_cancelled: boolean,
		is_deposited: boolean,
		is_filled: boolean,
		/** An array relationship */
		marketplace_cft20_details: Array<GraphQLTypes["marketplace_cft20_detail"]>,
		seller_address: string,
		total: GraphQLTypes["bigint"],
		/** An object relationship */
		transaction: GraphQLTypes["transaction"],
		transaction_id: number
	};
	/** order by aggregate values of table "marketplace_listing" */
	["marketplace_listing_aggregate_order_by"]: {
		avg?: GraphQLTypes["marketplace_listing_avg_order_by"] | undefined,
		count?: GraphQLTypes["order_by"] | undefined,
		max?: GraphQLTypes["marketplace_listing_max_order_by"] | undefined,
		min?: GraphQLTypes["marketplace_listing_min_order_by"] | undefined,
		stddev?: GraphQLTypes["marketplace_listing_stddev_order_by"] | undefined,
		stddev_pop?: GraphQLTypes["marketplace_listing_stddev_pop_order_by"] | undefined,
		stddev_samp?: GraphQLTypes["marketplace_listing_stddev_samp_order_by"] | undefined,
		sum?: GraphQLTypes["marketplace_listing_sum_order_by"] | undefined,
		var_pop?: GraphQLTypes["marketplace_listing_var_pop_order_by"] | undefined,
		var_samp?: GraphQLTypes["marketplace_listing_var_samp_order_by"] | undefined,
		variance?: GraphQLTypes["marketplace_listing_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "marketplace_listing" */
	["marketplace_listing_avg_order_by"]: {
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "marketplace_listing". All fields are combined with a logical 'AND'. */
	["marketplace_listing_bool_exp"]: {
		_and?: Array<GraphQLTypes["marketplace_listing_bool_exp"]> | undefined,
		_not?: GraphQLTypes["marketplace_listing_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["marketplace_listing_bool_exp"]> | undefined,
		chain_id?: GraphQLTypes["String_comparison_exp"] | undefined,
		date_created?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		date_updated?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		deposit_timeout?: GraphQLTypes["Int_comparison_exp"] | undefined,
		deposit_total?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		depositor_address?: GraphQLTypes["String_comparison_exp"] | undefined,
		depositor_timedout_block?: GraphQLTypes["Int_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		is_cancelled?: GraphQLTypes["Boolean_comparison_exp"] | undefined,
		is_deposited?: GraphQLTypes["Boolean_comparison_exp"] | undefined,
		is_filled?: GraphQLTypes["Boolean_comparison_exp"] | undefined,
		marketplace_cft20_details?: GraphQLTypes["marketplace_cft20_detail_bool_exp"] | undefined,
		seller_address?: GraphQLTypes["String_comparison_exp"] | undefined,
		total?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		transaction?: GraphQLTypes["transaction_bool_exp"] | undefined,
		transaction_id?: GraphQLTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "marketplace_listing" */
	["marketplace_listing_max_order_by"]: {
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		date_updated?: GraphQLTypes["order_by"] | undefined,
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_address?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		seller_address?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "marketplace_listing" */
	["marketplace_listing_min_order_by"]: {
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		date_updated?: GraphQLTypes["order_by"] | undefined,
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_address?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		seller_address?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "marketplace_listing". */
	["marketplace_listing_order_by"]: {
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		date_updated?: GraphQLTypes["order_by"] | undefined,
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_address?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		is_cancelled?: GraphQLTypes["order_by"] | undefined,
		is_deposited?: GraphQLTypes["order_by"] | undefined,
		is_filled?: GraphQLTypes["order_by"] | undefined,
		marketplace_cft20_details_aggregate?: GraphQLTypes["marketplace_cft20_detail_aggregate_order_by"] | undefined,
		seller_address?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction?: GraphQLTypes["transaction_order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** select columns of table "marketplace_listing" */
	["marketplace_listing_select_column"]: marketplace_listing_select_column;
	/** order by stddev() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_order_by"]: {
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_pop_order_by"]: {
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "marketplace_listing" */
	["marketplace_listing_stddev_samp_order_by"]: {
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "marketplace_listing" */
	["marketplace_listing_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["marketplace_listing_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["marketplace_listing_stream_cursor_value_input"]: {
		chain_id?: string | undefined,
		date_created?: GraphQLTypes["timestamp"] | undefined,
		date_updated?: GraphQLTypes["timestamp"] | undefined,
		deposit_timeout?: number | undefined,
		deposit_total?: GraphQLTypes["bigint"] | undefined,
		depositor_address?: string | undefined,
		depositor_timedout_block?: number | undefined,
		id?: number | undefined,
		is_cancelled?: boolean | undefined,
		is_deposited?: boolean | undefined,
		is_filled?: boolean | undefined,
		seller_address?: string | undefined,
		total?: GraphQLTypes["bigint"] | undefined,
		transaction_id?: number | undefined
	};
	/** order by sum() on columns of table "marketplace_listing" */
	["marketplace_listing_sum_order_by"]: {
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "marketplace_listing" */
	["marketplace_listing_var_pop_order_by"]: {
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "marketplace_listing" */
	["marketplace_listing_var_samp_order_by"]: {
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "marketplace_listing" */
	["marketplace_listing_variance_order_by"]: {
		deposit_timeout?: GraphQLTypes["order_by"] | undefined,
		deposit_total?: GraphQLTypes["order_by"] | undefined,
		depositor_timedout_block?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	["numeric"]: "scalar" & { name: "numeric" };
	/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
	["numeric_comparison_exp"]: {
		_eq?: GraphQLTypes["numeric"] | undefined,
		_gt?: GraphQLTypes["numeric"] | undefined,
		_gte?: GraphQLTypes["numeric"] | undefined,
		_in?: Array<GraphQLTypes["numeric"]> | undefined,
		_is_null?: boolean | undefined,
		_lt?: GraphQLTypes["numeric"] | undefined,
		_lte?: GraphQLTypes["numeric"] | undefined,
		_neq?: GraphQLTypes["numeric"] | undefined,
		_nin?: Array<GraphQLTypes["numeric"]> | undefined
	};
	/** column ordering options */
	["order_by"]: order_by;
	["query_root"]: {
		__typename: "query_root",
		/** fetch data from the table: "inscription" */
		inscription: Array<GraphQLTypes["inscription"]>,
		/** fetch data from the table: "inscription" using primary key columns */
		inscription_by_pk?: GraphQLTypes["inscription"] | undefined,
		/** fetch data from the table: "inscription_history" */
		inscription_history: Array<GraphQLTypes["inscription_history"]>,
		/** fetch data from the table: "inscription_history" using primary key columns */
		inscription_history_by_pk?: GraphQLTypes["inscription_history"] | undefined,
		/** fetch data from the table: "marketplace_cft20_detail" */
		marketplace_cft20_detail: Array<GraphQLTypes["marketplace_cft20_detail"]>,
		/** fetch data from the table: "marketplace_cft20_detail" using primary key columns */
		marketplace_cft20_detail_by_pk?: GraphQLTypes["marketplace_cft20_detail"] | undefined,
		/** fetch data from the table: "marketplace_listing" */
		marketplace_listing: Array<GraphQLTypes["marketplace_listing"]>,
		/** fetch data from the table: "marketplace_listing" using primary key columns */
		marketplace_listing_by_pk?: GraphQLTypes["marketplace_listing"] | undefined,
		/** fetch data from the table: "status" */
		status: Array<GraphQLTypes["status"]>,
		/** fetch data from the table: "status" using primary key columns */
		status_by_pk?: GraphQLTypes["status"] | undefined,
		/** fetch data from the table: "token" */
		token: Array<GraphQLTypes["token"]>,
		/** fetch data from the table: "token_address_history" */
		token_address_history: Array<GraphQLTypes["token_address_history"]>,
		/** fetch data from the table: "token_address_history" using primary key columns */
		token_address_history_by_pk?: GraphQLTypes["token_address_history"] | undefined,
		/** fetch data from the table: "token" using primary key columns */
		token_by_pk?: GraphQLTypes["token"] | undefined,
		/** fetch data from the table: "token_holder" */
		token_holder: Array<GraphQLTypes["token_holder"]>,
		/** fetch data from the table: "token_holder" using primary key columns */
		token_holder_by_pk?: GraphQLTypes["token_holder"] | undefined,
		/** fetch data from the table: "token_open_position" */
		token_open_position: Array<GraphQLTypes["token_open_position"]>,
		/** fetch data from the table: "token_open_position" using primary key columns */
		token_open_position_by_pk?: GraphQLTypes["token_open_position"] | undefined,
		/** fetch data from the table: "token_trade_history" */
		token_trade_history: Array<GraphQLTypes["token_trade_history"]>,
		/** fetch data from the table: "token_trade_history" using primary key columns */
		token_trade_history_by_pk?: GraphQLTypes["token_trade_history"] | undefined,
		/** fetch data from the table: "transaction" */
		transaction: Array<GraphQLTypes["transaction"]>,
		/** fetch data from the table: "transaction" using primary key columns */
		transaction_by_pk?: GraphQLTypes["transaction"] | undefined
	};
	["smallint"]: "scalar" & { name: "smallint" };
	/** Boolean expression to compare columns of type "smallint". All fields are combined with logical 'AND'. */
	["smallint_comparison_exp"]: {
		_eq?: GraphQLTypes["smallint"] | undefined,
		_gt?: GraphQLTypes["smallint"] | undefined,
		_gte?: GraphQLTypes["smallint"] | undefined,
		_in?: Array<GraphQLTypes["smallint"]> | undefined,
		_is_null?: boolean | undefined,
		_lt?: GraphQLTypes["smallint"] | undefined,
		_lte?: GraphQLTypes["smallint"] | undefined,
		_neq?: GraphQLTypes["smallint"] | undefined,
		_nin?: Array<GraphQLTypes["smallint"]> | undefined
	};
	/** columns and relationships of "status" */
	["status"]: {
		__typename: "status",
		base_token: string,
		base_token_usd: number,
		chain_id: string,
		date_updated: GraphQLTypes["timestamp"],
		id: number,
		last_known_height: number,
		last_processed_height: number
	};
	/** Boolean expression to filter rows from the table "status". All fields are combined with a logical 'AND'. */
	["status_bool_exp"]: {
		_and?: Array<GraphQLTypes["status_bool_exp"]> | undefined,
		_not?: GraphQLTypes["status_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["status_bool_exp"]> | undefined,
		base_token?: GraphQLTypes["String_comparison_exp"] | undefined,
		base_token_usd?: GraphQLTypes["Float_comparison_exp"] | undefined,
		chain_id?: GraphQLTypes["String_comparison_exp"] | undefined,
		date_updated?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		last_known_height?: GraphQLTypes["Int_comparison_exp"] | undefined,
		last_processed_height?: GraphQLTypes["Int_comparison_exp"] | undefined
	};
	/** Ordering options when selecting data from "status". */
	["status_order_by"]: {
		base_token?: GraphQLTypes["order_by"] | undefined,
		base_token_usd?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_updated?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		last_known_height?: GraphQLTypes["order_by"] | undefined,
		last_processed_height?: GraphQLTypes["order_by"] | undefined
	};
	/** select columns of table "status" */
	["status_select_column"]: status_select_column;
	/** Streaming cursor of the table "status" */
	["status_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["status_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["status_stream_cursor_value_input"]: {
		base_token?: string | undefined,
		base_token_usd?: number | undefined,
		chain_id?: string | undefined,
		date_updated?: GraphQLTypes["timestamp"] | undefined,
		id?: number | undefined,
		last_known_height?: number | undefined,
		last_processed_height?: number | undefined
	};
	["subscription_root"]: {
		__typename: "subscription_root",
		/** fetch data from the table: "inscription" */
		inscription: Array<GraphQLTypes["inscription"]>,
		/** fetch data from the table: "inscription" using primary key columns */
		inscription_by_pk?: GraphQLTypes["inscription"] | undefined,
		/** fetch data from the table: "inscription_history" */
		inscription_history: Array<GraphQLTypes["inscription_history"]>,
		/** fetch data from the table: "inscription_history" using primary key columns */
		inscription_history_by_pk?: GraphQLTypes["inscription_history"] | undefined,
		/** fetch data from the table in a streaming manner: "inscription_history" */
		inscription_history_stream: Array<GraphQLTypes["inscription_history"]>,
		/** fetch data from the table in a streaming manner: "inscription" */
		inscription_stream: Array<GraphQLTypes["inscription"]>,
		/** fetch data from the table: "marketplace_cft20_detail" */
		marketplace_cft20_detail: Array<GraphQLTypes["marketplace_cft20_detail"]>,
		/** fetch data from the table: "marketplace_cft20_detail" using primary key columns */
		marketplace_cft20_detail_by_pk?: GraphQLTypes["marketplace_cft20_detail"] | undefined,
		/** fetch data from the table in a streaming manner: "marketplace_cft20_detail" */
		marketplace_cft20_detail_stream: Array<GraphQLTypes["marketplace_cft20_detail"]>,
		/** fetch data from the table: "marketplace_listing" */
		marketplace_listing: Array<GraphQLTypes["marketplace_listing"]>,
		/** fetch data from the table: "marketplace_listing" using primary key columns */
		marketplace_listing_by_pk?: GraphQLTypes["marketplace_listing"] | undefined,
		/** fetch data from the table in a streaming manner: "marketplace_listing" */
		marketplace_listing_stream: Array<GraphQLTypes["marketplace_listing"]>,
		/** fetch data from the table: "status" */
		status: Array<GraphQLTypes["status"]>,
		/** fetch data from the table: "status" using primary key columns */
		status_by_pk?: GraphQLTypes["status"] | undefined,
		/** fetch data from the table in a streaming manner: "status" */
		status_stream: Array<GraphQLTypes["status"]>,
		/** fetch data from the table: "token" */
		token: Array<GraphQLTypes["token"]>,
		/** fetch data from the table: "token_address_history" */
		token_address_history: Array<GraphQLTypes["token_address_history"]>,
		/** fetch data from the table: "token_address_history" using primary key columns */
		token_address_history_by_pk?: GraphQLTypes["token_address_history"] | undefined,
		/** fetch data from the table in a streaming manner: "token_address_history" */
		token_address_history_stream: Array<GraphQLTypes["token_address_history"]>,
		/** fetch data from the table: "token" using primary key columns */
		token_by_pk?: GraphQLTypes["token"] | undefined,
		/** fetch data from the table: "token_holder" */
		token_holder: Array<GraphQLTypes["token_holder"]>,
		/** fetch data from the table: "token_holder" using primary key columns */
		token_holder_by_pk?: GraphQLTypes["token_holder"] | undefined,
		/** fetch data from the table in a streaming manner: "token_holder" */
		token_holder_stream: Array<GraphQLTypes["token_holder"]>,
		/** fetch data from the table: "token_open_position" */
		token_open_position: Array<GraphQLTypes["token_open_position"]>,
		/** fetch data from the table: "token_open_position" using primary key columns */
		token_open_position_by_pk?: GraphQLTypes["token_open_position"] | undefined,
		/** fetch data from the table in a streaming manner: "token_open_position" */
		token_open_position_stream: Array<GraphQLTypes["token_open_position"]>,
		/** fetch data from the table in a streaming manner: "token" */
		token_stream: Array<GraphQLTypes["token"]>,
		/** fetch data from the table: "token_trade_history" */
		token_trade_history: Array<GraphQLTypes["token_trade_history"]>,
		/** fetch data from the table: "token_trade_history" using primary key columns */
		token_trade_history_by_pk?: GraphQLTypes["token_trade_history"] | undefined,
		/** fetch data from the table in a streaming manner: "token_trade_history" */
		token_trade_history_stream: Array<GraphQLTypes["token_trade_history"]>,
		/** fetch data from the table: "transaction" */
		transaction: Array<GraphQLTypes["transaction"]>,
		/** fetch data from the table: "transaction" using primary key columns */
		transaction_by_pk?: GraphQLTypes["transaction"] | undefined,
		/** fetch data from the table in a streaming manner: "transaction" */
		transaction_stream: Array<GraphQLTypes["transaction"]>
	};
	["timestamp"]: "scalar" & { name: "timestamp" };
	/** Boolean expression to compare columns of type "timestamp". All fields are combined with logical 'AND'. */
	["timestamp_comparison_exp"]: {
		_eq?: GraphQLTypes["timestamp"] | undefined,
		_gt?: GraphQLTypes["timestamp"] | undefined,
		_gte?: GraphQLTypes["timestamp"] | undefined,
		_in?: Array<GraphQLTypes["timestamp"]> | undefined,
		_is_null?: boolean | undefined,
		_lt?: GraphQLTypes["timestamp"] | undefined,
		_lte?: GraphQLTypes["timestamp"] | undefined,
		_neq?: GraphQLTypes["timestamp"] | undefined,
		_nin?: Array<GraphQLTypes["timestamp"]> | undefined
	};
	/** columns and relationships of "token" */
	["token"]: {
		__typename: "token",
		chain_id: string,
		circulating_supply: GraphQLTypes["bigint"],
		content_path?: string | undefined,
		content_size_bytes?: number | undefined,
		creator: string,
		current_owner: string,
		date_created: GraphQLTypes["timestamp"],
		decimals: GraphQLTypes["smallint"],
		height: number,
		id: number,
		last_price_base: GraphQLTypes["bigint"],
		launch_timestamp: GraphQLTypes["bigint"],
		/** An array relationship */
		marketplace_cft20_details: Array<GraphQLTypes["marketplace_cft20_detail"]>,
		max_supply: GraphQLTypes["numeric"],
		metadata?: string | undefined,
		mint_page: string,
		name: string,
		per_mint_limit: GraphQLTypes["bigint"],
		ticker: string,
		/** An array relationship */
		token_address_histories: Array<GraphQLTypes["token_address_history"]>,
		/** An array relationship */
		token_holders: Array<GraphQLTypes["token_holder"]>,
		/** An array relationship */
		token_open_positions: Array<GraphQLTypes["token_open_position"]>,
		/** An array relationship */
		token_trade_histories: Array<GraphQLTypes["token_trade_history"]>,
		/** An object relationship */
		transaction: GraphQLTypes["transaction"],
		transaction_id: number,
		version: string,
		volume_24_base: GraphQLTypes["bigint"]
	};
	/** columns and relationships of "token_address_history" */
	["token_address_history"]: {
		__typename: "token_address_history",
		action: string,
		amount: GraphQLTypes["bigint"],
		chain_id: string,
		date_created: GraphQLTypes["timestamp"],
		height: number,
		id: number,
		receiver?: string | undefined,
		sender: string,
		/** An object relationship */
		token: GraphQLTypes["token"],
		token_id: number,
		/** An object relationship */
		transaction: GraphQLTypes["transaction"],
		transaction_id: number
	};
	/** order by aggregate values of table "token_address_history" */
	["token_address_history_aggregate_order_by"]: {
		avg?: GraphQLTypes["token_address_history_avg_order_by"] | undefined,
		count?: GraphQLTypes["order_by"] | undefined,
		max?: GraphQLTypes["token_address_history_max_order_by"] | undefined,
		min?: GraphQLTypes["token_address_history_min_order_by"] | undefined,
		stddev?: GraphQLTypes["token_address_history_stddev_order_by"] | undefined,
		stddev_pop?: GraphQLTypes["token_address_history_stddev_pop_order_by"] | undefined,
		stddev_samp?: GraphQLTypes["token_address_history_stddev_samp_order_by"] | undefined,
		sum?: GraphQLTypes["token_address_history_sum_order_by"] | undefined,
		var_pop?: GraphQLTypes["token_address_history_var_pop_order_by"] | undefined,
		var_samp?: GraphQLTypes["token_address_history_var_samp_order_by"] | undefined,
		variance?: GraphQLTypes["token_address_history_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "token_address_history" */
	["token_address_history_avg_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "token_address_history". All fields are combined with a logical 'AND'. */
	["token_address_history_bool_exp"]: {
		_and?: Array<GraphQLTypes["token_address_history_bool_exp"]> | undefined,
		_not?: GraphQLTypes["token_address_history_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["token_address_history_bool_exp"]> | undefined,
		action?: GraphQLTypes["String_comparison_exp"] | undefined,
		amount?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		chain_id?: GraphQLTypes["String_comparison_exp"] | undefined,
		date_created?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		height?: GraphQLTypes["Int_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		receiver?: GraphQLTypes["String_comparison_exp"] | undefined,
		sender?: GraphQLTypes["String_comparison_exp"] | undefined,
		token?: GraphQLTypes["token_bool_exp"] | undefined,
		token_id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		transaction?: GraphQLTypes["transaction_bool_exp"] | undefined,
		transaction_id?: GraphQLTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "token_address_history" */
	["token_address_history_max_order_by"]: {
		action?: GraphQLTypes["order_by"] | undefined,
		amount?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		receiver?: GraphQLTypes["order_by"] | undefined,
		sender?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "token_address_history" */
	["token_address_history_min_order_by"]: {
		action?: GraphQLTypes["order_by"] | undefined,
		amount?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		receiver?: GraphQLTypes["order_by"] | undefined,
		sender?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "token_address_history". */
	["token_address_history_order_by"]: {
		action?: GraphQLTypes["order_by"] | undefined,
		amount?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		receiver?: GraphQLTypes["order_by"] | undefined,
		sender?: GraphQLTypes["order_by"] | undefined,
		token?: GraphQLTypes["token_order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction?: GraphQLTypes["transaction_order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** select columns of table "token_address_history" */
	["token_address_history_select_column"]: token_address_history_select_column;
	/** order by stddev() on columns of table "token_address_history" */
	["token_address_history_stddev_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "token_address_history" */
	["token_address_history_stddev_pop_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "token_address_history" */
	["token_address_history_stddev_samp_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "token_address_history" */
	["token_address_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["token_address_history_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["token_address_history_stream_cursor_value_input"]: {
		action?: string | undefined,
		amount?: GraphQLTypes["bigint"] | undefined,
		chain_id?: string | undefined,
		date_created?: GraphQLTypes["timestamp"] | undefined,
		height?: number | undefined,
		id?: number | undefined,
		receiver?: string | undefined,
		sender?: string | undefined,
		token_id?: number | undefined,
		transaction_id?: number | undefined
	};
	/** order by sum() on columns of table "token_address_history" */
	["token_address_history_sum_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "token_address_history" */
	["token_address_history_var_pop_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "token_address_history" */
	["token_address_history_var_samp_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "token_address_history" */
	["token_address_history_variance_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "token". All fields are combined with a logical 'AND'. */
	["token_bool_exp"]: {
		_and?: Array<GraphQLTypes["token_bool_exp"]> | undefined,
		_not?: GraphQLTypes["token_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["token_bool_exp"]> | undefined,
		chain_id?: GraphQLTypes["String_comparison_exp"] | undefined,
		circulating_supply?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		content_path?: GraphQLTypes["String_comparison_exp"] | undefined,
		content_size_bytes?: GraphQLTypes["Int_comparison_exp"] | undefined,
		creator?: GraphQLTypes["String_comparison_exp"] | undefined,
		current_owner?: GraphQLTypes["String_comparison_exp"] | undefined,
		date_created?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		decimals?: GraphQLTypes["smallint_comparison_exp"] | undefined,
		height?: GraphQLTypes["Int_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		last_price_base?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		launch_timestamp?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		marketplace_cft20_details?: GraphQLTypes["marketplace_cft20_detail_bool_exp"] | undefined,
		max_supply?: GraphQLTypes["numeric_comparison_exp"] | undefined,
		metadata?: GraphQLTypes["String_comparison_exp"] | undefined,
		mint_page?: GraphQLTypes["String_comparison_exp"] | undefined,
		name?: GraphQLTypes["String_comparison_exp"] | undefined,
		per_mint_limit?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		ticker?: GraphQLTypes["String_comparison_exp"] | undefined,
		token_address_histories?: GraphQLTypes["token_address_history_bool_exp"] | undefined,
		token_holders?: GraphQLTypes["token_holder_bool_exp"] | undefined,
		token_open_positions?: GraphQLTypes["token_open_position_bool_exp"] | undefined,
		token_trade_histories?: GraphQLTypes["token_trade_history_bool_exp"] | undefined,
		transaction?: GraphQLTypes["transaction_bool_exp"] | undefined,
		transaction_id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		version?: GraphQLTypes["String_comparison_exp"] | undefined,
		volume_24_base?: GraphQLTypes["bigint_comparison_exp"] | undefined
	};
	/** columns and relationships of "token_holder" */
	["token_holder"]: {
		__typename: "token_holder",
		address: string,
		amount: GraphQLTypes["bigint"],
		chain_id: string,
		date_updated: GraphQLTypes["timestamp"],
		id: number,
		/** An object relationship */
		token: GraphQLTypes["token"],
		token_id: number
	};
	/** order by aggregate values of table "token_holder" */
	["token_holder_aggregate_order_by"]: {
		avg?: GraphQLTypes["token_holder_avg_order_by"] | undefined,
		count?: GraphQLTypes["order_by"] | undefined,
		max?: GraphQLTypes["token_holder_max_order_by"] | undefined,
		min?: GraphQLTypes["token_holder_min_order_by"] | undefined,
		stddev?: GraphQLTypes["token_holder_stddev_order_by"] | undefined,
		stddev_pop?: GraphQLTypes["token_holder_stddev_pop_order_by"] | undefined,
		stddev_samp?: GraphQLTypes["token_holder_stddev_samp_order_by"] | undefined,
		sum?: GraphQLTypes["token_holder_sum_order_by"] | undefined,
		var_pop?: GraphQLTypes["token_holder_var_pop_order_by"] | undefined,
		var_samp?: GraphQLTypes["token_holder_var_samp_order_by"] | undefined,
		variance?: GraphQLTypes["token_holder_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "token_holder" */
	["token_holder_avg_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "token_holder". All fields are combined with a logical 'AND'. */
	["token_holder_bool_exp"]: {
		_and?: Array<GraphQLTypes["token_holder_bool_exp"]> | undefined,
		_not?: GraphQLTypes["token_holder_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["token_holder_bool_exp"]> | undefined,
		address?: GraphQLTypes["String_comparison_exp"] | undefined,
		amount?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		chain_id?: GraphQLTypes["String_comparison_exp"] | undefined,
		date_updated?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		token?: GraphQLTypes["token_bool_exp"] | undefined,
		token_id?: GraphQLTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "token_holder" */
	["token_holder_max_order_by"]: {
		address?: GraphQLTypes["order_by"] | undefined,
		amount?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_updated?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "token_holder" */
	["token_holder_min_order_by"]: {
		address?: GraphQLTypes["order_by"] | undefined,
		amount?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_updated?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "token_holder". */
	["token_holder_order_by"]: {
		address?: GraphQLTypes["order_by"] | undefined,
		amount?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_updated?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token?: GraphQLTypes["token_order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** select columns of table "token_holder" */
	["token_holder_select_column"]: token_holder_select_column;
	/** order by stddev() on columns of table "token_holder" */
	["token_holder_stddev_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "token_holder" */
	["token_holder_stddev_pop_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "token_holder" */
	["token_holder_stddev_samp_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "token_holder" */
	["token_holder_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["token_holder_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["token_holder_stream_cursor_value_input"]: {
		address?: string | undefined,
		amount?: GraphQLTypes["bigint"] | undefined,
		chain_id?: string | undefined,
		date_updated?: GraphQLTypes["timestamp"] | undefined,
		id?: number | undefined,
		token_id?: number | undefined
	};
	/** order by sum() on columns of table "token_holder" */
	["token_holder_sum_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "token_holder" */
	["token_holder_var_pop_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "token_holder" */
	["token_holder_var_samp_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "token_holder" */
	["token_holder_variance_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined
	};
	/** columns and relationships of "token_open_position" */
	["token_open_position"]: {
		__typename: "token_open_position",
		amount: GraphQLTypes["bigint"],
		chain_id: string,
		date_created: GraphQLTypes["timestamp"],
		date_filled?: GraphQLTypes["timestamp"] | undefined,
		id: number,
		is_cancelled: boolean,
		is_filled: boolean,
		is_reserved: boolean,
		ppt: GraphQLTypes["bigint"],
		reserve_expires_block?: number | undefined,
		reserved_by?: string | undefined,
		seller_address: string,
		/** An object relationship */
		token: GraphQLTypes["token"],
		token_id: number,
		total: GraphQLTypes["bigint"],
		/** An object relationship */
		transaction: GraphQLTypes["transaction"],
		transaction_id: number
	};
	/** order by aggregate values of table "token_open_position" */
	["token_open_position_aggregate_order_by"]: {
		avg?: GraphQLTypes["token_open_position_avg_order_by"] | undefined,
		count?: GraphQLTypes["order_by"] | undefined,
		max?: GraphQLTypes["token_open_position_max_order_by"] | undefined,
		min?: GraphQLTypes["token_open_position_min_order_by"] | undefined,
		stddev?: GraphQLTypes["token_open_position_stddev_order_by"] | undefined,
		stddev_pop?: GraphQLTypes["token_open_position_stddev_pop_order_by"] | undefined,
		stddev_samp?: GraphQLTypes["token_open_position_stddev_samp_order_by"] | undefined,
		sum?: GraphQLTypes["token_open_position_sum_order_by"] | undefined,
		var_pop?: GraphQLTypes["token_open_position_var_pop_order_by"] | undefined,
		var_samp?: GraphQLTypes["token_open_position_var_samp_order_by"] | undefined,
		variance?: GraphQLTypes["token_open_position_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "token_open_position" */
	["token_open_position_avg_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "token_open_position". All fields are combined with a logical 'AND'. */
	["token_open_position_bool_exp"]: {
		_and?: Array<GraphQLTypes["token_open_position_bool_exp"]> | undefined,
		_not?: GraphQLTypes["token_open_position_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["token_open_position_bool_exp"]> | undefined,
		amount?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		chain_id?: GraphQLTypes["String_comparison_exp"] | undefined,
		date_created?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		date_filled?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		is_cancelled?: GraphQLTypes["Boolean_comparison_exp"] | undefined,
		is_filled?: GraphQLTypes["Boolean_comparison_exp"] | undefined,
		is_reserved?: GraphQLTypes["Boolean_comparison_exp"] | undefined,
		ppt?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		reserve_expires_block?: GraphQLTypes["Int_comparison_exp"] | undefined,
		reserved_by?: GraphQLTypes["String_comparison_exp"] | undefined,
		seller_address?: GraphQLTypes["String_comparison_exp"] | undefined,
		token?: GraphQLTypes["token_bool_exp"] | undefined,
		token_id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		total?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		transaction?: GraphQLTypes["transaction_bool_exp"] | undefined,
		transaction_id?: GraphQLTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "token_open_position" */
	["token_open_position_max_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		date_filled?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		reserved_by?: GraphQLTypes["order_by"] | undefined,
		seller_address?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "token_open_position" */
	["token_open_position_min_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		date_filled?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		reserved_by?: GraphQLTypes["order_by"] | undefined,
		seller_address?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "token_open_position". */
	["token_open_position_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		date_filled?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		is_cancelled?: GraphQLTypes["order_by"] | undefined,
		is_filled?: GraphQLTypes["order_by"] | undefined,
		is_reserved?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		reserved_by?: GraphQLTypes["order_by"] | undefined,
		seller_address?: GraphQLTypes["order_by"] | undefined,
		token?: GraphQLTypes["token_order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction?: GraphQLTypes["transaction_order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** select columns of table "token_open_position" */
	["token_open_position_select_column"]: token_open_position_select_column;
	/** order by stddev() on columns of table "token_open_position" */
	["token_open_position_stddev_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "token_open_position" */
	["token_open_position_stddev_pop_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "token_open_position" */
	["token_open_position_stddev_samp_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "token_open_position" */
	["token_open_position_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["token_open_position_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["token_open_position_stream_cursor_value_input"]: {
		amount?: GraphQLTypes["bigint"] | undefined,
		chain_id?: string | undefined,
		date_created?: GraphQLTypes["timestamp"] | undefined,
		date_filled?: GraphQLTypes["timestamp"] | undefined,
		id?: number | undefined,
		is_cancelled?: boolean | undefined,
		is_filled?: boolean | undefined,
		is_reserved?: boolean | undefined,
		ppt?: GraphQLTypes["bigint"] | undefined,
		reserve_expires_block?: number | undefined,
		reserved_by?: string | undefined,
		seller_address?: string | undefined,
		token_id?: number | undefined,
		total?: GraphQLTypes["bigint"] | undefined,
		transaction_id?: number | undefined
	};
	/** order by sum() on columns of table "token_open_position" */
	["token_open_position_sum_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "token_open_position" */
	["token_open_position_var_pop_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "token_open_position" */
	["token_open_position_var_samp_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "token_open_position" */
	["token_open_position_variance_order_by"]: {
		amount?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		ppt?: GraphQLTypes["order_by"] | undefined,
		reserve_expires_block?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "token". */
	["token_order_by"]: {
		chain_id?: GraphQLTypes["order_by"] | undefined,
		circulating_supply?: GraphQLTypes["order_by"] | undefined,
		content_path?: GraphQLTypes["order_by"] | undefined,
		content_size_bytes?: GraphQLTypes["order_by"] | undefined,
		creator?: GraphQLTypes["order_by"] | undefined,
		current_owner?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		decimals?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		last_price_base?: GraphQLTypes["order_by"] | undefined,
		launch_timestamp?: GraphQLTypes["order_by"] | undefined,
		marketplace_cft20_details_aggregate?: GraphQLTypes["marketplace_cft20_detail_aggregate_order_by"] | undefined,
		max_supply?: GraphQLTypes["order_by"] | undefined,
		metadata?: GraphQLTypes["order_by"] | undefined,
		mint_page?: GraphQLTypes["order_by"] | undefined,
		name?: GraphQLTypes["order_by"] | undefined,
		per_mint_limit?: GraphQLTypes["order_by"] | undefined,
		ticker?: GraphQLTypes["order_by"] | undefined,
		token_address_histories_aggregate?: GraphQLTypes["token_address_history_aggregate_order_by"] | undefined,
		token_holders_aggregate?: GraphQLTypes["token_holder_aggregate_order_by"] | undefined,
		token_open_positions_aggregate?: GraphQLTypes["token_open_position_aggregate_order_by"] | undefined,
		token_trade_histories_aggregate?: GraphQLTypes["token_trade_history_aggregate_order_by"] | undefined,
		transaction?: GraphQLTypes["transaction_order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined,
		version?: GraphQLTypes["order_by"] | undefined,
		volume_24_base?: GraphQLTypes["order_by"] | undefined
	};
	/** select columns of table "token" */
	["token_select_column"]: token_select_column;
	/** Streaming cursor of the table "token" */
	["token_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["token_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["token_stream_cursor_value_input"]: {
		chain_id?: string | undefined,
		circulating_supply?: GraphQLTypes["bigint"] | undefined,
		content_path?: string | undefined,
		content_size_bytes?: number | undefined,
		creator?: string | undefined,
		current_owner?: string | undefined,
		date_created?: GraphQLTypes["timestamp"] | undefined,
		decimals?: GraphQLTypes["smallint"] | undefined,
		height?: number | undefined,
		id?: number | undefined,
		last_price_base?: GraphQLTypes["bigint"] | undefined,
		launch_timestamp?: GraphQLTypes["bigint"] | undefined,
		max_supply?: GraphQLTypes["numeric"] | undefined,
		metadata?: string | undefined,
		mint_page?: string | undefined,
		name?: string | undefined,
		per_mint_limit?: GraphQLTypes["bigint"] | undefined,
		ticker?: string | undefined,
		transaction_id?: number | undefined,
		version?: string | undefined,
		volume_24_base?: GraphQLTypes["bigint"] | undefined
	};
	/** columns and relationships of "token_trade_history" */
	["token_trade_history"]: {
		__typename: "token_trade_history",
		amount_base: GraphQLTypes["bigint"],
		amount_quote: GraphQLTypes["bigint"],
		buyer_address?: string | undefined,
		chain_id: string,
		date_created: GraphQLTypes["timestamp"],
		id: number,
		rate: GraphQLTypes["bigint"],
		seller_address: string,
		/** An object relationship */
		token: GraphQLTypes["token"],
		token_id: number,
		total_usd: number,
		/** An object relationship */
		transaction: GraphQLTypes["transaction"],
		transaction_id: number
	};
	/** order by aggregate values of table "token_trade_history" */
	["token_trade_history_aggregate_order_by"]: {
		avg?: GraphQLTypes["token_trade_history_avg_order_by"] | undefined,
		count?: GraphQLTypes["order_by"] | undefined,
		max?: GraphQLTypes["token_trade_history_max_order_by"] | undefined,
		min?: GraphQLTypes["token_trade_history_min_order_by"] | undefined,
		stddev?: GraphQLTypes["token_trade_history_stddev_order_by"] | undefined,
		stddev_pop?: GraphQLTypes["token_trade_history_stddev_pop_order_by"] | undefined,
		stddev_samp?: GraphQLTypes["token_trade_history_stddev_samp_order_by"] | undefined,
		sum?: GraphQLTypes["token_trade_history_sum_order_by"] | undefined,
		var_pop?: GraphQLTypes["token_trade_history_var_pop_order_by"] | undefined,
		var_samp?: GraphQLTypes["token_trade_history_var_samp_order_by"] | undefined,
		variance?: GraphQLTypes["token_trade_history_variance_order_by"] | undefined
	};
	/** order by avg() on columns of table "token_trade_history" */
	["token_trade_history_avg_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Boolean expression to filter rows from the table "token_trade_history". All fields are combined with a logical 'AND'. */
	["token_trade_history_bool_exp"]: {
		_and?: Array<GraphQLTypes["token_trade_history_bool_exp"]> | undefined,
		_not?: GraphQLTypes["token_trade_history_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["token_trade_history_bool_exp"]> | undefined,
		amount_base?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		amount_quote?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		buyer_address?: GraphQLTypes["String_comparison_exp"] | undefined,
		chain_id?: GraphQLTypes["String_comparison_exp"] | undefined,
		date_created?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		rate?: GraphQLTypes["bigint_comparison_exp"] | undefined,
		seller_address?: GraphQLTypes["String_comparison_exp"] | undefined,
		token?: GraphQLTypes["token_bool_exp"] | undefined,
		token_id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		total_usd?: GraphQLTypes["Float_comparison_exp"] | undefined,
		transaction?: GraphQLTypes["transaction_bool_exp"] | undefined,
		transaction_id?: GraphQLTypes["Int_comparison_exp"] | undefined
	};
	/** order by max() on columns of table "token_trade_history" */
	["token_trade_history_max_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		buyer_address?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		seller_address?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by min() on columns of table "token_trade_history" */
	["token_trade_history_min_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		buyer_address?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		seller_address?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Ordering options when selecting data from "token_trade_history". */
	["token_trade_history_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		buyer_address?: GraphQLTypes["order_by"] | undefined,
		chain_id?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		seller_address?: GraphQLTypes["order_by"] | undefined,
		token?: GraphQLTypes["token_order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction?: GraphQLTypes["transaction_order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** select columns of table "token_trade_history" */
	["token_trade_history_select_column"]: token_trade_history_select_column;
	/** order by stddev() on columns of table "token_trade_history" */
	["token_trade_history_stddev_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_pop() on columns of table "token_trade_history" */
	["token_trade_history_stddev_pop_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by stddev_samp() on columns of table "token_trade_history" */
	["token_trade_history_stddev_samp_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** Streaming cursor of the table "token_trade_history" */
	["token_trade_history_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["token_trade_history_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["token_trade_history_stream_cursor_value_input"]: {
		amount_base?: GraphQLTypes["bigint"] | undefined,
		amount_quote?: GraphQLTypes["bigint"] | undefined,
		buyer_address?: string | undefined,
		chain_id?: string | undefined,
		date_created?: GraphQLTypes["timestamp"] | undefined,
		id?: number | undefined,
		rate?: GraphQLTypes["bigint"] | undefined,
		seller_address?: string | undefined,
		token_id?: number | undefined,
		total_usd?: number | undefined,
		transaction_id?: number | undefined
	};
	/** order by sum() on columns of table "token_trade_history" */
	["token_trade_history_sum_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_pop() on columns of table "token_trade_history" */
	["token_trade_history_var_pop_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by var_samp() on columns of table "token_trade_history" */
	["token_trade_history_var_samp_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** order by variance() on columns of table "token_trade_history" */
	["token_trade_history_variance_order_by"]: {
		amount_base?: GraphQLTypes["order_by"] | undefined,
		amount_quote?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		rate?: GraphQLTypes["order_by"] | undefined,
		token_id?: GraphQLTypes["order_by"] | undefined,
		total_usd?: GraphQLTypes["order_by"] | undefined,
		transaction_id?: GraphQLTypes["order_by"] | undefined
	};
	/** columns and relationships of "transaction" */
	["transaction"]: {
		__typename: "transaction",
		content: string,
		content_length: number,
		date_created: GraphQLTypes["timestamp"],
		fees: string,
		gas_used: number,
		hash: string,
		height: number,
		id: number,
		/** An object relationship */
		inscription?: GraphQLTypes["inscription"] | undefined,
		/** An object relationship */
		inscription_history?: GraphQLTypes["inscription_history"] | undefined,
		/** An array relationship */
		marketplace_listings: Array<GraphQLTypes["marketplace_listing"]>,
		status_message?: string | undefined,
		/** An object relationship */
		token?: GraphQLTypes["token"] | undefined,
		/** An object relationship */
		token_address_history?: GraphQLTypes["token_address_history"] | undefined,
		/** An array relationship */
		token_open_positions: Array<GraphQLTypes["token_open_position"]>,
		/** An object relationship */
		token_trade_history?: GraphQLTypes["token_trade_history"] | undefined
	};
	/** Boolean expression to filter rows from the table "transaction". All fields are combined with a logical 'AND'. */
	["transaction_bool_exp"]: {
		_and?: Array<GraphQLTypes["transaction_bool_exp"]> | undefined,
		_not?: GraphQLTypes["transaction_bool_exp"] | undefined,
		_or?: Array<GraphQLTypes["transaction_bool_exp"]> | undefined,
		content?: GraphQLTypes["String_comparison_exp"] | undefined,
		content_length?: GraphQLTypes["Int_comparison_exp"] | undefined,
		date_created?: GraphQLTypes["timestamp_comparison_exp"] | undefined,
		fees?: GraphQLTypes["String_comparison_exp"] | undefined,
		gas_used?: GraphQLTypes["Int_comparison_exp"] | undefined,
		hash?: GraphQLTypes["String_comparison_exp"] | undefined,
		height?: GraphQLTypes["Int_comparison_exp"] | undefined,
		id?: GraphQLTypes["Int_comparison_exp"] | undefined,
		inscription?: GraphQLTypes["inscription_bool_exp"] | undefined,
		inscription_history?: GraphQLTypes["inscription_history_bool_exp"] | undefined,
		marketplace_listings?: GraphQLTypes["marketplace_listing_bool_exp"] | undefined,
		status_message?: GraphQLTypes["String_comparison_exp"] | undefined,
		token?: GraphQLTypes["token_bool_exp"] | undefined,
		token_address_history?: GraphQLTypes["token_address_history_bool_exp"] | undefined,
		token_open_positions?: GraphQLTypes["token_open_position_bool_exp"] | undefined,
		token_trade_history?: GraphQLTypes["token_trade_history_bool_exp"] | undefined
	};
	/** Ordering options when selecting data from "transaction". */
	["transaction_order_by"]: {
		content?: GraphQLTypes["order_by"] | undefined,
		content_length?: GraphQLTypes["order_by"] | undefined,
		date_created?: GraphQLTypes["order_by"] | undefined,
		fees?: GraphQLTypes["order_by"] | undefined,
		gas_used?: GraphQLTypes["order_by"] | undefined,
		hash?: GraphQLTypes["order_by"] | undefined,
		height?: GraphQLTypes["order_by"] | undefined,
		id?: GraphQLTypes["order_by"] | undefined,
		inscription?: GraphQLTypes["inscription_order_by"] | undefined,
		inscription_history?: GraphQLTypes["inscription_history_order_by"] | undefined,
		marketplace_listings_aggregate?: GraphQLTypes["marketplace_listing_aggregate_order_by"] | undefined,
		status_message?: GraphQLTypes["order_by"] | undefined,
		token?: GraphQLTypes["token_order_by"] | undefined,
		token_address_history?: GraphQLTypes["token_address_history_order_by"] | undefined,
		token_open_positions_aggregate?: GraphQLTypes["token_open_position_aggregate_order_by"] | undefined,
		token_trade_history?: GraphQLTypes["token_trade_history_order_by"] | undefined
	};
	/** select columns of table "transaction" */
	["transaction_select_column"]: transaction_select_column;
	/** Streaming cursor of the table "transaction" */
	["transaction_stream_cursor_input"]: {
		/** Stream column input with initial value */
		initial_value: GraphQLTypes["transaction_stream_cursor_value_input"],
		/** cursor ordering */
		ordering?: GraphQLTypes["cursor_ordering"] | undefined
	};
	/** Initial value of the column from where the streaming should start */
	["transaction_stream_cursor_value_input"]: {
		content?: string | undefined,
		content_length?: number | undefined,
		date_created?: GraphQLTypes["timestamp"] | undefined,
		fees?: string | undefined,
		gas_used?: number | undefined,
		hash?: string | undefined,
		height?: number | undefined,
		id?: number | undefined,
		status_message?: string | undefined
	}
}
/** ordering argument of a cursor */
export const enum cursor_ordering {
	ASC = "ASC",
	DESC = "DESC"
}
/** select columns of table "inscription_history" */
export const enum inscription_history_select_column {
	action = "action",
	chain_id = "chain_id",
	date_created = "date_created",
	height = "height",
	id = "id",
	inscription_id = "inscription_id",
	receiver = "receiver",
	sender = "sender",
	transaction_id = "transaction_id"
}
/** select columns of table "inscription" */
export const enum inscription_select_column {
	chain_id = "chain_id",
	content_hash = "content_hash",
	content_path = "content_path",
	content_size_bytes = "content_size_bytes",
	creator = "creator",
	current_owner = "current_owner",
	date_created = "date_created",
	height = "height",
	id = "id",
	is_explicit = "is_explicit",
	metadata = "metadata",
	transaction_id = "transaction_id",
	type = "type",
	version = "version"
}
/** select columns of table "marketplace_cft20_detail" */
export const enum marketplace_cft20_detail_select_column {
	amount = "amount",
	date_created = "date_created",
	id = "id",
	listing_id = "listing_id",
	ppt = "ppt",
	token_id = "token_id"
}
/** select columns of table "marketplace_listing" */
export const enum marketplace_listing_select_column {
	chain_id = "chain_id",
	date_created = "date_created",
	date_updated = "date_updated",
	deposit_timeout = "deposit_timeout",
	deposit_total = "deposit_total",
	depositor_address = "depositor_address",
	depositor_timedout_block = "depositor_timedout_block",
	id = "id",
	is_cancelled = "is_cancelled",
	is_deposited = "is_deposited",
	is_filled = "is_filled",
	seller_address = "seller_address",
	total = "total",
	transaction_id = "transaction_id"
}
/** column ordering options */
export const enum order_by {
	asc = "asc",
	asc_nulls_first = "asc_nulls_first",
	asc_nulls_last = "asc_nulls_last",
	desc = "desc",
	desc_nulls_first = "desc_nulls_first",
	desc_nulls_last = "desc_nulls_last"
}
/** select columns of table "status" */
export const enum status_select_column {
	base_token = "base_token",
	base_token_usd = "base_token_usd",
	chain_id = "chain_id",
	date_updated = "date_updated",
	id = "id",
	last_known_height = "last_known_height",
	last_processed_height = "last_processed_height"
}
/** select columns of table "token_address_history" */
export const enum token_address_history_select_column {
	action = "action",
	amount = "amount",
	chain_id = "chain_id",
	date_created = "date_created",
	height = "height",
	id = "id",
	receiver = "receiver",
	sender = "sender",
	token_id = "token_id",
	transaction_id = "transaction_id"
}
/** select columns of table "token_holder" */
export const enum token_holder_select_column {
	address = "address",
	amount = "amount",
	chain_id = "chain_id",
	date_updated = "date_updated",
	id = "id",
	token_id = "token_id"
}
/** select columns of table "token_open_position" */
export const enum token_open_position_select_column {
	amount = "amount",
	chain_id = "chain_id",
	date_created = "date_created",
	date_filled = "date_filled",
	id = "id",
	is_cancelled = "is_cancelled",
	is_filled = "is_filled",
	is_reserved = "is_reserved",
	ppt = "ppt",
	reserve_expires_block = "reserve_expires_block",
	reserved_by = "reserved_by",
	seller_address = "seller_address",
	token_id = "token_id",
	total = "total",
	transaction_id = "transaction_id"
}
/** select columns of table "token" */
export const enum token_select_column {
	chain_id = "chain_id",
	circulating_supply = "circulating_supply",
	content_path = "content_path",
	content_size_bytes = "content_size_bytes",
	creator = "creator",
	current_owner = "current_owner",
	date_created = "date_created",
	decimals = "decimals",
	height = "height",
	id = "id",
	last_price_base = "last_price_base",
	launch_timestamp = "launch_timestamp",
	max_supply = "max_supply",
	metadata = "metadata",
	mint_page = "mint_page",
	name = "name",
	per_mint_limit = "per_mint_limit",
	ticker = "ticker",
	transaction_id = "transaction_id",
	version = "version",
	volume_24_base = "volume_24_base"
}
/** select columns of table "token_trade_history" */
export const enum token_trade_history_select_column {
	amount_base = "amount_base",
	amount_quote = "amount_quote",
	buyer_address = "buyer_address",
	chain_id = "chain_id",
	date_created = "date_created",
	id = "id",
	rate = "rate",
	seller_address = "seller_address",
	token_id = "token_id",
	total_usd = "total_usd",
	transaction_id = "transaction_id"
}
/** select columns of table "transaction" */
export const enum transaction_select_column {
	content = "content",
	content_length = "content_length",
	date_created = "date_created",
	fees = "fees",
	gas_used = "gas_used",
	hash = "hash",
	height = "height",
	id = "id",
	status_message = "status_message"
}

type ZEUS_VARIABLES = {
	["Boolean_comparison_exp"]: ValueTypes["Boolean_comparison_exp"];
	["Float_comparison_exp"]: ValueTypes["Float_comparison_exp"];
	["Int_comparison_exp"]: ValueTypes["Int_comparison_exp"];
	["String_comparison_exp"]: ValueTypes["String_comparison_exp"];
	["bigint"]: ValueTypes["bigint"];
	["bigint_comparison_exp"]: ValueTypes["bigint_comparison_exp"];
	["cursor_ordering"]: ValueTypes["cursor_ordering"];
	["inscription_bool_exp"]: ValueTypes["inscription_bool_exp"];
	["inscription_history_aggregate_order_by"]: ValueTypes["inscription_history_aggregate_order_by"];
	["inscription_history_avg_order_by"]: ValueTypes["inscription_history_avg_order_by"];
	["inscription_history_bool_exp"]: ValueTypes["inscription_history_bool_exp"];
	["inscription_history_max_order_by"]: ValueTypes["inscription_history_max_order_by"];
	["inscription_history_min_order_by"]: ValueTypes["inscription_history_min_order_by"];
	["inscription_history_order_by"]: ValueTypes["inscription_history_order_by"];
	["inscription_history_select_column"]: ValueTypes["inscription_history_select_column"];
	["inscription_history_stddev_order_by"]: ValueTypes["inscription_history_stddev_order_by"];
	["inscription_history_stddev_pop_order_by"]: ValueTypes["inscription_history_stddev_pop_order_by"];
	["inscription_history_stddev_samp_order_by"]: ValueTypes["inscription_history_stddev_samp_order_by"];
	["inscription_history_stream_cursor_input"]: ValueTypes["inscription_history_stream_cursor_input"];
	["inscription_history_stream_cursor_value_input"]: ValueTypes["inscription_history_stream_cursor_value_input"];
	["inscription_history_sum_order_by"]: ValueTypes["inscription_history_sum_order_by"];
	["inscription_history_var_pop_order_by"]: ValueTypes["inscription_history_var_pop_order_by"];
	["inscription_history_var_samp_order_by"]: ValueTypes["inscription_history_var_samp_order_by"];
	["inscription_history_variance_order_by"]: ValueTypes["inscription_history_variance_order_by"];
	["inscription_order_by"]: ValueTypes["inscription_order_by"];
	["inscription_select_column"]: ValueTypes["inscription_select_column"];
	["inscription_stream_cursor_input"]: ValueTypes["inscription_stream_cursor_input"];
	["inscription_stream_cursor_value_input"]: ValueTypes["inscription_stream_cursor_value_input"];
	["json"]: ValueTypes["json"];
	["json_comparison_exp"]: ValueTypes["json_comparison_exp"];
	["marketplace_cft20_detail_aggregate_order_by"]: ValueTypes["marketplace_cft20_detail_aggregate_order_by"];
	["marketplace_cft20_detail_avg_order_by"]: ValueTypes["marketplace_cft20_detail_avg_order_by"];
	["marketplace_cft20_detail_bool_exp"]: ValueTypes["marketplace_cft20_detail_bool_exp"];
	["marketplace_cft20_detail_max_order_by"]: ValueTypes["marketplace_cft20_detail_max_order_by"];
	["marketplace_cft20_detail_min_order_by"]: ValueTypes["marketplace_cft20_detail_min_order_by"];
	["marketplace_cft20_detail_order_by"]: ValueTypes["marketplace_cft20_detail_order_by"];
	["marketplace_cft20_detail_select_column"]: ValueTypes["marketplace_cft20_detail_select_column"];
	["marketplace_cft20_detail_stddev_order_by"]: ValueTypes["marketplace_cft20_detail_stddev_order_by"];
	["marketplace_cft20_detail_stddev_pop_order_by"]: ValueTypes["marketplace_cft20_detail_stddev_pop_order_by"];
	["marketplace_cft20_detail_stddev_samp_order_by"]: ValueTypes["marketplace_cft20_detail_stddev_samp_order_by"];
	["marketplace_cft20_detail_stream_cursor_input"]: ValueTypes["marketplace_cft20_detail_stream_cursor_input"];
	["marketplace_cft20_detail_stream_cursor_value_input"]: ValueTypes["marketplace_cft20_detail_stream_cursor_value_input"];
	["marketplace_cft20_detail_sum_order_by"]: ValueTypes["marketplace_cft20_detail_sum_order_by"];
	["marketplace_cft20_detail_var_pop_order_by"]: ValueTypes["marketplace_cft20_detail_var_pop_order_by"];
	["marketplace_cft20_detail_var_samp_order_by"]: ValueTypes["marketplace_cft20_detail_var_samp_order_by"];
	["marketplace_cft20_detail_variance_order_by"]: ValueTypes["marketplace_cft20_detail_variance_order_by"];
	["marketplace_listing_aggregate_order_by"]: ValueTypes["marketplace_listing_aggregate_order_by"];
	["marketplace_listing_avg_order_by"]: ValueTypes["marketplace_listing_avg_order_by"];
	["marketplace_listing_bool_exp"]: ValueTypes["marketplace_listing_bool_exp"];
	["marketplace_listing_max_order_by"]: ValueTypes["marketplace_listing_max_order_by"];
	["marketplace_listing_min_order_by"]: ValueTypes["marketplace_listing_min_order_by"];
	["marketplace_listing_order_by"]: ValueTypes["marketplace_listing_order_by"];
	["marketplace_listing_select_column"]: ValueTypes["marketplace_listing_select_column"];
	["marketplace_listing_stddev_order_by"]: ValueTypes["marketplace_listing_stddev_order_by"];
	["marketplace_listing_stddev_pop_order_by"]: ValueTypes["marketplace_listing_stddev_pop_order_by"];
	["marketplace_listing_stddev_samp_order_by"]: ValueTypes["marketplace_listing_stddev_samp_order_by"];
	["marketplace_listing_stream_cursor_input"]: ValueTypes["marketplace_listing_stream_cursor_input"];
	["marketplace_listing_stream_cursor_value_input"]: ValueTypes["marketplace_listing_stream_cursor_value_input"];
	["marketplace_listing_sum_order_by"]: ValueTypes["marketplace_listing_sum_order_by"];
	["marketplace_listing_var_pop_order_by"]: ValueTypes["marketplace_listing_var_pop_order_by"];
	["marketplace_listing_var_samp_order_by"]: ValueTypes["marketplace_listing_var_samp_order_by"];
	["marketplace_listing_variance_order_by"]: ValueTypes["marketplace_listing_variance_order_by"];
	["numeric"]: ValueTypes["numeric"];
	["numeric_comparison_exp"]: ValueTypes["numeric_comparison_exp"];
	["order_by"]: ValueTypes["order_by"];
	["smallint"]: ValueTypes["smallint"];
	["smallint_comparison_exp"]: ValueTypes["smallint_comparison_exp"];
	["status_bool_exp"]: ValueTypes["status_bool_exp"];
	["status_order_by"]: ValueTypes["status_order_by"];
	["status_select_column"]: ValueTypes["status_select_column"];
	["status_stream_cursor_input"]: ValueTypes["status_stream_cursor_input"];
	["status_stream_cursor_value_input"]: ValueTypes["status_stream_cursor_value_input"];
	["timestamp"]: ValueTypes["timestamp"];
	["timestamp_comparison_exp"]: ValueTypes["timestamp_comparison_exp"];
	["token_address_history_aggregate_order_by"]: ValueTypes["token_address_history_aggregate_order_by"];
	["token_address_history_avg_order_by"]: ValueTypes["token_address_history_avg_order_by"];
	["token_address_history_bool_exp"]: ValueTypes["token_address_history_bool_exp"];
	["token_address_history_max_order_by"]: ValueTypes["token_address_history_max_order_by"];
	["token_address_history_min_order_by"]: ValueTypes["token_address_history_min_order_by"];
	["token_address_history_order_by"]: ValueTypes["token_address_history_order_by"];
	["token_address_history_select_column"]: ValueTypes["token_address_history_select_column"];
	["token_address_history_stddev_order_by"]: ValueTypes["token_address_history_stddev_order_by"];
	["token_address_history_stddev_pop_order_by"]: ValueTypes["token_address_history_stddev_pop_order_by"];
	["token_address_history_stddev_samp_order_by"]: ValueTypes["token_address_history_stddev_samp_order_by"];
	["token_address_history_stream_cursor_input"]: ValueTypes["token_address_history_stream_cursor_input"];
	["token_address_history_stream_cursor_value_input"]: ValueTypes["token_address_history_stream_cursor_value_input"];
	["token_address_history_sum_order_by"]: ValueTypes["token_address_history_sum_order_by"];
	["token_address_history_var_pop_order_by"]: ValueTypes["token_address_history_var_pop_order_by"];
	["token_address_history_var_samp_order_by"]: ValueTypes["token_address_history_var_samp_order_by"];
	["token_address_history_variance_order_by"]: ValueTypes["token_address_history_variance_order_by"];
	["token_bool_exp"]: ValueTypes["token_bool_exp"];
	["token_holder_aggregate_order_by"]: ValueTypes["token_holder_aggregate_order_by"];
	["token_holder_avg_order_by"]: ValueTypes["token_holder_avg_order_by"];
	["token_holder_bool_exp"]: ValueTypes["token_holder_bool_exp"];
	["token_holder_max_order_by"]: ValueTypes["token_holder_max_order_by"];
	["token_holder_min_order_by"]: ValueTypes["token_holder_min_order_by"];
	["token_holder_order_by"]: ValueTypes["token_holder_order_by"];
	["token_holder_select_column"]: ValueTypes["token_holder_select_column"];
	["token_holder_stddev_order_by"]: ValueTypes["token_holder_stddev_order_by"];
	["token_holder_stddev_pop_order_by"]: ValueTypes["token_holder_stddev_pop_order_by"];
	["token_holder_stddev_samp_order_by"]: ValueTypes["token_holder_stddev_samp_order_by"];
	["token_holder_stream_cursor_input"]: ValueTypes["token_holder_stream_cursor_input"];
	["token_holder_stream_cursor_value_input"]: ValueTypes["token_holder_stream_cursor_value_input"];
	["token_holder_sum_order_by"]: ValueTypes["token_holder_sum_order_by"];
	["token_holder_var_pop_order_by"]: ValueTypes["token_holder_var_pop_order_by"];
	["token_holder_var_samp_order_by"]: ValueTypes["token_holder_var_samp_order_by"];
	["token_holder_variance_order_by"]: ValueTypes["token_holder_variance_order_by"];
	["token_open_position_aggregate_order_by"]: ValueTypes["token_open_position_aggregate_order_by"];
	["token_open_position_avg_order_by"]: ValueTypes["token_open_position_avg_order_by"];
	["token_open_position_bool_exp"]: ValueTypes["token_open_position_bool_exp"];
	["token_open_position_max_order_by"]: ValueTypes["token_open_position_max_order_by"];
	["token_open_position_min_order_by"]: ValueTypes["token_open_position_min_order_by"];
	["token_open_position_order_by"]: ValueTypes["token_open_position_order_by"];
	["token_open_position_select_column"]: ValueTypes["token_open_position_select_column"];
	["token_open_position_stddev_order_by"]: ValueTypes["token_open_position_stddev_order_by"];
	["token_open_position_stddev_pop_order_by"]: ValueTypes["token_open_position_stddev_pop_order_by"];
	["token_open_position_stddev_samp_order_by"]: ValueTypes["token_open_position_stddev_samp_order_by"];
	["token_open_position_stream_cursor_input"]: ValueTypes["token_open_position_stream_cursor_input"];
	["token_open_position_stream_cursor_value_input"]: ValueTypes["token_open_position_stream_cursor_value_input"];
	["token_open_position_sum_order_by"]: ValueTypes["token_open_position_sum_order_by"];
	["token_open_position_var_pop_order_by"]: ValueTypes["token_open_position_var_pop_order_by"];
	["token_open_position_var_samp_order_by"]: ValueTypes["token_open_position_var_samp_order_by"];
	["token_open_position_variance_order_by"]: ValueTypes["token_open_position_variance_order_by"];
	["token_order_by"]: ValueTypes["token_order_by"];
	["token_select_column"]: ValueTypes["token_select_column"];
	["token_stream_cursor_input"]: ValueTypes["token_stream_cursor_input"];
	["token_stream_cursor_value_input"]: ValueTypes["token_stream_cursor_value_input"];
	["token_trade_history_aggregate_order_by"]: ValueTypes["token_trade_history_aggregate_order_by"];
	["token_trade_history_avg_order_by"]: ValueTypes["token_trade_history_avg_order_by"];
	["token_trade_history_bool_exp"]: ValueTypes["token_trade_history_bool_exp"];
	["token_trade_history_max_order_by"]: ValueTypes["token_trade_history_max_order_by"];
	["token_trade_history_min_order_by"]: ValueTypes["token_trade_history_min_order_by"];
	["token_trade_history_order_by"]: ValueTypes["token_trade_history_order_by"];
	["token_trade_history_select_column"]: ValueTypes["token_trade_history_select_column"];
	["token_trade_history_stddev_order_by"]: ValueTypes["token_trade_history_stddev_order_by"];
	["token_trade_history_stddev_pop_order_by"]: ValueTypes["token_trade_history_stddev_pop_order_by"];
	["token_trade_history_stddev_samp_order_by"]: ValueTypes["token_trade_history_stddev_samp_order_by"];
	["token_trade_history_stream_cursor_input"]: ValueTypes["token_trade_history_stream_cursor_input"];
	["token_trade_history_stream_cursor_value_input"]: ValueTypes["token_trade_history_stream_cursor_value_input"];
	["token_trade_history_sum_order_by"]: ValueTypes["token_trade_history_sum_order_by"];
	["token_trade_history_var_pop_order_by"]: ValueTypes["token_trade_history_var_pop_order_by"];
	["token_trade_history_var_samp_order_by"]: ValueTypes["token_trade_history_var_samp_order_by"];
	["token_trade_history_variance_order_by"]: ValueTypes["token_trade_history_variance_order_by"];
	["transaction_bool_exp"]: ValueTypes["transaction_bool_exp"];
	["transaction_order_by"]: ValueTypes["transaction_order_by"];
	["transaction_select_column"]: ValueTypes["transaction_select_column"];
	["transaction_stream_cursor_input"]: ValueTypes["transaction_stream_cursor_input"];
	["transaction_stream_cursor_value_input"]: ValueTypes["transaction_stream_cursor_value_input"];
}