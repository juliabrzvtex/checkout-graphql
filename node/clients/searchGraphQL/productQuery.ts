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
  product(identifier: {field: id, values: $values}) {
    productName
    productId
    items {
      itemId
      name
      variations {
        name
        values
      }
    }
  }
}
`
