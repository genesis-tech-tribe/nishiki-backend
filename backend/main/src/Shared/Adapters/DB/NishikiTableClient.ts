import {
	DeleteItemCommand,
	DynamoDBClient,
	GetItemInput,
	GetItemCommand,
	PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "src/Shared/Adapters/DB/DynamoClient";
import { TABLE_NAME } from "src/Settings/Setting";
import { UserData } from "src/Shared/Adapters/DB/NishikiDBTypes";
import {
	DeleteItemInput,
	PutItemInput,
} from "@aws-sdk/client-dynamodb/dist-types/models";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

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