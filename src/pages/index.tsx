import 'prismjs/themes/prism-tomorrow.css'

import { Client } from '@notionhq/client'
import type { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'
import dayjs from 'dayjs'
import type { GetStaticProps, NextPage } from 'next'
import Link from 'next/link'
import prism from 'prismjs'
import { useEffect } from 'react'

import { Layout } from '@/lib/component/Layout'
import { PostComponent } from '@/lib/component/Post'
import type { Content } from '@/types/content'
import type { Post } from '@/types/post'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

type StaticProps = {
  posts: Post[]
}

export const getPosts = async (slug?: string) => {
  let database: QueryDatabaseResponse | undefined = undefined
  if (slug) {
    database = await notion.databases.query({
      // DB接続
      database_id: process.env.NOTION_DATABASE_ID as string,
      filter: {
        and: [
          {
            // Publishedがtrueのフィールドのみ抽出
            property: 'Slug',
            rich_text: {
              equals: slug,
            },
          },
        ],
      },
    })
  } else {
    database = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID as string,
      filter: {
        and: [
          {
            property: 'Published',
            checkbox: {
              equals: true,
            },
          },
        ],
      },
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending',
        },
      ],
    })
  }

  if (!database) return []

  const posts: Post[] = []
  database.results.forEach((page, index) => {
    if (!('properties' in page)) {
      posts.push({
        id: page.id,
        title: null,
        slug: null,
        createdTs: null,
        lastEditedTs: null,
        contents: [],
      })
      return
    }

    let title: string | null = null
    if (
      page.properties['Name'].type === 'title' &&
      Array.isArray(page.properties['Name'].title)
    ) {
      title = page.properties['Name'].title[0]?.plain_text ?? null
    }

    let slug: string | null = null
    if (
      page.properties['Slug'].type === 'rich_text' &&
      Array.isArray(page.properties['Slug'].rich_text)
    ) {
      slug = page.properties['Slug'].rich_text[0]?.plain_text ?? null
    }

    posts.push({
      id: page.id,
      title,
      slug,
      createdTs: (page as any).created_time,
      lastEditedTs: (page as any).last_edited_time,
      contents: [],
    })
  })
  return posts
}

export const getPostContents = async (post: Post) => {
  const blockResponse = await notion.blocks.children.list({
    block_id: post.id,
  })

  const contents: Content[] = []
  blockResponse.results.forEach((block) => {
    if (!('type' in block)) {
      return
    }

    switch (block.type) {
      case 'paragraph':
        contents.push({
          type: 'paragraph',
          text: block.paragraph.rich_text[0]?.plain_text ?? null,
        })

        break

      case 'heading_2':
        contents.push({
          type: 'heading_2',
          text: block.heading_2.rich_text[0]?.plain_text ?? null,
        })

        break

      case 'heading_3':
        contents.push({
          type: 'heading_3',
          text: block.heading_3.rich_text[0]?.plain_text ?? null,
        })

        break

      case 'quote':
        contents.push({
          type: 'quote',
          text: block.quote.rich_text[0]?.plain_text ?? null,
        })

        break

      case 'code':
        contents.push({
          type: 'code',
          text: block.code.rich_text[0]?.plain_text ?? null,
          language: block.code.language,
        })

        break
    }
  })

  return contents
}

export const getStaticProps: GetStaticProps<StaticProps> = async () => {
  const posts = await getPosts()
  const contentsList = await Promise.all(
    posts.map((post) => {
      return getPostContents(post)
    }),
  )

  posts.forEach((post, index) => {
    post.contents = contentsList[index]
  })

  return { props: { posts } }
}

const Home: NextPage<StaticProps> = ({ posts }) => {
  return (
    <Layout>
      {posts.map((post) => (
        <PostComponent post={post} key={post.id} />
      ))}
    </Layout>
  )
}

export default Home
