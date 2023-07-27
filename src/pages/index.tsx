import { Client } from '@notionhq/client'
import type { GetStaticProps } from 'next'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const getStaticProps: GetStaticProps<{}> = async () => {
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

  console.dir(database, { depth: null })

  const blocks = await notion.blocks.children.list({
    block_id: database.results[1]?.id,
  })

  console.dir(blocks, { depth: null })

  return { props: {} }
}

const Home = () => {
  return <div></div>
}

export default Home
