import React from 'react'

export function ThemeScript() {
  const codeToRunOnClient = `
(function() {
  const theme = window.localStorage.getItem('theme') || 'dark'
  document.documentElement.classList.add(theme)
})()
`

  return <script dangerouslySetInnerHTML={{ __html: codeToRunOnClient }} />
}
