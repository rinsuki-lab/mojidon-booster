import Vue from "vue"
import App from "./components/app.vue"

const root = document.createElement("div")
root.id = "root"
document.body.appendChild(root)

const app = new Vue({
    el: root,
    render: (h) => h(App),
})
