export interface Edition {
  id: number
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  enable: boolean
}

export interface EditionState {
  editions: Edition[]
}
