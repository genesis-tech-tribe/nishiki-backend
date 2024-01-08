import { CreateUserController } from "src/User/Controllers/CreateUserController";
import { CreateContainerController } from "src/Group/Controllers/CreateContainerController";
import { CreateGroupController } from "src/Group/Controllers/CreateGroupController";
import {
	BadRequestStatus,
	Controller,
	ForbiddenStatus,
	InternalServerErrorStatus,
} from "src/Shared";
import { NishikiDynamoDBClient } from "src/Shared/Adapters/DB/NishikiTableClient";
import { IGroupRepository } from "src/Group/Domain/IGroupRepository";
import { GroupId } from "src/Group/Domain/Entities/Group";

interface ICreateANewUser {
	emailAddress: string;
	name?: string;
}

/**
 * Create a new user, container, and group.
 */
export class CreateANewUserService extends Controller<ICreateANewUser> {
	constructor(
		readonly createUser: CreateUserController,
		readonly createGroup: CreateGroupController,
		readonly createContainer: CreateContainerController,
		readonly groupRepository: IGroupRepository,
		readonly nishikiDynamoDBClient: NishikiDynamoDBClient,
	) {
		super();
	}

	async handler(input: ICreateANewUser) {
		// create a new user
		const createUserResult = await this.createUser.execute(input);
		if (!(createUserResult.status === "CREATED" && createUserResult.body)) {
			return createUserResult as BadRequestStatus | InternalServerErrorStatus;
		}
		const userData = createUserResult.body;

		const userId = userData.id;
		const userName = userData.name;

		// crate a new group
		const createGroupResult = await this.createGroup.execute({
			name: `${userName}'s group`,
			userId: userId,
		});

		// console.log(createGroupResult);

		// when the creating a group failed, delete the user for rollback.
		if (!(createGroupResult.status === "CREATED" && createGroupResult.body)) {
			await this.nishikiDynamoDBClient.deleteUser(userId);
			return createGroupResult as BadRequestStatus | InternalServerErrorStatus;
		}

		const groupData = createGroupResult.body;

		const groupIdOrErr = GroupId.create(groupData.id);

		// normally, the groupId should be created successfully.
		// if it is an error, it means that we must repair the DB data.
		if (groupIdOrErr.err) {
			await this.nishikiDynamoDBClient.deleteUser(userId);
			console.error("[Service Error]: the generated group ID is incorrect.");
			console.error(`[Service Error]: In correct group ID ${groupData.id}.`);
			return this.internalServerError();
		}

		const groupId = groupIdOrErr.value;

		// create a new container
		const createContainerResult = await this.createContainer.execute({
			userId,
			name: `${userName}'s container`,
			groupId: groupId.id,
		});

		if (
			!(createContainerResult.status === "CREATED" && createUserResult.body)
		) {
			await Promise.all([
				this.nishikiDynamoDBClient.deleteUser(userId),
				this.groupRepository.delete(groupId),
			]);
			return createContainerResult as
				| BadRequestStatus
				| ForbiddenStatus
				| InternalServerErrorStatus;
		}

		return this.created(undefined);
	}
}
