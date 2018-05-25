import renderers from './defaultRenderers';

import gql from 'graphql-tag';
import { apolloForm } from '../lib/src/index';

const schema = gql`
  scalar Date

  enum State {
    NOT_FOUND
    ACTIVE
    INACTIVE
    SUSPENDED
  }

  input TextArea {
    text: String
  }
`;

export const query = gql`
  mutation createPost(
    $title: String!
    $isDraft: Boolean
    $views: Int
    $average: Float
    $state: State
    $content: TextArea
    $publishedAt: Date
  ) {
    createPost(
      title: $title
      isDraft: $isDraft
      views: $views
      average: $average
      state: $state
      content: $content
      publishedAt: $publishAt
    ) {
      id
      createdAt
    }
  }
`;
const CreatePostForm = apolloForm(query, {
  schema,
  renderers,
});

export default CreatePostForm;
