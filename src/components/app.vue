<template>
    <div>
        <h1>Mojidon Booster</h1>
        <p>やりすぎて怒られたりフォロワー減っても知らん</p>
        <input type="text" v-model="text"><input type="button" @click="fetchMojiAccount" value="取得">
        <div v-if="accounts.length">
            <ul>
                <li v-for="(link, index) in accounts" :key="index">
                    <span v-if="link == null">Fetching...</span>
                    <a v-else-if="typeof link === 'string'" :href="link">{{ link }}</a>
                    <span v-else style="color: red">{{ link.toString() }}</span>
                </li>
            </ul>
            <div>
                <h2>ブーストする</h2>
                <p>
                    アカウント:&nbsp;
                    <select v-model="nowSelectAccount">
                        <option v-for="account in mastodonAccounts" :key="account.acct">{{account.acct}}</option>
                    </select>
                    <input type="button" value="追加" @click="dialogState='authInputInstance'">
                </p>
                <input type="button" @click="boost" value="boost" :disabled="stateMax ? stateMax !== stateNow : false">
                <progress :max="stateMax" :value="stateNow"/>
            </div>
        </div>
        <div class="credit">
            <p>Created by <a href="https://mstdn.maud.io/@rinsuki">@rinsuki@mstdn.maud.io</a>.</p>
            <p>moji.m.to admin is <a href="https://mstdn.nere9.help/@osapon">@osapon@mstdn.nere9.help</a>.</p>
        </div>
        <modal v-if="dialogState == 'authInputInstance'" @close="dialogState = 'none'"><div slot="content">
            <h2>アカウント追加</h2>
            <input type="text" v-model="loginInstance" placeholder="あなたのMastodonインスタンス" />
            <input type="button" value="認証画面を開く" @click="openAuthWindow"/>
        </div></modal>
        <modal v-if="dialogState == 'authInputCode'" @close="dialogState = 'authInputInstance'"><div slot="content">
            <h2>ログイン</h2>
            <input type="text" v-model="oauthCode" placeholder="認証コード">
            <input type="button" @click="authWithCode" value="OK">
        </div></modal>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator"
import { IMastodonAccount, database } from "../database"
import Axios from "axios"
import Modal from "./common/modal.vue"

const oobUrl = "urn:ietf:wg:oauth:2.0:oob"

@Component({
    components: { Modal },
})
export default class App extends Vue {
    text: string = "ア"
    accounts: (string | null | Error)[] = []
    mastodonAccounts: IMastodonAccount[] = []
    dialogState: ("none" | "authInputInstance" | "authInputCode") = "none"
    loginInstance: string = ""
    loginInstanceInfo?: {clientId: string, clientSecret: string} = undefined
    oauthCode = ""
    nowSelectAccount: string | null = null
    stateMax = 0
    stateNow = 0

    async mounted() {
        await this.fetchAccountsFromDatabase()
    }

    async fetchAccountsFromDatabase() {
        this.mastodonAccounts = await database.mastodonAccounts.toArray()
        if (this.nowSelectAccount == null && this.mastodonAccounts.length) {
            this.nowSelectAccount = this.mastodonAccounts[0].acct
        }
    }

    async fetchMojiAccount() {
        const string = this.text
        this.accounts = new Array<null>(string.length).fill(null)
        var i = 0
        for (const char of string) {
            const charCode = char.charCodeAt(0).toString(16)
            console.log(charCode)
            try {
                const res = await fetch("https://moji.m.to/@"+charCode+".atom")
                if (!res.ok) {
                    throw new Error(res.statusText)
                }
                const parser = new DOMParser()
                const dom = await parser.parseFromString(await res.text(), "application/xml")
                throw dom.querySelector(`feed > entry > link[rel=alternate][type="text/html"]`)!.getAttribute("href")
            } catch(e) {
                Vue.set(this.accounts, i, e)
            }
            i++
        }
    }

    async openAuthWindow() {
        const host = this.loginInstance
        if (host === "") return
        var dialog = window.open("about:blank", "_blank", "width=480,height=560")
        if (dialog == null) return alert("ダイアログが開けなくてかなしい")
        dialog.document.body.innerHTML = "ちょっとまってね"
        try {
            const res = await Axios.post("https://"+host+"/api/v1/apps", {
                client_name: "Mojidon Booster",
                redirect_uris: oobUrl,
                scopes: "read write",
                website: location.origin,
            })
            if (res.status >= 400) {
                dialog.close()
                throw new Error("エラー: " + res.statusText)
            }
            const url = "https://"+host+"/oauth/authorize?client_id="+res.data.client_id+"&scope=read+write&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code"
            dialog.location.href = url
            this.loginInstanceInfo = {
                clientId: res.data.client_id,
                clientSecret: res.data.client_secret,
            }
            this.dialogState = "authInputCode"
        } catch (e) {
            dialog.close()
            alert(e.toString())
        }
    }

    async authWithCode() {
        const host = this.loginInstance
        const res = await Axios.post("https://"+host+"/oauth/token", {
            grant_type: "authorization_code",
            client_id: this.loginInstanceInfo!.clientId,
            client_secret: this.loginInstanceInfo!.clientSecret,
            redirect_uri: oobUrl,
            code: this.oauthCode,
        })
        if (res.data.error) return alert(res.data.error)
        const token = res.data.access_token
        const userInfo = await Axios.get("https://"+host+"/api/v1/accounts/verify_credentials", {
            headers: { Authorization: "Bearer "+token }
        })
        if (userInfo.data.error) return alert(res.data.error)
        const acct = [userInfo.data.username, host.toLowerCase()].join("@")
        database.mastodonAccounts.put({
            acct,
            accessToken: token
        })
        await this.fetchAccountsFromDatabase()
        this.dialogState = "none"
    }

    async boost() {
        function sleep(msec: number) {
            return new Promise(r => setTimeout(r, msec))
        }

        const account = this.mastodonAccounts.find(a => a.acct === this.nowSelectAccount)
        if (account == null) return alert("アカウントを追加してください")
        const token = account.accessToken
        const requestor = Axios.create({
            baseURL: "https://"+account.acct.split("@")[1],
            headers: {
                Authorization: "Bearer "+token,
            }
        })
        this.stateMax = this.accounts.length
        this.stateNow = 0
        var localIds: string[] = []
        for (const tootUrl of this.accounts) {
            if (typeof tootUrl === "string") {
                const res = await requestor.get("/api/v1/search?q="+encodeURIComponent(tootUrl))
                if (res.data.statuses.length === 0) return alert(tootUrl+"がみつかりませんでした")
                const post = res.data.statuses[0]
                if (post.reblogged) await requestor.post("/api/v1/statuses/"+post.id+"/unreblog")
                localIds.push(post.id)
                await sleep(1000)
                this.stateNow++
            }
        }
        for (const id of localIds.reverse()) {
            await requestor.post("/api/v1/statuses/"+id+"/reblog")
            await sleep(1000)
            this.stateNow++
        }
    }
}

</script>
