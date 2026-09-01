// lib/graphql-schema/typeDefs.ts
import gql from "graphql-tag";

export const typeDefs = gql`
  enum Locale {
    EN
    AR
  }
  enum ContentStatus {
    DRAFT
    PUBLISHED
  }
  enum Role {
    ADMIN
    EDITOR
  }
  enum DraftTone {
    ACADEMIC
    CURATORIAL
    EXHIBITION
  }

  type LocalizedField {
    value: String!
    locale: Locale!
    localeFallback: Boolean!
  }

  type Project {
    id: ID!
    slug: String!
    title(locale: Locale = EN): LocalizedField!
    description(locale: Locale = EN): LocalizedField!
    stack: [String!]!
    liveUrl: String
    status: ContentStatus!
    tags: [Tag!]!
  }

  type Post {
    id: ID!
    slug: String!
    title(locale: Locale = EN): LocalizedField!
    body(locale: Locale = EN): LocalizedField!
    status: ContentStatus!
    authorId: ID!
    createdAt: String!
    updatedAt: String!
  }

  type Testimonial {
    id: ID!
    authorName: String!
    roleTitle: String!
    quote(locale: Locale = EN): LocalizedField!
    status: ContentStatus!
    createdAt: String!
  }

  type Tag {
    id: ID!
    name: String!
  }

  type DraftAssistResult {
    available: Boolean!
    description: String
    seoSummary: String
    resetsAt: String
  }

  input ProjectInput {
    slug: String!
    titleEn: String
    titleAr: String
    descriptionEn: String
    descriptionAr: String
    stack: [String!]
    liveUrl: String
  }

  input PostInput {
    slug: String!
    titleEn: String
    titleAr: String
    bodyEn: String
    bodyAr: String
  }

  input TestimonialInput {
    authorName: String!
    roleTitle: String!
    quoteEn: String
    quoteAr: String
  }

  type User {
    id: ID!
    email: String!
    name: String
    role: Role!
    locale: String!
    theme: String!
    createdAt: String!
  }

  type Invitation {
    id: ID!
    email: String!
    role: Role!
    expiresAt: String!
    acceptedAt: String
    createdAt: String!
  }

  type Query {
    # Public path: force-filters to PUBLISHED regardless of the requested status (FR-001).
    projects(status: ContentStatus): [Project!]!
    project(slug: String!): Project
    posts(status: ContentStatus): [Post!]!
    post(slug: String!): Post
    testimonials(status: ContentStatus): [Testimonial!]!
    testimonial(id: ID!): Testimonial
    users: [User!]! # Admin only
    pendingInvitations: [Invitation!]! # Admin only
  }

  type Mutation {
    createProject(input: ProjectInput!): Project!
    updateProject(id: ID!, input: ProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    publishProject(id: ID!): Project!
    createPost(input: PostInput!): Post!
    updatePost(id: ID!, input: PostInput!): Post!
    deletePost(id: ID!): Boolean!
    createTestimonial(input: TestimonialInput!): Testimonial!
    updateTestimonial(id: ID!, input: TestimonialInput!): Testimonial!
    deleteTestimonial(id: ID!): Boolean!
    generateDraftAssist(
      bullets: [String!]!
      locale: Locale!
      tone: DraftTone = CURATORIAL
    ): DraftAssistResult!
    inviteUser(email: String!, role: Role!): Invitation!
    resendInvite(invitationId: ID!): Invitation!
    acceptInvite(token: String!, name: String!, password: String!): Boolean!
    updateUserRole(id: ID!, role: Role!): User!
    deleteUser(id: ID!): Boolean!
  }
`;
