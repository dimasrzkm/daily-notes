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

const toast = useToast()
const confirm = useConfirm()

const todayTask = ref(null) // khusus hari ini
const allTasks = ref([]) // SEMUA tanggal
const activeTaskId = ref(null)
const initialLoading = ref(true)
const taskId = ref(null)

const today = new Date().toISOString().slice(0, 10)

const activeTask = computed(() => allTasks.value.find((t) => t.id === activeTaskId.value))

const filteredTodayDetails = computed(() =>
  (todayTask.value?.detail_tasks || []).filter((d) => d.deleted_at === null),
)

const filteredAllTasks = computed(() =>
  allTasks.value.map((task) => ({
    ...task,
    detail_tasks: (task.detail_tasks || []).filter((d) => d.deleted_at === null),
  })),
)

const taskSelect = `
  id,
  date,
  title,
  detail_tasks (
    id,
    task,
    is_done,
    created_at,
    deleted_at
  )
`

onMounted(async () => {
  await Promise.all([initTodayTask(), fetchAllTasks()])

  activeTaskId.value = todayTask.value?.id
  initialLoading.value = false
})

async function fetchAllTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(taskSelect)
    .order('date', { ascending: false })

  if (!error) {
    allTasks.value = data || []
  }
}

async function initTodayTask() {
  const { data } = await supabase.from('tasks').select(taskSelect).eq('date', today).maybeSingle()

  if (data) {
    todayTask.value = data
    return
  }

  const { data: newTask } = await supabase
    .from('tasks')
    .insert({
      date: today,
      title: `Daily Notes - ${today}`,
    })
    .select(taskSelect)
    .single()

  todayTask.value = newTask
}

async function addTask(title) {
  if (!title.trim() || !todayTask.value) return

  const temp = {
    id: `temp-${Date.now()}`,
    task: title,
    is_done: false,
    deleted_at: null,
    pending: true,
  }

  todayTask.value.detail_tasks.unshift(temp)
  await new Promise((r) => requestAnimationFrame(r))

  const { data, error } = await supabase
    .from('detail_tasks')
    .insert({
      task_id: todayTask.value.id,
      task: title,
    })
    .select()
    .single()

  if (error) {
    todayTask.value.detail_tasks = todayTask.value.detail_tasks.filter((d) => d.id !== temp.id)
    return
  }

  Object.assign(temp, data)
  delete temp.pending
}

async function toggleDone(detail, value) {
  const old = detail.is_done
  detail.is_done = value

  const { error } = await supabase
    .from('detail_tasks')
    .update({ is_done: value })
    .eq('id', detail.id)

  if (error) detail.is_done = old
}

async function deleteTask(detail) {
  console.log(detail)
  const deletedAt = new Date().toISOString()
  detail.deleted_at = deletedAt

  const { error } = await supabase
    .from('detail_tasks')
    .update({ deleted_at: deletedAt })
    .eq('id', detail.id)

  if (error) detail.deleted_at = null
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

// Reject Popup
const confirm2 = (detail, event) => {
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
      deleteTask(detail)
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
                    v-for="detail in filteredTodayDetails"
                    :key="detail.id"
                    class="flex items-start gap-3 w-full"
                  >
                    <!-- KIRI -->
                    <div class="flex items-start gap-2 flex-1 min-w-0">
                      <Checkbox
                        :modelValue="detail.is_done"
                        :inputId="`${detail}`"
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
                      @click="confirm2(detail, $event)"
                    />
                  </div>
                </TransitionGroup>
              </div>
            </TabPanel>
            <TabPanel value="1">
              <div class="grid grid-cols-2 gap-4">
                <!-- KIRI: LIST TANGGAL -->
                <ul class="space-y-2 border-r pr-3">
                  <li
                    v-for="task in filteredAllTasks"
                    :key="task.id"
                    @click="activeTaskId = task.id"
                    class="cursor-pointer rounded px-2 py-1 hover:bg-gray-100"
                    :class="{
                      'bg-gray-200 font-semibold': task.id === activeTaskId,
                    }"
                  >
                    {{ task.date }}
                  </li>
                </ul>

                <!-- KANAN: DETAIL TASK -->
                <div>
                  <h2 v-if="activeTask" class="font-semibold mb-2">
                    Detail — {{ activeTask.date }}
                  </h2>

                  <ul v-if="activeTask?.detail_tasks?.length">
                    <li v-for="detail in activeTask.detail_tasks" :key="detail.id" class="text-sm">
                      • {{ detail.task }}
                    </li>
                  </ul>

                  <p v-else class="text-sm text-gray-400">Pilih tanggal untuk melihat detail</p>
                </div>
              </div>
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
