import { Decimal } from '@prisma/client/runtime/library'

import { create } from './core.js'

const { math, is } = create(Decimal)

export { math, is }
