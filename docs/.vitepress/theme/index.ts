import DefaultTheme from 'vitepress/theme'
import ProofTable from './components/ProofTable.vue'
import './generated/dk-tokens.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ProofTable', ProofTable)
  }
}
