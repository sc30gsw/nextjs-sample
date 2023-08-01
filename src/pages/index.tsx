import 'prismjs/themes/prism-tomorrow.css'

import { Client } from '@notionhq/client'
import type { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'
import dayjs from 'dayjs'
import type { GetStaticProps, NextPage } from 'next'
import Link from 'next/link'
import prism from 'prismjs'
import { useEffect } from 'react'

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
    <div className="m-auto min-h-[100vh] max-w-[800px]">
      {posts.map((post) => (
        <div className="mb-4 p-2" key={post.id}>
          <h1 className="my-4 text-2xl font-bold">
            <Link href={`/post/${encodeURIComponent(post.slug ?? '')}`}>
              {post.title}
            </Link>
          </h1>
          <div className="mb-2 flex justify-end">
            <div>
              <div className="mb-1 text-sm">
                作成日時: {dayjs(post.createdTs).format('YYYY-MM-DD HH:mm;ss')}
              </div>
              <div className="mb-1 text-sm">
                更新日時:{' '}
                {dayjs(post.lastEditedTs).format('YYYY-MM-DD HH:mm;ss')}
              </div>
            </div>
          </div>
          <div>
            {post.contents.map((content, index) => {
              const key = `${post.id}_${index}`
              switch (content.type) {
                case 'heading_2':
                  return (
                    <h2 key={key} className="mx-auto my-2 text-xl font-medium">
                      {content.text}
                    </h2>
                  )

                case 'heading_3':
                  return (
                    <p key={key} className="mx-auto my-2 text-lg font-medium">
                      {content.text}
                    </p>
                  )

                case 'paragraph':
                  return (
                    <p key={key} className="leading-6">
                      {content.text}
                    </p>
                  )

                case 'code':
                  return (
                    <pre
                      key={key}
                      // prismのシンタックスハイライトのクラス(lang-言語名)
                      // eslint-disable-next-line tailwindcss/no-custom-classname
                      className={`lang-${content.language} mx-auto my-4 leading-6`}
                    >
                      <code>{content.text}</code>
                    </pre>
                  )

                case 'quote':
                  return (
                    <blockquote
                      key={key}
                      className="m-0 border-l-2 border-custom-gray px-4 py-0 italic leading-6 text-custom-gray"
                    >
                      {content.text}
                    </blockquote>
                  )
              }
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Home
