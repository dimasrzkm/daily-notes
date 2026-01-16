<script setup>
import Button from 'primevue/button'
</script>

<template>
  <h1 class="text-7xl text-center">You did it!</h1>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
    documentation
  </p>
  <div class="mt-10 w-full flex justify-center flex-wrap gap-4">
    <Button label="Primary" />
    <Button label="Secondary" severity="secondary" />
    <Button label="Success" severity="success" />
    <Button label="Info" severity="info" />
    <Button label="Warn" severity="warn" />
    <Button label="Help" severity="help" />
    <Button label="Danger" severity="danger" />
    <Button label="Contrast" severity="contrast" />
  </div>
</template>

<style scoped></style>
