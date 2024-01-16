import { WalletType } from "../enum/wallet-type";

export type ConnectedWallet = {
    address: string;
    walletType: WalletType;
};
