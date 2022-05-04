// lit-html 模板，提供 html 模板(简单js表达式及事件绑定)、render 渲染能力
import { render } from 'https://unpkg.com/lit-html?module'
// reactivity 是vue3.0的核心，shallowReactive 浅响应，effect 可以理解为 watch，提供属性响应及部分生命周期处理
import {
  shallowReactive,
  effect
} from 'https://unpkg.com/@vue/reactivity/dist/reactivity.esm-browser.js'

let currentInstance

export function defineComponent(name, propDefs, factory) {
  if (typeof propDefs === 'function') {
    factory = propDefs
    propDefs = []
  }
  // 自定义元素 custom element，原生 API
  customElements.define(
    name,
    class extends HTMLElement {
      // 设置需要监听的属性
      static get observedAttributes() {
        return propDefs
      }
      constructor() {
        super()
        // 属性接入 vue 的响应式
        const props = (this._props = shallowReactive({}))
        currentInstance = this
        // lit-html 的 html 生成的模板
        const template = factory.call(this, props)
        currentInstance = null
        // bm onBeforeMount
        this._bm && this._bm.forEach((cb) => cb())
        // shadowRoot，closed 该节点对外部 API 调用关闭，即创建的是一个不会受外部干扰的 web component
        const root = this.attachShadow({ mode: 'closed' })
        let isMounted = false
        effect(() => {
          if (isMounted) {
            // _bu, onBeforeUpdate
            this._bu && this._bu.forEach((cb) => cb())
          }
          // 将 template 内容挂载到 shadowRoot 上
          render(template(), root)
          if (isMounted) {
            // _u，onUpdated
            this._u && this._u.forEach((cb) => cb())
          } else {
            isMounted = true
          }
        })
      }
      // 首次挂载到 dom 上后的回调，onMounted
      connectedCallback() {
        this._m && this._m.forEach((cb) => cb())
      }
      // 卸载， onUnmounted
      disconnectedCallback() {
        this._um && this._um.forEach((cb) => cb())
      }
      // 属性监听
      attributeChangedCallback(name, oldValue, newValue) {
        this._props[name] = newValue
      }
    }
  )
}

function createLifecycleMethod(name) {
  return (cb) => {
    if (currentInstance) {
      ;(currentInstance[name] || (currentInstance[name] = [])).push(cb)
    }
  }
}

export const onBeforeMount = createLifecycleMethod('_bm')
export const onMounted = createLifecycleMethod('_m')
export const onBeforeUpdate = createLifecycleMethod('_bu')
export const onUpdated = createLifecycleMethod('_u')
export const onUnmounted = createLifecycleMethod('_um')

export * from 'https://unpkg.com/lit-html?module'
export * from 'https://unpkg.com/@vue/reactivity/dist/reactivity.esm-browser.js'
