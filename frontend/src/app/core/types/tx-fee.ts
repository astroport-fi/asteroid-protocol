export type TxFee = {
    metaprotocol: {
        receiver: string;
        denom: string;
        amount: string;
    },
    chain: {
        denom: string;
        amount: string;
    }
    gasLimit: string;
}
