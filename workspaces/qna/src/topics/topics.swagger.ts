export const MessageResponseSwagger = {
  schema: { example: { message: 'Subscribed' } }
};

export const UnsubscribedResponseSwagger = {
  schema: { example: { message: 'Unsubscribed' } }
};

export const VoteRecordedResponseSwagger = {
  schema: { example: { message: 'Vote recorded' } }
};

export const VoteRemovedResponseSwagger = {
  schema: { example: { message: 'Vote removed' } }
};

export const TopicCreatedResponseSwagger = {
  schema: {
    example: {
      id: '6638e1f2c2a1b2c3d4e5f6c9',
      title: 'Best plants for indoor gardening?',
      body: 'I am looking for recommendations on easy-to-care-for indoor plants.',
      slug: 'best-plants-for-indoor-gardening',
      is_solved: false,
      user_id: '6638e1f2c2a1b2c3d4e5f6a7',
      substack_id: '6638e1f2c2a1b2c3d4e5f6b8',
      created_at: '2024-05-07T12:00:00.000Z',
      updated_at: '2024-05-07T12:00:00.000Z'
    }
  }
};

export const SearchTopicsResponseSwagger = {
  schema: {
    example: {
      data: [
        {
          id: '6638e1f2c2a1b2c3d4e5f6c9',
          title: 'Best plants for indoor gardening?',
          body: 'I am looking for recommendations on easy-to-care-for indoor plants.',
          slug: 'best-plants-for-indoor-gardening',
          is_solved: false,
          user_id: '6638e1f2c2a1b2c3d4e5f6a7',
          substack_id: '6638e1f2c2a1b2c3d4e5f6b8',
          created_at: '2024-05-07T12:00:00.000Z',
          updated_at: '2024-05-07T12:00:00.000Z',
          vote_score: 3,
          comments_count: 2,
          subscriptions_count: 1,
          has_accepted_answer: false,
          is_subscribed: false
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1
      }
    }
  }
};

export const MarkSolvedResponseSwagger = {
  schema: {
    example: {
      id: '6638e1f2c2a1b2c3d4e5f6c9',
      title: 'Best plants for indoor gardening?',
      body: 'I am looking for recommendations on easy-to-care-for indoor plants.',
      slug: 'best-plants-for-indoor-gardening',
      is_solved: true,
      user_id: '6638e1f2c2a1b2c3d4e5f6a7',
      substack_id: '6638e1f2c2a1b2c3d4e5f6b8',
      created_at: '2024-05-07T12:00:00.000Z',
      updated_at: '2024-05-07T12:00:00.000Z'
    }
  }
};

export const TopicUpdatedResponseSwagger = {
  schema: {
    example: {
      id: '6638e1f2c2a1b2c3d4e5f6c9',
      title: 'Updated topic title',
      body: 'Updated body content',
      slug: 'updated-topic-title',
      is_solved: false,
      user_id: '6638e1f2c2a1b2c3d4e5f6a7',
      substack_id: '6638e1f2c2a1b2c3d4e5f6b8',
      created_at: '2024-05-07T12:00:00.000Z',
      updated_at: '2024-05-07T12:00:00.000Z'
    }
  }
};

export const DeleteTopicResponseSwagger = {
  schema: { example: { message: 'Topic deleted successfully' } }
};

export const GetCommentsByTopicResponseSwagger = {
  schema: {
    example: [
      {
        id: '6638e1f2c2a1b2c3d4e5f6d1',
        topic_id: '6638e1f2c2a1b2c3d4e5f6c9',
        user_id: '6638e1f2c2a1b2c3d4e5f6b8',
        content: 'This is a comment.',
        is_accepted: false,
        created_at: '2024-05-07T12:00:00.000Z',
        updated_at: '2024-05-07T12:00:00.000Z'
      }
    ]
  }
};

export const GetTopicByIdResponseSwagger = {
  schema: {
    example: {
      id: '6638e1f2c2a1b2c3d4e5f6c9',
      title: 'Best plants for indoor gardening?',
      body: 'I am looking for recommendations on easy-to-care-for indoor plants.',
      slug: 'best-plants-for-indoor-gardening',
      is_solved: false,
      user_id: '6638e1f2c2a1b2c3d4e5f6a7',
      substack_id: '6638e1f2c2a1b2c3d4e5f6b8',
      created_at: '2024-05-07T12:00:00.000Z',
      updated_at: '2024-05-07T12:00:00.000Z',
      vote_score: 3,
      comments_count: 2,
      subscriptions_count: 1,
      has_accepted_answer: false,
      is_subscribed: false
    }
  }
};
