<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createZodPlugin } from '@formkit/zod'
import { editionSchema } from '@/schemas/admin/edition.schema'
import { fetchEditionById, updateEdition } from '@/api/admin/edition.api'
import type { Edition } from '@/interfaces/admin/edition.interface'

const router = useRouter()
const route = useRoute()
const errorMessage = ref<string>('')

const state = reactive<Partial<Edition>>({
  id: 0,
  name: '',
  description: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  enable: false
})

const loadEdition = async (): Promise<void> => {
  const editionId: number = Number(route.params.id)
  try {
    const data: Edition = await fetchEditionById(editionId)
    Object.assign(state, data)
  } catch (error) {
    errorMessage.value = "Impossible de charger les maisons d'éditions"
  }
}

const saveEdition = async (): Promise<void> => {
  try {
    await updateEdition(state.id!, state)
    router.push({ name: 'AdminEdition' })
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Une erreur est survenue'
    }
  }
}

onMounted((): void => {
  loadEdition()
})

const [zodPlugin, submitHandler] = createZodPlugin(editionSchema, saveEdition)
</script>

<template>
  <div>
    <h1 class="title">Modification d'une maison d'édition</h1>
    <div class="form-error" v-if="errorMessage">{{ errorMessage }}</div>
    <FormKit type="form" submit-label="Enregistrer" :plugins="[zodPlugin]" @submit="submitHandler">
      <FormKit
        type="text"
        name="name"
        validation="required"
        validation-label="Le nom de la maison d'édition"
        v-model="state.name"
        help="Veuillez entrer le nom de la maison d'édition. Ce champ est obligatoire."
      />
      <FormKit
        type="textarea"
        name="description"
        v-model="state.description"
        help="Vous pouvez entrer une description pour la maison d'édition. Ce champ est optionnel."
      />
      <FormKit
        type="checkbox"
        name="enable"
        v-model="state.enable"
        help="Cochez cette case si la maison d'édition doit être active."
      />
    </FormKit>
  </div>
</template>
