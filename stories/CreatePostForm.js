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
  input TextArea {
    value: String
  }
  input Date {
    value: String
  }
`;

export const query = gql`
  mutation createPost($title: String!, $isDraft: Boolean, $views: Int, $average: Float, $state: State, $content: TextArea, $publishedAt: Date) {
    createPost(title: $title, isDraft: $isDraft, views: $views, average: $average, state: $state, content: $content, publishedAt: $publishAt) {
      id
      createdAt
    }
  }`;
const CreatePostForm = apolloForm(query, {
  defs,
  resolvers: {
    TextArea: { component: 'textarea' },
    Date: { component: 'input', type: 'date' }
  },
});

export default CreatePostForm;
