import { useState } from 'react'

export type FontSize = 'xs' | 'small' | 'medium' | 'large' | 'xl' | 'xxl'

export const FONT_SIZES: FontSize[] = ['xs', 'small', 'medium', 'large', 'xl', 'xxl']

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  xs:     'Tiny',
  small:  'Small',
  medium: 'Medium',
  large:  'Large',
  xl:     'X-Large',
  xxl:    'Huge',
}

function applySize(size: FontSize) {
  document.documentElement.setAttribute('data-fontsize', size)
}

export function useFontSize() {
  const [size, setSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('budget-fontsize') as FontSize
    const valid = FONT_SIZES.includes(saved) ? saved : 'medium'
    applySize(valid)
    return valid
  })

  const updateSize = (newSize: FontSize) => {
    applySize(newSize)
    localStorage.setItem('budget-fontsize', newSize)
    setSize(newSize)
  }

  return { currentSize: size, setSize: updateSize }
}
