import type { ArtisanId } from '@/domain/artisan/artisan'
import { Coordinates } from '@/domain/sales-point/coordinates'
import type { SalesPoint } from '@/domain/sales-point/sales-point'
import { isSalesPointType } from '@/domain/sales-point/sales-point-type'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type { ArtisanSalesPointLinkRepository } from '../ports/artisan-sales-point-link.repository'
import type { SalesPointRepository } from '../ports/sales-point.repository'

const MIN_NAME_LENGTH = 3
const MAX_NAME_LENGTH = 120

export type RegisterSalesPointInput = {
  artisanId: ArtisanId
  name: string
  type: string
  latitude: number
  longitude: number
  address?: string
  openingHours?: string
}

/**
 * Registering a place to sell and selling there are the same act: an artisan marks a point because
 * that is where their pieces are, so the link is created with it rather than asked for twice.
 */
export class RegisterSalesPoint {
  constructor(
    private readonly salesPoints: SalesPointRepository,
    private readonly links: ArtisanSalesPointLinkRepository,
  ) {}

  async execute(input: RegisterSalesPointInput): Promise<Result<SalesPoint>> {
    const coordinates = Coordinates.create(input.latitude, input.longitude)
    if (!coordinates.ok) return coordinates

    const name = input.name.trim().replace(/\s+/g, ' ')

    if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
      return err(
        domainError('sales_point.invalid_name', 'Dê um nome ao ponto, como as pessoas o chamam.'),
      )
    }

    if (!isSalesPointType(input.type)) {
      return err(domainError('sales_point.invalid_type', 'Escolha o tipo do ponto de venda.'))
    }

    const salesPoint: SalesPoint = {
      id: crypto.randomUUID(),
      name,
      type: input.type,
      coordinates: coordinates.value,
      address: blankToNull(input.address),
      openingHours: blankToNull(input.openingHours),
      createdBy: input.artisanId,
      createdAt: new Date(),
    }

    await this.salesPoints.save(salesPoint)
    await this.links.link(input.artisanId, salesPoint.id)

    return ok(salesPoint)
  }
}

/** An untouched optional field arrives as an empty string; the column means "not informed". */
function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()

  return trimmed ? trimmed : null
}
