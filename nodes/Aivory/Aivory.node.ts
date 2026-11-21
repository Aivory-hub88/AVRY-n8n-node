import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError, NodeOperationError } from 'n8n-workflow';

// The agent gateway allows up to 195s per turn; leave headroom.
const DEFAULT_TIMEOUT_SECONDS = 200;

export class Aivory implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Aivory',
		name: 'aivory',
		icon: 'file:aivory.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Talk to your Aivory Cerveau agent',
		defaults: { name: 'Aivory' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'aivoryApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Agent', value: 'agent' }],
				default: 'agent',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['agent'] } },
				options: [
					{
						name: 'Send Message',
						value: 'sendMessage',
						action: 'Send a message to the agent',
						description: 'Send a message to the agent and get its reply',
					},
				],
				default: 'sendMessage',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				default: '',
				description: 'What to tell the agent (max 8000 characters)',
				displayOptions: { show: { resource: ['agent'], operation: ['sendMessage'] } },
			},
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '',
				placeholder: 'e.g. customer-4821',
				description:
					'Conversation thread. Messages with the same session ID share history; use one per end-user or ticket. Leave empty for the shared "default" thread.',
				displayOptions: { show: { resource: ['agent'], operation: ['sendMessage'] } },
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['agent'], operation: ['sendMessage'] } },
				options: [
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeout',
						type: 'number',
						typeOptions: { minValue: 5 },
						default: DEFAULT_TIMEOUT_SECONDS,
						description: 'Agents that use tools can take a while to answer',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('aivoryApi');
		const baseUrl = String(credentials.baseUrl || 'https://backend.aivory.id').replace(/\/+$/, '');

		for (let i = 0; i < items.length; i++) {
			try {
				const message = (this.getNodeParameter('message', i) as string).trim();
				if (!message) {
					throw new NodeOperationError(this.getNode(), 'Message must not be empty', {
						itemIndex: i,
					});
				}
				if (message.length > 8000) {
					throw new NodeOperationError(
						this.getNode(),
						`Message is ${message.length} characters; the limit is 8000`,
						{ itemIndex: i },
					);
				}
				const sessionId = (this.getNodeParameter('sessionId', i, '') as string).trim();
				const options = this.getNodeParameter('options', i, {}) as { timeout?: number };

				const body: IDataObject = { text: message };
				if (sessionId) body.session_id = sessionId;

				const request: IHttpRequestOptions = {
					method: 'POST',
					url: `${baseUrl}/api/v1/agent-api/message`,
					body,
					json: true,
					timeout: (options.timeout ?? DEFAULT_TIMEOUT_SECONDS) * 1000,
				};

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'aivoryApi',
					request,
				)) as IDataObject;

				returnData.push({
					json: { reply: response.reply, sessionId: response.session_id },
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				if (error instanceof NodeOperationError) throw error;
				throw new NodeApiError(this.getNode(), error as never, {
					itemIndex: i,
					message: friendlyMessage(error),
				});
			}
		}

		return [returnData];
	}
}

function friendlyMessage(error: unknown): string | undefined {
	const status = Number((error as { httpCode?: string }).httpCode);
	switch (status) {
		case 401:
			return 'Invalid or revoked Aivory API key';
		case 402:
			return 'The Aivory account is out of credits';
		case 403:
			return 'API deployment requires the Aivory Pro plan or above';
		case 429:
			return 'Rate limit hit for this API key. Retry in a minute';
		case 502:
		case 504:
			return 'The Aivory agent gateway did not answer. Try again';
		default:
			return undefined;
	}
}
