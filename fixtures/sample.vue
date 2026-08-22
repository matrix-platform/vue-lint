<template>
    <div class="sample" id="sample">
        <span :title="label" v-if="visible">
            {{ label }}
        </span>
    </div>
</template>

<style lang="scss">
    .sample {
        --sample-gap: 4px;

        color: inherit;
        display: flex;
        gap: var(--sample-gap);

        .sample__item {
            margin: 0;
        }
    }
</style>

<script setup>
    const label = "sample";
    const visible = true;
</script>
