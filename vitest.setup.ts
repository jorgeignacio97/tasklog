import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

// jsdom does not implement the <dialog> API (design AD-5). Emulate the two
// methods Modal uses so showModal/close toggle the element's open state,
// which tests can vi.spyOn to assert wiring.
const dialogProto = HTMLDialogElement.prototype as HTMLDialogElement & {
  showModal?: () => void
  close?: () => void
}

if (typeof dialogProto.showModal !== 'function') {
  dialogProto.showModal = function (this: HTMLDialogElement) {
    this.open = true
  }
}

if (typeof dialogProto.close !== 'function') {
  dialogProto.close = function (this: HTMLDialogElement) {
    this.open = false
  }
}
