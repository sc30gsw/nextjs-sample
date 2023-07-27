import { Client } from '@notionhq/client'
import type { GetStaticProps } from 'next'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export const getStaticProps: GetStaticProps<{}> = async () => {
  const database = await notion.databases.query({
    // DB接続
    database_id: process.env.NOTION_DATABASE_ID as string,
  })

  console.dir(database, { depth: null })

  return { props: {} }
}

const Home = () => {
  return <div></div>
}

export default Home
