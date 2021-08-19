import {
  InstanceOptions,
  IOContext,
  IOResponse,
  ExternalClient,
  RequestConfig,
} from '@vtex/api'
import { UserProfileInput } from 'vtex.checkout-graphql'

import { statusToError } from '../utils'

export interface SimulationData {
  country: string
  items: Array<{ id: string; quantity: number | string; seller: string }>
  postalCode?: string
  isCheckedIn?: boolean
  priceTables?: string[]
  marketingData?: Record<string, string>
}

export class Checkout extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(`http://portal.vtexcommercestable.com.br`, ctx, {
      ...options,
    })
  }

  public savePaymentToken = (paymentTokens: any) => {
    return this.post(
      this.routes.savePaymentToken(this.getChannelQueryString()),
      paymentTokens,
      { metric: 'checkout-save-payment' }
    )
  }

  public getPaymentSession = () => {
    return this.get<PaymentSession>(this.routes.getPaymentSession())
  }

  public addItem = (
    orderFormId: string,
    items: Array<Omit<OrderFormItemInput, 'uniqueId' | 'index' | 'options'>>,
    salesChannel?: string,
    allowedOutdatedData?: string[],
    account?: string,
  ) =>
    this.patch<CheckoutOrderForm>(
      this.routes.addItem(
        orderFormId,
        this.getChannelQueryString(salesChannel),
        account,
      ),
      {
        orderItems: items,
        allowedOutdatedData,
      },
      { metric: 'checkout-addItem' }
    )

  public cancelOrder = (orderFormId: string, reason: string) =>
    this.post(
      this.routes.cancelOrder(orderFormId),
      { reason },
      { metric: 'checkout-cancelOrder' }
    )

  public setOrderFormCustomData = (
    orderFormId: string,
    appId: string,
    field: string,
    value: any
  ) =>
    this.put(
      this.routes.orderFormCustomData(orderFormId, appId, field),
      { value },
      { metric: 'checkout-setOrderFormCustomData' }
    )

  public updateItems = (
    orderFormId: string,
    orderItems: Array<Omit<OrderFormItemInput, 'id'>>,
    splitItem: boolean,
    allowedOutdatedData?: string[],
    account?: string,
  ) =>
    this.patch<CheckoutOrderForm>(
      this.routes.addItem(orderFormId, this.getChannelQueryString(undefined), account),
      {
        orderItems,
        noSplitItem: !splitItem,
        allowedOutdatedData,
      },
      { metric: 'checkout-updateItems' }
    )

  public updateOrderFormIgnoreProfile = (
    orderFormId: string,
    ignoreProfileData: boolean
  ) =>
    this.patch(
      this.routes.orderFormProfile(orderFormId),
      { ignoreProfileData },
      { metric: 'checkout-updateOrderFormIgnoreProfile' }
    )

  public updateOrderFormPayment = (
    orderFormId: string,
    paymentData: PaymentDataInput
  ) =>
    this.post<CheckoutOrderForm>(
      this.routes.attachmentsData(orderFormId, 'paymentData'),
      paymentData,
      { metric: 'checkout-updateOrderFormPayment' }
    )

  public updateOrderFormProfile = (
    orderFormId: string,
    fields: UserProfileInput
  ) =>
    this.post<CheckoutOrderForm>(
      this.routes.attachmentsData(orderFormId, 'clientProfileData'),
      fields,
      { metric: 'checkout-updateOrderFormProfile' }
    )

  public updateOrderFormShipping = (orderFormId: string, shipping: any) =>
    this.post<CheckoutOrderForm>(
      this.routes.attachmentsData(orderFormId, 'shippingData'),
      shipping,
      { metric: 'checkout-updateOrderFormShipping' }
    )

  public updateOrderFormMarketingData = (
    orderFormId: string,
    marketingData: any,
    account?: string,
  ) =>
    this.post<CheckoutOrderForm>(
      this.routes.attachmentsData(orderFormId, 'marketingData', account),
      marketingData,
      { metric: 'checkout-updateOrderFormMarketingData' }
    )

  public updateOrderFormClientPreferencesData = (
    orderFormId: string,
    preferencesData: CheckoutClientPreferencesData
  ) =>
    this.post<CheckoutOrderForm>(
      this.routes.attachmentsData(orderFormId, 'clientPreferencesData'),
      preferencesData,
      { metric: 'checkout-updateOrderFormClientPreferencesData' }
    )

  public updateOrderFromOpenTextField = (
    orderFromId: string,
    openTextField: OpenTextField
  ) =>
    this.post<CheckoutOrderForm>(
      this.routes.attachmentsData(orderFromId, 'openTextField'),
      openTextField,
      { metric: 'checkout-updateOrderFromOpenTextField' }
    )

  public updateSubscriptionDataField = (
    orderFormId: string,
    subscriptionData: SubscriptionData
  ) =>
    this.post<CheckoutOrderForm>(
      this.routes.attachmentsData(orderFormId, 'subscriptionData'),
      subscriptionData,
      { metric: 'checkout-updateSubscriptionDataField' }
    )

  public addAssemblyOptions = async (
    orderFormId: string,
    itemId: string | number,
    assemblyOptionsId: string,
    body: any
  ) =>
    this.post(
      this.routes.assemblyOptions(orderFormId, itemId, assemblyOptionsId),
      body,
      { metric: 'checkout-addAssemblyOptions' }
    )

  public removeAssemblyOptions = async (
    orderFormId: string,
    itemId: string | number,
    assemblyOptionsId: string,
    body: any
  ) =>
    this.delete(
      this.routes.assemblyOptions(orderFormId, itemId, assemblyOptionsId),
      { metric: 'checkout-removeAssemblyOptions', data: body }
    )

  public addItemOffering = async (
    orderFormId: string,
    itemIndex: number,
    offeringId: string,
    offeringInfo?: any
  ) =>
    this.post<CheckoutOrderForm>(
      this.routes.offering(orderFormId, itemIndex),
      { id: offeringId, offeringInfo },
      { metric: 'checkout-addItemOffering' }
    )

  public removeItemOffering = async (
    orderFormId: string,
    itemIndex: number,
    offeringId: string
  ) =>
    this.post<CheckoutOrderForm>(
      this.routes.removeOffering(orderFormId, itemIndex, offeringId),
      { Id: offeringId },
      { metric: 'checkout-removeItemOffering' }
    )

  public addBundleItemAttachment = async (
    orderFormId: string,
    itemIndex: number,
    bundleItemId: string,
    attachmentName: string,
    attachmentContent: any
  ) =>
    this.post<CheckoutOrderForm>(
      this.routes.bundleItemAttachment(
        orderFormId,
        itemIndex,
        bundleItemId,
        attachmentName
      ),
      { content: attachmentContent },
      { metric: 'checkout-addBundleItemAttachment' }
    )

  public removeBundleItemAttachment = async (
    orderFormId: string,
    itemIndex: number,
    bundleItemId: string,
    attachmentName: string,
    attachmentContent: any
  ) =>
    this.delete<CheckoutOrderForm>(
      this.routes.bundleItemAttachment(
        orderFormId,
        itemIndex,
        bundleItemId,
        attachmentName
      ),
      {
        metric: 'checkout-removeBundleItemAttachment',
        data: { content: attachmentContent },
      }
    )

  public updateOrderFormCheckin = (orderFormId: string, checkinPayload: any) =>
    this.post(this.routes.checkin(orderFormId), checkinPayload, {
      metric: 'checkout-updateOrderFormCheckin',
    })

  public orderForm = (orderFormId?: string, refreshOutdatedData = false, account?: string) => {
    return this.post<CheckoutOrderForm>(
      this.routes.orderForm(
        orderFormId,
        this.getOrderFormQueryString(refreshOutdatedData),
        account,
      ),
      {},
      { metric: 'checkout-orderForm' }
    )
  }

  public orderFormRaw = (orderFormId?: string, refreshOutdatedData = false, account?: string) => {
    return this.postRaw<CheckoutOrderForm>(
      this.routes.orderForm(
        orderFormId,
        this.getOrderFormQueryString(refreshOutdatedData),
        account,
      ),
      {},
      { metric: 'checkout-orderForm' }
    )
  }

  public orders = () =>
    this.get(this.routes.orders(), { metric: 'checkout-orders' })

  public simulation = (simulation: SimulationData) =>
    this.post(
      this.routes.simulation(this.getChannelQueryString()),
      simulation,
      {
        metric: 'checkout-simulation',
      }
    )

  public insertCoupon = (orderFormId: string, coupon: string) =>
    this.post<CheckoutOrderForm>(this.routes.insertCoupon(orderFormId), {
      text: coupon,
    })

  public clearMessages = (orderFormId: string) =>
    this.post<CheckoutOrderForm>(this.routes.clearMessages(orderFormId), {})

  public getProfile = (email: string) =>
    this.get<CheckoutProfile>(this.routes.profile(email))

  public updateItemsOrdination = (
    orderFormId: string,
    ascending: boolean,
    criteria: string
  ) =>
    this.post<CheckoutOrderForm>(
      this.routes.updateItemsOrdination(orderFormId),
      {
        ascending,
        criteria,
      },
      { metric: 'checkout-orderForm' }
    )

  protected get = <T>(url: string, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      // ...this.getCommonHeaders(),
    }
    return this.http.get<T>(url, config).catch(statusToError) as Promise<T>
  }

  protected post = <T>(url: string, data?: any, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      // ...this.getCommonHeaders(),
    }
    return this.http.post<T>(url, data, config).catch(statusToError) as Promise<
      T
    >
  }

  protected postRaw = async <T>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ) => {
    config.headers = {
      ...config.headers,
      // ...this.getCommonHeaders(),
    }
    return this.http
      .postRaw<T>(url, data, config)
      .catch(statusToError) as Promise<IOResponse<T>>
  }

  protected delete = <T>(url: string, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      // ...this.getCommonHeaders(),
    }
    return this.http.delete<T>(url, config).catch(statusToError) as Promise<
      IOResponse<T>
    >
  }

  protected patch = <T>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ) => {
    config.headers = {
      ...config.headers,
      // ...this.getCommonHeaders(),
    }
    return this.http
      .patch<T>(url, data, config)
      .catch(statusToError) as Promise<T>
  }

  protected put = <T>(url: string, data?: any, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      // ...this.getCommonHeaders(),
    }
    return this.http.put<T>(url, data, config).catch(statusToError) as Promise<
      T
    >
  }

  // private getCommonHeaders = () => {
  //   const { orderFormId } = (this.context as unknown) as CustomIOContext
  //   const checkoutCookie = orderFormId ? checkoutCookieFormat(orderFormId) : ''
  //   return {
  //     Cookie: `${checkoutCookie}vtex_segment=${this.context.segmentToken};vtex_session=${this.context.sessionToken};`,
  //   }
  // }

  private getChannelQueryString = (salesChannel?: string) => {
    const { segment } = (this.context as unknown) as CustomIOContext
    const channel = salesChannel ?? segment?.channel
    const queryString = channel ? `?sc=${channel}` : ''
    return queryString
  }

  private getOrderFormQueryString = (refreshOutdatedData?: boolean) => {
    if (refreshOutdatedData)
      return `?refreshOutdatedData=${refreshOutdatedData}`

    return ''
  }

  private get routes() {
    const base = '/api/checkout/pub'
    return {
      addItem: (orderFormId: string, queryString: string, account?: string) =>
        `${base}/orderForm/${orderFormId}/items${queryString}${queryString ? '&' : '?'}an=${account ?? this.context.account}`,
      assemblyOptions: (
        orderFormId: string,
        itemId: string | number,
        assemblyOptionsId: string,
        account?: string,
      ) =>
        `${base}/orderForm/${orderFormId}/items/${itemId}/assemblyOptions/${encodeURI(
          assemblyOptionsId
        )}?an=${account ?? this.context.account}`,
      attachmentsData: (orderFormId: string, field: string, account?: string) =>
        `${base}/orderForm/${orderFormId}/attachments/${field}?an=${account ?? this.context.account}`,
      cancelOrder: (orderFormId: string, account?: string) =>
        `${base}/orders/${orderFormId}/user-cancel-request?an=${account ?? this.context.account}`,
      checkin: (orderFormId: string, account?: string) =>
        `${base}/orderForm/${orderFormId}/checkIn?an=${account ?? this.context.account}`,
      clearMessages: (orderFormId: string, account?: string) =>
        `${base}/orderForm/${orderFormId}/messages/clear?an=${account ?? this.context.account}`,
      insertCoupon: (orderFormId: string, account?: string) =>
        `${base}/orderForm/${orderFormId}/coupons?an=${account ?? this.context.account}`,
      orderForm: (orderFormId?: string, queryString?: string, account?: string) =>
        `${base}/orderForm/${orderFormId ?? ''}${queryString}${queryString ? '&' : '?'}an=${account ?? this.context.account}`,
      orderFormCustomData: (
        orderFormId: string,
        appId: string,
        field: string,
        account?: string
      ) => `${base}/orderForm/${orderFormId}/customData/${appId}/${field}?an=${account ?? this.context.account}`,
      orders: (account?: string) => `${base}/orders?an=${account ?? this.context.account}`,
      orderFormProfile: (orderFormId: string, account?: string) =>
        `${base}/orderForm/${orderFormId}/profile?an=${account ?? this.context.account}`,
      profile: (email: string, account?: string) => `${base}/profiles/?email=${email}?an=${account ?? this.context.account}`,
      simulation: (queryString: string, account?: string) =>
        `${base}/orderForms/simulation${queryString}${queryString ? '&' : '?'}an=${account ?? this.context.account}`,
      updateItems: (orderFormId: string, account?: string) =>
        `${base}/orderForm/${orderFormId}/items/update?an=${account ?? this.context.account}`,
      offering: (orderFormId: string, itemIndex: number, account?: string) =>
        `${base}/orderForm/${orderFormId}/items/${itemIndex}/offerings?an=${account ?? this.context.account}`,
      removeOffering: (
        orderFormId: string,
        itemIndex: number,
        offeringId: string,
        account?: string,
      ) =>
        `${base}/orderForm/${orderFormId}/items/${itemIndex}/offerings/${offeringId}/remove?an=${account ?? this.context.account}`,
      bundleItemAttachment: (
        orderFormId: string,
        itemIndex: number,
        bundleItemId: string,
        attachmentName: string,
        account?: string,          
      ) =>
        `${base}/orderForm/${orderFormId}/items/${itemIndex}/bundles/${bundleItemId}/attachments/${attachmentName}?an=${account ?? this.context.account}`,
      savePaymentToken: (queryString: string, account?: string) =>
        `${base}/current-user/payment-tokens/${queryString}${queryString ? '&' : '?'}an=${account ?? this.context.account}`,
      getPaymentSession: () => `${base}/payment-session`,
      updateItemsOrdination: (orderFormId: string, account?: string) =>
        `${base}/orderForm/${orderFormId}/itemsOrdination?an=${account ?? this.context.account}`,
    }
  }
}
