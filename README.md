# n8n-nodes-aivory

n8n community node for [Aivory](https://aivory.id) Cerveau agents. Send a message to your deployed agent and use its reply in any workflow, or attach it as a tool to an n8n AI Agent (`usableAsTool`).

## Credentials
Create an API key in the Aivory dashboard (Agents → your agent → Deploy → API; Pro plan or above). One key = one agent. Paste it into the **Aivory API** credential. Base URL defaults to `https://backend.aivory.id`.

## Operations
- **Agent → Send Message**: `Message` (required), `Session ID` (optional; same ID = same conversation thread), `Timeout`. Output: `{ reply, sessionId }`.

Each message consumes Aivory credits and is rate-limited per key. Errors 401/402/403/429 are mapped to readable messages.

## Develop
```
npm install && npm run build
```
Link into a local n8n: `npm link`, then in `~/.n8n/custom` run `npm link n8n-nodes-aivory` and restart n8n.

## License
MIT. The node is only useful with an Aivory account: every call needs an agent API key (Pro plan or above), is rate-limited per key and consumes credits.

## Publish
Name and `n8n-community-node-package` keyword are set. For n8n verification, publish from GitHub Actions with provenance (`npm publish --provenance`).
