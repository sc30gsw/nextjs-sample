import type { FunctionComponent, ReactNode } from 'react'
import React from 'react'

export const Layout: FunctionComponent<{ children: ReactNode }> = ({
  children,
}) => {
  return <div className="m-auto min-h-[100vh] max-w-[800px]">{children}</div>
}
