import { useMemo } from 'react'
import DOMPurify from 'dompurify'

const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<]+)/gi
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const INVISIBLE_PREVIEW_CHARS = /[\u00a0\u200b-\u200f\u2060\ufeff]/g
const LAYOUT_ELEMENTS = 'table, thead, tbody, tfoot, tr, td, th'
const EMPTY_LAYOUT_ELEMENTS = 'div, p, table, thead, tbody, tfoot, tr, td, th'

function removeSenderHiddenContent(html) {
  const sourceDocument = new DOMParser().parseFromString(html, 'text/html')

  sourceDocument.body.querySelectorAll('[hidden], [aria-hidden="true"], [style]').forEach(element => {
    const style = element.style
    const compactStyle = (element.getAttribute('style') || '').toLowerCase().replace(/\s/g, '')
    const hidesOverflowAtZeroHeight =
      ['0', '0px'].includes(style.maxHeight) && style.overflow === 'hidden'
    const isHidden =
      element.hasAttribute('hidden') ||
      element.getAttribute('aria-hidden')?.toLowerCase() === 'true' ||
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      hidesOverflowAtZeroHeight ||
      compactStyle.includes('mso-hide:all')

    if (isHidden) element.remove()
  })

  return sourceDocument.body.innerHTML
}

function collapseEmailLayout(documentNode) {
  documentNode.body.querySelectorAll(LAYOUT_ELEMENTS).forEach(element => {
    element.removeAttribute('height')
  })

  documentNode.body.querySelectorAll('*').forEach(element => {
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE) return
      const value = node.textContent || ''
      const visibleValue = value.replace(INVISIBLE_PREVIEW_CHARS, '')
      if (visibleValue !== value && !visibleValue.trim()) {
        node.textContent = ' '
      }
    })
  })

  documentNode.body.querySelectorAll('*').forEach(element => {
    let consecutiveBreaks = 0
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeName === 'BR') {
        consecutiveBreaks += 1
        if (consecutiveBreaks > 2) node.remove()
      } else if ((node.textContent || '').trim()) {
        consecutiveBreaks = 0
      }
    })
  })

  Array.from(documentNode.body.querySelectorAll(EMPTY_LAYOUT_ELEMENTS)).reverse().forEach(element => {
    const visibleText = (element.textContent || '').replace(INVISIBLE_PREVIEW_CHARS, '').trim()
    if (!visibleText && !element.querySelector('img, hr')) element.remove()
  })
}

function PlainEmailBody({ text }) {
  const parts = (text || '').split(URL_PATTERN)

  return (
    <div className="modal-body modal-body--plain">
      {parts.map((part, index) => {
        if (!/^(?:https?:\/\/|www\.)/i.test(part)) return part
        const match = part.match(/^(.*?)([),.;!?]*)$/)
        const url = match?.[1] || part
        const punctuation = match?.[2] || ''
        const href = url.startsWith('www.') ? `https://${url}` : url
        return (
          <span key={`${url}-${index}`}>
            <a href={href} target="_blank" rel="noopener noreferrer">{url}</a>
            {punctuation}
          </span>
        )
      })}
    </div>
  )
}

function sanitizeEmailHtml(html) {
  const visibleHtml = removeSenderHiddenContent(html)
  const clean = DOMPurify.sanitize(visibleHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [
      'audio', 'base', 'button', 'embed', 'form', 'iframe', 'input', 'link',
      'math', 'meta', 'object', 'option', 'script', 'select', 'source', 'style',
      'svg', 'textarea', 'video',
    ],
    FORBID_ATTR: ['srcset', 'style'],
  })
  const documentNode = new DOMParser().parseFromString(clean, 'text/html')
  collapseEmailLayout(documentNode)

  documentNode.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href')?.trim()
    try {
      const parsed = new URL(href)
      if (!SAFE_LINK_PROTOCOLS.has(parsed.protocol)) throw new Error('Unsafe link')
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')
    } catch {
      link.removeAttribute('href')
      link.removeAttribute('target')
      link.removeAttribute('rel')
    }
  })

  documentNode.querySelectorAll('img').forEach(image => {
    const source = image.getAttribute('src')?.trim()
    try {
      const parsed = new URL(source)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported image')
      image.setAttribute('loading', 'lazy')
      image.setAttribute('decoding', 'async')
      image.setAttribute('referrerpolicy', 'no-referrer')
      if (!image.getAttribute('alt')) image.setAttribute('alt', 'Email image')
    } catch {
      image.remove()
    }
  })

  return documentNode.body.innerHTML
}

export default function EmailBody({ html, text }) {
  const sanitizedHtml = useMemo(() => html ? sanitizeEmailHtml(html) : '', [html])

  if (!sanitizedHtml) return <PlainEmailBody text={text} />

  return (
    <div
      className="modal-body modal-body--rich"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
