// import {
//   GraphQLTypes,
//   InputType,
//   ScalarDefinition,
//   Selector,
// } from '@asteroid-protocol/sdk'

// export const collectionSelector = Selector('collection')({
//   id: true,
//   transaction: {
//     hash: true,
//   },
//   symbol: true,
//   creator: true,
//   content_path: true,
//   content_size_bytes: true,
//   date_created: true,
//   is_explicit: true,
//   __alias: {
//     name: {
//       metadata: [
//         {
//           path: '$.metadata.name',
//         },
//         true,
//       ],
//     },
//     description: {
//       metadata: [
//         {
//           path: '$.metadata.description',
//         },
//         true,
//       ],
//     },
//     mime: {
//       metadata: [
//         {
//           path: '$.metadata.mime',
//         },
//         true,
//       ],
//     },
//   },
// })

// export type Collection = InputType<
//   GraphQLTypes['collection'],
//   typeof collectionSelector,
//   ScalarDefinition
// >
