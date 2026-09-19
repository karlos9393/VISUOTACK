'use client'
import { useEffect, useRef } from 'react'
import { TaskIcon } from './task-icon'

let openDialogs = 0
let previousOverflow = ''

export function TaskDialog({
  title,
  children,
  onClose,
  drawer = false
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  drawer?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    if (openDialogs === 0) previousOverflow = document.body.style.overflow
    openDialogs += 1
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      openDialogs -= 1
      if (openDialogs === 0) document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className={
        drawer
          ? 'fixed inset-y-0 left-auto right-0 !m-0 h-dvh max-h-dvh w-full max-w-xl border-0 bg-white p-0 shadow-2xl backdrop:bg-gray-900/25'
          : '!m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-white p-0 shadow-xl backdrop:bg-gray-900/25'
      }
    >
      <div
        className="flex h-full flex-col text-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <TaskIcon name="close" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </dialog>
  )
}
