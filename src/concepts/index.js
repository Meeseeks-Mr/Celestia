import { module1 } from './module1'
import { module2 } from './module2'
import { module3 } from './module3'
import { module4 } from './module4'
import { module5 } from './module5'
import { module6 } from './module6'
import { module7 } from './module7'

export const MODULES = [
  { id: 1, name: 'Earth & Sky', shortName: 'Basics', color: '#00E5FF', icon: '🌍' },
  { id: 2, name: 'Coordinates', shortName: 'Coords', color: '#FFB830', icon: '📐' },
  { id: 3, name: 'Motion & Time', shortName: 'Motion', color: '#FF8C42', icon: '⏱️' },
  { id: 4, name: 'PZX Triangle', shortName: 'PZX', color: '#00E5FF', icon: '🔺' },
  { id: 5, name: 'Celestial Fix', shortName: 'Fix', color: '#00E676', icon: '📌' },
  { id: 6, name: 'Route Geometry', shortName: 'Routes', color: '#00BCD4', icon: '✈️' },
  { id: 7, name: 'Twilight', shortName: 'Twilight', color: '#FF8C42', icon: '🌆' },
]

export const ALL_CONCEPTS = [
  ...module1,
  ...module2,
  ...module3,
  ...module4,
  ...module5,
  ...module6,
  ...module7,
]

export const CONCEPTS_BY_MODULE = {
  1: module1,
  2: module2,
  3: module3,
  4: module4,
  5: module5,
  6: module6,
  7: module7,
}

export const getConceptById = (id) => ALL_CONCEPTS.find((c) => c.id === id)

export const DIFFICULTY_COLORS = {
  basic: '#00E676',
  intermediate: '#FFB830',
  advanced: '#FF6B6B',
}

export const DIFFICULTY_LABELS = {
  basic: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}
