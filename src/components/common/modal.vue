<template>
    <div v-if="show">
        <div class="modal-mask" @click="close">
            <div class="modal-wrapper" @click="eventCanceller">
                <div class="modal-content">
                    <button class="modal-close-button" @click="close">×</button>
                    <slot name="content" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .modal-mask {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(48, 48, 48, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        transition: opacity .3s ease;
    }
    .modal-wrapper {
        margin: auto;
        background: rgba(255, 255, 255, 0.9);
        padding: 2em;
        width: 480px;
    }
    .modal-close-button {
        float: right;
    }
    h2 {
        -webkit-margin-before: 0;
    }
</style>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator"

@Component
export default class Modal extends Vue {
    show = true

    close() {
        this.$emit("close")
        this.show = false
    }

    eventCanceller(e: Event) {
        e.stopPropagation()
    }
}
</script>
