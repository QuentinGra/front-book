<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createZodPlugin } from '@formkit/zod'
import { categorySchema } from '@/schemas/admin/category.schema'
import { createCategory } from '@/api/admin/category.api'
import type { Category } from '@/interfaces/admin/category.interface'

const router = useRouter()
const errorMessage = ref<string>('')

const state = reactive<Partial<Category>>({
  name: '',
  description: '',
  enable: false
})

const saveCategory = async (): Promise<void> => {
  try {
    await createCategory(state)
    router.push({ name: 'AdminCategory' })
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Une erreur est survenue'
    }
  }
}

const [zodPlugin, submitHandler] = createZodPlugin(categorySchema, saveCategory)
</script>

<template>
  <div>
    <h1 class="title">Création d'une catégorie</h1>
    <div class="form-error" v-if="errorMessage">{{ errorMessage }}</div>
    <FormKit type="form" submit-label="Enregistrer" :plugins="[zodPlugin]" @submit="submitHandler">
      <FormKit
        type="text"
        name="name"
        v-model="state.name"
        validation="required"
        validation-label="Le nom de la catégorie"
        help="Veuillez entrer le nom de la catégorie. Ce champ est obligatoire."
      />
      <FormKit
        type="textarea"
        name="description"
        v-model="state.description"
        help="Vous pouvez entrer une description pour la catégorie. Ce champ est optionnel."
      />
      <FormKit
        type="checkbox"
        name="enable"
        v-model="state.enable"
        help="Cochez cette case si la catégorie doit être active."
      />
    </FormKit>
  </div>
</template>
