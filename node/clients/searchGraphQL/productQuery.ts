interface Offer {
  AvailableQuantity: number
}

interface Seller {
  sellerDefault: boolean
  commertialOffer: Offer
}

export interface ProductResponse {
  productName: string
  productId: string
  items: Array<{
    itemId: string
    name: string
    variations: Array<{
      name: string
      values: string[]
    }>
    sellers: Seller[]
  }>
}

export interface ProductsByIdentifierResponse {
  productsByIdentifier: ProductResponse[]
}

export interface ProductArgs {
  values: string[]
}

export const query = `
query Product($values: [ID!]!) {
  productsByIdentifier(field: id, values: $values) {
    productName
    productId
    items {
      itemId
      name
      variations {
        name
        values
      }
      sellers {
        sellerDefault
        commertialOffer {
          AvailableQuantity
        }
      }
    }
  }
}
`
