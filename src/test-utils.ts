import { HarmajaStaticOutput } from './harmaja'
import * as H from './index'
export * from './observable/test-utils'

export function mounted(element: H.HarmajaOutput) {
  const parent = document.createElement('html')
  const root = document.createElement('div')
  parent.appendChild(root)

  H.mount(element, root)

  return element as HarmajaStaticOutput
}

export function renderAsString(output: H.HarmajaOutput): string {
  return getHtml(mounted(output))
}

export function getHtml(element: H.HarmajaStaticOutput): string {
  if (element instanceof Array) {
    return element.map(getHtml).join('')
  } else {
    if (element instanceof HTMLElement) {
      return element.outerHTML
    } else {
      return element.textContent || ''
    }
  }
}
export function wait(delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay))
}
