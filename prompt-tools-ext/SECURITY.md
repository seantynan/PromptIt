# Security & Privacy

Prompt It is designed as a local-first browser extension and does not operate any backend service.

## API Key Handling

Prompt It requires a user-provided OpenAI API key.

- The API key is entered by the user
- It is stored locally using the browser’s extension storage
- It is accessed only by the extension’s background service
- It is sent only to OpenAI’s API over HTTPS (TLS)

Prompt It does not transmit API keys to any other server.

## Network Requests

The extension makes network requests only to:

- https://api.openai.com

There are no analytics, telemetry, logging, or tracking endpoints.

## Data Collection

Prompt It does not collect or store:

- Personal data
- Browsing history
- Selected text
- Prompts or responses
- Usage metrics

All processing happens locally in the browser and remotely only at OpenAI’s API.

## Transparency

The full source code for Prompt It is publicly available for inspection so users can verify how data and API keys are handled.

## Reporting a Security Issue

If you believe you have found a security or privacy issue, please contact:

📧 info@promptitapp.com
