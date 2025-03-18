/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUsers = /* GraphQL */ `
  query GetUsers {
    getUsers {
      id
      name
      email
      wantname
      bio
      __typename
    }
  }
`;
export const getProfile = /* GraphQL */ `
  query GetProfile($userId: ID!) {
    getProfile(userId: $userId) {
      id
      cognito_user_id
      display_name
      bio
      favorite_ingredients
      refrigerator_brand
      created_at
      updated_at
      __typename
    }
  }
`;
