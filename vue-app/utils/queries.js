import gql from "graphql-tag";

export const GET_BY_CATEGORY = {
    query: gql`
      query {
        categories(
          where: { id: "0x91d747cbc7f58b7ed03eab308da9cb036bf32cf6" }
        ) {
          id
          description
          imageHash
          imageUrl
          projects {
            id
            name
            description
            website
            twitter
            avatar
            image
            updatedAt
            owner {
              id
            }
          }
        }
      }
    `
  }