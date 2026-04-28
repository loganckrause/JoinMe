import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/fastapi",
    },
    {
      type: "category",
      label: "auth",
      items: [
        {
          type: "doc",
          id: "api/register-auth-register-post",
          label: "Register",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/login-auth-login-post",
          label: "Login",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "categories",
      items: [
        {
          type: "doc",
          id: "api/get-categories-categories-get",
          label: "Get Categories",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/create-category-categories-post",
          label: "Create Category",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/create-categories-categories-bulk-post",
          label: "Create Categories",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "events",
      items: [
        {
          type: "doc",
          id: "api/get-event-feed-events-get",
          label: "Get Event Feed",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/create-new-event-events-post",
          label: "Create New Event",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-user-events-events-me-events-get",
          label: "Get User Events",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-hosted-events-events-hosted-get",
          label: "Get Hosted Events",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-event-events-event-id-get",
          label: "Get Event",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/update-event-events-event-id-patch",
          label: "Update Event",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "api/delete-event-events-event-id-delete",
          label: "Delete Event",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "api/get-event-attendees-events-event-id-attendees-get",
          label: "Get Event Attendees",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/attend-event-events-event-id-attend-post",
          label: "Attend Event",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/leave-event-events-event-id-attend-delete",
          label: "Leave Event",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "api/upload-event-picture-events-event-id-picture-post",
          label: "Upload Event Picture",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "notifications",
      items: [
        {
          type: "doc",
          id: "api/list-notifications-notifications-get",
          label: "List Notifications",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-unread-count-notifications-unread-count-get",
          label: "Get Unread Count",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/mark-as-read-notifications-notification-id-read-patch",
          label: "Mark As Read",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "api/mark-all-read-notifications-mark-all-read-post",
          label: "Mark All Read",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/respond-to-attendance-notifications-notification-id-respond-post",
          label: "Respond To Attendance",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "swipes",
      items: [
        {
          type: "doc",
          id: "api/record-user-swipe-swipes-post",
          label: "Record User Swipe",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-user-swipes-swipes-accepted-get",
          label: "Get User Swipes",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "users",
      items: [
        {
          type: "doc",
          id: "api/read-current-user-users-me-get",
          label: "Read Current User",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/update-current-user-users-me-patch",
          label: "Update Current User",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "api/get-user-users-user-id-get",
          label: "Get User",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/register-push-token-users-me-push-token-post",
          label: "Register Push Token",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/upload-user-picture-users-me-picture-post",
          label: "Upload User Picture",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "preferences",
      items: [
        {
          type: "doc",
          id: "api/get-user-preferences-preferences-get",
          label: "Get User Preferences",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/add-preference-preferences-post",
          label: "Add Preference",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-preferences-for-user-preferences-user-user-id-get",
          label: "Get Preferences For User",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/remove-preference-preferences-category-id-delete",
          label: "Remove Preference",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "api/get-notification-preferences-preferences-notifications-get",
          label: "Get Notification Preferences",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/update-notification-preference-preferences-notifications-patch",
          label: "Update Notification Preference",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "api/bulk-add-preferences-preferences-bulk-post",
          label: "Bulk Add Preferences",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "user-ratings",
      items: [
        {
          type: "doc",
          id: "api/get-user-ratings-user-ratings-get",
          label: "Get User Ratings",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/create-user-rating-user-ratings-post",
          label: "Create User Rating",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-received-ratings-user-ratings-received-get",
          label: "Get Received Ratings",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-user-rating-user-ratings-rating-id-get",
          label: "Get User Rating",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/update-user-rating-user-ratings-rating-id-put",
          label: "Update User Rating",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/delete-user-rating-user-ratings-rating-id-delete",
          label: "Delete User Rating",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "event-ratings",
      items: [
        {
          type: "doc",
          id: "api/get-user-event-ratings-event-ratings-get",
          label: "Get User Event Ratings",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/create-event-rating-event-ratings-post",
          label: "Create Event Rating",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/get-event-ratings-event-ratings-event-event-id-get",
          label: "Get Event Ratings",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/get-event-rating-event-ratings-rating-id-get",
          label: "Get Event Rating",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/update-event-rating-event-ratings-rating-id-put",
          label: "Update Event Rating",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/delete-event-rating-event-ratings-rating-id-delete",
          label: "Delete Event Rating",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "attendance",
      items: [
        {
          type: "doc",
          id: "api/trigger-daily-attendance-prompts-attendance-cron-daily-prompt-post",
          label: "Trigger Daily Attendance Prompts",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/confirm-attendance-attendance-events-event-id-confirm-post",
          label: "Confirm Attendance",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "UNTAGGED",
      items: [
        {
          type: "doc",
          id: "api/root-get",
          label: "Root",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
