import { verifyADR36Amino } from '@keplr-wallet/cosmos'

function main() {
  const signDoc = {
    pub_key: {
      type: 'tendermint/PubKeySecp256k1',
      value: 'A/MdHVpitzHNSdD1Zw3kY+L5PEIPyd9l6sD5i4aIfXp9',
    },
    signature:
      'vb78/y129cOiWyQkeFF8wCKZsOyzjpILnpEVZ72o5YUhEOmQZzVPcbUqWPLR7aZQ20j6vnYhIuCQN0HEG3igFg==',
  }
  const address = 'cosmos1m9l358xunhhwds0568za49mzhvuxx9uxre5tud'
  const message = 'cosmos1m9l358xunhhwds0568za49mzhvuxx9uxre5tud'
  const res = verifyADR36Amino(
    'cosmos',
    address,
    message,
    Buffer.from(signDoc.pub_key.value, 'base64'),
    Buffer.from(signDoc.signature, 'base64'),
  )
  console.log(res)
}

main()
