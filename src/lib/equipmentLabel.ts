import { useTranslation } from 'react-i18next'
import type { Equipment } from '@/domain/types'

const EQUIPMENT_MESSAGE_KEY: Record<Equipment, string> = {
  barbell: 'common:equipment.barbell',
  dumbbell: 'common:equipment.dumbbell',
  bench: 'common:equipment.bench',
  band: 'common:equipment.band',
  bodyweight: 'common:equipment.bodyweight',
  machine: 'common:equipment.machine',
}

export function useEquipmentLabel(equipment: Equipment): string {
  const { t } = useTranslation()
  return t(EQUIPMENT_MESSAGE_KEY[equipment])
}
