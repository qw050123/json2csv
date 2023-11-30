import { createApp } from 'vue';
import App from './App.vue';
// Vuetify
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import '@/assets/style/reset.css';
import '@/assets/style/global.scss';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  defaults: {
    VTextField: { density: 'comfortable', variant: 'outlined' },
    VSelect: { density: 'comfortable', variant: 'outlined' },
    VTextarea: { density: 'comfortable', variant: 'outlined' },
    VTable: { density: 'comfortable' },
    VBtn: { density: 'comfortable' }
  }
});
const app = createApp(App);
app.use(vuetify);
app.mount('#app');
