# Frontend Developer Assessment - Chat Application

## Overview

This is a real-time chat dashboard built with Next.js, TypeScript, and Tailwind CSS. The application connects healthcare professionals (Students and Preceptors) and provides features for real-time messaging, activity history, and performance analytics.

**The app works, but it has several issues that need to be identified and fixed.**

## Your Task

Review the codebase and identify issues related to:

1. **Code Quality & Best Practices**
2. **Performance Optimization**
3. **UI/UX Consistency**
4. **Architecture & Organization**

You are expected to:

- Identify problems in the code
- Refactor and fix issues you find
- **Freedom to Update UI/UX**: You are encouraged to improve the design, layout, and user experience as you see fit to make it feel more premium and professional.
- Explain why your changes improve the codebase

## Design Theme

The application should follow a consistent design system. Use these guidelines when refactoring the UI:

### Color Palette

| Color          | Hex Code  | Usage                           |
| -------------- | --------- | ------------------------------- |
| Primary        | `#6366F1` | Buttons, links, active states   |
| Primary Dark   | `#4F46E5` | Hover states, accents           |
| Background     | `#F8FAFC` | Page background                 |
| Surface        | `#FFFFFF` | Cards, modals, panels           |
| Text Primary   | `#1E293B` | Headings, important text        |
| Text Secondary | `#64748B` | Body text, descriptions         |
| Border         | `#E2E8F0` | Dividers, input borders         |
| Success        | `#10B981` | Success messages, online status |
| Error          | `#EF4444` | Error messages, alerts          |

### Typography

Use **two font families** for visual hierarchy:

| Font                  | Usage                               |
| --------------------- | ----------------------------------- |
| **Inter**             | Body text, labels, descriptions     |
| **Plus Jakarta Sans** | Headings (h1-h6), navigation titles |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Test Credentials

Use the following accounts to test the application:

| Role          | Email                  | Password   |
| ------------- | ---------------------- | ---------- |
| **Student**   | `student@yopmail.com`  | `Test@123` |
| **Preceptor** | `karishma@yopmail.com` | `Test@123` |

## API Documentation

The application uses the following APIs:

### Authentication

- `POST /api/v1/auth/login` - Login with email/password

### Connections

- `GET /api/v1/relation?type=accepted&page=1&limit=50` - Get connected users
- Use query param `name` for search feature

### Chat

- `GET /api/v1/chats/:userId` - Get chat messages with a user
- **WebSocket connection** for real-time messages.

#### WebSocket Events (Specification)

To ensure real-time features work correctly, your implementation must adhere to the following event names and payload structures:

- **Events**:
  - `login`: Must be emitted immediately after connection. Payload: `{ userId }` (The `userId` as a string).
  - `message`: Used for both sending and receiving messages.
  - **Payload (Outgoing)**: `{ message, receiverId, senderId, mediaType: 'text' }`
  - **Payload (Incoming)**: `{ message, senderId, timestamp }`

### Analytics, History and Settings

- Note: The **History**, **Settings** and **Analytics** tabs currently use mock data. This includes the **Edit Profile** feature, which should be functional (handling form state/UI logic) but does not require integration with a real backend API. **You are NOT required to remove or replace this mock data with real API calls.**
- However, you should still treat these as production-ready features. Focus on refactoring their implementation for better architecture, modularity, and performance (e.g., handling large datasets in History).
- Candidates should investigate the current "monolithic" implementation and propose more robust, maintainable patterns.

### Base URL

```
https://backend.cauhec.org/api/v1
```

## Evaluation Criteria

You will be evaluated on your ability to:

1. **Identify Issues** - Can you spot problems in the code?
2. **Propose Solutions** - Do your solutions follow best practices?
3. **Code Quality** - Is your refactored code clean and maintainable?
4. **Performance Awareness** - Do you understand performance implications?
5. **UI/UX Sense** - Can you identify and fix design inconsistencies?

## Submission

Once complete, please package your work as a **ZIP file** and send it to **tech@creativescript.org**.

Your submission should include:

1. Your refactored code (excluding `node_modules` and `.next` folders)
2. A brief document explaining the issues you identified and how you resolved them
3. Any additional improvements you would suggest given more time

## Time Limit

You have **4 hours** to complete this assessment. Focus on the most critical issues first.

Good luck! 🚀
