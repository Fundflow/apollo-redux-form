import React from 'react';

import gql from 'graphql-tag'
import {
  apolloForm
} from '../lib/src/index';

const defs = gql`
  enum State {
    NOT_FOUND
    ACTIVE
    INACTIVE
    SUSPENDED
  }
`;

export const query = gql`
  mutation createPost($title: String!, $isDraft: Boolean, $views: Int, $average: Float, $state: State) {
    createPost(title: $title, isDraft: $isDraft, views: $views, average: $average, state: $state) {
      id
      createdAt
    }
  }`;
const CreatePostForm = apolloForm(query, {defs});

export default CreatePostForm;
