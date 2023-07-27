import { Client } from '@notionhq/client'
import type { GetStaticProps, NextPage } from 'next'

import type { Content } from '@/types/content'
import type { Post } from '@/types/post'
import { notojp } from '@/utils/font'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

type StaticProps = {
  post: Post | null
}

export const getStaticProps: GetStaticProps<StaticProps> = async () => {
  const database = await notion.databases.query({
    // DB接続
    database_id: process.env.NOTION_DATABASE_ID as string,
    filter: {
      and: [
        {
          // Publishedがtrueのフィールドのみ抽出
          property: 'Published',
          checkbox: {
            equals: true,
          },
        },
      ],
    },
    sorts: [
      {
        // ページの作成日時の降順
        timestamp: 'created_time',
        direction: 'descending',
      },
    ],
  })

  const page = database.results[1]

  if (!page) {
    return {
      props: {
        post: null,
      },
    }
  }

  if (!('properties' in page)) {
    return {
      props: {
        post: {
          id: page.id,
          title: null,
          slug: null,
          createdTs: null,
          lastEditedTs: null,
          contents: [],
        },
      },
    }
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
    console.log(page.properties['Slug'].rich_text[0]?.plain_text)
    slug = page.properties['Slug'].rich_text[0]?.plain_text ?? null
  }

  const blocks = await notion.blocks.children.list({
    block_id: page.id,
  })

  const contents: Content[] = []
  blocks.results.forEach((block) => {
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

  const post: Post = {
    id: page.id,
    title,
    slug,
    createdTs: (page as any).created_time,
    lastEditedTs: (page as any).last_edited_time,
    contents,
  }

  console.dir(post, { depth: null })

  return { props: { post } }
}

const Home: NextPage<StaticProps> = ({ post }) => {
  if (!post) return
  return (
    <div className={`m-auto min-h-[100vh] max-w-[800px] ${notojp.className}`}>
      <div className="mb-4 p-2">
        <h1 className="my-4 text-2xl font-bold">{post.title}</h1>
      </div>
    </div>
  )
}

export default Home
