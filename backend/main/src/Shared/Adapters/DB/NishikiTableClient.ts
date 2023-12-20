import {
	DeleteItemInput,
	DeleteItemCommand,
	DynamoDBClient,
	GetItemInput,
	GetItemCommand,
	PutItemInput,
	PutItemCommand,
	QueryInput,
	QueryCommand,
	AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "src/Shared/Adapters/DB/DynamoClient";
import { TABLE_NAME } from "src/Settings/Setting";
import {
	GroupData,
	UserData,
	GroupInput,
	UserGroupRelation,
	InvitationLink,
} from "src/Shared/Adapters/DB/NishikiDBTypes";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { RepositoryError } from "src/Shared/Layers/Repository/RepositoryError";
import { validate as uuidValidate } from "uuid";

/**
 * EMailUserRelation
 * https://genesis-tech-tribe.github.io/nishiki-documents/project-document/database#emailuserrelation
 */
const EMAIL_ADDRESS_RELATION_INDEX_NAME = "EMailAndUserIdRelationship";

/**
 * UserAndGroupRelations
 * https://genesis-tech-tribe.github.io/nishiki-documents/project-document/database#userandgrouprelations
 */
const USER_AND_GROUP_RELATIONS = "UserAndGroupRelationship";

/**
 * InvitationHash
 * https://genesis-tech-tribe.github.io/nishiki-documents/project-document/database#invitationhash
 */
const INVITATION_HASH = "InvitationHash";

/**
 * This class is wrapper of the AWS DynamoDB client.
 * To use DynamoDB, we need to define the access patterns while designing the table.
 * This client is the concrete class of the access patterns against the NishikiTable, which is the DB of this application.
 *
 * [Nishiki DB definition](https://genesis-tech-tribe.github.io/nishiki-documents/project-document/database)
 *
 * @class NishikiDynamoDBClient
 */
export class NishikiDynamoDBClient {
	readonly dynamoClient: DynamoDBClient;
	readonly tableName: string;

	/**
	 * The params are for debugging.
	 * In production, you don't need to set the params.
	 *
	 * @constructor
	 * @param dbClient - the DynamoDB client of the AWS SDK.
	 * @param tableName - the name of the target table.
	 */
	constructor(
		dbClient: DynamoDBClient = dynamoClient,
		tableName: string = TABLE_NAME,
	) {
		this.dynamoClient = dbClient;
		this.tableName = tableName;
	}

	/**
	 * Get a single user from the DB.
	 * @param userId - user's ID. It should be UUID.
	 * @returns {UserData | null} - the user data. If the user does not exist, it returns null.
	 */
	async getUser(userId: string): Promise<UserData | null> {
		const getUserInput: GetItemInput = {
			TableName: this.tableName,
			Key: marshall({
				PK: userId,
				SK: "User",
			}),
		};

		const getUserCommand = new GetItemCommand(getUserInput);

		const response = await this.dynamoClient.send(getUserCommand);

		if (!response.Item) return null;

		const userResponse = unmarshall(response.Item);

		return {
			userId: userResponse.PK,
			username: userResponse.UserName,
			emailAddress: userResponse.EMailAddress,
		};
	}

	/**
	 * Get a list of user IDs who belong to the group from the DB.
	 * @param groupId
	 */
	async listOfUsersInGroup(groupId: string): Promise<UserGroupRelation[]> {
		const listOfUsersInGroupInput: QueryInput = {
			TableName: this.tableName,
			IndexName: USER_AND_GROUP_RELATIONS,
			KeyConditionExpression: "GroupId = :groupId",
			ExpressionAttributeValues: marshall({
				":groupId": groupId,
			}),
		};

		const command = new QueryCommand(listOfUsersInGroupInput);
		const response = await this.dynamoClient.send(command);

		if (!response.Items) return [];
		if (response.Items.length === 0) return [];

		return response.Items.map((item) => {
			const unmarshalledItem = unmarshall(item);

			return {
				userId: unmarshalledItem.PK,
				SK: unmarshalledItem.SK,
			};
		});
	}

	/**
	 * Save a user to the DB.
	 * @param user - user data
	 */
	async saveUser(user: UserData) {
		const saveUserInput: PutItemInput = {
			TableName: this.tableName,
			Item: marshall({
				PK: user.userId,
				SK: "User",
				UserName: user.username,
				EMailAddress: user.emailAddress,
			}),
		};

		const command = new PutItemCommand(saveUserInput);
		await this.dynamoClient.send(command);
	}

	async deleteUser(userId: string) {
		const deleteUserInput: DeleteItemInput = {
			TableName: this.tableName,
			Key: marshall({
				PK: userId,
				SK: "User",
			}),
		};

		const command = new DeleteItemCommand(deleteUserInput);
		await this.dynamoClient.send(command);
	}

	/**
	 * Get a group from the DB.
	 * @param groupId
	 * @returns {GroupData | null} - the group data. If the group does not exist, it returns null.
	 */
	async getGroup(groupId: string): Promise<GroupData | null> {
		const getGroupInput: GetItemInput = {
			TableName: this.tableName,
			Key: marshall({
				PK: groupId,
				SK: "Group",
			}),
		};

		const command = new GetItemCommand(getGroupInput);
		const response = await this.dynamoClient.send(command);

		if (!response.Item) return null;

		const unmarshalledData = unmarshall(response.Item);

		return {
			groupId: unmarshalledData.PK,
			groupName: unmarshalledData.GroupName,
		};
	}

	/**
	 * Save a group to the DB.
	 * This function generates multiple putItem commands and sends it concurrently.
	 * If user IDs are provided, this function issues [PutItem commands for creating user and group relations](https://genesis-tech-tribe.github.io/nishiki-documents/project-document/database#user).
	 * @param groupId
	 * @param props
	 */
	async saveGroup(groupId: string, props: GroupInput) {
		const { groupName, userIds, containerIds } = props;

		// no change
		if (!(groupName || userIds || containerIds)) {
			return;
		}

		let putCommands: PutItemCommand[] = [];

		// save a group with name
		if (groupName) {
			putCommands.push(
				new PutItemCommand({
					TableName: this.tableName,
					Item: marshall({
						PK: groupId,
						SK: "Group",
						GroupName: groupName,
					}),
				}),
			);
		}

		// crate put-user-item commands
		if (userIds && userIds.length > 0) {
			const userAndGroupPutCommands: PutItemCommand[] = userIds.map(
				(userId) => {
					return new PutItemCommand({
						TableName: this.tableName,
						Item: marshall({
							PK: userId,
							SK: `Group#${groupId}`,
							GroupId: groupId,
						}),
					});
				},
			);

			putCommands = [...putCommands, ...userAndGroupPutCommands];
		}

		// crate put-container-item commands
		if (containerIds && containerIds.length > 0) {
			const containerPutCommands: PutItemCommand[] = containerIds.map(
				(containerId) => {
					return new PutItemCommand({
						TableName: this.tableName,
						Item: marshall({
							PK: groupId,
							SK: `Container#${containerId}`,
							ContainerId: containerId,
						}),
					});
				},
			);

			putCommands = [...putCommands, ...containerPutCommands];
		}

		await Promise.all(
			putCommands.map((command) => this.dynamoClient.send(command)),
		);
	}

	/**
	 * Add a link and hash data to the Table.
	 * This function takes the link expiry Datetime as a parameter.
	 * @param groupId - UUID of the group ID
	 * @param linkExpiryDatetime - Accepting a Data object. Which is stored as the ISO string.
	 * @param invitationLinkHash - hash data
	 */
	async addInvitationLink(
		groupId: string,
		linkExpiryDatetime: Date,
		invitationLinkHash: string,
	) {
		const putJoinLinkInput: PutItemInput = {
			TableName: this.tableName,
			Item: marshall({
				PK: groupId,
				SK: "InvitationLinkHash",
				LinkExpiryDatetime: linkExpiryDatetime.toISOString(),
				InvitationLinkHash: invitationLinkHash,
			}),
		};

		const command = new PutItemCommand(putJoinLinkInput);
		await this.dynamoClient.send(command);
	}

	/**
	 * Get an invitation link.
	 * If Group ID is set as an argument, this function gets an invitation link using default PK and SK.
	 * If Invitation Link Hash is set as an argument, this function gets an invitation link using the InvitationHash GSI.
	 * When the invitation link hash is provided the operation against DB will be the query.
	 * Which means we cannot deny the possibility that there are multiple invitation link hash.
	 * In that case, this function returns the latest Datetime one.
	 * And, for the debugging sake, log the duplicate hash values.
	 * @param id - this value can be both the Group ID and the Invitation Link Hash
	 * @returns {InvitationLink | null}
	 */
	async getInvitationLink(id: string): Promise<InvitationLink | null> {
		// the group ID should be the uuid.
		// this block is for the Group ID.
		if (uuidValidate(id)) {
			const getItemInput: GetItemInput = {
				TableName: this.tableName,
				Key: marshall({
					PK: id,
					SK: "InvitationLinkHash",
				}),
			};

			const command = new GetItemCommand(getItemInput);
			const response = await this.dynamoClient.send(command);

			if (!response.Item) return null;

			return fromItemToInvitationLink(response.Item);
		}

		// When the ID in the argument is the Invitation Link Hash.
		const queryItemInput: QueryInput = {
			TableName: this.tableName,
			IndexName: INVITATION_HASH,
			KeyConditionExpression: "InvitationLinkHash = :invitationLinkHash",
			ExpressionAttributeValues: marshall({
				":invitationLinkHash": id,
			}),
		};

		const command = new QueryCommand(queryItemInput);
		const response = await this.dynamoClient.send(command);

		if (!(response.Items && response.Items.length > 0)) return null;

		return fromItemToInvitationLink(response.Items[0]);
	}

	/**
	 * delete an invitation link
	 * @param groupId
	 */
	async deleteInvitationLink(groupId: string): Promise<void>;
	/**
	 * delete group using the InvitationLink type alias
	 * @param invitationLink
	 */
	async deleteInvitationLink(invitationLink: InvitationLink): Promise<void>;
	async deleteInvitationLink(argument: InvitationLink | string): Promise<void> {
		let groupId = "";

		if (typeof argument === "string") {
			if (!uuidValidate(argument)) {
				throw new NishikiTableClientError("Invalid Input", [
					"Detect an invalid input in the deleteInvitationLink input.",
					"This must be a mistake of programmer.",
					`Argument: ${argument}`,
				]);
			}
			groupId = argument;
		} else {
			groupId = argument.groupId;
		}

		const deleteInvitationLinkInput: DeleteItemInput = {
			TableName: this.tableName,
			Key: marshall({
				PK: groupId,
				SK: "InvitationLinkHash",
			}),
		};

		const command = new DeleteItemCommand(deleteInvitationLinkInput);
		await this.dynamoClient.send(command);
	}
	/**
	 * delete group by the groupId.
	 * @param groupId
	 */
	async deleteGroup(groupId: string) {
		const deleteGroupInput: DeleteItemInput = {
			TableName: this.tableName,
			Key: marshall({
				PK: groupId,
				SK: "Group",
			}),
		};

		const command = new DeleteItemCommand(deleteGroupInput);
		await this.dynamoClient.send(command);
	}

	/**
	 * Get a user ID by the user's email address.
	 * @param emailAddress - the user's email address.
	 * @returns {string | null} - the user ID. If the user does not exist, it returns null.
	 */
	async getUserIdByEmail(emailAddress: string): Promise<string | null> {
		const getUserInput: QueryInput = {
			TableName: this.tableName,
			IndexName: EMAIL_ADDRESS_RELATION_INDEX_NAME,
			KeyConditionExpression: "EMailAddress = :email",
			ExpressionAttributeValues: marshall({
				":email": emailAddress,
			}),
		};
		const command = new QueryCommand(getUserInput);
		const response = await this.dynamoClient.send(command);

		if (!response.Items) return null;

		if (response.Items.length === 0) return null;

		if (response.Items.length > 1) {
			const report = [
				...response.Items.map((item) => `UserID: ${unmarshall(item).PK}`),
			];
			throw new NishikiTableClientError(
				"Multiple users are found with the same email address.",
				report,
			);
		}

		return unmarshall(response.Items[0]).PK;
	}

	/**
	 * This is just the factory method of the NishikiDynamoDBClient.
	 * Used for the shorthand.
	 *
	 * @returns {NishikiDynamoDBClient} - the instance of the NishikiDynamoDBClient.
	 *
	 * @example
	 * ```ts
	 * /// using this, you can write a code with one line.
	 * const data = NishikiDynamoDBClient.use().getOperation();
	 * ```
	 */
	static use(): NishikiDynamoDBClient {
		return new NishikiDynamoDBClient();
	}
}

class NishikiTableClientError extends RepositoryError {
	constructor(message: string, report: string | string[]) {
		super("NishikiTableClientError", message, report);
	}
}

/**
 * This function takes the item of the invitation link and returns InvitationLink.
 * Helper function for the InvitationLink function.
 * @param item
 * @returns {InvitationLink}
 */
const fromItemToInvitationLink = (
	item: Record<string, AttributeValue>,
): InvitationLink => {
	const unmarshalled = unmarshall(item);

	return {
		groupId: unmarshalled.PK,
		SK: unmarshalled.SK,
		linkExpiryTime: new Date(unmarshalled.LinkExpiryDatetime),
		invitationLinkHash: unmarshalled.InvitationLinkHash,
	};
};

// for debug
export const __local__ = {
	EMAIL_ADDRESS_RELATION_INDEX_NAME,
	USER_AND_GROUP_RELATIONS,
	INVITATION_HASH,
};
