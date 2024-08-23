import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  password: z
    .string()
    .min(8, { message: 'Mot de passe invalide' })
    .regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,}$/, {
      message:
        'Votre mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial, et faire plus de 8 caractères.'
    }),
  firstName: z.string().max(255, { message: 'Prénom invalide' }),
  lastName: z.string().max(255, { message: 'Nom invalide' }),
  birthDate: z.date({ message: 'Date de naissance invalide' })
})
