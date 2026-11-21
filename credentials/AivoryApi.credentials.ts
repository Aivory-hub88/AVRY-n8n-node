import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AivoryApi implements ICredentialType {
	name = 'aivoryApi';

	displayName = 'Aivory API';

	icon = { light: 'file:aivory.svg', dark: 'file:aivory.dark.svg' } as const;

	documentationUrl = 'https://aivory.id';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: 'avk_live_...',
			description:
				'Agent API key. Create it in the Aivory dashboard: Agents → your agent → Deploy → API. Each key is bound to one agent.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://backend.aivory.id',
			description: 'Only change this for a self-hosted or staging Aivory backend',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-Aivory-Api-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	// Validates the key and plan without sending a message (no credits spent).
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/v1/agent-api/ping',
			method: 'GET',
		},
	};
}
