<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createZodPlugin } from '@formkit/zod'
import { loginSchema } from '@/schemas/auth/login.schema'
import type { LoginValues } from '@/interfaces/auth/login.interface'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login, hasRole } = useAuth()
const errorMessage = ref<string>('')

const handleLogin = async (values: LoginValues): Promise<void> => {
  try {
    await login(values.username, values.password)
    if (hasRole('ROLE_ADMIN')) {
      router.push('/admin-panel')
    } else {
      router.push('/')
    }
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Une erreur est survenue'
    }
  }
}

const [zodPlugin, submitHandler] = createZodPlugin(loginSchema, handleLogin)
</script>

<template>
  <div class="form-error" v-if="errorMessage">{{ errorMessage }}</div>
  <FormKit type="form" submit-label="Connexion" :plugins="[zodPlugin]" @submit="submitHandler">
    <FormKit
      type="email"
      name="username"
      validation="required"
      validation-label="Le mail"
      help="Entrer votre adresse mail"
    />
    <FormKit
      type="password"
      name="password"
      validation="required"
      validation-label="Le mot de passe"
      help="Entrer votre mot de passe"
    />
  </FormKit>
</template>
