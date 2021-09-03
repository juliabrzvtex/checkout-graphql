// eslint-disable-next-line no-restricted-imports
import uniqBy from 'lodash/uniqBy'
import { CarbonEstimate } from 'vtex.checkout-graphql'

import {
  addressHasGeocoordinates,
  filterDeliveryOptions,
  getSelectedAddress,
} from './address'
import {
  getFormattedDeliveryOptions,
  hasDeliveryOption,
} from './delivery-options'
import { Clients } from '../clients'
import { DELIVERY, PICKUP_IN_POINT } from '../constants'
import { formatBusinessHoursList } from './pickup'

export const ORDER_FORM_BUCKET = 'order-form'
const NULL_IF_NOT_FOUND = true

export const getShippingData = (
  address: CheckoutAddress,
  logisticsInfo: LogisticsInfo[] | null
) => {
  const selectedAddresses = [address]
  const hasGeocoordinates = addressHasGeocoordinates(address)
  const logisticsInfoWithAddress =
    logisticsInfo?.map((li: LogisticsInfo) => ({
      ...li,
      addressId: address.addressId,
    })) ?? []

  const requestPayload = {
    logisticsInfo: logisticsInfoWithAddress,
    selectedAddresses,
    ...(hasGeocoordinates ? { clearAddressIfPostalCodeNotFound: false } : {}),
  }

  return requestPayload
}

export const selectShippingOption = ({
  shippingData,
  slaId,
  itemId,
  deliveryChannel,
}: {
  shippingData: ShippingData | null
  slaId: string
  itemId?: string
  deliveryChannel: string
}) => {
  const logisticsInfoWithSelectedDeliveryOption =
    shippingData?.logisticsInfo.map((li: LogisticsInfo) => {
      return {
        ...li,
        selectedDeliveryChannel: deliveryChannel,
        selectedSla:
          hasDeliveryOption(li.slas, slaId) &&
          (itemId != null ? li.itemId === itemId : true)
            ? slaId
            : li.selectedSla,
      }
    }) ?? []

  const deliveryAddress = getSelectedAddress(
    shippingData?.selectedAddresses ?? []
  )

  if (!deliveryAddress) {
    return shippingData
  }

  return getShippingData(
    deliveryAddress,
    logisticsInfoWithSelectedDeliveryOption
  )
}

export const selectAddress = ({
  shippingData,
  address,
}: {
  shippingData: ShippingData | null
  address: CheckoutAddress
}): ShippingData | null => {
  if (!shippingData) {
    return null
  }

  return {
    ...shippingData,
    selectedAddresses: [address],
  }
}

export const getShippingInfo = async ({
  clients,
  orderForm,
}: {
  clients: Clients
  orderForm: Pick<
    CheckoutOrderForm,
    'orderFormId' | 'shippingData' | 'totalizers' | 'orderFormId' | 'value'
  >
}) => {
  const logisticsInfo = orderForm.shippingData?.logisticsInfo ?? []
  const pickupPoints = orderForm.shippingData?.pickupPoints ?? []

  const countries = Array.from(
    new Set(logisticsInfo.flatMap(item => item.shipsTo)).values()
  )

  const availableAddresses = orderForm.shippingData?.availableAddresses ?? []

  const selectedAddress =
    orderForm.shippingData &&
    getSelectedAddress(orderForm.shippingData.selectedAddresses)

  const availableItemsLogisticsInfo = logisticsInfo
    ? logisticsInfo.filter((item: LogisticsInfo) => item.slas.length > 0)
    : []

  const deliveryOptions = uniqBy(
    availableItemsLogisticsInfo.flatMap((item: LogisticsInfo) => item.slas),
    'id'
  )

  // Since at this time shipping does not show scheduled delivery/pickup
  // we are filtering from them results.
  // Also we will filter deliveryOptions which does not apply to all LogisticsInfo.
  const filteredDeliveryOptions = filterDeliveryOptions(
    deliveryOptions,
    availableItemsLogisticsInfo
  )

  const carbonEstimate =
    (await clients.vbase.getJSON<Record<string, CarbonEstimate> | null>(
      ORDER_FORM_BUCKET,
      orderForm.orderFormId,
      NULL_IF_NOT_FOUND
    )) ?? {}

  const updatedDeliveryOptions = await getFormattedDeliveryOptions(
    carbonEstimate,
    filteredDeliveryOptions,
    availableItemsLogisticsInfo
  )

  const selectedDeliveryOption = updatedDeliveryOptions.find(
    option => option.isSelected && option.deliveryChannel === DELIVERY
  )

  const shippingTotalizer = orderForm.totalizers.find(
    totalizer => totalizer.id === 'Shipping'
  )

  if (
    selectedDeliveryOption &&
    shippingTotalizer &&
    selectedDeliveryOption.price !== shippingTotalizer.value
  ) {
    const newShippingData = selectShippingOption({
      slaId: selectedDeliveryOption.id,
      deliveryChannel: DELIVERY,
      shippingData: orderForm.shippingData,
    })

    await clients.checkout.updateOrderFormShipping(
      orderForm.orderFormId,
      newShippingData
    )

    const difference = selectedDeliveryOption.price - shippingTotalizer.value
    shippingTotalizer.value = selectedDeliveryOption.price
    orderForm.value += difference
  }

  return {
    availableAddresses,
    countries,
    deliveryOptions: updatedDeliveryOptions.filter(
      ({ deliveryChannel }) => deliveryChannel === DELIVERY
    ),
    pickupOptions: updatedDeliveryOptions
      .filter(({ deliveryChannel }) => deliveryChannel === PICKUP_IN_POINT)
      .map(pickupOption => {
        return {
          id: pickupOption.id,
          address: pickupOption.sla.pickupStoreInfo.address,
          deliveryChannel: pickupOption.sla.deliveryChannel,
          price: pickupOption.price,
          estimate: pickupOption.estimate,
          isSelected: pickupOption.isSelected,
          friendlyName: pickupOption.sla.pickupStoreInfo.friendlyName,
          additionalInfo: pickupOption.sla.pickupStoreInfo.additionalInfo,
          storeDistance: pickupOption.sla.pickupDistance,
          transitTime: pickupOption.sla.transitTime,
          businessHours: formatBusinessHoursList(
            pickupPoints.find(
              (pp: PickupPoint) => pp.id === pickupOption.pickupPointId
            )?.businessHours ?? []
          ),
        }
      }),
    selectedAddress,
  }
}

export async function calculateCarbonEstimate({
  clients,
  dockId,
  orderForm,
}: {
  clients: Clients
  dockId: string
  orderForm: CheckoutOrderForm
}): Promise<CarbonEstimate> {
  const dock = await clients.logisticsRest.getLoadingDock({ id: dockId })
  if (dock.address?.postalCode == null) {
    return { cost: 0, carbonKg: 0 }
  }

  try {
    console.log(dockId, JSON.stringify(dock.address, null, 2))

    const estimate = await clients.cloverly.estimateShipping({
      zipFrom: dock.address.postalCode,
      zipTo: '10001',
    })

    console.log(JSON.stringify(estimate, null, 2))

    return {
      cost: estimate.total_cost_in_usd_cents,
      carbonKg: estimate.equivalent_carbon_in_kg,
    }
  } catch {
    return { cost: 0, carbonKg: 0 }
  }
}
