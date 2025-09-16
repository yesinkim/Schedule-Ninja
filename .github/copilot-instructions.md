# Project Overview

This project is **Schedule Ninja**, a Chrome extension that intelligently parses text content and automatically creates Google Calendar events. It uses AI (Groq API) to extract scheduling information from any webpage text and seamlessly integrates with Google Calendar API.

## Core Functionality

- **Text Parsing**: Uses AI to extract event information from selected text on any webpage
- **Calendar Integration**: Automatically creates Google Calendar events with proper formatting
- **Multi-event Support**: Can parse and create multiple events from a single text selection
- **Smart Validation**: Validates and corrects event data before calendar creation
- **Cross-platform**: Works on any website through Chrome extension

## Folder Structure

- `/`: Root directory containing Chrome extension files
  - `manifest.json`: Extension configuration and permissions
  - `background.js`: Service worker handling API calls and calendar integration
  - `content.js`: Content script for text selection and modal UI
  - `popup.html/js`: Extension popup interface
  - `secrets.js`: API keys and sensitive configuration
- `/icons/`: Extension icons in various sizes

## Technology Stack

### Frontend (Chrome Extension)
- **Manifest V3**: Modern Chrome extension architecture
- **Vanilla JavaScript**: No frameworks for lightweight performance
- **Bulma CSS**: Clean, modern UI framework
- **Inline CSS**: Custom styling for modal components
- **Google Calendar API**: Event creation and management

### Backend (Optional Server)
- **FastAPI**: Python web framework for API endpoints
- **Groq API**: AI text parsing and event extraction
- **Pydantic**: Data validation and serialization

### APIs and Services
- **Groq API**: AI-powered text analysis (gemma2-9b-it model)
- **Google Calendar API**: Calendar event management
- **OAuth2**: Google authentication flow

## Coding Standards

### JavaScript
- Use semicolons at the end of each statement
- Use single quotes for strings consistently
- Use arrow functions for callbacks and async operations
- Use `const` and `let` instead of `var`
- Use template literals for string interpolation
- Use async/await for asynchronous operations

### Python (Backend)
- Follow PEP 8 style guidelines
- Use type hints with Pydantic models
- Use async/await for FastAPI endpoints
- Use proper error handling with HTTPException

### General
- Use meaningful variable and function names
- Add comments for complex logic
- Handle errors gracefully with user-friendly messages
- Use consistent indentation (2 spaces for JS, 4 spaces for Python)

## UI/UX Guidelines

### Design System
- **Color Palette**: 
  - Primary: #E83941 (red accent)
  - Background: #313B43 (dark blue-gray)
  - Text: #e7e7e9 (light gray)
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent padding and margins using Bulma classes

### User Experience
- **Modal Interface**: Clean, non-intrusive modal for text selection
- **Loading States**: Clear feedback during AI processing
- **Error Handling**: User-friendly error messages with recovery options
- **Responsive Design**: Works across different screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## API Integration Patterns

### Google Calendar API
- Always validate event data before API calls
- Handle timezone conversion properly (Asia/Seoul default)
- Support both all-day and time-specific events
- Implement proper error handling for API failures

### Groq AI API
- Use structured prompts for consistent JSON responses
- Handle multiple events in single text selection
- Implement timeout handling for API calls
- Validate AI responses before processing

## Security Considerations

- Store API keys in separate `secrets.js` file (not committed to version control)
- Use Chrome extension permissions minimally
- Validate all user inputs before API calls
- Implement proper CORS handling for external APIs

## Development Workflow

- Test extension in Chrome developer mode
- Use browser dev tools for debugging
- Test with various text formats and languages
- Validate calendar integration with real Google accounts
- Test error scenarios and edge cases

## Key Features to Maintain

- **Smart Text Parsing**: Accurate extraction of dates, times, and event details
- **Multi-language Support**: Handle Korean and English text effectively
- **Calendar Validation**: Ensure proper event formatting before creation
- **User Feedback**: Clear status updates and error messages
- **Performance**: Fast processing and minimal resource usage
