export type Account = {
    account_number: number;
    address: string;
    sequence: number;
    pub_key: {
        "@type": string;
        key: string
    }
};
