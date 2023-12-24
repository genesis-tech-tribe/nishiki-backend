import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteContainerUseCase } from "src/Group/UseCases/DeleteContainerUseCase/DeleteContainerUseCase";
import { MockContainerRepository } from "../MockContainerRepository";
import { Container, ContainerId } from "src/Group/Domain/Entities/Container";
import { MockGroupRepository } from "../MockGroupRepository";
import { UserId } from "src/User";
import { GroupId, Group } from "src/Group/Domain/Entities/Group";

const USER_ID = UserId.generate();

describe("delete container use case", () => {
	let mockContainerRepository: MockContainerRepository;
	let mockGroupRepository: MockGroupRepository;
	let useCase: DeleteContainerUseCase;

	const containerId = ContainerId.create("dummyId").unwrap();
	const container: Container = Container.default(containerId).unwrap();

	const groupId = GroupId.create("dummyGroupId").unwrap();
	const groupName = "dummyGroupName";
	const group = Group.create(groupId, {
		name: groupName,
		containerIds: [containerId],
		userIds: [USER_ID],
	}).unwrap();

	beforeEach(() => {
		mockContainerRepository = new MockContainerRepository();
		mockGroupRepository = new MockGroupRepository();
		useCase = new DeleteContainerUseCase(
			mockContainerRepository,
			mockGroupRepository,
		);
		mockGroupRepository.pushDummyData(group);
		mockContainerRepository.pushDummyData(container);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("delete container", async () => {
		const result = await useCase.execute({
			userId: USER_ID.id,
			containerId: "dummyId",
		});
		const newGroup = await mockGroupRepository.find(groupId);
		expect(result.ok).toBeTruthy();
		await expect(mockContainerRepository.find(containerId)).resolves.toBe(null);
		await expect(newGroup?.containerIds.length).toBe(0);
	});
	it("User is not authorized", async () => {
		const anotherUserId = UserId.generate().id;

		const result = await useCase.execute({
			userId: anotherUserId,
			containerId: "dummyId",
		});
		expect(result.ok).toBeFalsy();
		await expect(mockContainerRepository.find(containerId)).resolves.toBe(
			container,
		);
		await expect(mockGroupRepository.find(groupId)).resolves.toBe(group);
	});
});