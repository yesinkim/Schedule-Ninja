# Project Overview

This document provides a comprehensive overview of the Schedule Ninja project, including its inspiration, functionality, technical architecture, and future plans.

---

## 1. Inspiration & Problem Statement

**The Problem:** The digital workflow is plagued by constant "context switching." To schedule an event found in an email or on a webpage, users must disrupt their focus by opening a new tab, navigating to their calendar, and manually transferring information. This tedious, multi-step process kills productivity and breaks the user's flow of concentration.

**The Inspiration:** The inspiration for Schedule Ninja came from this simple, yet universal, frustration. We asked ourselves, "What if you could capture an event right where you are, without ever leaving the page?" This desire for a seamless, focused workflow was the spark that ignited the project.

---

## 2. What It Does

Schedule Ninja is a privacy-first AI assistant built as a Chrome Extension that helps you reclaim your focus. It allows users to capture and save event details to their Google Calendar in two seconds, without ever leaving the current page.

When you're on a webpage containing event information, you simply click the Schedule Ninja icon. The extension uses **Chrome's built-in, on-device AI (powered by Gemini Nano)** to instantly scan the page, understand the context, and extract key details like the event title, date, and time. It then presents this information to you in a clean pop-up, allowing you to add it to your Google Calendar with a single click. It transforms a multi-step, distracting process into a seamless, two-second interaction, keeping you in your flow.

---

## 3. How We Built It

Schedule Ninja is built entirely on modern web technologies and leverages the power of **Google Chrome's built-in AI APIs**.

*   **Frontend**: The user interface is a simple and intuitive Chrome Extension popup built with HTML, CSS, and JavaScript.
*   **Core Logic**: The magic happens in our content script, which has access to the webpage's content to perform its analysis.
*   **AI-Powered Detection**: We use Chrome's native, on-device AI to process the text of the current webpage. This allows us to perform natural language processing tasks to identify and extract schedule-related entities directly in the browser. This on-device approach is not only fast but also completely private, as no user data ever leaves their machine.
*   **Calendar Integration**: We use the Google Calendar API to create a pre-filled calendar event, making the final step for the user as simple as clicking "Save".

---

## 4. Challenges & Accomplishments

**Challenges:** Our biggest challenge was designing an AI model that could accurately identify event details across the vast and unpredictable structure of the web, all while running entirely on-device. It was a significant design and engineering challenge to create parsing logic that was smart enough to handle different date formats, time zones, and event descriptions without compromising the speed and privacy central to our mission.

**Accomplishments:** We are incredibly proud of creating a user experience that feels truly seamless and respects user privacy. By committing to a 100% on-device AI approach, we've built a tool that is not only fast and works offline but also guarantees that the user's personal information remains completely private. Seeing the AI correctly parse a complex event description from a messy email thread for the first time was a huge moment for our team.

---

## 5. What We Learned

This project was a deep dive into the potential of on-device AI. We learned that you don't always need massive, server-side models to create powerful and intelligent user experiences. By leveraging Chrome's built-in AI capabilities, we could build a product that is efficient, private, and accessible. This has reinforced our belief in building tools that are not just functional, but also mindful of the user's attention.

---

## 6. What's Next for Schedule Ninja

We see the current version as the first step towards a much more powerful "Auto-Detection Agent." Our vision is to enhance its capabilities while staying true to our privacy-first principles. This will be achieved through a "progressive enhancement" model, where the fast, on-device AI remains the default, with an optional, powerful server-side agent for complex tasks.

Our roadmap includes:

*   **Enhanced AI Accuracy via Server-Side Agent**: For complex texts (like long email threads), we will offer an opt-in feature that leverages a powerful, server-side "Smart Scheduling Agent" built with **LangGraph**.
    *   **Architecture**: This agent will be a stateful graph that can manage multi-step reasoning. Its nodes will handle parsing, validation, and clarification.
    *   **Interactive Workflow**: If the agent finds ambiguous information (e.g., "Let's meet tomorrow morning"), it will generate questions ("Should I set the time for 9 AM?") and interact with the user via the extension UI to confirm details.
    *   **Tool Integration**: The agent will be able to use external tools, such as calling the Google Maps API to find a precise address for a location like "the cafe near the office."

*   **Deeper Contextual Understanding**: We will evolve the agent to understand context from entire conversations. The LangGraph-based agent is key to this, as it can process larger blocks of text and trace relationships between different parts of a conversation to suggest the most relevant event.

*   **In-Extension Management**: We will add features to view, manage, and edit recently added events directly from the extension.

*   **Ecosystem Expansion**: After a formal launch on the Chrome Web Store, we plan to integrate with other popular services like Outlook and Notion Calendar.

---

## 7. Testing Instructions

To test Schedule Ninja, please follow these steps:

1.  **Load the Extension**:
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" in the top-right corner.
    *   Click "Load unpacked" and select the project's root folder.

2.  **Quick Test**:
    *   Open the `quick-test.html` file in your browser.
    *   Click the Schedule Ninja icon in the toolbar to see the AI instantly extract event details from the page.

3.  **Comprehensive Test**:
    *   For more complex scenarios, open `archive/tests/comprehensive-test.html`.
    *   This file contains various edge cases. Click the extension icon to verify its accuracy in different situations.
