import type { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class AivoryApi implements ICredentialType {
	name = 'aivoryApi';

	displayName = 'Aivory API';

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

	// No `test` request on purpose: the only public endpoint sends a message,
	// which would spend a credit just to check the key.
}
