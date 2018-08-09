import Dexie from "dexie"

class MojidonBoosterDatabase extends Dexie {
    mastodonAccounts!: Dexie.Table<IMastodonAccount, string>

    constructor() {
        super("MojidonBoosterDatabase")
        this.version(1).stores({
            mastodonAccounts: "++acct, accessToken",
        })
    }
}

export interface IMastodonAccount {
    acct: string
    accessToken: string
}

export const database = new MojidonBoosterDatabase()
