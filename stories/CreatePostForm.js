import React from 'react';

import gql from 'graphql-tag'
import {
  apolloForm
} from '../lib/src/index';

export const query = gql`
  mutation createPost($title: String, $isDraft: Boolean, $views: Int, $average: Float) {
    createPost(title: $title, isDraft: $isDraft, views: $views, average: $average) {
      id
      createdAt
    }
  }`;
const CreatePostForm = apolloForm(query);

export default CreatePostForm;
