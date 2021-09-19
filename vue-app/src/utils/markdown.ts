import * as MarkdownIt from 'markdown-it'
import * as mila from 'markdown-it-link-attributes'

export const markdown = new MarkdownIt({ linkify: true, breaks: true }).use(
  mila,
  {
    attrs: {
      target: '_blank',
      rel: 'noopener',
    },
  }
)
