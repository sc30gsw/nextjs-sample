import type { Content } from './content'

export type Post = {
  id: string
  title: string | null
  slug: string | null
  createdTs: string | null
  lastEditedTs: string | null
  contents: Content[]
}
