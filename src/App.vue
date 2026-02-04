<script setup>
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import { Form } from '@primevue/forms'
import ConfirmPopup from 'primevue/confirmpopup'
import { Button, Message, Textarea } from 'primevue'

import { ref, onMounted, computed } from 'vue'
import { supabase } from './lib/supabaseClient'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const tasks = ref([])
const initialLoading = ref(true)

const confirm = useConfirm()
const toast = useToast()

onMounted(async () => {
  await fetchTasks()
  initialLoading.value = false
})

const taskId = ref(null)

const filteredTasks = computed(() => {
  return tasks.value.map((task) => ({
    ...task,
    detail_tasks: (task.detail_tasks || []).filter((d) => d.deleted_at === null),
  }))
})

async function fetchTasks() {
  const { data, error } = await supabase.from('tasks').select(
    `
      id,
      title,
      created_at,
      detail_tasks (
        id,
        task,
        is_done,
        created_at,
        deleted_at
      )
    `,
  )

  if (!error) {
    tasks.value = data
    taskId.value = data[0].id
  }

  tasks.value = data || []
}

async function addTask(title) {
  if (!title.trim()) return

  // ambil parent task (misalnya task pertama)
  const parentTask = tasks.value.find((t) => t.id === taskId.value)
  if (!parentTask) return

  // 1️⃣ temp detail task (OPTIMISTIC)
  const tempDetail = {
    id: `temp-${Date.now()}`,
    task: title,
    is_done: false,
    deleted_at: null,
    pending: true,
  }

  // pastikan array ada
  if (!parentTask.detail_tasks) {
    parentTask.detail_tasks = []
  }

  // tambahkan ke UI
  parentTask.detail_tasks.unshift(tempDetail)

  // biarkan render dulu
  await new Promise((r) => requestAnimationFrame(r))

  // 2️⃣ kirim ke database
  const { data, error } = await supabase
    .from('detail_tasks')
    .insert({
      task_id: taskId.value,
      task: title,
    })
    .select()
    .single()

  if (error) {
    // rollback
    parentTask.detail_tasks = parentTask.detail_tasks.filter((d) => d.id !== tempDetail.id)
    return
  }

  // update IN-PLACE (INI KUNCI)
  Object.assign(tempDetail, data)
  delete tempDetail.pending
}

async function toggleDone(task, value) {
  task.is_done = value
  const { error } = await supabase.from('detail_tasks').update({ is_done: value }).eq('id', task.id)

  if (error) {
    task.is_done = !value
  }
}

async function deleteTask(detailId) {
  for (const task of tasks.value) {
    const detail = task.detail_tasks?.find((d) => d.id === detailId)
    if (detail) {
      detail.deleted_at = new Date().toISOString()
      break
    }
  }

  // 2️⃣ Update ke database
  const { error } = await supabase
    .from('detail_tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', detailId)

  if (error) {
    console.error(error)

    // 3️⃣ Rollback kalau gagal
    for (const task of tasks.value) {
      const detail = task.detail_tasks?.find((d) => d.id === detailId)
      if (detail) {
        detail.deleted_at = null
        break
      }
    }
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

// Reject Popup
const confirm2 = (id, event) => {
  confirm.require({
    target: event.currentTarget,
    message: 'Delete?',
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: () => {
      deleteTask(id)
      toast.add({
        severity: 'success',
        summary: 'Confirmed',
        detail: 'Record deleted',
        life: 3000,
      })
    },
    reject: () => {
      toast.add({
        severity: 'error',
        summary: 'Rejected',
        detail: 'rejected',
        life: 3000,
        autoZIndex: true,
      })
    },
  })
}
</script>

<template>
  <!-- GLOBAL -->
  <Toast position="top-right" />
  <ConfirmPopup />

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
                  <div
                    v-for="detail in filteredTasks[0]?.detail_tasks || []"
                    :key="detail.id"
                    class="flex items-start gap-3 w-full"
                  >
                    <!-- KIRI -->
                    <div class="flex items-start gap-2 flex-1 min-w-0">
                      <Checkbox
                        :modelValue="detail.is_done"
                        :inputId="`${detail.id}`"
                        binary
                        @update:modelValue="toggleDone(detail, $event)"
                      />

                      <label
                        :for="detail.id"
                        class="text-justify hover:cursor-pointer text-sm leading-snug break-words whitespace-normal max-w-full transition-all duration-200"
                        :class="{
                          'line-through text-gray-400 scale-[0.98]': detail.is_done,
                        }"
                      >
                        {{ detail.task }}
                      </label>
                    </div>

                    <!-- KANAN -->
                    <Button
                      icon="pi pi-times"
                      text
                      severity="danger"
                      class="shrink-0 ml-6"
                      @click="confirm2(detail.id, $event)"
                    />
                  </div>
                </TransitionGroup>
              </div>
            </TabPanel>
            <TabPanel value="1">
              <h1>Todo List</h1>

              <ul>
                <li v-for="detail in tasks[0]?.detail_tasks || []" :key="detail.id">
                  {{ detail.task }}
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
