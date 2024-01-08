import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateUserController } from "src/User/Controllers/CreateUserController";
import { CreateGroupController } from "src/Group/Controllers/CreateGroupController";
import { CreateContainerController } from "src/Group/Controllers/CreateContainerController";
import { testDynamoDBClient } from "test/Shared/Adapters/DynamoDBTestClient";
import { CreateANewUserService } from "src/Services/CreateNewUserService/CreateANewUserService";
import { NishikiDynamoDBClient } from "src/Shared/Adapters/DB/NishikiTableClient";
import { CreateUserUseCase } from "src/User/UseCases/CreateUserUseCase/CreateUserUseCase";
import { CreateGroupUseCase } from "src/Group/UseCases/CreateGroupUseCase/CreateGroupUseCase";
import { CreateContainerUseCase } from "src/Group/UseCases/CreateContainerUseCase/CreateContainerUseCase";
import { MockContainerRepository } from "test/Group/MockContainerRepository";
import { MockGroupRepository } from "test/Group/MockGroupRepository";
import { MockUserRepository } from "test/User/MockUserRepository";
import { BadRequestStatus, CreatedStatus } from "src/Shared";

describe("Create a new user service", () => {
	const TABLE_NAME = "create-a-new-user-service";
	const testNishikiDynamoDBClient = testDynamoDBClient(TABLE_NAME);
	const mockContainerRepository = new MockContainerRepository();
	const mockGroupRepository = new MockGroupRepository();
	const mockUserRepository = new MockUserRepository();

	let createUserController: CreateUserController;
	let createGroupController: CreateGroupController;
	let createContainerController: CreateContainerController;
	let nishikiDynamoDBClient: NishikiDynamoDBClient;

	let service: CreateANewUserService;

	beforeEach(() => {
		nishikiDynamoDBClient = new NishikiDynamoDBClient(
			testNishikiDynamoDBClient,
			TABLE_NAME,
		);
		createUserController = new CreateUserController(
			new CreateUserUseCase(mockUserRepository),
		);
		createGroupController = new CreateGroupController(
			new CreateGroupUseCase(mockGroupRepository),
		);
		createContainerController = new CreateContainerController(
			new CreateContainerUseCase(mockContainerRepository, mockGroupRepository),
		);
		service = new CreateANewUserService(
			createUserController,
			createGroupController,
			createContainerController,
			mockGroupRepository,
			nishikiDynamoDBClient,
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Normal System", () => {
		it("created a new user", async () => {
			vi.spyOn(createUserController, "execute").mockImplementation((input) => {
				return createdUserControllerResponse;
			});
			vi.spyOn(createGroupController, "execute").mockImplementation((input) => {
				return createdGroupControllerResponse;
			});
			vi.spyOn(createContainerController, "execute").mockImplementation(() => {
				return createdContainerControllerResponse;
			});

			const result = await service.execute(dummyInput);

			expect(result.status).toBe("CREATED");
			expect(result.statusCode).toBe(201);
		});
	});

	describe("Abnormal System", () => {
		it("Creating a user failed", async () => {
			vi.spyOn(createUserController, "execute").mockImplementationOnce(() => {
				return badRequestControllerResponse;
			});

			const result = await service.execute(dummyInput);

			expect(result.statusCode).toBe(400);
			expect(result.status).toBe("BAD_REQUEST");
		});

		it("When creating a group fails, then the user data is deleted", async () => {
			vi.spyOn(createUserController, "execute").mockImplementationOnce(() => {
				return createdUserControllerResponse;
			});
			vi.spyOn(createGroupController, "execute").mockImplementationOnce(() => {
				return badRequestControllerResponse;
			});
			vi.spyOn(nishikiDynamoDBClient, "deleteUser").mockImplementationOnce(
				() => {
					return Promise.resolve();
				},
			);

			const result = await service.execute(dummyInput);

			expect(result.statusCode).toBe(400);
			expect(result.status).toBe("BAD_REQUEST");
			expect(nishikiDynamoDBClient.deleteUser).toBeCalled();
		});

		it("When creating a container fails, then the user data and the group data are deleted", async () => {
			vi.spyOn(createUserController, "execute").mockImplementationOnce(() => {
				return createdUserControllerResponse;
			});
			vi.spyOn(createGroupController, "execute").mockImplementationOnce(() => {
				return createdGroupControllerResponse;
			});
			vi.spyOn(nishikiDynamoDBClient, "deleteUser").mockImplementationOnce(
				() => {
					return Promise.resolve();
				},
			);
			vi.spyOn(mockGroupRepository, "delete").mockImplementationOnce(
				(input) => {
					return Promise.resolve(undefined);
				},
			);

			const result = await service.execute(dummyInput);

			expect(result.statusCode).toBe(400);
			expect(result.status).toBe("BAD_REQUEST");
			expect(nishikiDynamoDBClient.deleteUser).toBeCalled();
			expect(mockGroupRepository.delete).toBeCalled();
		});
	});
});

// biome-ignore lint/suspicious/noExplicitAny: this is the test code
const createdUserControllerResponse: Promise<CreatedStatus<any>> =
	Promise.resolve({
		statusCode: 201,
		status: "CREATED",
		body: {
			id: "bb8a8d16-19c3-42d9-9db1-451a9473cad1",
			name: "user",
		},
	});

// biome-ignore lint/suspicious/noExplicitAny: this is the test code
const createdGroupControllerResponse: Promise<CreatedStatus<any>> =
	Promise.resolve({
		statusCode: 201,
		status: "CREATED",
		body: {
			id: "4e9b3656-8fec-4f64-a33d-96225a5dbf34",
			name: "user's group",
			containers: [],
			userIds: [],
		},
	});

// biome-ignore lint/suspicious/noExplicitAny: this is the test code
const createdContainerControllerResponse: Promise<CreatedStatus<any>> =
	Promise.resolve({
		statusCode: 201,
		status: "CREATED",
		body: {
			id: "4a27e18a2-e551-4f30-b4f6-74d92362863c",
			name: "user's container",
			foods: [],
		},
	});

const badRequestControllerResponse: Promise<BadRequestStatus> = Promise.resolve(
	{
		statusCode: 400,
		status: "BAD_REQUEST",
	},
);

const dummyInput = { emailAddress: "email@gmail.com" };
