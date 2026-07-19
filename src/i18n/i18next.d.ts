import 'i18next'
import type common from '@/locales/en/common.json'
import type domain from '@/locales/en/domain.json'
import type today from '@/locales/en/today.json'
import type workout from '@/locales/en/workout.json'
import type progress from '@/locales/en/progress.json'
import type library from '@/locales/en/library.json'
import type checkin from '@/locales/en/checkin.json'
import type seed from '@/locales/en/seed.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof common
      domain: typeof domain
      today: typeof today
      workout: typeof workout
      progress: typeof progress
      library: typeof library
      checkin: typeof checkin
      seed: typeof seed
    }
  }
}
