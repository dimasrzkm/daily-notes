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
const selectedTasks = ref([])
const loading = ref(false)

onMounted(fetchTasks)

async function fetchTasks() {
  const { data, error } = await supabase.from(`tasks`).select().order(`id`, { ascending: false })

  if (!error) {
    tasks.value = data
  }
}

async function addTask(title) {
  if (loading.value) return
  if (!title.trim()) return

  loading.value = true

  const { error } = await supabase.from('tasks').insert({
    title,
  })

  loading.value = false

  if (!error) {
    fetchTasks()
  } else {
    console.log(error)
  }
}

const onFormSubmit = ({ values }) => {
  console.log(values)
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
    <Card class="w-xs min:max-w-2xl">
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
          <TabPanels class="overflow-y-auto max-h-64">
            <TabPanel value="0" class="-ml-4">
              <div class="card flex flex-col flex-wrap justify-center gap-4">
                <div
                  v-for="task in [...tasks].reverse()"
                  :key="task.id"
                  class="flex items-center gap-2"
                >
                  <Checkbox
                    v-model="selectedTasks"
                    :inputId="`${task.id}`"
                    name="category"
                    :value="task.id"
                  />
                  <label
                    :for="task.id"
                    class="hover:cursor-pointer"
                    :class="{ 'line-through text-gray-400': selectedTasks.includes(task.id) }"
                    >{{ task.title }}
                  </label>
                </div>
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

<style scoped></style>
