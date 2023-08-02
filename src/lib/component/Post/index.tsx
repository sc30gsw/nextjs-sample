import dayjs from 'dayjs'
import Link from 'next/link'
import type { FunctionComponent } from 'react'
import React from 'react'

import type { Post } from '@/types/post'

export const PostComponent: FunctionComponent<{ post: Post }> = ({ post }) => {
  return (
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
            更新日時: {dayjs(post.lastEditedTs).format('YYYY-MM-DD HH:mm;ss')}
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
  )
}
