<script setup>
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import { Form } from '@primevue/forms'
import { InputText, Button } from 'primevue'

import { ref, reactive } from 'vue'

const allMenus = reactive([
  {
    id: 1,
    name: 'Bayar Tagihan Gas ke katiran',
  },
  {
    id: 2,
    name: 'Beli minyak 5 kg',
  },
  {
    id: 3,
    name: 'Bayar uang gas ke sekolah dan beli minyak lagi',
  },
])
const selectedCategories = ref([])

const resolver = ({ values }) => {
  const errors = {}

  if (!values.username) {
    errors.title = [{ message: 'Title is required.' }]
  }

  return {
    values, // (Optional) Used to pass current form values to submit event.
    errors,
  }
}

const addMenu = () => {
  const nextId = allMenus.length > 0 ? Math.max(...allMenus.map((m) => m.id)) + 1 : 1

  allMenus.push({
    id: nextId,
    name: `Menu ${nextId}`,
  })
}

const onFormSubmit = () => {
  addMenu()
}
</script>

<template>
  <div class="flex justify-center items-center mt-16">
    <Card class="w-xs min:max-w-2xl">
      <template #title>
        <h1 class="text-4xl text-center">Daily Notes</h1>
        <Form
          :resolver="resolver"
          @submit="onFormSubmit"
          class="mt-8 flex flex-row gap-2 w-full sm:w-56"
        >
          <div class="flex flex-col gap-1">
            <InputText name="title" type="text" placeholder="type..." fluid />
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
                  v-for="menu in [...allMenus].reverse()"
                  :key="menu.id"
                  class="flex items-center gap-2"
                >
                  <Checkbox
                    v-model="selectedCategories"
                    :inputId="`${menu.id}`"
                    name="category"
                    :value="menu.id"
                  />
                  <label
                    :for="menu.id"
                    class="hover:cursor-pointer"
                    :class="{ 'line-through text-gray-400': selectedCategories.includes(menu.id) }"
                    >{{ menu.name }}
                  </label>
                </div>
              </div>
            </TabPanel>
            <TabPanel value="1">
              <p class="m-0">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
                doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
                veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam
                voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur
                magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci
                velit, sed quia non numquam eius modi.
              </p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>
</template>

<style scoped></style>
