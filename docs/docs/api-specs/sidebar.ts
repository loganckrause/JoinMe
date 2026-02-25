import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api-specs/joinme-api",
    },
    {
      type: "category",
      label: "Authentication",
      items: [
        {
          type: "doc",
          id: "api-specs/register-a-new-user",
          label: "Register a new user",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api-specs/authenticate-user-and-receive-jwt",
          label: "Authenticate user and receive JWT",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Events",
      items: [
        {
          type: "doc",
          id: "api-specs/get-event-feed-discover",
          label: "Get event feed (Discover)",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api-specs/create-a-new-event",
          label: "Create a new event",
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
          id: "api-specs/perform-a-swipe-on-an-event",
          label: "Perform a swipe on an event",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Chat",
      items: [
        {
          type: "doc",
          id: "api-specs/get-chat-messages-for-an-event",
          label: "Get chat messages for an event",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api-specs/send-a-message-in-an-event-chat",
          label: "Send a message in an event chat",
          className: "api-method post",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
