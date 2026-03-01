import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/joinme-api",
    },
    {
      type: "category",
      label: "Authentication",
      items: [
        {
          type: "doc",
          id: "api/register-a-new-user",
          label: "Register a new user",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/authenticate-user-and-receive-jwt",
          label: "Authenticate user and receive JWT",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "User",
      items: [
        {
          type: "doc",
          id: "api/get-current-user-profile",
          label: "Get current user profile",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/update-user-profile",
          label: "Update user profile",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "api/get-events-the-current-user-is-attending-or-hosting",
          label: "Get events the current user is attending or hosting",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-public-profile-of-another-user",
          label: "Get public profile of another user",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Events",
      items: [
        {
          type: "doc",
          id: "api/get-events-the-current-user-is-attending-or-hosting",
          label: "Get events the current user is attending or hosting",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-a-list-of-users-attending-the-event",
          label: "Get a list of users attending the event",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-all-available-event-categories",
          label: "Get all available event categories",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-event-feed-discover",
          label: "Get event feed (Discover)",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/create-a-new-event",
          label: "Create a new event",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-event-details",
          label: "Get event details",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/update-event-details",
          label: "Update event details",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "api/delete-an-event",
          label: "Delete an event",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Chat",
      items: [
        {
          type: "doc",
          id: "api/get-chat-messages-for-an-event",
          label: "Get chat messages for an event",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/send-a-message-in-an-event-chat",
          label: "Send a message in an event chat",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Swipes",
      items: [
        {
          type: "doc",
          id: "api/perform-a-swipe-on-an-event",
          label: "Perform a swipe on an event",
          className: "api-method post",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
