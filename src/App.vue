<script setup>
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import { Form } from '@primevue/forms'
import { Button, Message, Textarea } from 'primevue'

import { ref, onMounted } from 'vue'
import { supabase } from './lib/supabaseClient'

const tasks = ref([])
const initialLoading = ref(true)

onMounted(async () => {
  await fetchTasks()
  initialLoading.value = false
})

async function fetchTasks() {
  const { data, error } = await supabase.from(`tasks`).select().order(`id`, { ascending: false })

  if (!error) {
    tasks.value = data
  }

  tasks.value = data || []
}

async function addTask(title) {
  if (!title.trim()) return

  // 1️⃣ Tambah ke UI dulu → animasi jalan
  const tempTask = {
    id: `temp-${Date.now()}`,
    title,
    is_done: false,
    pending: true,
  }

  tasks.value.splice(0, 0, tempTask)

  // biarkan browser render dulu
  await new Promise((r) => requestAnimationFrame(r))

  // Kirim ke server
  const { data, error } = await supabase.from('tasks').insert({ title }).select().single()

  if (error) {
    tasks.value = tasks.value.filter((t) => t.id !== tempTask.id)
    return
  }

  // update IN-PLACE (INI KUNCI)
  Object.assign(tempTask, data)
  delete tempTask.pending
}

async function toggleDone(task, value) {
  task.is_done = value

  const { error } = await supabase.from('tasks').update({ is_done: value }).eq('id', task.id)

  if (error) {
    task.is_done = !value
  }
}

async function deleteTask(id) {
  if (!confirm('Hapus task ini?')) return

  const previousTasks = [...tasks.value]
  tasks.value = tasks.value.filter((task) => task.id !== id)

  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) {
    // rollback kalau gagal
    tasks.value = previousTasks
  }
}

const onFormSubmit = ({ values }) => {
  addTask(values.title)
}

const resolver = ({ values }) => {
  const errors = {}

  if (!values.title) {
    errors.title = [{ message: 'Title is required.' }]
  }

  return {
    values,
    errors,
  }
}
</script>

<template>
  <div class="flex justify-center items-center mt-16">
    <Card class="w-xs min:max-w-2xl sm:w-md">
      <template #title>
        <h1 class="text-4xl text-center">Daily Notes</h1>
        <Form
          v-slot="$form"
          :resolver="resolver"
          @submit="onFormSubmit"
          class="mt-8 flex flex-col gap-2 w-full"
        >
          <div class="flex flex-col gap-1">
            <Textarea name="title" class="w-full" />
            <Message v-if="$form.title?.invalid" severity="error" size="small" variant="simple">{{
              $form.title.error?.message
            }}</Message>
          </div>
          <Button type="submit" severity="contrast" label="Add" />
        </Form>
      </template>
      <template #content>
        <Tabs value="0">
          <TabList>
            <Tab value="0">Today</Tab>
            <Tab value="1">All Notes</Tab>
          </TabList>
          <TabPanels class="overflow-y-auto max-h-64 overflow-x-hidden">
            <TabPanel value="0" class="-ml-4">
              <div class="card flex flex-col flex-wrap justify-center gap-4">
                <!-- loading -->
                <div v-if="initialLoading" class="space-y-3">
                  <div v-for="i in 4" :key="i" class="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>

                <!-- lists -->
                <TransitionGroup name="list" tag="div" class="flex flex-col gap-4" v-else>
                  <div v-for="task in tasks" :key="task.id" class="flex items-start gap-3 w-full">
                    <!-- KIRI -->
                    <div class="flex items-start gap-2 flex-1 min-w-0">
                      <Checkbox
                        :modelValue="task.is_done"
                        :inputId="`${task.id}`"
                        binary
                        @update:modelValue="toggleDone(task, $event)"
                      />

                      <label
                        :for="task.id"
                        class="text-justify hover:cursor-pointer text-sm leading-snug break-words whitespace-normal max-w-full transition-all duration-200"
                        :class="{
                          'line-through text-gray-400 scale-[0.98]': task.is_done,
                        }"
                      >
                        {{ task.title }}
                      </label>
                    </div>

                    <!-- KANAN -->
                    <Button
                      icon="pi pi-times"
                      text
                      severity="danger"
                      class="shrink-0 ml-6"
                      @click="deleteTask(task.id)"
                    />
                  </div>
                </TransitionGroup>
              </div>
            </TabPanel>
            <TabPanel value="1">
              <h1>Todo List</h1>

              <ul>
                <li v-for="task in tasks" :key="task.id">
                  {{ task.title }}
                </li>
              </ul>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.list-move {
  transition: transform 0.25s ease;
}
</style>
