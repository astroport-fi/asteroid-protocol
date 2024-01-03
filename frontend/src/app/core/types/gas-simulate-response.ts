
export interface GasSimulateResponse {
    gas_info: GasInfo
}

export interface GasInfo {
    gas_wanted: string
    gas_used: string
}
