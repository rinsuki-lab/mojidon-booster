import Dexie from "dexie"

class MojidonBoosterDatabase extends Dexie {
    mastodonAccounts!: Dexie.Table<IMastodonAccount, string>
    mojiAccounts!: Dexie.Table<IMojiAccount, string>

    constructor() {
        super("MojidonBoosterDatabase")
        this.version(2).stores({
            mastodonAccounts: "++acct, accessToken",
            mojiAccounts: "++code, url",
        })
        this.version(1).stores({
            mastodonAccounts: "++acct, accessToken",
        })
    }
}

export interface IMastodonAccount {
    acct: string
    accessToken: string
}

export interface IMojiAccount {
    code: string
    url: string
}

export const database = new MojidonBoosterDatabase()
