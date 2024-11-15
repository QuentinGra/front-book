<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { fetchBookById } from '@/api/admin/book.api'
import { formatDate } from '@/utils/date.utils'
import { capitalizeFirstLetter } from '@/utils/string.utils'
import { createRating, getRatingByBook, updateRating } from '@/api/user/rating.api'
import BaseModal from '@/components/common/BaseModal.vue'
import { fetchList } from '@/api/user/list.api'
import { useAuth } from '@/composables/useAuth'
import { Star } from 'lucide-vue-next'
import { addBookToListSchema } from '@/schemas/user/bookList.schema'
import { addBookToList } from '@/api/user/bookList.api'
import type { Book } from '@/interfaces/admin/book.interface'
import type { List } from '@/interfaces/user/list.interface'

const IMAGE_PATH = import.meta.env.VITE_IMAGE_URL_LOCAL
const STATUS_OPTIONS = {
  reading: 'En cours de lecture',
  read: 'Lu',
  wish: 'À lire'
} as const

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const book = ref<Book | null>(null)
const errorMessage = ref<string>('')

const isListModalOpen = ref<boolean>(false)
const isLoading = ref<boolean>(false)

const lists = ref<List[]>([])
const selectedListId = ref<number | null>(null)

const selectedStatus = ref<string>('wish')

const rating = ref<number>(0)
const ratingId = ref<number>(0)
const hoverRating = ref<number>(0)

const { isUserDefined } = useAuth()

interface RatingResponse {
  id: number
  rating: number
}

const setHoverRating = (value: number): void => {
  hoverRating.value = value
}

/**
 * Sets the rating for a book. If the user is not defined, redirects to the login page.
 * If the rating is greater than 0, updates the existing rating. Otherwise, creates a new rating.
 *
 * @param {number} value - The rating value to be set.
 * @returns {void}
 * @throws Will set an error message if the rating update or creation fails.
 */
const setRating = async (value: number): Promise<void> => {
  if (!isUserDefined.value) {
    router.push({ name: 'Login' })
    return
  }

  if (!book.value || !authStore.user) {
    errorMessage.value = 'Une erreur est survenue'
    return
  }

  rating.value = value

  try {
    if (ratingId.value) {
      await updateRating(ratingId.value, rating.value)
    } else {
      const newRating = await createRating(book.value.id, authStore.user.id, rating.value)
      ratingId.value = newRating.id
    }
  } catch (error) {
    errorMessage.value = 'Impossible de noter le livre'
  }
}

/**
 * Asynchronously checks if a rating exists for the current book and updates the rating state.
 *
 * If the user is not defined, the function returns immediately.
 *
 * The function attempts to retrieve the rating for the book using the `getRatingByBook` function.
 * If successful, it updates the `rating` and `ratingId` state with the retrieved data.
 * If an error occurs and the error response status is 404, it retains the current rating value.
 * Otherwise, it sets the rating to 0.
 *
 * @returns {Promise<void>} A promise that resolves when the rating check is complete.
 */
const checkExistingRating = async (): Promise<void> => {
  if (!isUserDefined.value || !book.value?.id) return

  try {
    const data: RatingResponse = await getRatingByBook(book.value.id)
    rating.value = data?.rating ?? 0
    ratingId.value = data?.id
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { status?: number } }
      rating.value = apiError.response?.status === 404 ? rating.value : 0
    } else {
      rating.value = 0
    }
  }
}

const loadBook = async (): Promise<void> => {
  const bookId: number = Number(route.params.id)
  try {
    const data: Book = await fetchBookById(bookId)
    book.value = data
  } catch (error) {
    errorMessage.value = 'Impossible de charger le livre'
  }
}

const loadLists = async (): Promise<void> => {
  try {
    lists.value = await fetchList()
  } catch (error) {
    errorMessage.value = 'Impossible de charger les listes'
  }
}

const handleAddToList = async (): Promise<void> => {
  if (!book.value) {
    errorMessage.value = "Impossible d'ajouter le livre à la liste"
    return
  }

  try {
    const validatedData = addBookToListSchema.parse({
      listId: selectedListId.value,
      status: selectedStatus.value
    })

    isLoading.value = true
    await addBookToList(book.value.id, validatedData.listId, validatedData.status)
    isListModalOpen.value = false
  } catch (error) {
    errorMessage.value = "Impossible d'ajouter le livre à la liste"
  } finally {
    isLoading.value = false
  }
}

/**
 * Watches the `isListModalOpen` reactive property.
 * When `isListModalOpen` becomes true, it attempts to load lists by calling `loadLists`.
 * If an error occurs during the loading process, it sets an error message and closes the modal.
 *
 * @param {boolean} isOpen - Indicates whether the list modal is open.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
watch(isListModalOpen, async (isOpen: boolean): Promise<void> => {
  if (isOpen) {
    try {
      await loadLists()
    } catch (error) {
      errorMessage.value = 'Impossible de charger les listes'
      isListModalOpen.value = false
    }
  }
})

const navigateToCategoryDetail = (categoryId: number): void => {
  router.push({ name: 'CategoryDetail', params: { id: categoryId } })
}

const navigateToAuthorDetail = (authorId: number): void => {
  router.push({ name: 'AuthorDetail', params: { id: authorId } })
}

onMounted(async (): Promise<void> => {
  await loadBook()
  await checkExistingRating()
})
</script>

<template>
  <div class="form-error" v-if="errorMessage">{{ errorMessage }}</div>
  <div v-if="book" class="book-detail">
    <div class="book-detail-left">
      <img :src="IMAGE_PATH + book.bookImages[0].imageName" alt="Book cover" class="book-image" />
      <button class="book-detail-add-to-list" @click="isListModalOpen = true">
        Ajouter à la liste de lecture
      </button>
      <div class="book-detail-rate-book">
        <Star
          v-for="star in 5"
          :key="star"
          :class="[
            'book-detail-star',
            { 'book-detail-star-filled': star <= (hoverRating || rating) }
          ]"
          :size="28"
          :stroke-width="2"
          @click="setRating(star)"
          @mouseover="setHoverRating(star)"
          @mouseleave="setHoverRating(0)"
        />
      </div>
    </div>
    <div class="book-detail-right">
      <h1 class="book-detail-title">{{ book.name }}</h1>
      <p @click="navigateToAuthorDetail(book.author.id)" class="book-detail-author">
        <span class="book-detail-info">Auteur</span>{{ book.author.lastName }}
        {{ book.author.firstName }}
      </p>
      <div class="book-detail-variants">
        <span v-for="variant in book.bookVariants" :key="variant.id" class="book-detail-variant">
          {{ capitalizeFirstLetter(variant.type) }}
        </span>
      </div>
      <p class="book-detail-description">{{ book.description }}</p>
      <div class="book-detail-categories">
        <span
          v-for="category in book.categories"
          :key="category.id"
          @click="navigateToCategoryDetail(category.id)"
          class="book-detail-category"
        >
          {{ category.name }}
        </span>
      </div>
      <p class="book-detail-edition">
        <span class="book-detail-info">Maison d'édition</span>{{ book.edition.name }}
      </p>
      <p class="book-detail-date">
        <span class="book-detail-info">Date d'édition</span>{{ formatDate(book.dateEdition) }}
      </p>
    </div>
  </div>

  <BaseModal
    :is-open="isListModalOpen"
    :is-loading="isLoading"
    :error-message="errorMessage"
    title="Ajouter à une liste"
    confirm-text="Ajouter"
    @cancel="isListModalOpen = false"
    @confirm="handleAddToList"
  >
    <div class="form-group">
      <label>Choisir une liste</label>
      <select v-model="selectedListId" class="form-select">
        <option value="">Sélectionner une liste</option>
        <option v-for="list in lists" :key="list.id" :value="list.id">
          {{ list.name }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <label>Statut de lecture</label>
      <select v-model="selectedStatus" class="form-select">
        <option v-for="(label, value) in STATUS_OPTIONS" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
    </div>
  </BaseModal>
</template>
