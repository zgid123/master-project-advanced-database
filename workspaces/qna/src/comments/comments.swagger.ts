export const CommentCreatedResponseSwagger = {
  schema: {
    example: {
      id: '6638e1f2c2a1b2c3d4e5f6c9',
      topic_id: '6638e1f2c2a1b2c3d4e5f6a7',
      user_id: '6638e1f2c2a1b2c3d4e5f6b8',
      content: 'This is a comment.',
      is_accepted: false,
      created_at: '2024-05-07T12:00:00.000Z',
      updated_at: '2024-05-07T12:00:00.000Z'
    }
  }
};

export const CommentAcceptedResponseSwagger = {
  schema: {
    example: {
      id: '6638e1f2c2a1b2c3d4e5f6c9',
      topic_id: '6638e1f2c2a1b2c3d4e5f6a7',
      user_id: '6638e1f2c2a1b2c3d4e5f6b8',
      content: 'This is a comment.',
      is_accepted: true,
      created_at: '2024-05-07T12:00:00.000Z',
      updated_at: '2024-05-07T12:00:00.000Z'
    }
  }
};

export const CommentUpdatedResponseSwagger = {
  schema: {
    example: {
      id: '6638e1f2c2a1b2c3d4e5f6c9',
      topic_id: '6638e1f2c2a1b2c3d4e5f6a7',
      user_id: '6638e1f2c2a1b2c3d4e5f6b8',
      content: 'Updated comment content',
      is_accepted: false,
      created_at: '2024-05-07T12:00:00.000Z',
      updated_at: '2024-05-07T12:00:00.000Z'
    }
  }
};

export const CommentDeletedResponseSwagger = {
  schema: {
    example: {
      message: 'Comment deleted successfully'
    }
  }
};
